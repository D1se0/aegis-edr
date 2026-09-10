import { useState } from 'react'
import { Terminal } from 'lucide-react'
import { GlassCard } from './GlassCard'

type Tab = 'windows' | 'linux' | 'mac'

const TABS: { id: Tab; label: string }[] = [
  { id: 'windows', label: 'Windows' },
  { id: 'linux', label: 'Linux' },
  { id: 'mac', label: 'macOS' }
]

const STEPS: Record<Tab, { title: string; body: string; code?: string }[]> = {
  windows: [
    { title: '1. Descarga el instalador', body: 'Descarga el archivo Aegis-EDR-Setup.exe desde la seccion de descargas.' },
    { title: '2. Ejecuta el asistente', body: 'Abre el instalador NSIS y sigue los pasos. Puedes elegir la carpeta de instalacion.' },
    { title: '3. Acepta el control de cuentas', body: 'Aegis necesita privilegios elevados para monitorizar procesos y red a nivel de sistema.' },
    { title: '4. Listo', body: 'La aplicacion se abre automaticamente y comienza la monitorizacion en tiempo real.' }
  ],
  linux: [
    {
      title: '1. Paquete .deb (Debian / Ubuntu / Kali)',
      body: 'Descarga el .deb y ejecuta:',
      code: 'sudo apt install ./aegis-edr_amd64.deb'
    },
    {
      title: '2. Alternativa AppImage (cualquier distro)',
      body: 'Dale permisos de ejecucion y arrancalo directamente:',
      code: 'chmod +x Aegis-EDR-x86_64.AppImage\n./Aegis-EDR-x86_64.AppImage'
    },
    { title: '3. Primer arranque', body: 'Se te pedira contraseña de sudo para habilitar el monitor de red y el firewall activo.' }
  ],
  mac: [
    { title: '1. Descarga la imagen .dmg', body: 'Monta el archivo .dmg y arrastra Aegis EDR a la carpeta Aplicaciones.' },
    {
      title: '2. Primer arranque',
      body: 'macOS puede marcar la app como de origen no identificado la primera vez. Abrela con clic derecho → Abrir.'
    },
    { title: '3. Permisos del sistema', body: 'Concede permisos de accesibilidad y monitorizacion de red cuando el sistema lo solicite.' }
  ]
}

export function Install() {
  const [tab, setTab] = useState<Tab>('linux')

  return (
    <section id="instalacion" className="relative py-24">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="section-eyebrow mx-auto">Puesta en marcha</div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-50 sm:text-4xl">
            Instalacion en <span className="gradient-text">menos de dos minutos</span>
          </h2>
        </div>

        <div className="mt-10 flex justify-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'bg-gradient-to-br from-aegis-cyan to-aegis-blue text-void-950 shadow-glow'
                  : 'border border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          {STEPS[tab].map((step) => (
            <GlassCard key={step.title}>
              <h3 className="text-sm font-semibold text-slate-100">{step.title}</h3>
              <p className="mt-1.5 text-sm text-slate-400">{step.body}</p>
              {step.code && (
                <pre className="mt-3 flex items-start gap-2 overflow-x-auto rounded-xl border border-white/10 bg-void-950/80 p-3.5 font-mono text-xs text-aegis-cyan">
                  <Terminal className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                  <code className="whitespace-pre">{step.code}</code>
                </pre>
              )}
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  )
}
