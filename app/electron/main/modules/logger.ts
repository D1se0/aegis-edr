import { app } from 'electron'
import { appendFileSync, mkdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

let logDir = ''
let logFile = ''

function ensureLogFile() {
  if (logFile) return
  logDir = join(app.getPath('userData'), 'logs')
  if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true })
  const stamp = new Date().toISOString().slice(0, 10)
  logFile = join(logDir, `aegis-${stamp}.log`)
}

function write(level: string, scope: string, message: string, extra?: unknown) {
  try {
    ensureLogFile()
    const line = `[${new Date().toISOString()}] [${level}] [${scope}] ${message}${
      extra !== undefined ? ' ' + safeStringify(extra) : ''
    }\n`
    appendFileSync(logFile, line)
    if (level === 'ERROR') console.error(line.trim())
  } catch {
    /* logging must never crash the app */
  }
}

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

export const logger = {
  info: (scope: string, message: string, extra?: unknown) => write('INFO', scope, message, extra),
  warn: (scope: string, message: string, extra?: unknown) => write('WARN', scope, message, extra),
  error: (scope: string, message: string, extra?: unknown) => write('ERROR', scope, message, extra),
  getLogDir: () => logDir
}
