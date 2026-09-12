import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Check, KeyRound, Loader2, Send, ShieldAlert, Sparkles, Trash2, X } from 'lucide-react'
import { getAegisApi } from '@/lib/ipcClient'
import { GlassCard, GlassCardHeader } from '@/components/ui/GlassCard'
import { Toggle } from '@/components/ui/Toggle'
import type { AiChatMessage, AiConfirmationRequest, AiModel, AiSettings } from '@shared/types'

const MODEL_OPTIONS: Array<{ id: AiModel; label: string; note: string }> = [
  { id: 'claude-opus-5', label: 'Claude Opus 5', note: 'Maxima calidad de analisis · recomendado' },
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5', note: 'Equilibrado en coste y velocidad' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', note: 'El mas rapido y economico' }
]

function ChatBubble({ message }: { message: AiChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={clsx(
          'max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser ? 'bg-gradient-to-br from-aegis-cyan to-aegis-blue text-void-950' : 'glass-panel text-slate-200'
        )}
      >
        {message.text || <span className="opacity-50">…</span>}
      </div>
    </motion.div>
  )
}

function ConfirmationCard({ request, onDecide }: { request: AiConfirmationRequest; onDecide: (approved: boolean) => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-aegis-amber/30 bg-aegis-amber/[0.07] p-4">
      <div className="mb-2 flex items-center gap-2 text-aegis-amber">
        <ShieldAlert size={16} />
        <p className="text-sm font-semibold">La IA quiere ejecutar: {request.toolLabel}</p>
      </div>
      {request.reasoning && <p className="mb-2 text-xs text-slate-300">{request.reasoning}</p>}
      <pre className="mb-3 max-h-24 overflow-auto rounded-lg bg-black/30 p-2 text-[11px] text-slate-400">{JSON.stringify(request.input, null, 2)}</pre>
      <div className="flex gap-2">
        <button onClick={() => onDecide(true)} className="glass-btn-primary flex-1 justify-center !bg-none !bg-aegis-green text-void-950">
          <Check size={14} /> Aprobar
        </button>
        <button onClick={() => onDecide(false)} className="glass-btn-danger flex-1 justify-center">
          <X size={14} /> Denegar
        </button>
      </div>
    </motion.div>
  )
}

function SetupForm({ onSaved }: { onSaved: (settings: AiSettings) => void }) {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState<AiModel>('claude-opus-5')
  const [autonomousMode, setAutonomousMode] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!apiKey.trim()) return
    setSaving(true)
    const saved = await getAegisApi().aiSaveSettings({ apiKey: apiKey.trim(), model, autonomousMode })
    setSaving(false)
    setApiKey('')
    onSaved(saved)
  }

  return (
    <GlassCard strong className="mx-auto max-w-xl">
      <GlassCardHeader title="Configura el Asistente IA" subtitle="Usa tu propia clave de la API de Anthropic (Claude)" icon={<KeyRound size={16} />} />
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">Clave de API de Anthropic</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-aegis-cyan/40"
          />
          <p className="mt-1 text-[11px] text-slate-500">
            Se cifra con el almacen de credenciales de tu sistema operativo antes de guardarse en disco. Nunca sale de tu equipo salvo
            hacia la propia API de Anthropic.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-slate-400">Modelo</label>
          <div className="grid gap-2">
            {MODEL_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setModel(opt.id)}
                className={clsx(
                  'flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition-colors',
                  model === opt.id ? 'border-aegis-cyan/40 bg-aegis-cyan/[0.06]' : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                )}
              >
                <div>
                  <p className="text-sm font-medium text-slate-200">{opt.label}</p>
                  <p className="text-[11px] text-slate-500">{opt.note}</p>
                </div>
                {model === opt.id && <Check size={16} className="text-aegis-cyan" />}
              </button>
            ))}
          </div>
        </div>

        <Toggle
          checked={autonomousMode}
          onChange={setAutonomousMode}
          label="Modo autonomo"
          description="La IA ejecutara acciones (matar procesos, bloquear IPs, cuarentena, aislar red) sin pedirte confirmacion. Cada accion autonoma queda registrada como alerta."
        />
        {autonomousMode && (
          <div className="flex items-center gap-2 rounded-xl border border-aegis-red/30 bg-aegis-red/10 p-3 text-xs text-aegis-red">
            <ShieldAlert size={16} className="shrink-0" /> Con el modo autonomo activo, la IA puede tomar acciones drasticas sin que las
            apruebes una a una. Activalo solo si confias en el criterio del modelo para tu caso de uso.
          </div>
        )}

        <button onClick={handleSave} disabled={!apiKey.trim() || saving} className="glass-btn-primary w-full justify-center">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {saving ? 'Guardando...' : 'Activar asistente IA'}
        </button>
      </div>
    </GlassCard>
  )
}

