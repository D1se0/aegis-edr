import { randomUUID } from 'node:crypto'
import type { Alert, Incident, IncidentEvent, Severity } from '../../shared/types'
import { onAlert } from './alerts'

/**
 * Correlaciona alertas relacionadas en "incidentes" para contar una historia
 * (storyline) en vez de una lista plana. Correlacion deliberadamente simple:
 * dos alertas se agrupan en el mismo incidente si comparten la misma IP o el
 * mismo PID Y ocurren dentro de una ventana de tiempo corta. Sin una clave de
 * correlacion compartida, cada alerta relevante se convierte en su propio
 * incidente de un solo evento (sigue siendo una vista normalizada valida).
 */

const CORRELATION_WINDOW_MS = 10 * 60 * 1000
const MAX_INCIDENTS = 150
const IPV4_RE = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/
const SEVERITY_RANK: Record<Severity, number> = { info: 0, low: 1, medium: 2, high: 3, critical: 4 }

let incidents: Incident[] = []

type CorrelationKey = { kind: 'ip' | 'pid'; value: string }

function correlationKey(alert: Alert): CorrelationKey | null {
  const sourceIp = alert.sourceId && IPV4_RE.test(alert.sourceId) ? alert.sourceId.match(IPV4_RE) : null
  const ipMatch = sourceIp || alert.message.match(IPV4_RE) || alert.title.match(IPV4_RE)
  if (ipMatch) return { kind: 'ip', value: ipMatch[1] }
  if (alert.sourceId && /^\d+$/.test(alert.sourceId)) return { kind: 'pid', value: alert.sourceId }
  return null
}

function handleAlert(alert: Alert) {
  if (alert.severity === 'info') return
  const key = correlationKey(alert)
  const now = Date.now()
  const event: IncidentEvent = { alertId: alert.id, time: alert.time, category: alert.category, summary: alert.title }

  if (key) {
    const existing = incidents.find(
      (inc) =>
        ((key.kind === 'ip' && inc.ip === key.value) || (key.kind === 'pid' && inc.processKey === key.value)) &&
        now - new Date(inc.updatedAt).getTime() < CORRELATION_WINDOW_MS
    )
    if (existing) {
      existing.events.unshift(event)
      existing.updatedAt = alert.time
      if (SEVERITY_RANK[alert.severity] > SEVERITY_RANK[existing.severity]) existing.severity = alert.severity
      return
    }
  }

  const incident: Incident = {
    id: randomUUID(),
    title: alert.title,
    severity: alert.severity,
    startedAt: alert.time,
    updatedAt: alert.time,
    events: [event],
    processKey: key?.kind === 'pid' ? key.value : undefined,
    ip: key?.kind === 'ip' ? key.value : undefined
  }
  incidents.unshift(incident)
  if (incidents.length > MAX_INCIDENTS) incidents = incidents.slice(0, MAX_INCIDENTS)
}

export function initStorylineEngine() {
  onAlert(handleAlert)
}

export function listIncidents(): Incident[] {
  return incidents
}

export function getIncident(id: string): Incident | undefined {
  return incidents.find((i) => i.id === id)
}
