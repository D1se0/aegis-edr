export type DetectedOs = 'windows' | 'linux' | 'mac' | 'unknown'

export function detectOs(): DetectedOs {
  if (typeof navigator === 'undefined') return 'unknown'

  const uaData = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
  const platform = (uaData?.platform || navigator.platform || '').toLowerCase()
  const ua = navigator.userAgent.toLowerCase()

  if (platform.includes('win') || ua.includes('windows')) return 'windows'
  if (platform.includes('mac') || ua.includes('mac os') || ua.includes('macintosh')) return 'mac'
  if (platform.includes('linux') || ua.includes('linux')) return 'linux'
  return 'unknown'
}

export const OS_LABEL: Record<DetectedOs, string> = {
  windows: 'Windows',
  linux: 'Linux',
  mac: 'macOS',
  unknown: 'tu sistema'
}
