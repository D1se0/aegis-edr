import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import { join } from 'node:path'
import type { BrowserExtensionInfo } from '../../shared/types'
import { logger } from './logger'

/**
 * Auditoria de extensiones de navegador instaladas (Chrome/Chromium/Edge/Firefox).
 * Lee unicamente ficheros de manifiesto/metadatos locales, nunca ejecuta el
 * navegador ni llama a ninguna API externa.
 *
 * Limitacion honesta para Firefox: los permisos declarados de una extension
 * viven dentro del .xpi (zip) empaquetado, no en extensions.json; leerlos
 * exigiria descomprimir cada .xpi. Por simplicidad y para no anadir una
 * dependencia de descompresion solo para esto, para Firefox se reporta
 * nombre/id pero los permisos pueden aparecer vacios (se marca explicitamente).
 */

const HIGH_RISK_HOST_PATTERNS = ['<all_urls>', '*://*/*', 'http://*/*', 'https://*/*']

function chromiumBaseDirs(): Array<{ browser: BrowserExtensionInfo['browser']; dir: string }> {
  const home = homedir()
  const os = platform()
  if (os === 'win32') {
    const local = process.env.LOCALAPPDATA || join(home, 'AppData', 'Local')
    return [
      { browser: 'chrome', dir: join(local, 'Google', 'Chrome', 'User Data') },
      { browser: 'chromium', dir: join(local, 'Chromium', 'User Data') },
      { browser: 'edge', dir: join(local, 'Microsoft', 'Edge', 'User Data') }
    ]
  }
  if (os === 'darwin') {
    const support = join(home, 'Library', 'Application Support')
    return [
      { browser: 'chrome', dir: join(support, 'Google', 'Chrome') },
      { browser: 'chromium', dir: join(support, 'Chromium') },
      { browser: 'edge', dir: join(support, 'Microsoft Edge') }
    ]
  }
  return [
    { browser: 'chrome', dir: join(home, '.config', 'google-chrome') },
    { browser: 'chromium', dir: join(home, '.config', 'chromium') },
    { browser: 'edge', dir: join(home, '.config', 'microsoft-edge') }
  ]
}

function firefoxProfileDirs(): string[] {
  const home = homedir()
  const os = platform()
  const root =
    os === 'win32'
      ? join(process.env.APPDATA || join(home, 'AppData', 'Roaming'), 'Mozilla', 'Firefox', 'Profiles')
      : os === 'darwin'
        ? join(home, 'Library', 'Application Support', 'Firefox', 'Profiles')
        : join(home, '.mozilla', 'firefox')
  if (!existsSync(root)) return []
  try {
    return readdirSync(root)
      .map((f) => join(root, f))
      .filter((p) => {
        try {
          return existsSync(join(p, 'extensions.json'))
        } catch {
          return false
        }
      })
  } catch {
    return []
  }
}

function chromiumProfileDirs(base: string): string[] {
  if (!existsSync(base)) return []
  try {
    return readdirSync(base)
      .filter((n) => n === 'Default' || /^Profile \d+$/.test(n))
      .map((n) => join(base, n))
  } catch {
    return []
  }
}

function scoreExtension(permissions: string[]): { riskScore: number; riskReasons: string[] } {
  const riskReasons: string[] = []
  let riskScore = 0
  const broadHost = permissions.some((p) => HIGH_RISK_HOST_PATTERNS.includes(p))
  if (broadHost) {
    riskScore += 30
    riskReasons.push('Solicita acceso a todas las paginas web que visitas')
  }
  if (permissions.includes('webRequest') || permissions.includes('webRequestBlocking')) {
    riskScore += 20
    riskReasons.push('Puede interceptar o modificar trafico de red del navegador')
  }
  if (permissions.includes('cookies')) {
    riskScore += 15
    riskReasons.push('Tiene acceso a las cookies del navegador')
  }
  if (permissions.includes('nativeMessaging')) {
    riskScore += 25
    riskReasons.push('Puede comunicarse con aplicaciones nativas fuera del navegador')
  }
  if (permissions.includes('clipboardRead')) {
    riskScore += 10
    riskReasons.push('Puede leer el portapapeles')
  }
  if (broadHost && (permissions.includes('cookies') || permissions.includes('webRequest'))) {
    riskScore += 15
    riskReasons.push('Combinacion de permisos de alto riesgo (acceso amplio + interceptacion/cookies)')
  }
  return { riskScore: Math.min(100, riskScore), riskReasons }
}

