import express from 'express'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.join(__dirname, '..', 'dist')

const PORT = process.env.PORT || 8080
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'D1se0'
const GITHUB_REPO = process.env.GITHUB_REPO || 'aegis-edr'
const CACHE_TTL_MS = 5 * 60 * 1000

let cache = { data: null, expiresAt: 0 }

function detectAssetPlatform(name) {
  const lower = name.toLowerCase()
  if (lower.endsWith('.deb')) return 'linux-deb'
  if (lower.endsWith('.appimage')) return 'linux-appimage'
  if (lower.endsWith('.exe')) return 'windows'
  if (lower.endsWith('.dmg')) return 'mac-dmg'
  if (lower.endsWith('.zip') && (lower.includes('mac') || lower.includes('darwin'))) return 'mac-zip'
  return 'other'
}

function normalizeRelease(release) {
  const assets = (release.assets || [])
    .map((a) => ({
      name: a.name,
      url: a.browser_download_url,
      sizeBytes: a.size ?? 0,
      platform: detectAssetPlatform(a.name)
    }))
    .filter((a) => a.platform !== 'other')

  return {
    available: true,
    version: release.tag_name || release.name || null,
    publishedAt: release.published_at || null,
    releaseUrl: release.html_url || null,
    notes: release.body || null,
    assets
  }
}

const UNAVAILABLE = {
  available: false,
  version: null,
  publishedAt: null,
  releaseUrl: null,
  notes: null,
  assets: []
}

async function fetchLatestRelease() {
  const now = Date.now()
  if (cache.data && cache.expiresAt > now) return cache.data

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`

  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'aegis-edr-website'
      }
    })

    let normalized
    if (res.status === 404) {
      normalized = UNAVAILABLE
    } else if (!res.ok) {
      throw new Error(`GitHub API respondio ${res.status}`)
    } else {
      const release = await res.json()
      normalized = normalizeRelease(release)
    }

    cache = { data: normalized, expiresAt: now + CACHE_TTL_MS }
    return normalized
  } catch (err) {
    console.error('[releases] fallo al consultar GitHub:', err.message)
    if (cache.data) return cache.data
    return UNAVAILABLE
  }
}

const app = express()

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/releases/latest', async (_req, res) => {
  const data = await fetchLatestRelease()
  res.set('Cache-Control', 'public, max-age=120')
  res.json(data)
})

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'))
  })
} else {
  app.get('/', (_req, res) => {
    res.status(200).send('Aegis EDR website API — ejecuta "npm run build" para servir el sitio estatico.')
  })
}

app.listen(PORT, () => {
  console.log(`[aegis-edr-website] escuchando en http://localhost:${PORT} (repo GitHub: ${GITHUB_OWNER}/${GITHUB_REPO})`)
})
