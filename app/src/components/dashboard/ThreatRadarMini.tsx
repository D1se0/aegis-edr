import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { Alert, Severity } from '@shared/types'

const SEVERITY_COLOR: Record<Severity, string> = {
  critical: '#ff5470',
  high: '#ffb84f',
  medium: '#8b6bff',
  low: '#4f7bff',
  info: '#3ee6d0'
}

/** Posicion pseudo-aleatoria pero estable por id, para que los blips no salten entre renders. */
function blipPosition(id: string, radius: number) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  const angle = (hash % 360) * (Math.PI / 180)
  const dist = 0.25 + ((hash >> 8) % 70) / 100
  return { x: Math.cos(angle) * radius * dist, y: Math.sin(angle) * radius * dist }
}

export function ThreatRadarMini({ alerts, size = 180 }: { alerts: Alert[]; size?: number }) {
  const active = useMemo(() => alerts.filter((a) => !a.acknowledged && a.severity !== 'info').slice(0, 10), [alerts])
  const radius = size / 2 - 10
  const center = size / 2

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {[0.33, 0.66, 1].map((f) => (
          <circle key={f} cx={center} cy={center} r={radius * f} fill="none" stroke="rgba(62,230,208,0.15)" strokeWidth={1} />
        ))}
        <line x1={center} y1={10} x2={center} y2={size - 10} stroke="rgba(62,230,208,0.1)" strokeWidth={1} />
        <line x1={10} y1={center} x2={size - 10} y2={center} stroke="rgba(62,230,208,0.1)" strokeWidth={1} />

        <motion.g animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }} style={{ originX: `${center}px`, originY: `${center}px` }}>
          <path d={`M ${center} ${center} L ${center} 10 A ${radius} ${radius} 0 0 1 ${center + radius * Math.sin(0.6)} ${center - radius * Math.cos(0.6)} Z`} fill="url(#radar-sweep)" />
        </motion.g>

        <defs>
          <linearGradient id="radar-sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3ee6d0" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3ee6d0" stopOpacity="0" />
          </linearGradient>
        </defs>

        {active.map((a) => {
          const { x, y } = blipPosition(a.id, radius)
          const color = SEVERITY_COLOR[a.severity]
          return (
            <g key={a.id}>
              <circle cx={center + x} cy={center + y} r={4} fill={color} />
              <motion.circle
                cx={center + x}
                cy={center + y}
                r={4}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                initial={{ opacity: 0.8, r: 4 }}
                animate={{ opacity: 0, r: 14 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              />
            </g>
          )
        })}
      </svg>
      {active.length === 0 && <span className="absolute text-[11px] text-slate-600">Sin amenazas activas</span>}
    </div>
  )
}
