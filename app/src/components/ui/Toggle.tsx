import clsx from 'clsx'

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (value: boolean) => void; label: string; description?: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm font-medium text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          checked ? 'bg-gradient-to-r from-aegis-cyan to-aegis-blue' : 'bg-white/10'
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
      </button>
    </label>
  )
}
