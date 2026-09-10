const BLIPS = [
  { top: '22%', left: '68%', delay: '0s', color: 'bg-aegis-red' },
  { top: '58%', left: '30%', delay: '0.6s', color: 'bg-aegis-amber' },
  { top: '38%', left: '42%', delay: '1.1s', color: 'bg-aegis-cyan' },
  { top: '70%', left: '66%', delay: '1.7s', color: 'bg-aegis-red' },
  { top: '46%', left: '78%', delay: '0.3s', color: 'bg-aegis-cyan' }
]

export function ThreatRadar() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      <div className="absolute inset-0 rounded-full border border-white/[0.06]" />
      <div className="absolute inset-[12%] rounded-full border border-white/[0.06]" />
      <div className="absolute inset-[24%] rounded-full border border-white/[0.06]" />
      <div className="absolute inset-[36%] rounded-full border border-white/[0.08]" />
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/[0.05]" />
      <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/[0.05]" />

      <div className="absolute inset-0 overflow-hidden rounded-full">
        <div
          className="absolute inset-0 origin-center animate-radarSweep"
          style={{
            background: 'conic-gradient(from 0deg, rgba(62,230,208,0.35), transparent 28%)'
          }}
        />
      </div>

      {BLIPS.map((blip, i) => (
        <span
          key={i}
          className={`absolute h-2.5 w-2.5 rounded-full ${blip.color} shadow-glow animate-blipPulse`}
          style={{ top: blip.top, left: blip.left, animationDelay: blip.delay }}
        />
      ))}

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-aegis-cyan/30 bg-void-900/80 shadow-glow backdrop-blur-xl">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-aegis-cyan">Live</span>
        </div>
      </div>
    </div>
  )
}