function scanChromiumFamily(browser: BrowserExtensionInfo['browser'], baseDir: string): BrowserExtensionInfo[] {
  const results: BrowserExtensionInfo[] = []
  for (const profileDir of chromiumProfileDirs(baseDir)) {
    const extDir = join(profileDir, 'Extensions')
    if (!existsSync(extDir)) continue
    let extIds: string[] = []
    try {
      extIds = readdirSync(extDir)
    } catch {
      continue
    }
    for (const extId of extIds) {
      try {
        const versions = readdirSync(join(extDir, extId)).sort()
        const latest = versions.at(-1)
        if (!latest) continue
        const manifestPath = join(extDir, extId, latest, 'manifest.json')
        if (!existsSync(manifestPath)) continue
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8')) as {
          name?: string
          permissions?: unknown[]
          host_permissions?: unknown[]
        }
        const permissions = [...(manifest.permissions || []), ...(manifest.host_permissions || [])].filter(
          (p): p is string => typeof p === 'string'
        )
        const name = typeof manifest.name === 'string' && !manifest.name.startsWith('__MSG_') ? manifest.name : extId
        const { riskScore, riskReasons } = scoreExtension(permissions)
        results.push({
          browser,
          profile: profileDir.split(/[\\/]/).pop() || profileDir,
          id: extId,
          name,
          permissions,
          riskScore,
          riskReasons
        })
      } catch (err) {
        logger.warn('browserExtensions', `No se pudo leer la extension ${extId}`, String(err))
      }
    }
  }
  return results
}

interface FirefoxAddonEntry {
  id?: string
  defaultLocale?: { name?: string }
  type?: string
  userPermissions?: { permissions?: unknown[] }
}

function scanFirefox(): BrowserExtensionInfo[] {
  const results: BrowserExtensionInfo[] = []
  for (const profileDir of firefoxProfileDirs()) {
    try {
      const raw = JSON.parse(readFileSync(join(profileDir, 'extensions.json'), 'utf-8')) as { addons?: FirefoxAddonEntry[] }
      for (const addon of raw.addons || []) {
        if (addon.type && addon.type !== 'extension') continue
        const permissions = (addon.userPermissions?.permissions || []).filter((p): p is string => typeof p === 'string')
        const { riskScore, riskReasons } = scoreExtension(permissions)
        if (permissions.length === 0) riskReasons.push('Permisos no disponibles para extensiones de Firefox (empaquetados dentro del .xpi)')
        results.push({
          browser: 'firefox',
          profile: profileDir.split(/[\\/]/).pop() || profileDir,
          id: addon.id || 'desconocido',
          name: addon.defaultLocale?.name || addon.id || 'Extension de Firefox',
          permissions,
          riskScore,
          riskReasons
        })
      }
    } catch (err) {
      logger.warn('browserExtensions', `No se pudo leer extensions.json de ${profileDir}`, String(err))
    }
  }
  return results
}

let latest: BrowserExtensionInfo[] = []

export function scanBrowserExtensions(): BrowserExtensionInfo[] {
  const results: BrowserExtensionInfo[] = []
  for (const { browser, dir } of chromiumBaseDirs()) {
    results.push(...scanChromiumFamily(browser, dir))
  }
  results.push(...scanFirefox())
  results.sort((a, b) => b.riskScore - a.riskScore)
  latest = results
  return results
}

export function listBrowserExtensions(): BrowserExtensionInfo[] {
  return latest
}
