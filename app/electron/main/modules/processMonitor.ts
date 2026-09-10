import si from 'systeminformation'
import type { ProcessInfo } from '../../shared/types'
import { scoreProcess, severityFromScore } from './threatEngine'
import { raiseAlert } from './alerts'
import { getSettings } from './store'
import { logger } from './logger'

let latest: ProcessInfo[] = []
const alertedRecently = new Map<string, number>()
const ALERT_COOLDOWN_MS = 10 * 60 * 1000
let timer: NodeJS.Timeout | null = null

export function getLatestProcesses(): ProcessInfo[] {
  return latest
}

export async function pollProcesses(): Promise<ProcessInfo[]> {
  const settings = getSettings()
  try {
    const data = await si.processes()
    const list: ProcessInfo[] = data.list.map((p) => {
      const memMb = (p.memRss || 0) / 1024
      const { riskScore, riskReasons } = scoreProcess({
        name: p.name || 'desconocido',
        path: (p as unknown as { path?: string }).path || p.command || '',
        user: p.user || '',
        cpu: p.cpu || 0,
        memMb,
        cpuAlertThreshold: settings.cpuAlertThreshold
      })
      return {
        pid: p.pid,
        ppid: p.parentPid,
        name: p.name || 'desconocido',
        path: (p as unknown as { path?: string }).path || p.command || '',
        user: p.user || 'n/d',
        cpu: p.cpu || 0,
        memMb,
        startedAt: p.started || '',
        riskScore,
        riskReasons,
        blocked: false
      }
    })

    list.sort((a, b) => b.riskScore - a.riskScore || b.cpu - a.cpu)
    latest = list

    if (settings.protection.realtimeMonitoring) {
      for (const proc of list) {
        if (proc.riskScore < 45) continue
        const key = `${proc.name}:${proc.path}`
        const last = alertedRecently.get(key) || 0
        if (Date.now() - last < ALERT_COOLDOWN_MS) continue
        alertedRecently.set(key, Date.now())
        raiseAlert({
          severity: severityFromScore(proc.riskScore),
          category: 'process',
          title: `Proceso sospechoso detectado: ${proc.name}`,
          message: `${proc.riskReasons.join('. ')}. PID ${proc.pid}, ruta: ${proc.path || 'desconocida'}.`,
          sourceId: String(proc.pid)
        })
      }
    }

    return list
  } catch (err) {
    logger.error('processMonitor', 'Fallo al listar procesos', String(err))
    return latest
  }
}

export function startProcessMonitor(intervalMs = 5000) {
  if (timer) return
  pollProcesses()
  timer = setInterval(pollProcesses, intervalMs)
}

export function stopProcessMonitor() {
  if (timer) clearInterval(timer)
  timer = null
}

export function killProcessByPid(pid: number): { ok: boolean; error?: string } {
  try {
    process.kill(pid, 'SIGTERM')
    setTimeout(() => {
      try {
        process.kill(pid, 0)
        process.kill(pid, 'SIGKILL')
      } catch {
        /* already dead */
      }
    }, 1500)
    raiseAlert({
      severity: 'info',
      category: 'process',
      title: 'Proceso finalizado manualmente',
      message: `Se ha enviado señal de terminacion al proceso PID ${pid}.`,
      sourceId: String(pid),
      autoBlocked: true
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}
