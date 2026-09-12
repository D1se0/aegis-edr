import Anthropic from '@anthropic-ai/sdk'
import { randomUUID } from 'node:crypto'
import { safeStorage } from 'electron'
import type { BrowserWindow } from 'electron'
import type { AiChatMessage, AiConfirmationRequest, AiModel, AiSendResult, AiSettings, AiSettingsInput } from '../../shared/types'
import { IPC } from '../../shared/types'
import { store, getSettings, saveSettings } from './store'
import { logger } from './logger'
import { recordSelfNetworkCall } from './selfTelemetry'
import { getLatestProcesses, killProcessByPid } from './processMonitor'
import { getLatestConnections } from './networkMonitor'
import { blockIp, unblockIp, isolateHost } from './firewall'
import { quarantineFile, restoreFromQuarantine, listQuarantine } from './quarantine'
import { getLatestPersistence } from './persistenceScan'
import { getAlerts, raiseAlert } from './alerts'
import { computeSecurityScore } from './threatEngine'
import { getVitals } from './systemInfo'

/**
 * Asistente IA (Claude). Reglas de privacidad, no negociables:
 *  - NUNCA se invoca en background ni de forma automatica/programada: solo
 *    cuando el usuario escribe una pregunta en la seccion "Asistente IA".
 *  - La clave de API nunca sale del proceso main ni se expone al renderer
 *    (solo se expone un booleano `hasApiKey`).
 *  - Cada llamada saliente a la API de Claude se registra en selfTelemetry
 *    ("la app se vigila a si misma").
 *
 * Las "tools" son un espejo fino del contrato IPC ya existente: nunca
 * reimplementan logica, siempre delegan en las funciones ya validadas de cada
 * modulo (por ejemplo, block_ip pasa por la validacion de IP de firewall.ts).
 */

type ReadOnlyTool =
  | 'get_dashboard_snapshot'
  | 'list_processes'
  | 'list_connections'
  | 'list_alerts'
  | 'list_quarantine'
  | 'list_persistence'
  | 'get_settings'

type ActionTool = 'kill_process' | 'block_ip' | 'unblock_ip' | 'quarantine_file' | 'restore_quarantined_file' | 'isolate_network' | 'set_protection_module'

type ToolName = ReadOnlyTool | ActionTool

const READ_ONLY_TOOLS = new Set<ToolName>([
  'get_dashboard_snapshot',
  'list_processes',
  'list_connections',
  'list_alerts',
  'list_quarantine',
  'list_persistence',
  'get_settings'
])

const TOOL_LABELS: Record<ToolName, string> = {
  get_dashboard_snapshot: 'Consultar el panel general',
  list_processes: 'Listar procesos en ejecucion',
  list_connections: 'Listar conexiones de red',
  list_alerts: 'Listar alertas',
  list_quarantine: 'Listar ficheros en cuarentena',
  list_persistence: 'Listar puntos de persistencia',
  get_settings: 'Consultar ajustes',
  kill_process: 'Finalizar un proceso',
  block_ip: 'Bloquear una direccion IP',
  unblock_ip: 'Desbloquear una direccion IP',
  quarantine_file: 'Poner un fichero en cuarentena',
  restore_quarantined_file: 'Restaurar un fichero desde cuarentena',
  isolate_network: 'Aislar la red del equipo',
  set_protection_module: 'Cambiar un modulo de proteccion'
}

const AI_SYSTEM_PROMPT = `Eres el asistente de seguridad integrado en Aegis EDR, un EDR profesional de deteccion y respuesta en el endpoint. Hablas siempre en español, con tono claro, profesional y directo, como un analista de seguridad experto.

Tienes acceso a herramientas para consultar el estado real del equipo (procesos, conexiones de red, alertas, cuarentena, persistencia, ajustes) y para actuar sobre el (finalizar procesos, bloquear IPs, poner ficheros en cuarentena, aislar la red, activar/desactivar modulos de proteccion). Usa las herramientas de consulta libremente para responder con datos reales, nunca inventes datos del sistema — si necesitas saber algo, llama a la herramienta correspondiente.

Las herramientas de accion pueden requerir confirmacion explicita del usuario antes de ejecutarse; si el usuario deniega una accion, respeta la decision y explica alternativas en vez de insistir. Cuando el usuario te pida analizar una seccion ("mirame la seccion X y dime que es peligroso"), consulta los datos relevantes con las herramientas de lectura y da un veredicto claro y accionable: que es peligroso, por que, y que accion recomiendas — y ofrece ejecutarla si procede.

Nunca reveles ni proceses la clave de API del usuario. Se conciso pero completo: prioriza la señal sobre el ruido.`

