import clsx from 'clsx'

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: Array<{ id: T; label: string }> }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={clsx(
            'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
            value === opt.id ? 'bg-white/[0.09] text-slate-50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]' : 'text-slate-500 hover:text-slate-300'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
