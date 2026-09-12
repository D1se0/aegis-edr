import { randomUUID } from 'node:crypto'
import type { Alert, AlertCategory, Severity } from '../../shared/types'
import { logger } from './logger'
import { getSettings } from './store'
import { recordSelfNetworkCall } from './selfTelemetry'

const MAX_ALERTS = 500
let alerts: Alert[] = []
type Listener = (alert: Alert) => void
const listeners = new Set<Listener>()

export function onAlert(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function raiseAlert(input: {
  severity: Severity
  category: AlertCategory
  title: string
  message: string
  sourceId?: string
  autoBlocked?: boolean
  mitreTechniques?: string[]
}): Alert {
  const alert: Alert = {
    id: randomUUID(),
    time: new Date().toISOString(),
    severity: input.severity,
    category: input.category,
    title: input.title,
    message: input.message,
    sourceId: input.sourceId,
    acknowledged: false,
    autoBlocked: input.autoBlocked ?? false,
    mitreTechniques: input.mitreTechniques
  }
  alerts.unshift(alert)
  if (alerts.length > MAX_ALERTS) alerts = alerts.slice(0, MAX_ALERTS)
  logger.info('alerts', `${alert.severity.toUpperCase()} ${alert.category}: ${alert.title}`)
  for (const l of listeners) l(alert)
  if (alert.severity === 'critical') dispatchWebhook(alert)
  return alert
}

/** Notifica alertas criticas a un webhook externo (Slack/Discord/generico) si esta configurado. Nunca bloquea ni rompe el flujo principal. */
function dispatchWebhook(alert: Alert) {
  const settings = getSettings()
  const url = settings.webhookUrl
  if (!url) return

  let body: Record<string, unknown>
  const text = `🛡️ Aegis EDR — ${alert.title}\n${alert.message}`
  if (settings.webhookFormat === 'slack') body = { text }
  else if (settings.webhookFormat === 'discord') body = { content: text }
  else body = { title: alert.title, message: alert.message, severity: alert.severity, category: alert.category, time: alert.time }

  recordSelfNetworkCall(safeHost(url), 'Envio de webhook por alerta critica')
  fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  }).catch((err) => {
    logger.warn('alerts', 'No se pudo entregar el webhook de alerta', String(err))
  })
}

function safeHost(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return 'webhook configurado'
  }
}

export function getAlerts(): Alert[] {
  return alerts
}

export function acknowledgeAlert(id: string) {
  alerts = alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
}

export function clearAlerts() {
  alerts = alerts.map((a) => ({ ...a, acknowledged: true }))
}
