import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Cpu, HardDrive, MemoryStick, Radar, ScanLine, ShieldOff, Siren, Wifi } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { GlassCard, GlassCardHeader } from '@/components/ui/GlassCard'
import { ScoreGauge } from '@/components/ui/ScoreGauge'
import { StatTile } from '@/components/ui/StatTile'
import { MiniArea } from '@/components/ui/MiniArea'
import { Toggle } from '@/components/ui/Toggle'
import { SeverityBadge } from '@/components/ui/SeverityBadge'
import type { ProtectionState } from '@shared/types'

const PROTECTION_LABELS: Record<keyof ProtectionState, { label: string; description: string }> = {
  realtimeMonitoring: { label: 'Monitorizacion en tiempo real', description: 'Vigila procesos, red y ficheros de forma continua' },
  networkGuard: { label: 'Escudo de red', description: 'Detecta conexiones y escaneos sospechosos' },
  fileGuard: { label: 'Integridad de ficheros', description: 'Vigila carpetas de usuario y ficheros criticos' },
  ransomwareShield: { label: 'Escudo anti-ransomware', description: 'Detecta cifrados masivos de ficheros' },
  persistenceGuard: { label: 'Guardian de autoarranque', description: 'Detecta nuevas entradas de persistencia' },
  autoBlock: { label: 'Bloqueo automatico', description: 'Bloquea automaticamente amenazas de alta severidad' }
}

function useHistory(value: number | undefined, length = 24) {
  const [history, setHistory] = useState<number[]>(() => Array(length).fill(value ?? 0))
  const last = useRef(value)
  useEffect(() => {
    if (value === undefined || value === last.current) return
    last.current = value
    setHistory((h) => [...h.slice(1), value])
  }, [value])
  return history
}

export function Dashboard() {
  const snapshot = useAppStore((s) => s.snapshot)
  const settings = useAppStore((s) => s.settings)
  const toggleProtection = useAppStore((s) => s.toggleProtection)
  const runFullScan = useAppStore((s) => s.runFullScan)
  const isolateHost = useAppStore((s) => s.isolateHost)
  const [scanning, setScanning] = useState(false)
  const [isolating, setIsolating] = useState(false)

  const cpuHistory = useHistory(snapshot?.vitals.cpuLoad)
  const memHistory = useHistory(snapshot?.vitals.memUsedPct)
  const netHistory = useHistory(snapshot?.vitals.netInSpeed)

  if (!snapshot || !settings) {
    return <div className="flex h-full items-center justify-center text-slate-500">Cargando telemetria del sistema...</div>
  }

  const criticalCount = snapshot.alerts.filter((a) => !a.acknowledged && (a.severity === 'critical' || a.severity === 'high')).length
  const recentAlerts = snapshot.alerts.slice(0, 6)

  const handleScan = async () => {
    setScanning(true)
    await runFullScan()
    setTimeout(() => setScanning(false), 1600)
  }

  const handleIsolate = async () => {
    setIsolating(true)
    await isolateHost('Aislamiento manual solicitado por el usuario desde el panel')
    setTimeout(() => setIsolating(false), 1600)
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <GlassCard strong className="xl:col-span-1">
        <div className="flex flex-col items-center gap-4 py-2">
          <ScoreGauge score={snapshot.score} label={snapshot.scoreLabel} />
          <div className="flex w-full items-center justify-around border-t border-white/[0.06] pt-4 text-center">
            <div>
              <p className="text-lg font-bold text-slate-100">{snapshot.processes.length}</p>
              <p className="text-[11px] text-slate-500">Procesos</p>
            </div>
            <div>
              <p className="text-lg font-bold text-slate-100">{snapshot.connections.length}</p>
              <p className="text-[11px] text-slate-500">Conexiones</p>
            </div>
            <div>
              <p className={criticalCount > 0 ? 'text-lg font-bold text-aegis-red' : 'text-lg font-bold text-slate-100'}>{criticalCount}</p>
              <p className="text-[11px] text-slate-500">Amenazas activas</p>
            </div>
          </div>
          <div className="flex w-full gap-2 pt-2">
            <button onClick={handleScan} disabled={scanning} className="glass-btn-primary flex-1 justify-center">
              <ScanLine size={16} className={scanning ? 'animate-spin' : ''} />
              {scanning ? 'Analizando...' : 'Analisis completo'}
            </button>
            <button onClick={handleIsolate} disabled={isolating} className="glass-btn-danger flex-1 justify-center" title="Corta toda la conectividad de red salvo loopback">
              <ShieldOff size={16} />
              {isolating ? 'Aislando...' : 'Aislar equipo'}
            </button>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4 xl:col-span-2">
        <StatTile label="CPU" value={snapshot.vitals.cpuLoad} unit="%" icon={<Cpu size={16} />} accent={snapshot.vitals.cpuLoad > 85 ? 'red' : 'cyan'}>
          <MiniArea data={cpuHistory} color="#3ee6d0" />
        </StatTile>
        <StatTile label="Memoria" value={snapshot.vitals.memUsedPct} unit={`% de ${snapshot.vitals.memTotalGb} GB`} icon={<MemoryStick size={16} />} accent="violet">
          <MiniArea data={memHistory} color="#8b6bff" />
        </StatTile>
        <StatTile label="Red entrante" value={snapshot.vitals.netInSpeed} unit="KB/s" icon={<Wifi size={16} />} accent="green">
          <MiniArea data={netHistory} color="#33e39a" />
        </StatTile>
        <StatTile label="Disco" value={snapshot.vitals.diskUsedPct} unit="% usado" icon={<HardDrive size={16} />} accent="amber" />
      </div>

      <GlassCard className="xl:col-span-2">
        <GlassCardHeader title="Actividad reciente" subtitle="Ultimos eventos de seguridad detectados" icon={<Activity size={16} />} />
        <div className="flex flex-col divide-y divide-white/[0.06]">
          {recentAlerts.map((a) => (
            <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-200">{a.title}</p>
                <p className="truncate text-xs text-slate-500">{new Date(a.time).toLocaleTimeString()} · {a.message}</p>
              </div>
              <SeverityBadge severity={a.severity} />
            </motion.div>
          ))}
          {recentAlerts.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Sin eventos recientes. Todo tranquilo.</p>}
        </div>
      </GlassCard>

      <GlassCard>
        <GlassCardHeader title="Modulos de proteccion" subtitle="Activa o desactiva cada escudo" icon={<Radar size={16} />} />
        <div className="divide-y divide-white/[0.06]">
          {(Object.keys(PROTECTION_LABELS) as Array<keyof ProtectionState>).map((key) => (
            <Toggle
              key={key}
              checked={settings.protection[key]}
              onChange={(value) => toggleProtection(key, value)}
              label={PROTECTION_LABELS[key].label}
              description={PROTECTION_LABELS[key].description}
            />
          ))}
        </div>
        {criticalCount > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-aegis-red/30 bg-aegis-red/10 p-3 text-xs text-aegis-red">
            <Siren size={16} className="shrink-0" />
            Hay {criticalCount} amenaza(s) de severidad alta o critica sin resolver. Revisa la seccion de Alertas.
          </div>
        )}
      </GlassCard>
    </div>
  )
}
