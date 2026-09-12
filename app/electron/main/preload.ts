import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/types'
import type { AppSettings, AiSettingsInput, PlaybookRule } from '../shared/types'

const api = {
  getSnapshot: () => ipcRenderer.invoke(IPC.getSnapshot),
  getSettings: () => ipcRenderer.invoke(IPC.getSettings),
  updateSettings: (settings: AppSettings) => ipcRenderer.invoke(IPC.updateSettings, settings),
  runFullScan: () => ipcRenderer.invoke(IPC.runFullScan),
  killProcess: (pid: number) => ipcRenderer.invoke(IPC.killProcess, pid),
  blockProcessNetwork: (pid: number) => ipcRenderer.invoke(IPC.blockProcessNetwork, pid),
  blockIp: (ip: string, reason: string) => ipcRenderer.invoke(IPC.blockIp, ip, reason),
  unblockIp: (ip: string) => ipcRenderer.invoke(IPC.unblockIp, ip),
  quarantineFile: (path: string, reason: string) => ipcRenderer.invoke(IPC.quarantineFile, path, reason),
  restoreQuarantine: (id: string) => ipcRenderer.invoke(IPC.restoreQuarantine, id),
  listQuarantine: () => ipcRenderer.invoke(IPC.listQuarantine),
  acknowledgeAlert: (id: string) => ipcRenderer.invoke(IPC.acknowledgeAlert, id),
  clearAlerts: () => ipcRenderer.invoke(IPC.clearAlerts),
  toggleProtection: (key: string, value: boolean) => ipcRenderer.invoke(IPC.toggleProtection, key, value),
  isolateHost: (reason: string) => ipcRenderer.invoke(IPC.isolateHost, reason),
  restoreNetwork: () => ipcRenderer.invoke(IPC.restoreNetwork),
  checkForUpdates: () => ipcRenderer.invoke(IPC.checkForUpdates),
  windowAction: (action: 'minimize' | 'maximize' | 'close') => ipcRenderer.invoke(IPC.windowAction, action),
  openExternal: (url: string) => ipcRenderer.invoke(IPC.openExternal, url),
  onSnapshotUpdate: (cb: (snapshot: unknown) => void) => {
    const listener = (_: unknown, data: unknown) => cb(data)
    ipcRenderer.on(IPC.onSnapshotUpdate, listener)
    return () => ipcRenderer.removeListener(IPC.onSnapshotUpdate, listener)
  },
  onAlert: (cb: (alert: unknown) => void) => {
    const listener = (_: unknown, data: unknown) => cb(data)
    ipcRenderer.on(IPC.onAlert, listener)
    return () => ipcRenderer.removeListener(IPC.onAlert, listener)
  },
  onUpdateStatus: (cb: (status: unknown) => void) => {
    const listener = (_: unknown, data: unknown) => cb(data)
    ipcRenderer.on(IPC.onUpdateStatus, listener)
    return () => ipcRenderer.removeListener(IPC.onUpdateStatus, listener)
  },

  // Asistente IA
  aiGetSettings: () => ipcRenderer.invoke(IPC.aiGetSettings),
  aiSaveSettings: (input: AiSettingsInput) => ipcRenderer.invoke(IPC.aiSaveSettings, input),
  aiClearApiKey: () => ipcRenderer.invoke(IPC.aiClearApiKey),
  aiSendMessage: (text: string) => ipcRenderer.invoke(IPC.aiSendMessage, text),
  aiConfirmAction: (requestId: string, approved: boolean) => ipcRenderer.invoke(IPC.aiConfirmAction, requestId, approved),
  aiClearConversation: () => ipcRenderer.invoke(IPC.aiClearConversation),
  aiGetHistory: () => ipcRenderer.invoke(IPC.aiGetHistory),
  onAiStreamDelta: (cb: (delta: unknown) => void) => {
    const listener = (_: unknown, data: unknown) => cb(data)
    ipcRenderer.on(IPC.onAiStreamDelta, listener)
    return () => ipcRenderer.removeListener(IPC.onAiStreamDelta, listener)
  },
  onAiConfirmationRequest: (cb: (request: unknown) => void) => {
    const listener = (_: unknown, data: unknown) => cb(data)
    ipcRenderer.on(IPC.onAiConfirmationRequest, listener)
    return () => ipcRenderer.removeListener(IPC.onAiConfirmationRequest, listener)
  },

  // Storyline / incidentes
  listIncidents: () => ipcRenderer.invoke(IPC.listIncidents),

  // Score explicable
  explainScore: () => ipcRenderer.invoke(IPC.explainScore),

  // Honeytokens
  listHoneytokens: () => ipcRenderer.invoke(IPC.listHoneytokens),

  // Backups / rollback simplificado
  listFileBackups: () => ipcRenderer.invoke(IPC.listFileBackups),
  restoreFromBackup: (id: string) => ipcRenderer.invoke(IPC.restoreFromBackup, id),

  // Auditoria de extensiones de navegador
  listBrowserExtensions: () => ipcRenderer.invoke(IPC.listBrowserExtensions),
  scanBrowserExtensions: () => ipcRenderer.invoke(IPC.scanBrowserExtensions),

  // Modo incidente
  triggerIncidentMode: (reason: string) => ipcRenderer.invoke(IPC.triggerIncidentMode, reason),

  // Playbooks
  listPlaybooks: () => ipcRenderer.invoke(IPC.listPlaybooks),
  savePlaybook: (rule: Partial<Pick<PlaybookRule, 'id'>> & Omit<PlaybookRule, 'id' | 'createdAt' | 'timesTriggered'>) =>
    ipcRenderer.invoke(IPC.savePlaybook, rule),
  deletePlaybook: (id: string) => ipcRenderer.invoke(IPC.deletePlaybook, id),

  // Auto-vigilancia de red propia
  listSelfNetworkLog: () => ipcRenderer.invoke(IPC.listSelfNetworkLog),

  // Config-as-code
  exportConfig: () => ipcRenderer.invoke(IPC.exportConfig),
  importConfig: (raw: string) => ipcRenderer.invoke(IPC.importConfig, raw),

  // Insignia de score
  getScoreBadgeSvg: () => ipcRenderer.invoke(IPC.getScoreBadgeSvg)
}

contextBridge.exposeInMainWorld('aegis', api)

export type AegisApi = typeof api
