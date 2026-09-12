import Store from 'electron-store'

/**
 * Baseline de comportamiento por proceso: recuerda que destinos (IP:puerto) ha
 * contactado historicamente cada proceso conocido (por nombre) y permite marcar
 * una conexion como "nunca vista antes" para ese proceso.
 *
 * Simplificacion deliberada: no es una ventana temporal deslizante de N dias con
 * caducidad de entradas (eso exigiria trackear timestamp por objetivo y una tarea
 * de poda periodica); en su lugar mantiene un historial acumulativo acotado (200
 * destinos mas recientes por proceso). Solo se considera "novedoso" un destino
 * cuando el proceso ya tiene un baseline minimamente establecido, para no generar
 * alertas de "primera conexion" en cascada nada mas instalar la app.
 */

interface BaselineSchema {
  knownTargets: Record<string, string[]>
}

const store = new Store<BaselineSchema>({ name: 'aegis-edr-baseline', defaults: { knownTargets: {} } })

const MIN_BASELINE_SIZE = 3
const MAX_TARGETS_PER_PROCESS = 200

/**
 * Registra el destino en el historial del proceso y devuelve true si es un
 * destino nuevo Y el proceso ya tenia un baseline establecido (>= MIN_BASELINE_SIZE
 * destinos distintos previos) — es decir, una desviacion real de su patron habitual.
 */
export function isNovelTarget(processKey: string, target: string): boolean {
  const known = (store.get('knownTargets') as Record<string, string[]>) || {}
  const list = known[processKey] || []
  const alreadySeen = list.includes(target)
  const hadBaseline = list.length >= MIN_BASELINE_SIZE

  if (!alreadySeen) {
    known[processKey] = Array.from(new Set([...list, target])).slice(-MAX_TARGETS_PER_PROCESS)
    store.set('knownTargets', known)
  }

  return hadBaseline && !alreadySeen
}

export function resetBaseline(processKey?: string) {
  if (!processKey) {
    store.set('knownTargets', {})
    return
  }
  const known = (store.get('knownTargets') as Record<string, string[]>) || {}
  delete known[processKey]
  store.set('knownTargets', known)
}
