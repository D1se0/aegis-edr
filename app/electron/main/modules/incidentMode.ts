import { app } from 'electron'
import { existsSync, mkdirSync, createWriteStream } from 'node:fs'
import { join } from 'node:path'
import archiver from 'archiver'
import type { IncidentModeResult } from '../../shared/types'
import { isolateHost } from './firewall'
import { getLatestProcesses, killProcessByPid } from './processMonitor'
import { getLatestConnections } from './networkMonitor'
import { getAlerts, raiseAlert } from './alerts'
import { getLatestPersistence } from './persistenceScan'
import { getRecentFileEvents, getHostsStatus } from './fileIntegrity'
import { listQuarantine } from './quarantine'
import { logger } from './logger'

/**
 * "Modo Incidente": respuesta de un clic ante una amenaza confirmada. Aisla la
 * red, finaliza los procesos actualmente marcados como criticos, y empaqueta
 * un bundle de evidencia (zip) con el snapshot completo — listo para adjuntar
 * a un informe o entregar a un equipo de respuesta a incidentes.
 */
export async function triggerIncidentMode(reason: string): Promise<IncidentModeResult> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const bundleDir = join(app.getPath('userData'), 'incidents')
    if (!existsSync(bundleDir)) mkdirSync(bundleDir, { recursive: true })
    const zipPath = join(bundleDir, `incident-${timestamp}.zip`)

    const isolation = await isolateHost(`Modo incidente activado: ${reason}`)

    const criticalProcesses = getLatestProcesses().filter((p) => p.riskScore >= 70)
    for (const p of criticalProcesses) {
      killProcessByPid(p.pid)
    }

    const evidence = {
      generatedAt: new Date().toISOString(),
      reason,
      networkIsolated: isolation.ok,
      processesTerminated: criticalProcesses.map((p) => ({ pid: p.pid, name: p.name, path: p.path, riskScore: p.riskScore, riskReasons: p.riskReasons })),
      allProcesses: getLatestProcesses(),
      connections: getLatestConnections(),
      alerts: getAlerts(),
      persistence: getLatestPersistence(),
      fileEvents: getRecentFileEvents(),
      hosts: getHostsStatus(),
      quarantine: listQuarantine()
    }

    await new Promise<void>((resolve, reject) => {
      const output = createWriteStream(zipPath)
      const archive = archiver('zip', { zlib: { level: 9 } })
      output.on('close', () => resolve())
      archive.on('error', (err) => reject(err))
      archive.pipe(output)
      archive.append(JSON.stringify(evidence, null, 2), { name: 'evidence.json' })
      archive.append(
        `Aegis EDR — Bundle de evidencia de Modo Incidente\nGenerado: ${evidence.generatedAt}\nMotivo: ${reason}\nRed aislada: ${isolation.ok ? 'si' : 'no (' + (isolation.error ?? 'error desconocido') + ')'}\nProcesos finalizados: ${criticalProcesses.length}\n`,
        { name: 'README.txt' }
      )
      archive.finalize()
    })

    raiseAlert({
      severity: 'critical',
      category: 'system',
      title: 'Modo Incidente activado',
      message: `Red aislada: ${isolation.ok ? 'si' : 'no'}. ${criticalProcesses.length} proceso(s) critico(s) finalizados. Evidencia empaquetada en ${zipPath}. Motivo: ${reason}`,
      autoBlocked: true
    })

    return { ok: true, bundlePath: zipPath }
  } catch (err) {
    logger.error('incidentMode', 'Fallo al activar el modo incidente', String(err))
    return { ok: false, error: String(err) }
  }
}