interface StoredAiConfig {
  encryptedApiKey: string | null
  keyStorageEncrypted: boolean
  model: AiModel
  autonomousMode: boolean
}

const DEFAULT_AI_CONFIG: StoredAiConfig = {
  encryptedApiKey: null,
  keyStorageEncrypted: false,
  model: 'claude-opus-5',
  autonomousMode: false
}

function getAiConfigRaw(): StoredAiConfig {
  return { ...DEFAULT_AI_CONFIG, ...((store.get('aiConfig') as StoredAiConfig) || {}) }
}

export function getAiSettings(): AiSettings {
  const cfg = getAiConfigRaw()
  return { hasApiKey: !!cfg.encryptedApiKey, keyStorageEncrypted: cfg.keyStorageEncrypted, model: cfg.model, autonomousMode: cfg.autonomousMode }
}

export function saveAiSettings(input: AiSettingsInput): AiSettings {
  const current = getAiConfigRaw()
  let encryptedApiKey = current.encryptedApiKey
  let keyStorageEncrypted = current.keyStorageEncrypted

  if (input.apiKey) {
    if (safeStorage.isEncryptionAvailable()) {
      encryptedApiKey = safeStorage.encryptString(input.apiKey).toString('base64')
      keyStorageEncrypted = true
    } else {
      // No hay keychain/libsecret disponible: guardamos igualmente (mejor que no funcionar),
      // pero lo dejamos explicito via keyStorageEncrypted=false para que la UI avise.
      encryptedApiKey = Buffer.from(input.apiKey, 'utf-8').toString('base64')
      keyStorageEncrypted = false
      logger.warn('aiAssistant', 'safeStorage no disponible en este sistema: la clave de API se guarda sin cifrado del SO')
    }
  }

  store.set('aiConfig', { encryptedApiKey, keyStorageEncrypted, model: input.model, autonomousMode: input.autonomousMode })
  return getAiSettings()
}

export function clearAiApiKey(): AiSettings {
  const cfg = getAiConfigRaw()
  store.set('aiConfig', { ...cfg, encryptedApiKey: null, keyStorageEncrypted: false })
  return getAiSettings()
}

function getDecryptedApiKey(): string | null {
  const cfg = getAiConfigRaw()
  if (!cfg.encryptedApiKey) return null
  try {
    if (cfg.keyStorageEncrypted && safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(Buffer.from(cfg.encryptedApiKey, 'base64'))
    }
    return Buffer.from(cfg.encryptedApiKey, 'base64').toString('utf-8')
  } catch (err) {
    logger.error('aiAssistant', 'No se pudo descifrar la clave de API almacenada', String(err))
    return null
  }
}

let conversation: Anthropic.MessageParam[] = []
let history: AiChatMessage[] = []

export function getAiHistory(): AiChatMessage[] {
  return history
}

export function clearAiConversation() {
  conversation = []
  history = []
}

const pendingConfirmations = new Map<string, (approved: boolean) => void>()

export function confirmAiAction(requestId: string, approved: boolean) {
  const resolve = pendingConfirmations.get(requestId)
  if (!resolve) return
  pendingConfirmations.delete(requestId)
  resolve(approved)
}

