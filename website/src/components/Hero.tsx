import { motion } from 'framer-motion'
import { ArrowRight, Github, Sparkles } from 'lucide-react'
import { ThreatRadar } from './ThreatRadar'
import { GITHUB_URL } from '@/lib/site'
import { detectOs, OS_LABEL } from '@/lib/platform'
import { useEffect, useState } from 'react'

export function Hero() {
  const [os, setOs] = useState<ReturnType<typeof detectOs>>('unknown')

  useEffect(() => {
    setOs(detectOs())
  }, [])

  return (
    <section id="top" className="relative overflow-hidden pb-24 pt-16 sm:pt-24">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent)]" />

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:gap-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="section-eyebrow">
            <Sparkles className="h-3.5 w-3.5" />
            Deteccion y respuesta en el endpoint
          </div>

          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
            Vigilancia total sobre <span className="gradient-text">cada proceso, conexion y fichero</span> de tu equipo
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
            Aegis EDR monitoriza en tiempo real, detecta comportamiento anomalo y{' '}
            <span className="text-slate-200">bloquea amenazas automaticamente</span> antes de que se conviertan en un
            incidente. Procesos, red, ficheros y persistencia — todo bajo un mismo panel de control profesional.
          </p>

          <div className="mt-9 flex flex-col gap-3.5 sm:flex-row sm:items-center">
            <a href="#descargas" className="glass-btn-primary !px-6 !py-3.5 text-base">
              Descargar para {OS_LABEL[os]}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer noopener" className="glass-btn !px-6 !py-3.5 text-base">
              <Github className="h-4 w-4" />
              Ver codigo fuente
            </a>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-aegis-green" /> Windows · Linux · macOS
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-aegis-cyan" /> Codigo abierto en GitHub
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-aegis-blue" /> Respuesta automatica configurable
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
          className="relative"
        >
          <ThreatRadar />
        </motion.div>
      </div>
    </section>
  )
}
