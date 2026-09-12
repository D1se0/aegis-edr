import { useEffect, useState } from 'react'
import { FilePlus, FileClock, FileX, Globe2, ShieldCheck, ShieldAlert, KeySquare, RotateCcw } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { getAegisApi } from '@/lib/ipcClient'
import { GlassCard, GlassCardHeader } from '@/components/ui/GlassCard'
import { Tabs } from '@/components/ui/Tabs'
import clsx from 'clsx'
import type { BrowserExtensionInfo, FileBackupEntry, HoneytokenFile } from '@shared/types'

const TYPE_ICON = { add: FilePlus, change: FileClock, unlink: FileX, addDir: FilePlus, unlinkDir: FileX } as const
const TYPE_LABEL = { add: 'Creado', change: 'Modificado', unlink: 'Eliminado', addDir: 'Carpeta creada', unlinkDir: 'Carpeta eliminada' } as const

function BackupsPanel() {
  const [backups, setBackups] = useState<FileBackupEntry[]>([])
  const [busy, setBusy] = useState<string | null>(null)

  const load = () => getAegisApi().listFileBackups().then(setBackups)
  useEffect(() => {
    load()
  }, [])

  const handleRestore = async (id: string) => {
    setBusy(id)
    await getAegisApi().restoreFromBackup(id)
    setBusy(null)
    load()
  }

  if (backups.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-500">Sin copias de respaldo todavia. Se crean automaticamente antes de cambios en rutas vigiladas (no es un snapshot nativo del SO, es un historial propio de la app).</p>
  }

  return (
    <div className="space-y-2">
      {backups.map((b) => (
        <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
          <div className="min-w-0">
            <p data-sensitive="true" className="truncate text-sm text-slate-200">{b.originalPath}</p>
            <p className="text-[11px] text-slate-500">
              {(b.sizeBytes / 1024).toFixed(1)} KB · {new Date(b.createdAt).toLocaleString()} · sha256 {b.sha256.slice(0, 10)}...
            </p>
          </div>
          <button disabled={busy === b.id} onClick={() => handleRestore(b.id)} className="glass-btn shrink-0 !px-2.5 !py-1.5 text-xs">
            <RotateCcw size={13} /> Restaurar
          </button>
        </div>
      ))}
    </div>
  )
}

