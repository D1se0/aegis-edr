import { useState } from 'react'
import { Download, Info, Settings2, ShieldQuestion } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { getAegisApi } from '@/lib/ipcClient'
import { GlassCard, GlassCardHeader } from '@/components/ui/GlassCard'
import { Toggle } from '@/components/ui/Toggle'

export function SettingsView() {
  const settings = useAppStore((s) => s.settings)
  const toggleProtection = useAppStore((s) => s.toggleProtection)
  const [checking, setChecking] = useState(false)

  if (!settings) return null

  const handleCheckUpdates = async () => {
    setChecking(true)
    await getAegisApi().checkForUpdates()
    setTimeout(() => setChecking(false), 1500)
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <GlassCard strong>
        <GlassCardHeader title="Bloqueo automatico" subtitle="Responde automaticamente ante amenazas graves" icon={<ShieldQuestion size={16} />} />
        <Toggle
          checked={settings.protection.autoBlock}
          onChange={(v) => toggleProtection('autoBlock', v)}
          label="Bloquear automaticamente amenazas criticas"
          description="Aegis EDR bloqueara IPs y pondra en cuarentena ficheros sin pedir confirmacion cuando detecte severidad critica"
        />
      </GlassCard>

      <GlassCard strong>
        <GlassCardHeader title="Actualizaciones" subtitle="Aegis EDR se actualiza desde las releases de GitHub" icon={<Download size={16} />} />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-300">Canal: <span className="font-semibold text-slate-100">{settings.updateChannel}</span></p>
            <p className="mt-1 text-xs text-slate-500">Version actual 0.1.0</p>
          </div>
          <button onClick={handleCheckUpdates} disabled={checking} className="glass-btn-primary text-xs">
            {checking ? 'Buscando...' : 'Buscar actualizaciones'}
          </button>
        </div>
      </GlassCard>

      <GlassCard strong className="xl:col-span-2">
        <GlassCardHeader title="Umbrales de deteccion" subtitle="Ajusta la sensibilidad del motor de heuristicas" icon={<Settings2 size={16} />} />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-sm text-slate-300">Alerta de CPU por proceso</p>
            <p className="text-2xl font-bold text-aegis-cyan">{settings.cpuAlertThreshold}%</p>
            <p className="text-xs text-slate-500">Procesos que superen este uso de CPU se marcaran como sospechosos.</p>
          </div>
          <div>
            <p className="mb-1 text-sm text-slate-300">Umbral de escaneo de puertos</p>
            <p className="text-2xl font-bold text-aegis-violet">{settings.connectionsPerMinuteThreshold} destinos/min</p>
            <p className="text-xs text-slate-500">Un mismo proceso contactando mas destinos que este umbral en 60s dispara una alerta.</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="xl:col-span-2">
        <GlassCardHeader title="Acerca de Aegis EDR" icon={<Info size={16} />} />
        <p className="text-sm leading-relaxed text-slate-400">
          Aegis EDR es un agente de deteccion y respuesta en el endpoint que opera en espacio de usuario: correlaciona telemetria de
          procesos, red, ficheros y autoarranque para detectar comportamiento anomalo y ofrecer respuesta activa (finalizar procesos,
          bloquear IPs, cuarentena de ficheros y aislamiento total de red). No sustituye a un EDR de nivel kernel ni a un antivirus con
          firmas certificadas; es una capa de visibilidad y contencion adicional pensada para equipos tecnicos.
        </p>
      </GlassCard>
    </div>
  )
}
