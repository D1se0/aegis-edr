import { randomUUID } from 'node:crypto'
import type { Alert, AlertCategory, Severity } from '../../shared/types'
import { logger } from './logger'

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
    autoBlocked: input.autoBlocked ?? false
  }
  alerts.unshift(alert)
  if (alerts.length > MAX_ALERTS) alerts = alerts.slice(0, MAX_ALERTS)
  logger.info('alerts', `${alert.severity.toUpperCase()} ${alert.category}: ${alert.title}`)
  for (const l of listeners) l(alert)
  return alert
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