export function AiAssistantView() {
  const [settings, setSettings] = useState<AiSettings | null>(null)
  const [messages, setMessages] = useState<AiChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [pendingRequest, setPendingRequest] = useState<AiConfirmationRequest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const api = getAegisApi()
    Promise.all([api.aiGetSettings(), api.aiGetHistory()]).then(([s, h]) => {
      setSettings(s)
      setMessages(h)
    })

    const offDelta = api.onAiStreamDelta((delta) => {
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === delta.messageId)
        if (idx === -1) {
          if (!delta.textDelta) return prev
          return [...prev, { id: delta.messageId, role: 'assistant', text: delta.textDelta, time: new Date().toISOString() }]
        }
        const updated = [...prev]
        updated[idx] = { ...updated[idx], text: updated[idx].text + delta.textDelta }
        return updated
      })
      if (delta.done) setSending(false)
    })

    const offConfirm = api.onAiConfirmationRequest((request) => setPendingRequest(request))

    return () => {
      offDelta()
      offConfirm()
    }
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, pendingRequest])

  if (!settings) {
    return <div className="flex h-full items-center justify-center text-slate-500">Cargando asistente...</div>
  }

  if (!settings.hasApiKey) {
    return <SetupForm onSaved={setSettings} />
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setError(null)
    setSending(true)
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, role: 'user', text, time: new Date().toISOString() }])
    const result = await getAegisApi().aiSendMessage(text)
    if (!result.ok) {
      setSending(false)
      setError(result.error || 'Error inesperado al contactar con la API de Claude.')
    }
  }

  const handleDecide = async (approved: boolean) => {
    if (!pendingRequest) return
    await getAegisApi().aiConfirmAction(pendingRequest.requestId, approved)
    setPendingRequest(null)
  }

  const handleClear = async () => {
    await getAegisApi().aiClearConversation()
    setMessages([])
  }

  const handleAutonomousToggle = async (value: boolean) => {
    const updated = await getAegisApi().aiSaveSettings({ model: settings.model, autonomousMode: value })
    setSettings(updated)
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <GlassCard className="flex shrink-0 items-center justify-between !p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-aegis-cyan/10 text-aegis-cyan">
            <Bot size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">{settings.model}</p>
            <p className="text-[11px] text-slate-500">
              {settings.keyStorageEncrypted ? 'Clave cifrada con el almacen del sistema' : '⚠ Clave guardada sin cifrado del SO'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Modo autonomo</span>
            <Toggle checked={settings.autonomousMode} onChange={handleAutonomousToggle} label="" />
          </div>
          <button onClick={handleClear} title="Borrar conversacion" className="rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-slate-400 hover:text-aegis-red">
            <Trash2 size={14} />
          </button>
        </div>
      </GlassCard>

      <GlassCard strong className="flex flex-1 flex-col overflow-hidden !p-0">
        <div ref={scrollRef} className="flex-1 space-y-3 overflow-auto p-5">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-500">
              <Sparkles size={28} className="text-aegis-cyan/60" />
              <p className="text-sm">Pregunta lo que quieras sobre el estado de tu equipo.</p>
              <p className="text-xs">Ej: "Mirame la seccion de procesos y dime que es peligroso y que no"</p>
            </div>
          )}
          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}
          <AnimatePresence>{pendingRequest && <ConfirmationCard request={pendingRequest} onDecide={handleDecide} />}</AnimatePresence>
          {sending && !pendingRequest && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 size={12} className="animate-spin" /> Analizando...
            </div>
          )}
          {error && <div className="rounded-xl border border-aegis-red/30 bg-aegis-red/10 p-3 text-xs text-aegis-red">{error}</div>}
        </div>

        <div className="border-t border-white/[0.06] p-4">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              rows={1}
              placeholder="Mirame la seccion de procesos y dime que es peligroso y que no..."
              className="max-h-32 flex-1 resize-none rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-aegis-cyan/40"
            />
            <button onClick={handleSend} disabled={sending || !input.trim()} className="glass-btn-primary !px-3.5 !py-2.5">
              <Send size={16} />
            </button>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
            Al enviar un mensaje se comparte con la API de Anthropic tu pregunta y los datos que la IA consulte del equipo (procesos,
            red, alertas, etc.) para responderte — nunca ocurre en segundo plano, solo cuando tu preguntas.
          </p>
        </div>
      </GlassCard>
    </div>
  )
}
