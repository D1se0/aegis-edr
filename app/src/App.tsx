import { useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { TitleBar } from '@/components/layout/TitleBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { ToastStack } from '@/components/layout/ToastStack'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { ProcessesView } from '@/components/processes/ProcessesView'
import { NetworkView } from '@/components/network/NetworkView'
import { FilesystemView } from '@/components/filesystem/FilesystemView'
import { PersistenceView } from '@/components/persistence/PersistenceView'
import { AlertsView } from '@/components/alerts/AlertsView'
import { QuarantineView } from '@/components/quarantine/QuarantineView'
import { SettingsView } from '@/components/settings/SettingsView'

const SECTION_TITLES: Record<string, string> = {
  dashboard: 'Panel general',
  processes: 'Procesos en ejecucion',
  network: 'Red y conexiones',
  filesystem: 'Sistema de ficheros',
  persistence: 'Puntos de autoarranque',
  alerts: 'Centro de alertas',
  quarantine: 'Cuarentena',
  settings: 'Ajustes'
}

export default function App() {
  const init = useAppStore((s) => s.init)
  const section = useAppStore((s) => s.section)
  const ready = useAppStore((s) => s.ready)

  useEffect(() => {
    init()
  }, [init])

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="relative flex-1 overflow-auto p-6">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-aegis-cyan/[0.04] to-transparent" />
          <div className="relative mb-5 flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-50">{SECTION_TITLES[section]}</h1>
          </div>
          {!ready ? (
            <div className="flex h-[70%] items-center justify-center text-sm text-slate-500">Inicializando agente de seguridad...</div>
          ) : (
            <div className="relative">
              {section === 'dashboard' && <Dashboard />}
              {section === 'processes' && <ProcessesView />}
              {section === 'network' && <NetworkView />}
              {section === 'filesystem' && <FilesystemView />}
              {section === 'persistence' && <PersistenceView />}
              {section === 'alerts' && <AlertsView />}
              {section === 'quarantine' && <QuarantineView />}
              {section === 'settings' && <SettingsView />}
            </div>
          )}
        </main>
      </div>
      <ToastStack />
    </div>
  )
}