function requestConfirmation(win: BrowserWindow, toolName: ActionTool, input: Record<string, unknown>, reasoning: string): Promise<boolean> {
  const requestId = randomUUID()
  const request: AiConfirmationRequest = {
    requestId,
    toolName,
    toolLabel: TOOL_LABELS[toolName],
    input,
    reasoning,
    createdAt: new Date().toISOString()
  }
  if (!win.isDestroyed()) win.webContents.send(IPC.onAiConfirmationRequest, request)
  return new Promise((resolve) => {
    pendingConfirmations.set(requestId, resolve)
  })
}

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_dashboard_snapshot',
    description:
      'Devuelve la puntuacion de seguridad actual, su etiqueta, los vitales del sistema (CPU/memoria/disco/red) y el estado de los modulos de proteccion. Llamala cuando el usuario pregunte por el estado general, la puntuacion de seguridad o como esta el equipo.',
    input_schema: { type: 'object', properties: {}, required: [], additionalProperties: false },
    strict: true
  },
  {
    name: 'list_processes',
    description:
      'Devuelve la lista de procesos en ejecucion con su PID, ruta, usuario, consumo de CPU/memoria y puntuacion de riesgo con motivos. Llamala para analizar procesos sospechosos o responder preguntas sobre la seccion de Procesos.',
    input_schema: { type: 'object', properties: {}, required: [], additionalProperties: false },
    strict: true
  },
  {
    name: 'list_connections',
    description:
      'Devuelve las conexiones de red activas con IP/puerto remoto, proceso asociado y puntuacion de riesgo. Llamala para analizar trafico de red sospechoso o responder preguntas sobre la seccion de Red.',
    input_schema: { type: 'object', properties: {}, required: [], additionalProperties: false },
    strict: true
  },
  {
    name: 'list_alerts',
    description: 'Devuelve el historial de alertas generadas (severidad, categoria, titulo, mensaje). Llamala para resumir o analizar amenazas detectadas recientemente.',
    input_schema: { type: 'object', properties: {}, required: [], additionalProperties: false },
    strict: true
  },
  {
    name: 'list_quarantine',
    description: 'Devuelve los ficheros actualmente en cuarentena, con su hash SHA-256 y motivo de aislamiento.',
    input_schema: { type: 'object', properties: {}, required: [], additionalProperties: false },
    strict: true
  },
  {
    name: 'list_persistence',
    description: 'Devuelve los puntos de autoarranque/persistencia detectados en el sistema (registro, cron, systemd, launchd, etc).',
    input_schema: { type: 'object', properties: {}, required: [], additionalProperties: false },
    strict: true
  },
  {
    name: 'get_settings',
    description: 'Devuelve los ajustes actuales de la aplicacion (modulos de proteccion activos, umbrales, canal de actualizaciones, etc).',
    input_schema: { type: 'object', properties: {}, required: [], additionalProperties: false },
    strict: true
  },
  {
    name: 'kill_process',
    description:
      'Finaliza (mata) un proceso por su PID. Usala cuando el usuario pida explicitamente terminar un proceso, o cuando tras analizar la lista de procesos identifiques uno claramente malicioso y el usuario acepte actuar.',
    input_schema: {
      type: 'object',
      properties: {
        pid: { type: 'integer', description: 'PID exacto del proceso a finalizar, obtenido de list_processes' },
        reason: { type: 'string', description: 'Motivo breve y claro de por que se finaliza este proceso' }
      },
      required: ['pid', 'reason'],
      additionalProperties: false
    },
    strict: true
  },
  {
    name: 'block_ip',
    description: 'Bloquea una direccion IP a nivel de firewall (entrada y salida). Usala cuando identifiques una IP remota como maliciosa o el usuario lo pida explicitamente.',
    input_schema: {
      type: 'object',
      properties: {
        ip: { type: 'string', description: 'Direccion IPv4 o IPv6 a bloquear' },
        reason: { type: 'string', description: 'Motivo breve del bloqueo' }
      },
      required: ['ip', 'reason'],
      additionalProperties: false
    },
    strict: true
  },
  {
    name: 'unblock_ip',
    description: 'Desbloquea una direccion IP previamente bloqueada.',
    input_schema: {
      type: 'object',
      properties: { ip: { type: 'string', description: 'Direccion IP a desbloquear' } },
      required: ['ip'],
      additionalProperties: false
    },
    strict: true
  },
  {
    name: 'quarantine_file',
    description: 'Aisla un fichero del sistema de ficheros moviendolo a cuarentena. Usala ante un fichero identificado como malicioso o sospechoso.',
    input_schema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Ruta absoluta del fichero a poner en cuarentena' },
        reason: { type: 'string', description: 'Motivo breve de la cuarentena' }
      },
      required: ['path', 'reason'],
      additionalProperties: false
    },
    strict: true
  },
  {
    name: 'restore_quarantined_file',
    description: 'Restaura un fichero previamente puesto en cuarentena a su ubicacion original, dado su id (obtenido de list_quarantine).',
    input_schema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Id del elemento en cuarentena' } },
      required: ['id'],
      additionalProperties: false
    },
    strict: true
  },
  {
    name: 'isolate_network',
    description:
      'Aisla completamente la red del equipo (solo queda trafico local/loopback). Es una accion drastica: usala solo ante una amenaza activa confirmada (p.ej. ransomware en curso) y con el motivo bien justificado.',
    input_schema: {
      type: 'object',
      properties: { reason: { type: 'string', description: 'Motivo del aislamiento de red' } },
      required: ['reason'],
      additionalProperties: false
    },
    strict: true
  },
  {
    name: 'set_protection_module',
    description: 'Activa o desactiva un modulo de proteccion concreto.',
    input_schema: {
      type: 'object',
      properties: {
        module: {
          type: 'string',
          enum: ['realtimeMonitoring', 'networkGuard', 'fileGuard', 'ransomwareShield', 'persistenceGuard', 'autoBlock'],
          description: 'Modulo de proteccion a cambiar'
        },
        enabled: { type: 'boolean', description: 'true para activar, false para desactivar' }
      },
      required: ['module', 'enabled'],
      additionalProperties: false
    },
    strict: true
  }
]

