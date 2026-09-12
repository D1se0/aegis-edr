import { useRef, useState } from 'react'
import { Download, Eye, Info, KeySquare, Settings2, ShieldQuestion, Upload, Webhook } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { getAegisApi } from '@/lib/ipcClient'
import { GlassCard, GlassCardHeader } from '@/components/ui/GlassCard'
import { Toggle } from '@/components/ui/Toggle'
import { Tabs } from '@/components/ui/Tabs'
import { PlaybooksPanel } from '@/components/settings/PlaybooksPanel'
import { TransparencyPanel } from '@/components/settings/TransparencyPanel'
import type { AppSettings } from '@shared/types'

type WebhookFormatOption = AppSettings['webhookFormat']

export function SettingsView() {
  const settings = useAppStore((s) => s.settings)
  const toggleProtection = useAppStore((s) => s.toggleProtection)
  const updateAppSettings = useAppStore((s) => s.updateAppSettings)
  const presentationMode = useAppStore((s) => s.presentationMode)
  const togglePresentationMode = useAppStore((s) => s.togglePresentationMode)
  const [checking, setChecking] = useState(false)
  const [tab, setTab] = useState<'general' | 'playbooks' | 'transparency'>('general')
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!settings) return null

  const handleCheckUpdates = async () => {
    setChecking(true)
    await getAegisApi().checkForUpdates()
    setTimeout(() => setChecking(false), 1500)
  }

  const handleExport = async () => {
    const bundle = await getAegisApi().exportConfig()
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aegis-edr-config-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportClick = () => fileInputRef.current?.click()

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const result = await getAegisApi().importConfig(text)
    setImportError(result.ok ? null : result.error || 'No se pudo importar la configuracion.')
    e.target.value = ''
  }

  return (
    <div className="space-y-5">
      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { id: 'general', label: 'General' },
          { id: 'playbooks', label: 'Playbooks' },
          { id: 'transparency', label: 'Transparencia' }
        ]}
      />

      {tab === 'playbooks' && <PlaybooksPanel />}
      {tab === 'transparency' && <TransparencyPanel />}

      {tab === 'general' && (
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
                <p className="text-sm text-slate-300">
                  Canal: <span className="font-semibold text-slate-100">{settings.updateChannel}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500">Version actual {__APP_VERSION__}</p>
              </div>
              <button onClick={handleCheckUpdates} disabled={checking} className="glass-btn-primary text-xs">
                {checking ? 'Buscando...' : 'Buscar actualizaciones'}
              </button>
            </div>
          </GlassCard>

          <GlassCard strong>
            <GlassCardHeader title="Honeytokens y respaldo" subtitle="Señuelos anti-ransomware y copias antes de cambios" icon={<KeySquare size={16} />} />
            <Toggle
              checked={settings.honeytokensEnabled}
              onChange={(v) => updateAppSettings({ honeytokensEnabled: v })}
              label="Sembrar ficheros señuelo (honeytokens)"
              description="Cualquier acceso a estos ficheros dispara una alerta critica y cuarentena automatica del proceso responsable"
            />
            <Toggle
              checked={settings.backupBeforeChange}
              onChange={(v) => updateAppSettings({ backupBeforeChange: v })}
              label="Backup antes de cambios en rutas vigiladas"
              description="Guarda una copia local versionada antes de aplicar el cambio, para poder restaurarla (no es un snapshot nativo del sistema operativo)"
            />
          </GlassCard>

          <GlassCard strong>
            <GlassCardHeader title="Webhook de alertas criticas" subtitle="Notifica a Slack, Discord o un endpoint generico" icon={<Webhook size={16} />} />
            <div className="space-y-3">
              <input
                value={settings.webhookUrl ?? ''}
                onChange={(e) => updateAppSettings({ webhookUrl: e.target.value || null })}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-aegis-cyan/40"
              />
              <div className="flex gap-2">
                {(['slack', 'discord', 'generic'] as WebhookFormatOption[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => updateAppSettings({ webhookFormat: fmt })}
                    className={`flex-1 rounded-lg border px-2 py-1.5 text-xs capitalize ${settings.webhookFormat === fmt ? 'border-aegis-cyan/40 bg-aegis-cyan/[0.08] text-aegis-cyan' : 'border-white/10 text-slate-400'}`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
          </GlassCard>

          <GlassCard strong>
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

          <GlassCard strong>
            <GlassCardHeader title="Privacidad visual" subtitle="Difumina datos sensibles en pantalla (IPs, rutas, hostname)" icon={<Eye size={16} />} />
            <Toggle
              checked={presentationMode}
              onChange={togglePresentationMode}
              label="Modo presentacion"
              description="Util para capturas de pantalla o compartir pantalla en directo. Pasa el raton por encima para revelar temporalmente."
            />
          </GlassCard>

          <GlassCard strong className="xl:col-span-2">
            <GlassCardHeader title="Configuracion como codigo" subtitle="Exporta o importa todos tus ajustes y playbooks" icon={<Upload size={16} />} />
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={handleExport} className="glass-btn text-xs">
                <Download size={13} /> Exportar configuracion
              </button>
              <button onClick={handleImportClick} className="glass-btn text-xs">
                <Upload size={13} /> Importar configuracion
              </button>
              <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
              {importError && <span className="text-xs text-aegis-red">{importError}</span>}
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
      )}
    </div>
  )
}
