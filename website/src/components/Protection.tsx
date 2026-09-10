import { motion } from 'framer-motion'
import { Bug, Radar, Lock, FileWarning, RefreshCw, Usb } from 'lucide-react'
import { GlassCard } from './GlassCard'

const THREATS = [
  {
    icon: Bug,
    title: 'Procesos maliciosos',
    desc: 'Analisis de comportamiento y firmas para detectar mineros, RATs y binarios lanzados desde rutas sospechosas.',
    color: 'text-aegis-red'
  },
  {
    icon: Radar,
    title: 'Conexiones C2 y exfiltracion',
    desc: 'Deteccion de trafico saliente hacia infraestructura de comando y control o puertos asociados a shells reversas.',
    color: 'text-aegis-cyan'
  },
  {
    icon: FileWarning,
    title: 'Ransomware y manipulacion de ficheros',
    desc: 'Vigilancia de zonas criticas del sistema y patrones de cifrado masivo para frenar el ransomware en segundos.',
    color: 'text-aegis-amber'
  },
  {
    icon: RefreshCw,
    title: 'Persistencia y autoarranque',
    desc: 'Rastrea servicios, tareas programadas y entradas de autoarranque nuevas o modificadas para bloquear el rearme.',
    color: 'text-aegis-violet'
  },
  {
    icon: Lock,
    title: 'Integridad de /etc/hosts y ficheros clave',
    desc: 'Hashing continuo de ficheros sensibles con alerta inmediata ante cualquier alteracion no autorizada.',
    color: 'text-aegis-blue'
  },
  {
    icon: Usb,
    title: 'Dispositivos externos',
    desc: 'Notificacion instantanea al conectar unidades USB u otros dispositivos no reconocidos previamente.',
    color: 'text-aegis-pink'
  }
]

export function Protection() {
  return (
    <section id="proteccion" className="relative py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="section-eyebrow mx-auto">Cobertura de amenazas</div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-50 sm:text-4xl">
            Lo que Aegis detecta y bloquea <span className="gradient-text">antes de que sea tarde</span>
          </h2>
          <p className="mt-4 text-slate-400">
            Un motor de riesgo cruza señales de proceso, red y sistema de ficheros para puntuar cada evento y decidir
            si requiere alerta, bloqueo automatico o ambos.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {THREATS.map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
            >
              <GlassCard className="group h-full transition-all hover:border-white/20 hover:bg-white/[0.06]">
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] ${t.color}`}>
                  <t.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-100">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{t.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
