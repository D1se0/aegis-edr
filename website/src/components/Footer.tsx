import { ShieldHalf, Github } from 'lucide-react'
import { GITHUB_URL } from '@/lib/site'

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-5 sm:px-8 md:flex-row md:justify-between">
        <div className="flex items-center gap-2.5 font-bold text-slate-100">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-aegis-cyan to-aegis-blue text-void-950">
            <ShieldHalf className="h-4 w-4" strokeWidth={2.5} />
          </span>
          Aegis <span className="text-aegis-cyan">EDR</span>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
          <a href="#proteccion" className="hover:text-slate-200">Proteccion</a>
          <a href="#funciones" className="hover:text-slate-200">Funciones</a>
          <a href="#descargas" className="hover:text-slate-200">Descargas</a>
          <a href="#instalacion" className="hover:text-slate-200">Instalacion</a>
          <a href={GITHUB_URL} target="_blank" rel="noreferrer noopener" className="flex items-center gap-1.5 hover:text-slate-200">
            <Github className="h-4 w-4" /> GitHub
          </a>
        </nav>
      </div>
      <p className="mt-8 text-center text-xs text-slate-600">
        Aegis EDR es un proyecto de codigo abierto. Distribuido bajo licencia MIT.
      </p>
    </footer>
  )
}