function ExtensionsPanel() {
  const [extensions, setExtensions] = useState<BrowserExtensionInfo[]>([])
  const [scanning, setScanning] = useState(false)

  useEffect(() => {
    getAegisApi().listBrowserExtensions().then(setExtensions)
  }, [])

  const handleScan = async () => {
    setScanning(true)
    const result = await getAegisApi().scanBrowserExtensions()
    setExtensions(result)
    setScanning(false)
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button onClick={handleScan} disabled={scanning} className="glass-btn text-xs">
          {scanning ? 'Escaneando...' : 'Volver a escanear'}
        </button>
      </div>
      <div className="space-y-2">
        {extensions.map((ext) => (
          <div key={ext.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-200">{ext.name}</p>
              <span className={clsx('text-xs font-bold', ext.riskScore >= 45 ? 'text-aegis-red' : ext.riskScore > 0 ? 'text-aegis-amber' : 'text-slate-500')}>{ext.riskScore}</span>
            </div>
            <p className="text-[11px] text-slate-500">{ext.browser} · perfil {ext.profile}</p>
            {ext.riskReasons.length > 0 && <p className="mt-1 text-[11px] text-aegis-amber">{ext.riskReasons[0]}</p>}
          </div>
        ))}
        {extensions.length === 0 && !scanning && <p className="py-10 text-center text-sm text-slate-500">Sin extensiones detectadas o navegadores no encontrados.</p>}
      </div>
    </div>
  )
}

function HoneytokensPanel() {
  const [tokens, setTokens] = useState<HoneytokenFile[]>([])
  useEffect(() => {
    getAegisApi().listHoneytokens().then(setTokens)
  }, [])
  if (tokens.length === 0) return <p className="py-6 text-center text-xs text-slate-500">Los honeytokens estan desactivados o no se han creado (activalos en Ajustes).</p>
  return (
    <div className="space-y-2">
      {tokens.map((t) => (
        <div key={t.path} className={clsx('flex items-center justify-between rounded-xl border px-3 py-2 text-xs', t.triggered ? 'border-aegis-red/30 bg-aegis-red/10 text-aegis-red' : 'border-white/[0.06] bg-white/[0.02] text-slate-400')}>
          <span data-sensitive="true" className="truncate">{t.path}</span>
          {t.triggered ? <span className="font-semibold">¡Activado!</span> : <span>Vigilando</span>}
        </div>
      ))}
    </div>
  )
}

export function FilesystemView() {
  const snapshot = useAppStore((s) => s.snapshot)
  const quarantineFile = useAppStore((s) => s.quarantineFile)
  const [tab, setTab] = useState<'activity' | 'backups' | 'extensions'>('activity')

  const events = snapshot?.fileEvents ?? []
  const hosts = snapshot?.hosts

  return (
    <div className="grid h-full grid-cols-1 gap-5 xl:grid-cols-3">
      <GlassCard strong className="flex flex-col xl:col-span-2">
        <GlassCardHeader
          title="Sistema de ficheros"
          subtitle="Actividad, copias de respaldo y extensiones de navegador"
          icon={<FileClock size={16} />}
          action={
            <Tabs
              value={tab}
              onChange={setTab}
              options={[
                { id: 'activity', label: 'Actividad' },
                { id: 'backups', label: 'Backups' },
                { id: 'extensions', label: 'Extensiones' }
              ]}
            />
          }
        />
        <div className="flex-1 space-y-1 overflow-auto">
          {tab === 'activity' &&
            (events.length > 0 ? (
              events.map((e) => {
                const Icon = TYPE_ICON[e.type]
                return (
                  <div key={e.id} className={clsx('flex items-center justify-between gap-3 rounded-xl px-3 py-2.5', e.riskScore > 0 ? 'bg-aegis-red/[0.06]' : 'hover:bg-white/[0.03]')}>
                    <div className="flex min-w-0 items-center gap-3">
                      <Icon size={16} className={e.riskScore > 0 ? 'text-aegis-red' : 'text-slate-500'} />
                      <div className="min-w-0">
                        <p data-sensitive="true" className="truncate text-sm text-slate-200">{e.path}</p>
                        <p className="text-xs text-slate-500">{TYPE_LABEL[e.type]} · {e.zone === 'critical-system' ? 'fichero critico' : 'datos de usuario'} · {new Date(e.time).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    {e.riskScore > 0 && (
                      <button onClick={() => quarantineFile(e.path, e.riskReasons[0] || 'Actividad de fichero sospechosa')} className="glass-btn-danger shrink-0 !px-2.5 !py-1 text-xs">
                        Cuarentena
                      </button>
                    )}
                  </div>
                )
              })
            ) : (
              <p className="py-10 text-center text-sm text-slate-500">Sin actividad reciente de ficheros.</p>
            ))}
          {tab === 'backups' && <BackupsPanel />}
          {tab === 'extensions' && <ExtensionsPanel />}
        </div>
      </GlassCard>

      <div className="flex flex-col gap-5">
        <GlassCard>
          <GlassCardHeader title="Fichero hosts" subtitle="Deteccion de secuestro de DNS local" icon={<Globe2 size={16} />} />
          {hosts && (
            <div className="space-y-3">
              <div className={clsx('flex items-center gap-2 rounded-xl p-3', hosts.tampered ? 'bg-aegis-red/10 text-aegis-red' : 'bg-aegis-green/10 text-aegis-green')}>
                {hosts.tampered ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                <span className="text-sm font-medium">{hosts.tampered ? 'Modificacion detectada' : 'Integridad verificada'}</span>
              </div>
              <p className="text-xs text-slate-500">Ruta: {hosts.path}</p>
              <p className="text-xs text-slate-500">Ultima comprobacion: {new Date(hosts.lastChecked).toLocaleTimeString()}</p>
              {hosts.suspiciousEntries.length > 0 && (
                <div className="rounded-xl border border-aegis-red/20 bg-aegis-red/5 p-3">
                  <p className="mb-1 text-xs font-semibold text-aegis-red">Entradas sospechosas:</p>
                  {hosts.suspiciousEntries.map((entry) => (
                    <p key={entry} className="truncate font-mono text-[11px] text-slate-400">{entry}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <GlassCardHeader title="Honeytokens" subtitle="Ficheros señuelo para detectar ransomware/exfiltracion" icon={<KeySquare size={16} />} />
          <HoneytokensPanel />
        </GlassCard>
      </div>
    </div>
  )
}
