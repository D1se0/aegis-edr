import { useEffect, useState } from 'react'

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

type ReleaseState =
  | { status: 'loading' }
  | { status: 'ready'; data: ReleaseInfo }
  | { status: 'error'; message: string }

const FALLBACK: ReleaseInfo = {
  available: false,
  version: null,
  publishedAt: null,
  releaseUrl: null,
  notes: null,
  assets: []
}

export function useReleases(): ReleaseState {
  const [state, setState] = useState<ReleaseState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    fetch('/api/releases/latest')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return (await res.json()) as ReleaseInfo
      })
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', data })
      })
      .catch((err) => {
        if (cancelled) return
        console.warn('No se pudo obtener la ultima release de GitHub:', err)
        setState({ status: 'ready', data: FALLBACK })
      })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