async function executeTool(
  win: BrowserWindow,
  name: ToolName,
  input: Record<string, unknown>,
  reasoning: string
): Promise<{ text: string; isError?: boolean }> {
  if (READ_ONLY_TOOLS.has(name)) {
    switch (name as ReadOnlyTool) {
      case 'get_dashboard_snapshot': {
        const alerts = getAlerts()
        const { score, label } = computeSecurityScore(alerts)
        return { text: JSON.stringify({ score, scoreLabel: label, vitals: getVitals(), protection: getSettings().protection }) }
      }
      case 'list_processes':
        return { text: JSON.stringify(getLatestProcesses().slice(0, 60)) }
      case 'list_connections':
        return { text: JSON.stringify(getLatestConnections().slice(0, 60)) }
      case 'list_alerts':
        return { text: JSON.stringify(getAlerts().slice(0, 60)) }
      case 'list_quarantine':
        return { text: JSON.stringify(listQuarantine()) }
      case 'list_persistence':
        return { text: JSON.stringify(getLatestPersistence()) }
      case 'get_settings':
        return { text: JSON.stringify(getSettings()) }
    }
  }

  const actionName = name as ActionTool
  const autonomous = getAiSettings().autonomousMode
  const approved = autonomous ? true : await requestConfirmation(win, actionName, input, reasoning)

  if (!approved) {
    return { text: 'El usuario denego esta accion. No la ejecutes de nuevo salvo que el usuario lo pida explicitamente otra vez.' }
  }

  if (autonomous) {
    raiseAlert({
      severity: 'info',
      category: 'system',
      title: `La IA ejecuto automaticamente: ${TOOL_LABELS[actionName]}`,
      message: `Motivo: ${reasoning || 'sin motivo especificado por el modelo'}`
    })
  }

  switch (actionName) {
    case 'kill_process': {
      const result = killProcessByPid(Number(input.pid))
      return { text: JSON.stringify(result), isError: !result.ok }
    }
    case 'block_ip': {
      const result = await blockIp(String(input.ip), String(input.reason || reasoning || 'Accion solicitada por el asistente IA'))
      return { text: JSON.stringify(result), isError: !result.ok }
    }
    case 'unblock_ip': {
      const result = await unblockIp(String(input.ip))
      return { text: JSON.stringify(result), isError: !result.ok }
    }
    case 'quarantine_file': {
      const result = quarantineFile(String(input.path), String(input.reason || reasoning || 'Accion solicitada por el asistente IA'))
      return { text: JSON.stringify(result), isError: !result.ok }
    }
    case 'restore_quarantined_file': {
      const result = restoreFromQuarantine(String(input.id))
      return { text: JSON.stringify(result), isError: !result.ok }
    }
    case 'isolate_network': {
      const result = await isolateHost(String(input.reason || reasoning || 'Accion solicitada por el asistente IA'))
      return { text: JSON.stringify(result), isError: !result.ok }
    }
    case 'set_protection_module': {
      const settings = getSettings()
      const key = String(input.module) as keyof typeof settings.protection
      if (!(key in settings.protection)) return { text: 'Modulo de proteccion desconocido.', isError: true }
      settings.protection = { ...settings.protection, [key]: Boolean(input.enabled) }
      saveSettings(settings)
      return { text: JSON.stringify(settings.protection) }
    }
  }
}

