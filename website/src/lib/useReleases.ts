import { useEffect, useState } from 'react'
import { fetchLatestRelease, type ReleaseInfo } from './github'

export type { ReleaseAsset, ReleaseInfo } from './github'

type ReleaseState =
  | { status: 'loading' }
  | { status: 'ready'; data: ReleaseInfo }

export function useReleases(): ReleaseState {
  const [state, setState] = useState<ReleaseState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    fetchLatestRelease().then((data) => {
      if (!cancelled) setState({ status: 'ready', data })
    })

    return () => {
      cancelled = true
    }
  }, [])

  return state
}
