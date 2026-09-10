import type { ReactNode } from 'react'
import { GlassCard } from './GlassCard'
import { AlertTriangle, CheckCircle2, Flame, Cpu, ShieldCheck, FolderLock, Bell } from 'lucide-react'

function MockFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <GlassCard strong className="!p-0 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-aegis-red/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-aegis-amber/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-aegis-green/70" />
        <span className="ml-2 text-xs font-medium text-slate-500">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </GlassCard>
  )
}

export function ProcessMock() {
  const rows = [
    { name: 'systemd', cpu: '0.2%', risk: 0 },
    { name: 'chromium', cpu: '14.5%', risk: 0 },
    { name: 'xh31mm2', cpu: '91.4%', risk: 88 },
    { name: 'sshd', cpu: '0.0%', risk: 0 }
  ]
  return (
    <MockFrame title="Procesos en ejecucion">
      <div className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.name}
            className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm ${
              r.risk > 0 ? 'border border-aegis-red/30 bg-aegis-red/[0.08]' : 'bg-white/[0.03]'
            }`}
          >
            <span className="flex items-center gap-2 font-mono text-xs text-slate-300">
              <Cpu className="h-3.5 w-3.5 text-slate-500" />
              {r.name}
            </span>
            <span className="text-xs text-slate-500">{r.cpu}</span>
            {r.risk > 0 ? (
              <span className="badge border-aegis-red/30 bg-aegis-red/10 text-aegis-red">riesgo {r.risk}</span>
            ) : (
              <span className="badge">seguro</span>
            )}
          </div>
        ))}
      </div>
    </MockFrame>
  )
}

export function NetworkMock() {
  const bars = [30, 55, 42, 70, 48, 82, 60, 90, 65, 40, 58, 75]
  return (
    <MockFrame title="Trafico de red en tiempo real">
      <div className="flex h-28 items-end gap-1.5">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm bg-gradient-to-t from-aegis-cyan/70 to-aegis-blue/40"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-lg border border-aegis-red/30 bg-aegis-red/[0.08] px-3 py-2 text-xs">
        <span className="text-aegis-red">185.220.101.45:4444 · puerto C2 conocido</span>
        <span className="badge border-aegis-red/30 bg-aegis-red/10 text-aegis-red">bloqueada</span>
      </div>
    </MockFrame>
  )
}

export function FirewallMock() {
  return (
    <MockFrame title="Firewall activo">
      <div className="space-y-2.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Bloqueo automatico</span>
          <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-aegis-cyan/80">
            <span className="ml-4 h-3.5 w-3.5 rounded-full bg-void-950" />
          </span>
        </div>
        <div className="h-px bg-white/[0.06]" />
        {['203.0.113.77', '185.220.101.45', '45.155.204.10'].map((ip) => (
          <div key={ip} className="flex items-center justify-between font-mono text-xs text-slate-400">
            <span>{ip}</span>
            <Flame className="h-3.5 w-3.5 text-aegis-red" />
          </div>
        ))}
      </div>
    </MockFrame>
  )
}

export function IntegrityMock() {
  const files = [
    { path: '/etc/hosts', ok: true },
    { path: '/etc/passwd', ok: true },
    { path: '~/.ssh/authorized_keys', ok: false }
  ]
  return (
    <MockFrame title="Integridad de ficheros">
      <div className="space-y-2">
        {files.map((f) => (
          <div key={f.path} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2.5 text-xs">
            <span className="font-mono text-slate-300">{f.path}</span>
            {f.ok ? (
              <CheckCircle2 className="h-4 w-4 text-aegis-green" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-aegis-amber" />
            )}
          </div>
        ))}
      </div>
    </MockFrame>
  )
}

export function PersistenceMock() {
  return (
    <MockFrame title="Puntos de autoarranque">
      <div className="space-y-2.5 text-xs">
        <div className="rounded-lg bg-white/[0.03] px-3 py-2.5">
          <p className="font-mono text-slate-300">nvidia-persistenced.service</p>
          <p className="mt-1 text-slate-500">systemd · sin riesgo</p>
        </div>
        <div className="rounded-lg border border-aegis-amber/30 bg-aegis-amber/[0.08] px-3 py-2.5">
          <p className="font-mono text-slate-200">backup-sync.desktop</p>
          <p className="mt-1 text-aegis-amber">descarga contenido remoto al iniciar</p>
        </div>
      </div>
    </MockFrame>
  )
}

export function QuarantineMock() {
  return (
    <MockFrame title="Cuarentena">
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <FolderLock className="h-9 w-9 text-aegis-violet" />
        <p className="text-sm text-slate-300">xh31mm2</p>
        <p className="font-mono text-[11px] text-slate-500">sha256 e3b0c4...b7852b</p>
        <span className="badge border-aegis-violet/30 bg-aegis-violet/10 text-aegis-violet">aislado de forma segura</span>
      </div>
    </MockFrame>
  )
}

export function AlertsMock() {
  const items = [
    { sev: 'critical', text: 'Minero de criptomonedas detectado', color: 'border-aegis-red/30 bg-aegis-red/[0.08] text-aegis-red' },
    { sev: 'high', text: 'IP bloqueada automaticamente', color: 'border-aegis-amber/30 bg-aegis-amber/[0.08] text-aegis-amber' },
    { sev: 'info', text: 'Analisis completo sin hallazgos', color: 'border-white/10 bg-white/[0.03] text-slate-400' }
  ]
  return (
    <MockFrame title="Centro de alertas">
      <div className="space-y-2">
        {items.map((a, i) => (
          <div key={i} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-xs ${a.color}`}>
            <Bell className="h-3.5 w-3.5 shrink-0" />
            <span>{a.text}</span>
          </div>
        ))}
        <div className="flex items-center gap-2.5 rounded-lg border border-aegis-green/30 bg-aegis-green/[0.08] px-3 py-2.5 text-xs text-aegis-green">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          Puntuacion de seguridad: 94/100
        </div>
      </div>
    </MockFrame>
  )
}
