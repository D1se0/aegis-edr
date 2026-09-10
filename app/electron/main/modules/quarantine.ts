import { app } from 'electron'
import { createHash, randomUUID } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, statSync, chmodSync } from 'node:fs'
import { join, basename } from 'node:path'
import type { QuarantineItem } from '../../shared/types'
import { store } from './store'
import { raiseAlert } from './alerts'
import { logger } from './logger'

function getQuarantineDir(): string {
  const dir = join(app.getPath('userData'), 'quarantine')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

export function listQuarantine(): QuarantineItem[] {
  return (store.get('quarantine') as QuarantineItem[]) || []
}

export function quarantineFile(originalPath: string, reason: string): { ok: boolean; error?: string; item?: QuarantineItem } {
  try {
    if (!existsSync(originalPath)) return { ok: false, error: 'El fichero no existe.' }
    const stats = statSync(originalPath)
    const data = readFileSync(originalPath)
    const sha256 = createHash('sha256').update(data).digest('hex')
    const id = randomUUID()
    const dest = join(getQuarantineDir(), `${id}__${basename(originalPath)}.quarantined`)

    renameSync(originalPath, dest)
    try {
      chmodSync(dest, 0o000)
    } catch {
      /* best-effort en Windows/permite fallback */
    }

    const item: QuarantineItem = {
      id,
      originalPath,
      quarantinedAt: new Date().toISOString(),
      reason,
      sha256,
      sizeBytes: stats.size
    }
    const list = listQuarantine()
    list.unshift(item)
    store.set('quarantine', list)

    raiseAlert({
      severity: 'high',
      category: 'filesystem',
      title: 'Fichero puesto en cuarentena',
      message: `${originalPath} ha sido aislado (${reason}). SHA-256: ${sha256.slice(0, 16)}...`,
      sourceId: id,
      autoBlocked: true
    })

    return { ok: true, item }
  } catch (err) {
    logger.error('quarantine', 'No se pudo poner en cuarentena', String(err))
    return { ok: false, error: String(err) }
  }
}

export function restoreFromQuarantine(id: string): { ok: boolean; error?: string } {
  try {
    const list = listQuarantine()
    const item = list.find((i) => i.id === id)
    if (!item) return { ok: false, error: 'Elemento no encontrado en cuarentena.' }
    const dest = join(getQuarantineDir(), `${id}__${basename(item.originalPath)}.quarantined`)
    if (!existsSync(dest)) return { ok: false, error: 'El fichero en cuarentena ya no existe en disco.' }

    try {
      chmodSync(dest, 0o644)
    } catch {
      /* noop */
    }
    renameSync(dest, item.originalPath)
    store.set('quarantine', list.filter((i) => i.id !== id))

    raiseAlert({
      severity: 'info',
      category: 'filesystem',
      title: 'Fichero restaurado desde cuarentena',
      message: `${item.originalPath} ha sido restaurado por el usuario.`,
      sourceId: id
    })

    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}
