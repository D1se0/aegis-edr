import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldHalf, Github, Menu, X } from 'lucide-react'
import { GITHUB_URL } from '@/lib/site'

const LINKS = [
  { href: '/#proteccion', label: 'Proteccion' },
  { href: '/#funciones', label: 'Funciones' },
  { href: '/#descargas', label: 'Descargas' },
  { href: '/#instalacion', label: 'Instalacion' }
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-white/10 bg-void-950/70 backdrop-blur-xl' : 'border-b border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-slate-50">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-aegis-cyan to-aegis-blue text-void-950 shadow-glow">
            <ShieldHalf className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="text-lg tracking-tight">
            Aegis <span className="text-aegis-cyan">EDR</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-slate-100"
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/docs"
            className="rounded-lg px-3.5 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-slate-100"
          >
            Docs
          </Link>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="glass-btn"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
          <a href="/#descargas" className="glass-btn-primary">
            Descargar
          </a>
        </div>

        <button
          className="glass-btn !px-2.5 !py-2 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-void-950/95 px-5 pb-5 pt-2 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/[0.05]"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/docs"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/[0.05]"
            >
              Docs
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/[0.05]"
            >
              GitHub
            </a>
            <a href="/#descargas" onClick={() => setOpen(false)} className="glass-btn-primary mt-2 justify-center">
              Descargar
            </a>
          </nav>
        </div>
      )}
    </header>
  )
}
