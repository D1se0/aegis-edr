/**
 * Deteccion de binarios "living-off-the-land" (LOLBins): utilidades legitimas del
 * sistema operativo frecuentemente abusadas para ejecucion/descarga/evasion sin
 * dejar caer malware nuevo en disco. Heuristica basada en nombre + heuristica de
 * parametros sospechosos en la ruta/linea de comando disponible (no siempre se
 * dispone de la linea de comandos completa via systeminformation, es un
 * best-effort documentado).
 */

const LOLBIN_NAMES = [
  'powershell',
  'pwsh',
  'mshta',
  'rundll32',
  'certutil',
  'regsvr32',
  'wscript',
  'cscript',
  'bitsadmin',
  'cmstp',
  'installutil',
  'msbuild',
  'regsvcs',
  'regasm'
]

const SUSPICIOUS_MARKERS = [
  '-enc',
  '-encodedcommand',
  'downloadstring',
  'downloadfile',
  'invoke-expression',
  ' iex ',
  'frombase64string',
  '-urlcache',
  '-w hidden',
  '-windowstyle hidden',
  'bypass'
]

export interface LolbinCheck {
  flagged: boolean
  reason?: string
}

export function checkLolbin(name: string, pathOrCommand: string): LolbinCheck {
  const lowerName = name.toLowerCase()
  const isLolbin = LOLBIN_NAMES.some((b) => lowerName.includes(b))
  if (!isLolbin) return { flagged: false }

  const haystack = ` ${pathOrCommand.toLowerCase()} `
  const hasSuspiciousMarker = SUSPICIOUS_MARKERS.some((m) => haystack.includes(m))
  if (hasSuspiciousMarker) {
    return {
      flagged: true,
      reason: 'Binario "living-off-the-land" (LOLBin) del sistema usado con parametros tipicos de descarga/ejecucion ofuscada'
    }
  }
  return { flagged: false }
}
