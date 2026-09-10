import { motion } from 'framer-motion'
import { Github, Star, GitFork } from 'lucide-react'
import { GITHUB_URL } from '@/lib/site'

export function GithubBanner() {
  return (
    <section className="relative py-16">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55 }}
          className="glass-panel-strong relative overflow-hidden px-8 py-12 text-center"
        >
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,black,transparent)]" />
          <div className="relative">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] text-slate-100">
              <Github className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-2xl font-bold text-slate-50 sm:text-3xl">Codigo abierto y auditable</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-400">
              Todo el motor de deteccion, la interfaz y el proceso de build estan publicados en GitHub. Revisa el
              codigo, propone mejoras o compila tu propia version firmada.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href={GITHUB_URL} target="_blank" rel="noreferrer noopener" className="glass-btn-primary">
                <Github className="h-4 w-4" />
                Ver repositorio
              </a>
              <a href={`${GITHUB_URL}/stargazers`} target="_blank" rel="noreferrer noopener" className="glass-btn">
                <Star className="h-4 w-4" />
                Dar una estrella
              </a>
              <a href={`${GITHUB_URL}/fork`} target="_blank" rel="noreferrer noopener" className="glass-btn">
                <GitFork className="h-4 w-4" />
                Hacer fork
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
