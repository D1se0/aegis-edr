import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/types'
import type { AppSettings } from '../shared/types'

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
  }
}

contextBridge.exposeInMainWorld('aegis', api)

export type AegisApi = typeof api
