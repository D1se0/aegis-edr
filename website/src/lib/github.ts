import { GITHUB_OWNER, GITHUB_REPO } from './site'

export interface ReleaseAsset {
  name: string
  url: string
  sizeBytes: number
  platform: 'windows' | 'linux-deb' | 'linux-appimage' | 'mac-dmg' | 'mac-zip' | 'other'
}

export interface ReleaseInfo {
  available: boolean
  version: string | null
  publishedAt: string | null
  releaseUrl: string | null
  notes: string | null
  assets: ReleaseAsset[]
}

const UNAVAILABLE: ReleaseInfo = {
  available: false,
  version: null,
  publishedAt: null,
  releaseUrl: null,
  notes: null,
  assets: []
}

const CACHE_KEY = 'aegis-edr:latest-release'
const CACHE_TTL_MS = 5 * 60 * 1000

function detectAssetPlatform(name: string): ReleaseAsset['platform'] {
  const lower = name.toLowerCase()
  if (lower.endsWith('.deb')) return 'linux-deb'
  if (lower.endsWith('.appimage')) return 'linux-appimage'
  if (lower.endsWith('.exe')) return 'windows'
  if (lower.endsWith('.dmg')) return 'mac-dmg'
  if (lower.endsWith('.zip') && (lower.includes('mac') || lower.includes('darwin'))) return 'mac-zip'
  return 'other'
}

function normalizeRelease(release: any): ReleaseInfo {
  const assets: ReleaseAsset[] = (release.assets || [])
    .map((a: any) => ({
      name: a.name,
      url: a.browser_download_url,
      sizeBytes: a.size ?? 0,
      platform: detectAssetPlatform(a.name)
    }))
    .filter((a: ReleaseAsset) => a.platform !== 'other')

  return {
    available: true,
    version: release.tag_name || release.name || null,
    publishedAt: release.published_at || null,
    releaseUrl: release.html_url || null,
    notes: release.body || null,
    assets
  }
}

function readCache(): ReleaseInfo | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { data: ReleaseInfo; expiresAt: number }
    if (parsed.expiresAt < Date.now()) return null
    return parsed.data
  } catch {
    return null
  }
}

function writeCache(data: ReleaseInfo) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, expiresAt: Date.now() + CACHE_TTL_MS }))
  } catch {
    // sessionStorage puede fallar en modo privado; no es critico
  }
}

/**
 * Se llama siempre directamente a la API publica de GitHub desde el navegador.
 * El sitio se sirve como estatico (GitHub Pages) asi que no puede depender de
 * un backend propio; el servidor Express de server/index.js sigue existiendo
 * como opcion de auto-hosting pero el frontend no depende de el.
 */
export async function fetchLatestRelease(): Promise<ReleaseInfo> {
  const cached = readCache()
  if (cached) return cached

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' }
    })

    if (res.status === 404) {
      writeCache(UNAVAILABLE)
      return UNAVAILABLE
    }
    if (!res.ok) throw new Error(`GitHub API respondio ${res.status}`)

    const release = await res.json()
    const normalized = normalizeRelease(release)
    writeCache(normalized)
    return normalized
  } catch (err) {
    console.warn('No se pudo obtener la ultima release de GitHub:', err)
    return UNAVAILABLE
  }
}
