import { useEffect, useState } from 'react'
import { Plus, Trash2, Workflow } from 'lucide-react'
import { getAegisApi, type PlaybookInput } from '@/lib/ipcClient'
import { GlassCard, GlassCardHeader } from '@/components/ui/GlassCard'
import { Toggle } from '@/components/ui/Toggle'
import type { AlertCategory, PlaybookActionType, PlaybookRule, Severity } from '@shared/types'

const CATEGORIES: Array<AlertCategory | ''> = ['', 'process', 'network', 'filesystem', 'persistence', 'hosts', 'usb', 'system', 'ransomware']
const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low', 'info']
const ACTIONS: PlaybookActionType[] = ['kill_process', 'block_ip', 'quarantine_file', 'notify']
const ACTION_LABEL: Record<PlaybookActionType, string> = {
  kill_process: 'Finalizar proceso',
  block_ip: 'Bloquear IP',
  quarantine_file: 'Poner en cuarentena',
  notify: 'Solo notificar'
}

function emptyForm(): PlaybookInput {
  return { name: '', enabled: true, condition: { minSeverity: 'high' }, action: 'notify' }
}

export function PlaybooksPanel() {
  const [rules, setRules] = useState<PlaybookRule[]>([])
  const [form, setForm] = useState<PlaybookInput>(emptyForm())

  const load = () => getAegisApi().listPlaybooks().then(setRules)
  useEffect(() => {
    load()
  }, [])

  const handleCreate = async () => {
    if (!form.name.trim()) return
    await getAegisApi().savePlaybook(form)
    setForm(emptyForm())
    load()
  }

  const handleToggle = async (rule: PlaybookRule, enabled: boolean) => {
    await getAegisApi().savePlaybook({ ...rule, enabled })
    load()
  }

  const handleDelete = async (id: string) => {
    await getAegisApi().deletePlaybook(id)
    load()
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <GlassCard strong>
        <GlassCardHeader title="Nueva regla" subtitle="Si ocurre esto, entonces haz aquello" icon={<Plus size={16} />} />
        <div className="space-y-3">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Nombre de la regla"
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-aegis-cyan/40"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.condition.category ?? ''}
              onChange={(e) => setForm({ ...form, condition: { ...form.condition, category: (e.target.value || undefined) as AlertCategory | undefined } })}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 text-xs text-slate-200"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c || 'Cualquier categoria'}
                </option>
              ))}
            </select>
            <select
              value={form.condition.minSeverity}
              onChange={(e) => setForm({ ...form, condition: { ...form.condition, minSeverity: e.target.value as Severity } })}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 text-xs text-slate-200"
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  Severidad minima: {s}
                </option>
              ))}
            </select>
          </div>
          <select
            value={form.action}
            onChange={(e) => setForm({ ...form, action: e.target.value as PlaybookActionType })}
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 text-xs text-slate-200"
          >
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                Accion: {ACTION_LABEL[a]}
              </option>
            ))}
          </select>
          <button onClick={handleCreate} disabled={!form.name.trim()} className="glass-btn-primary w-full justify-center">
            <Plus size={14} /> Crear regla
          </button>
        </div>
      </GlassCard>

      <GlassCard strong>
        <GlassCardHeader title="Reglas activas" subtitle={`${rules.length} playbook(s) configurados`} icon={<Workflow size={16} />} />
        <div className="space-y-2">
          {rules.map((r) => (
            <div key={r.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-200">{r.name}</p>
                <div className="flex items-center gap-2">
                  <Toggle checked={r.enabled} onChange={(v) => handleToggle(r, v)} label="" />
                  <button onClick={() => handleDelete(r.id)} className="text-slate-500 hover:text-aegis-red">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-500">
                {r.condition.category || 'cualquier categoria'} · severidad ≥ {r.condition.minSeverity} → {ACTION_LABEL[r.action]} · disparada {r.timesTriggered} vez(veces)
              </p>
            </div>
          ))}
          {rules.length === 0 && <p className="py-6 text-center text-xs text-slate-500">Sin playbooks configurados.</p>}
        </div>
      </GlassCard>
    </div>
  )
}
