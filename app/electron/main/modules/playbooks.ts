import { randomUUID } from 'node:crypto'
import type { Alert, PlaybookRule, Severity } from '../../shared/types'
import { getPlaybooksRaw, savePlaybooksRaw } from './store'
import { killProcessByPid } from './processMonitor'
import { blockIp } from './firewall'
import { quarantineFile } from './quarantine'
import { raiseAlert } from './alerts'
import { logger } from './logger'

/**
 * Playbooks simples (si-esto-entonces-aquello): reglas persistidas que se evaluan
 * contra cada alerta nueva generada por raiseAlert(). No reimplementan ninguna
 * accion: siempre delegan en las funciones ya validadas de cada modulo.
 */

const SEVERITY_RANK: Record<Severity, number> = { info: 0, low: 1, medium: 2, high: 3, critical: 4 }
const IPV4_RE = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/

export function listPlaybooks(): PlaybookRule[] {
  return getPlaybooksRaw()
}

export function savePlaybook(
  input: Partial<Pick<PlaybookRule, 'id'>> & Omit<PlaybookRule, 'id' | 'createdAt' | 'timesTriggered'>
): PlaybookRule {
  const rules = getPlaybooksRaw()
  if (input.id) {
    const idx = rules.findIndex((r) => r.id === input.id)
    if (idx >= 0) {
      rules[idx] = { ...rules[idx], name: input.name, enabled: input.enabled, condition: input.condition, action: input.action }
      savePlaybooksRaw(rules)
      return rules[idx]
    }
  }
  const created: PlaybookRule = {
    id: randomUUID(),
    name: input.name,
    enabled: input.enabled,
    condition: input.condition,
    action: input.action,
    createdAt: new Date().toISOString(),
    timesTriggered: 0
  }
  rules.unshift(created)
  savePlaybooksRaw(rules)
  return created
}

export function deletePlaybook(id: string) {
  savePlaybooksRaw(getPlaybooksRaw().filter((r) => r.id !== id))
}

export function replacePlaybooks(rules: PlaybookRule[]) {
  savePlaybooksRaw(rules)
}

function severityMeets(severity: Severity, min: Severity): boolean {
  return SEVERITY_RANK[severity] >= SEVERITY_RANK[min]
}

/** Extrae una IPv4 de sourceId/message: el sourceId de las alertas de red no siempre es la IP en crudo. */
function extractIp(alert: Alert): string | null {
  if (alert.sourceId && IPV4_RE.test(alert.sourceId)) return alert.sourceId.match(IPV4_RE)![1]
  const fromMessage = alert.message.match(IPV4_RE) || alert.title.match(IPV4_RE)
  return fromMessage ? fromMessage[1] : null
}

export async function evaluatePlaybooks(alert: Alert): Promise<void> {
  const rules = getPlaybooksRaw().filter((r) => r.enabled)
  for (const rule of rules) {
    const cond = rule.condition
    if (cond.category && cond.category !== alert.category) continue
    if (!severityMeets(alert.severity, cond.minSeverity)) continue
    if (cond.matchText) {
      const haystack = `${alert.title} ${alert.message} ${alert.sourceId ?? ''}`.toLowerCase()
      if (!haystack.includes(cond.matchText.toLowerCase())) continue
    }

    try {
      const executed = await executeAction(rule, alert)
      if (!executed) continue
      const updated = getPlaybooksRaw().map((r) => (r.id === rule.id ? { ...r, timesTriggered: r.timesTriggered + 1 } : r))
      savePlaybooksRaw(updated)
    } catch (err) {
      logger.error('playbooks', `Fallo ejecutando playbook "${rule.name}"`, String(err))
    }
  }
}

/** Devuelve true si la accion se pudo intentar (aunque falle internamente), false si no habia datos suficientes en la alerta. */
async function executeAction(rule: PlaybookRule, alert: Alert): Promise<boolean> {
  switch (rule.action) {
    case 'kill_process': {
      const pid = Number(alert.sourceId)
      if (!Number.isFinite(pid) || pid <= 0) return false
      killProcessByPid(pid)
      return true
    }
    case 'block_ip': {
      const ip = extractIp(alert)
      if (!ip) return false
      await blockIp(ip, `Playbook "${rule.name}" disparado por alerta: ${alert.title}`)
      return true
    }
    case 'quarantine_file': {
      if (!alert.sourceId) return false
      quarantineFile(alert.sourceId, `Playbook "${rule.name}" disparado por alerta: ${alert.title}`)
      return true
    }
    case 'notify': {
      raiseAlert({
        severity: 'info',
        category: 'system',
        title: `Playbook activado: ${rule.name}`,
        message: `Se cumplieron las condiciones de "${rule.name}" para la alerta: ${alert.title}`
      })
      return true
    }
    default:
      return false
  }
}