const MAX_ITERATIONS = 12

export async function sendAiMessage(win: BrowserWindow, userText: string): Promise<AiSendResult> {
  const apiKey = getDecryptedApiKey()
  if (!apiKey) {
    return { ok: false, error: 'No hay una clave de API de Claude configurada. Añadela en Ajustes > Asistente IA.' }
  }

  const cfg = getAiSettings()
  const client = new Anthropic({ apiKey })

  history.push({ id: randomUUID(), role: 'user', text: userText, time: new Date().toISOString() })
  conversation.push({ role: 'user', content: userText })

  const messageId = randomUUID()
  let assistantText = ''
  const useThinking = cfg.model !== 'claude-haiku-4-5'

  try {
    let iterations = 0
    let done = false

    while (!done) {
      iterations += 1
      if (iterations > MAX_ITERATIONS) {
        logger.warn('aiAssistant', 'El bucle agentico alcanzo el limite de iteraciones sin terminar')
        break
      }

      recordSelfNetworkCall('api.anthropic.com', 'Consulta al asistente IA (Claude)')

      const stream = client.messages.stream({
        model: cfg.model,
        max_tokens: 4096,
        ...(useThinking ? { thinking: { type: 'adaptive' as const } } : {}),
        system: AI_SYSTEM_PROMPT,
        tools: TOOLS,
        messages: conversation
      })

      stream.on('text', (delta) => {
        assistantText += delta
        if (!win.isDestroyed()) win.webContents.send(IPC.onAiStreamDelta, { messageId, textDelta: delta, done: false })
      })

      const response = await stream.finalMessage()

      if (response.stop_reason === 'pause_turn') {
        conversation.push({ role: 'assistant', content: response.content })
        continue
      }

      conversation.push({ role: 'assistant', content: response.content })

      const toolUseBlocks = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')

      if (toolUseBlocks.length === 0) {
        done = true
        break
      }

      const reasoning = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join(' ')
        .trim()

      const toolResults: Anthropic.ToolResultBlockParam[] = []
      for (const block of toolUseBlocks) {
        const name = block.name as ToolName
        const input = (block.input as Record<string, unknown>) || {}
        try {
          const result = await executeTool(win, name, input, reasoning)
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result.text, is_error: result.isError })
        } catch (err) {
          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: `Error ejecutando la herramienta: ${String(err)}`, is_error: true })
        }
      }

      conversation.push({ role: 'user', content: toolResults })
    }

    if (!win.isDestroyed()) win.webContents.send(IPC.onAiStreamDelta, { messageId, textDelta: '', done: true })
    history.push({ id: messageId, role: 'assistant', text: assistantText, time: new Date().toISOString() })

    return { ok: true }
  } catch (err) {
    let message = 'Error inesperado al contactar con la API de Claude.'
    if (err instanceof Anthropic.AuthenticationError) message = 'La clave de API no es valida.'
    else if (err instanceof Anthropic.RateLimitError) message = 'Limite de peticiones alcanzado, reintenta en unos segundos.'
    else if (err instanceof Anthropic.APIError) message = `Error de la API de Claude: ${err.message}`
    logger.error('aiAssistant', 'Fallo en la conversacion con el asistente IA', String(err))
    if (!win.isDestroyed()) win.webContents.send(IPC.onAiStreamDelta, { messageId, textDelta: '', done: true })
    return { ok: false, error: message }
  }
}
