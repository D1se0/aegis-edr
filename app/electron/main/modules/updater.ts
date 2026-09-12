import electronUpdater from 'electron-updater'
const { autoUpdater } = electronUpdater
import type { BrowserWindow } from 'electron'
import { IPC } from '../../shared/types'
import type { UpdateStatus } from '../../shared/types'
import { logger } from './logger'
import { recordSelfNetworkCall } from './selfTelemetry'

export function initUpdater(win: BrowserWindow) {
  autoUpdater.autoDownload = false
  autoUpdater.logger = { info: (m) => logger.info('updater', String(m)), warn: (m) => logger.warn('updater', String(m)), error: (m) => logger.error('updater', String(m)), debug: () => {} }

  const send = (status: UpdateStatus) => {
    if (!win.isDestroyed()) win.webContents.send(IPC.onUpdateStatus, status)
  }

  autoUpdater.on('checking-for-update', () => {
    recordSelfNetworkCall('github.com/D1se0/aegis-edr/releases', 'Comprobacion de actualizaciones')
    send({ status: 'checking' })
  })
  autoUpdater.on('update-available', (info) => {
    send({ status: 'available', version: info.version })
    autoUpdater.downloadUpdate()
  })
  autoUpdater.on('update-not-available', () => send({ status: 'not-available' }))
  autoUpdater.on('download-progress', (p) => send({ status: 'downloading', progress: Math.round(p.percent) }))
  autoUpdater.on('update-downloaded', (info) => send({ status: 'downloaded', version: info.version }))
  autoUpdater.on('error', (err) => send({ status: 'error', message: String(err) }))
}

export function checkForUpdates() {
  autoUpdater.checkForUpdates().catch((err) => logger.error('updater', 'Fallo al comprobar actualizaciones', String(err)))
}
