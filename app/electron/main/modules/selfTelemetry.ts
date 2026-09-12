import { randomUUID } from 'node:crypto'
import type { SelfNetworkLogEntry } from '../../shared/types'

/**
 * "La app se vigila a si misma": registro en memoria de cada llamada de red que
 * el propio Aegis EDR realiza (comprobacion de actualizaciones, llamadas a la
 * API de Claude si el usuario usa el asistente IA, webhooks salientes). Nunca
 * registra trafico de terceros, solo el que genera esta aplicacion.
 */

const MAX_ENTRIES = 200
let log: SelfNetworkLogEntry[] = []

export function recordSelfNetworkCall(destination: string, purpose: string) {
  log.unshift({ id: randomUUID(), time: new Date().toISOString(), destination, purpose })
  if (log.length > MAX_ENTRIES) log = log.slice(0, MAX_ENTRIES)
}

export function listSelfNetworkLog(): SelfNetworkLogEntry[] {
  return log
}
