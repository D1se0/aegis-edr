import { motion } from 'framer-motion'
import type { ComponentType } from 'react'
import { Activity, Network, Flame, FileCheck2, RefreshCw, FolderLock, BellRing } from 'lucide-react'
import {
  ProcessMock,
  NetworkMock,
  FirewallMock,
  IntegrityMock,
  PersistenceMock,
  QuarantineMock,
  AlertsMock
} from './FeatureMockups'

interface FeatureDef {
  icon: ComponentType<{ className?: string }>
  eyebrow: string
  title: string
  desc: string
  points: string[]
  Mock: ComponentType
}

const FEATURES: FeatureDef[] = [
  {
    icon: Activity,
    eyebrow: 'Procesos',
    title: 'Monitor de procesos con puntuacion de riesgo',
    desc: 'Cada proceso en ejecucion se evalua contra firmas conocidas, rutas de origen sospechosas y consumo anomalo de recursos.',
    points: ['Arbol de procesos padre/hijo en vivo', 'Terminacion y bloqueo con un clic', 'Historial de comportamiento por PID'],
    Mock: ProcessMock
  },
  {
    icon: Network,
    eyebrow: 'Red',
    title: 'Visibilidad completa del trafico saliente y entrante',
    desc: 'Cada conexion se cruza contra listas de puertos y rangos IP de alto riesgo asociados a C2, exfiltracion y shells reversas.',
    points: ['Grafico de trafico en tiempo real', 'Deteccion de escaneo de puertos', 'Bloqueo de IP con un clic'],
    Mock: NetworkMock
  },
  {
    icon: Flame,
    eyebrow: 'Firewall',
    title: 'Firewall activo con bloqueo automatico configurable',
    desc: 'Define el umbral de severidad a partir del cual Aegis actua por si solo, sin esperar confirmacion manual.',
    points: ['Reglas de bloqueo por IP o proceso', 'Aislamiento de red del equipo (kill-switch)', 'Restauracion instantanea'],
    Mock: FirewallMock
  },
  {
    icon: FileCheck2,
    eyebrow: 'Integridad',
    title: 'Vigilancia de ficheros y zonas criticas del sistema',
    desc: 'Hashing continuo de rutas sensibles como /etc/hosts, y deteccion temprana de patrones tipo ransomware en carpetas de usuario.',
    points: ['Comparacion continua contra baseline', 'Alerta ante manipulacion de /etc/hosts', 'Deteccion de cifrado masivo'],
    Mock: IntegrityMock
  },
  {
    icon: RefreshCw,
    eyebrow: 'Persistencia',
    title: 'Gestor de puntos de autoarranque',
    desc: 'Rastrea servicios systemd, tareas programadas, entradas de registro y autostart para frenar el rearme tras una limpieza.',
    points: ['Deteccion de nuevas entradas de autoarranque', 'Analisis del comando asociado', 'Eliminacion segura desde el panel'],
    Mock: PersistenceMock
  },
  {
    icon: FolderLock,
    eyebrow: 'Cuarentena',
    title: 'Aislamiento seguro de ficheros sospechosos',
    desc: 'Los ficheros marcados como amenaza se mueven a una boveda cifrada con su huella SHA-256, lista para restaurar o eliminar.',
    points: ['Boveda aislada del sistema de ficheros', 'Registro de huella criptografica', 'Restauracion o borrado permanente'],
    Mock: QuarantineMock
  },
  {
    icon: BellRing,
    eyebrow: 'Alertas',
    title: 'Centro de alertas con puntuacion global de seguridad',
    desc: 'Todas las señales se consolidan en una puntuacion de 0 a 100 y un feed cronologico priorizado por severidad.',
    points: ['Notificaciones nativas del sistema operativo', 'Historial completo y exportable', 'Puntuacion de seguridad en vivo'],
    Mock: AlertsMock
  }
]

export function Features() {
  return (
    <section id="funciones" className="relative py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="section-eyebrow mx-auto">Panel de control</div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-50 sm:text-4xl">
            Siete disciplinas de seguridad, <span className="gradient-text">un solo agente</span>
          </h2>
          <p className="mt-4 text-slate-400">
            Cada seccion del panel esta pensada para pasar de la deteccion a la accion en segundos.
          </p>
        </div>

        <div className="mt-16 space-y-24">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className={`grid items-center gap-10 lg:grid-cols-2 lg:gap-16 ${i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}
            >
              <motion.div
                initial={{ opacity: 0, x: i % 2 === 0 ? -24 : 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.55 }}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-aegis-cyan">
                  <f.icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-aegis-cyan">{f.eyebrow}</span>
                <h3 className="mt-2 text-2xl font-bold text-slate-50">{f.title}</h3>
                <p className="mt-3 text-slate-400">{f.desc}</p>
                <ul className="mt-5 space-y-2.5">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-aegis-cyan" />
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.55, delay: 0.1 }}
              >
                <f.Mock />
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
