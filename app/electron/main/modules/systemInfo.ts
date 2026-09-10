import si from 'systeminformation'
import { randomUUID } from 'node:crypto'
import type { SystemVitals, UsbDevice } from '../../shared/types'
import { raiseAlert } from './alerts'
import { logger } from './logger'

let vitals: SystemVitals = {
  cpuLoad: 0,
  memUsedPct: 0,
  memTotalGb: 0,
  diskUsedPct: 0,
  platform: process.platform,
  distro: '',
  hostname: '',
  uptimeSec: 0,
  netInSpeed: 0,
  netOutSpeed: 0
}

let usbEvents: UsbDevice[] = []
let knownUsb = new Set<string>()
let baselineUsbDone = false
let timer: NodeJS.Timeout | null = null
let usbTimer: NodeJS.Timeout | null = null
let staticInfoLoaded = false

export function getVitals(): SystemVitals {
  return vitals
}

export function getUsbEvents(): UsbDevice[] {
  return usbEvents
}

async function loadStaticInfo() {
  try {
    const [osInfo] = await Promise.all([si.osInfo()])
    vitals.distro = `${osInfo.distro} ${osInfo.release}`.trim()
    vitals.hostname = osInfo.hostname
    staticInfoLoaded = true
  } catch (err) {
    logger.error('systemInfo', 'No se pudo cargar info estatica del SO', String(err))
  }
}

async function pollVitals() {
  try {
    if (!staticInfoLoaded) await loadStaticInfo()
    const [load, mem, fs, time, net] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      Promise.resolve(si.time()),
      si.networkStats().catch(() => [])
    ])

    const primaryDisk = fs[0]
    const netAgg = Array.isArray(net) && net.length ? net[0] : undefined

    vitals = {
      ...vitals,
      cpuLoad: Math.round(load.currentLoad),
      memUsedPct: Math.round((mem.active / mem.total) * 100),
      memTotalGb: Math.round((mem.total / 1024 / 1024 / 1024) * 10) / 10,
      diskUsedPct: primaryDisk ? Math.round(primaryDisk.use) : 0,
      uptimeSec: time.uptime || 0,
      netInSpeed: netAgg ? Math.round((netAgg.rx_sec || 0) / 1024) : 0,
      netOutSpeed: netAgg ? Math.round((netAgg.tx_sec || 0) / 1024) : 0
    }
  } catch (err) {
    logger.error('systemInfo', 'Fallo al obtener vitales del sistema', String(err))
  }
}

async function pollUsb() {
  try {
    const devices = await si.usb()
    const currentIds = new Set(devices.map((d) => `${d.vendor}:${d.name}:${d.serialNumber || ''}`))

    if (!baselineUsbDone) {
      knownUsb = currentIds
      baselineUsbDone = true
      return
    }

    for (const id of currentIds) {
      if (knownUsb.has(id)) continue
      const [vendor, name] = id.split(':')
      const ev: UsbDevice = { id: randomUUID(), name: name || 'Dispositivo USB', vendor: vendor || 'desconocido', event: 'connected', time: new Date().toISOString() }
      usbEvents.unshift(ev)
      raiseAlert({
        severity: 'medium',
        category: 'usb',
        title: `Nuevo dispositivo USB conectado: ${ev.name}`,
        message: `Fabricante: ${ev.vendor}. Verifica que reconoces este dispositivo.`,
        sourceId: ev.id
      })
    }
    for (const id of knownUsb) {
      if (currentIds.has(id)) continue
      const [vendor, name] = id.split(':')
      usbEvents.unshift({ id: randomUUID(), name: name || 'Dispositivo USB', vendor: vendor || 'desconocido', event: 'disconnected', time: new Date().toISOString() })
    }
    usbEvents = usbEvents.slice(0, 100)
    knownUsb = currentIds
  } catch (err) {
    logger.error('systemInfo', 'Fallo al enumerar USB', String(err))
  }
}

export function startSystemInfoMonitor(vitalsIntervalMs = 3000, usbIntervalMs = 8000) {
  if (timer) return
  pollVitals()
  pollUsb()
  timer = setInterval(() => {
    pollVitals()
  }, vitalsIntervalMs)
  usbTimer = setInterval(pollUsb, usbIntervalMs)
}

export function stopSystemInfoMonitor() {
  if (timer) clearInterval(timer)
  if (usbTimer) clearInterval(usbTimer)
  timer = null
  usbTimer = null
}
