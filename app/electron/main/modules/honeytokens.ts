import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { HoneytokenFile } from '../../shared/types'
import { getSettings } from './store'
import { logger } from './logger'

/**
 * Honeytokens: ficheros senuelo sembrados en carpetas habituales para actuar de
 * tripwire ante ransomware/exfiltracion/movimiento lateral. Cualquier acceso o
 * modificacion se trata como maxima prioridad, ya que un usuario/proceso legitimo
 * nunca deberia tocarlos.
 *
 * Limitacion honesta: un file watcher (chokidar) no da atribucion de proceso —
 * no podemos identificar QUE proceso toco el fichero, solo que fue tocado. Por
 * eso la respuesta ante un honeytoken disparado actua a nivel de alerta
 * critica + (opcional) aislamiento de red del host, no "cuarentena del proceso
 * responsable" (eso exigiria auditoria a nivel de SO tipo auditd/ETW).
 */

interface HoneytokenTemplate {
  dir: 'Desktop' | 'Documents'
  name: string
  content: string
}

const TEMPLATES: HoneytokenTemplate[] = [
  { dir: 'Desktop', name: 'passwords.xlsx', content: 'Aegis EDR honeytoken — no borrar. Cualquier acceso a este fichero genera una alerta critica.' },
  { dir: 'Documents', name: 'aws_credentials.json', content: JSON.stringify({ aws_access_key_id: 'AKIA_HONEYTOKEN_AEGISEDR', aws_secret_access_key: 'HONEYTOKEN_DO_NOT_USE' }, null, 2) },
  { dir: 'Desktop', name: 'wallet_seed_phrase.txt', content: 'Aegis EDR honeytoken — fichero senuelo, no contiene datos reales.' }
]

let seeded: HoneytokenFile[] = []

export function seedHoneytokens(): HoneytokenFile[] {
  const settings = getSettings()
  seeded = []
  if (!settings.honeytokensEnabled) return seeded

  for (const t of TEMPLATES) {
    const dirPath = join(homedir(), t.dir)
    if (!existsSync(dirPath)) continue
    const filePath = join(dirPath, t.name)
    try {
      if (!existsSync(filePath)) {
        mkdirSync(dirPath, { recursive: true })
        writeFileSync(filePath, t.content)
      }
      seeded.push({ path: filePath, createdAt: new Date().toISOString(), triggered: false })
    } catch (err) {
      logger.warn('honeytokens', `No se pudo sembrar el honeytoken ${filePath}`, String(err))
    }
  }
  return seeded
}

export function listHoneytokens(): HoneytokenFile[] {
  return seeded
}

export function isHoneytokenPath(path: string): boolean {
  return seeded.some((h) => h.path === path)
}

export function markHoneytokenTriggered(path: string) {
  seeded = seeded.map((h) => (h.path === path ? { ...h, triggered: true, triggeredAt: new Date().toISOString() } : h))
}
