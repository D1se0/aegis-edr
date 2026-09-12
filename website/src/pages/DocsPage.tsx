import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { BookOpen, Menu, ShieldHalf, X } from 'lucide-react'
import { DOCS } from '@/docs/content'
import { DocBlockView } from '@/docs/DocBlockView'

const GROUPS = Array.from(new Set(DOCS.map((d) => d.group)))

export default function DocsPage() {
  const { slug } = useParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const active = DOCS.find((d) => d.slug === slug) ?? DOCS[0]

  if (!slug) return <Navigate to={`/docs/${DOCS[0].slug}`} replace />

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:flex-row lg:gap-10">
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        className="glass-btn w-full justify-between lg:hidden"
        aria-expanded={sidebarOpen}
      >
        <span className="flex items-center gap-2">
          <BookOpen size={16} /> {active.title}
        </span>
        {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
      </button>

      <aside className={`shrink-0 lg:sticky lg:top-24 lg:block lg:h-fit lg:w-64 ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="glass-panel p-4">
          <Link to="/" className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-200 hover:text-aegis-cyan">
            <ShieldHalf size={16} className="text-aegis-cyan" /> Aegis EDR Docs
          </Link>
          <nav className="flex flex-col gap-4">
            {GROUPS.map((group) => (
              <div key={group}>
                <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{group}</p>
                <div className="flex flex-col gap-0.5">
                  {DOCS.filter((d) => d.group === group).map((d) => (
                    <Link
                      key={d.slug}
                      to={`/docs/${d.slug}`}
                      onClick={() => setSidebarOpen(false)}
                      className={`rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                        d.slug === active.slug
                          ? 'bg-aegis-cyan/10 font-medium text-aegis-cyan'
                          : 'text-slate-400 hover:bg-white/[0.05] hover:text-slate-200'
                      }`}
                    >
                      {d.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      <main className="min-w-0 flex-1 pb-16">
        <div className="glass-panel-strong p-6 sm:p-8">
          <p className="section-eyebrow">{active.group}</p>
          <h1 className="mb-5 text-2xl font-bold text-slate-50 sm:text-3xl">{active.title}</h1>
          <div className="flex flex-col gap-4">
            {active.blocks.map((block, i) => (
              <DocBlockView key={i} block={block} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
