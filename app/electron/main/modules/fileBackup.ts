import { app } from 'electron'
import { existsSync, mkdirSync, copyFileSync, statSync, readFileSync, unlinkSync } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import { join, basename } from 'node:path'
import type { FileBackupEntry } from '../../shared/types'
import { store } from './store'
import { logger } from './logger'

/**
 * Rollback simplificado ante ransomware: NO es una integracion con snapshots
 * nativos del sistema operativo (VSS en Windows, snapshots de APFS en macOS,
 * btrfs/ZFS en Linux) — seria una integracion muy distinta por SO y de alto
 * riesgo de romper algo fuera del control de la app. En su lugar, cada vez que
 * fileIntegrity detecta un evento add/change en una ruta vigilada (con
 * "backupBeforeChange" activado), se guarda una copia versionada del contenido
 * en ese instante en un directorio propio de la app. Como cada evento crea una
 * entrada NUEVA (nunca sobreescribe), queda un historial: si un evento
 * posterior resulta ser ransomware, las copias de eventos ANTERIORES siguen
 * disponibles para restaurar el "ultimo estado bueno conocido".
 */

const MAX_BACKUPS = 300
const MAX_BACKUP_AGE_DAYS = 14
const MAX_BACKUP_FILE_SIZE_BYTES = 25 * 1024 * 1024 // no respaldamos ficheros enormes

function getBackupDir(): string {
  const dir = join(app.getPath('userData'), 'file-backups')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

function backupPathFor(entry: Pick<FileBackupEntry, 'id' | 'originalPath'>): string {
  return join(getBackupDir(), `${entry.id}__${basename(entry.originalPath)}`)
}

function listBackupsRaw(): FileBackupEntry[] {
  return (store.get('fileBackups') as FileBackupEntry[]) || []
}

function saveBackupsRaw(list: FileBackupEntry[]) {
  store.set('fileBackups', list)
}

export function listFileBackups(): FileBackupEntry[] {
  return listBackupsRaw()
}

/** Toma una instantanea versionada del contenido actual del fichero (best-effort, nunca lanza). */
export function backupFileVersion(originalPath: string): FileBackupEntry | null {
  try {
    if (!existsSync(originalPath)) return null
    const stats = statSync(originalPath)
    if (!stats.isFile() || stats.size > MAX_BACKUP_FILE_SIZE_BYTES) return null

    const data = readFileSync(originalPath)
    const sha256 = createHash('sha256').update(data).digest('hex')
    const id = randomUUID()
    const entry: FileBackupEntry = { id, originalPath, createdAt: new Date().toISOString(), sizeBytes: stats.size, sha256 }
    copyFileSync(originalPath, backupPathFor(entry))

    let list = [entry, ...listBackupsRaw()]
    if (list.length > MAX_BACKUPS) {
      for (const stale of list.slice(MAX_BACKUPS)) purgeBackupFile(stale)
      list = list.slice(0, MAX_BACKUPS)
    }
    saveBackupsRaw(list)
    purgeExpiredBackups()
    return entry
  } catch (err) {
    logger.warn('fileBackup', `No se pudo respaldar version de ${originalPath}`, String(err))
    return null
  }
}

function purgeBackupFile(entry: FileBackupEntry) {
  try {
    const path = backupPathFor(entry)
    if (existsSync(path)) unlinkSync(path)
  } catch {
    /* best-effort */
  }
}

function purgeExpiredBackups() {
  const cutoff = Date.now() - MAX_BACKUP_AGE_DAYS * 24 * 60 * 60 * 1000
  const list = listBackupsRaw()
  const keep: FileBackupEntry[] = []
  for (const entry of list) {
    if (new Date(entry.createdAt).getTime() < cutoff) purgeBackupFile(entry)
    else keep.push(entry)
  }
  if (keep.length !== list.length) saveBackupsRaw(keep)
}

export function restoreFromBackup(id: string): { ok: boolean; error?: string } {
  try {
    const entry = listBackupsRaw().find((e) => e.id === id)
    if (!entry) return { ok: false, error: 'Version de respaldo no encontrada.' }
    const backupPath = backupPathFor(entry)
    if (!existsSync(backupPath)) return { ok: false, error: 'El fichero de respaldo ya no existe en disco.' }
    copyFileSync(backupPath, entry.originalPath)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}
