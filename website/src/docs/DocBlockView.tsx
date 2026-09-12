import { AlertTriangle, Info, ShieldAlert } from 'lucide-react'
import type { DocBlock } from './content'

const CALLOUT_STYLES: Record<string, { wrap: string; icon: JSX.Element }> = {
  info: { wrap: 'border-aegis-cyan/25 bg-aegis-cyan/[0.06] text-aegis-cyan', icon: <Info size={16} className="shrink-0" /> },
  warning: { wrap: 'border-aegis-amber/25 bg-aegis-amber/[0.06] text-aegis-amber', icon: <AlertTriangle size={16} className="shrink-0" /> },
  danger: { wrap: 'border-aegis-red/25 bg-aegis-red/[0.06] text-aegis-red', icon: <ShieldAlert size={16} className="shrink-0" /> }
}

export function DocBlockView({ block }: { block: DocBlock }) {
  switch (block.type) {
    case 'p':
      return <p className="leading-relaxed text-slate-300">{block.text}</p>
    case 'h3':
      return <h3 className="mt-2 text-lg font-semibold text-slate-100">{block.text}</h3>
    case 'list':
      return (
        <ul className="list-disc space-y-1.5 pl-5 text-slate-300 marker:text-aegis-cyan">
          {block.items.map((item, i) => (
            <li key={i} className="leading-relaxed">{item}</li>
          ))}
        </ul>
      )
    case 'code':
      return (
        <pre className="overflow-x-auto rounded-xl border border-white/10 bg-void-950/80 p-4 text-xs leading-relaxed text-slate-300">
          <code className="font-mono">{block.code}</code>
        </pre>
      )
    case 'callout': {
      const style = CALLOUT_STYLES[block.tone]
      return (
        <div className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-sm ${style.wrap}`}>
          {style.icon}
          <p className="leading-relaxed">{block.text}</p>
        </div>
      )
    }
    case 'table':
      return (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                {block.headers.map((h) => (
                  <th key={h} className="px-4 py-2.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {block.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2.5 text-slate-300">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    default:
      return null
  }
}
