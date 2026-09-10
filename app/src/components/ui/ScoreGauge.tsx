import { motion } from 'framer-motion'

function colorForScore(score: number) {
  if (score >= 90) return '#33e39a'
  if (score >= 70) return '#3ee6d0'
  if (score >= 40) return '#ffb84f'
  return '#ff5470'
}

export function ScoreGauge({ score, label, size = 200 }: { score: number; label: string; size?: number }) {
  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = colorForScore(score)

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth={14} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={14}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 10px ${color}66)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-extrabold tabular-nums text-slate-50">{score}</span>
        <span className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">{label}</span>
      </div>
    </div>
  )
}
