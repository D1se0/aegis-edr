import { app, BrowserWindow, ipcMain, shell, Notification } from 'electron'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { IPC } from '../shared/types'
import type { SecuritySnapshot, AppSettings } from '../shared/types'
import { getSettings, saveSettings } from './modules/store'
import { logger } from './modules/logger'
import { startProcessMonitor, getLatestProcesses, killProcessByPid } from './modules/processMonitor'
import { startNetworkMonitor, getLatestConnections } from './modules/networkMonitor'
import { startFileIntegrityMonitor, getRecentFileEvents, getHostsStatus } from './modules/fileIntegrity'
import { startPersistenceScan, getLatestPersistence, scanPersistence } from './modules/persistenceScan'
import { startSystemInfoMonitor, getVitals, getUsbEvents } from './modules/systemInfo'
import { blockIp, unblockIp, isolateHost, restoreNetwork } from './modules/firewall'
import { quarantineFile, restoreFromQuarantine, listQuarantine } from './modules/quarantine'
import { onAlert, getAlerts, acknowledgeAlert, clearAlerts, raiseAlert } from './modules/alerts'
import { computeSecurityScore } from './modules/threatEngine'
import { initUpdater, checkForUpdates } from './modules/updater'

const __dirname = dirname(fileURLToPath(import.meta.url))
process.env.APP_ROOT = join(__dirname, '..', '..')
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL
const RENDERER_DIST = join(process.env.APP_ROOT, 'dist')

let mainWindow: BrowserWindow | null = null

function buildSnapshot(): SecuritySnapshot {
  const alerts = getAlerts()
  const { score, label } = computeSecurityScore(alerts)
  const settings = getSettings()
  return {
    score,
    scoreLabel: label,
    vitals: getVitals(),
    processes: getLatestProcesses(),
    connections: getLatestConnections(),
    alerts,
    persistence: getLatestPersistence(),
    fileEvents: getRecentFileEvents(),
    hosts: getHostsStatus(),
    usbEvents: getUsbEvents(),
    protection: settings.protection,
    lastScan: new Date().toISOString()
  }
}

function broadcastSnapshot() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IPC.onSnapshotUpdate, buildSnapshot())
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 680,
    show: false,
    frame: false,
    transparent: process.platform !== 'linux',
    backgroundColor: process.platform === 'linux' ? '#05070d' : '#00000000',
    vibrancy: process.platform === 'darwin' ? 'under-window' : undefined,
    backgroundMaterial: process.platform === 'win32' ? 'acrylic' : undefined,
    titleBarStyle: 'hidden',
    icon: join(process.env.APP_ROOT!, 'build', 'icon.png'),
    webPreferences: {
      preload: join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.once('ready-to-show', () => mainWindow?.show())

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(join(RENDERER_DIST, 'index.html'))
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

function registerIpc() {
  ipcMain.handle(IPC.getSnapshot, () => buildSnapshot())
  ipcMain.handle(IPC.getSettings, () => getSettings())
  ipcMain.handle(IPC.updateSettings, (_e, settings: AppSettings) => {
    saveSettings(settings)
    return getSettings()
  })
  ipcMain.handle(IPC.runFullScan, async () => {
    await scanPersistence()
    broadcastSnapshot()
    return buildSnapshot()
  })
  ipcMain.handle(IPC.killProcess, (_e, pid: number) => killProcessByPid(pid))
  ipcMain.handle(IPC.blockProcessNetwork, (_e, pid: number) => {
    const conn = getLatestConnections().find((c) => c.pid === pid && c.remoteAddress)
    if (!conn) return { ok: false, error: 'No se encontraron conexiones activas para ese proceso.' }
    return blockIp(conn.remoteAddress, `Bloqueo manual de red para el proceso ${conn.processName} (PID ${pid})`)
  })
  ipcMain.handle(IPC.blockIp, (_e, ip: string, reason: string) => blockIp(ip, reason))
  ipcMain.handle(IPC.unblockIp, (_e, ip: string) => unblockIp(ip))
  ipcMain.handle(IPC.quarantineFile, (_e, path: string, reason: string) => quarantineFile(path, reason))
  ipcMain.handle(IPC.restoreQuarantine, (_e, id: string) => restoreFromQuarantine(id))
  ipcMain.handle(IPC.listQuarantine, () => listQuarantine())
  ipcMain.handle(IPC.acknowledgeAlert, (_e, id: string) => {
    acknowledgeAlert(id)
    return true
  })
  ipcMain.handle(IPC.clearAlerts, () => {
    clearAlerts()
    return true
  })
  ipcMain.handle(IPC.toggleProtection, (_e, key: string, value: boolean) => {
    const settings = getSettings()
    ;(settings.protection as unknown as Record<string, boolean>)[key] = value
    saveSettings(settings)
    return settings
  })
  ipcMain.handle(IPC.isolateHost, (_e, reason: string) => isolateHost(reason))
  ipcMain.handle(IPC.restoreNetwork, () => restoreNetwork())
  ipcMain.handle(IPC.checkForUpdates, () => checkForUpdates())
  ipcMain.handle(IPC.windowAction, (_e, action: 'minimize' | 'maximize' | 'close') => {
    if (!mainWindow) return
    if (action === 'minimize') mainWindow.minimize()
    if (action === 'maximize') mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
    if (action === 'close') mainWindow.close()
  })
  ipcMain.handle(IPC.openExternal, (_e, url: string) => shell.openExternal(url))
}

app.whenReady().then(() => {
  createWindow()
  registerIpc()

  if (mainWindow) initUpdater(mainWindow)

  startProcessMonitor()
  startNetworkMonitor()
  startFileIntegrityMonitor()
  startPersistenceScan()
  startSystemInfoMonitor()

  onAlert((alert) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPC.onAlert, alert)
    }
    if (['critical', 'high'].includes(alert.severity) && Notification.isSupported()) {
      new Notification({ title: `Aegis EDR · ${alert.title}`, body: alert.message }).show()
    }
  })

  setInterval(broadcastSnapshot, 3000)

  raiseAlert({
    severity: 'info',
    category: 'system',
    title: 'Aegis EDR activo',
    message: 'La monitorizacion en tiempo real ha comenzado correctamente.'
  })

  logger.info('main', 'Aegis EDR iniciado', { platform: process.platform })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
