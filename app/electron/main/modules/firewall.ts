import sudoPrompt from 'sudo-prompt'
import { platform } from 'node:os'
import { raiseAlert } from './alerts'
import { logger } from './logger'

const blockedIps = new Set<string>()
const SUDO_OPTS = { name: 'Aegis EDR' }

export function getBlockedIps(): string[] {
  return Array.from(blockedIps)
}

export function isIpBlocked(ip: string): boolean {
  return blockedIps.has(ip)
}

function runElevated(command: string): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    sudoPrompt.exec(command, SUDO_OPTS, (error) => {
      if (error) {
        logger.error('firewall', `Comando elevado fallido: ${command}`, String(error))
        resolve({ ok: false, error: String(error) })
      } else {
        resolve({ ok: true })
      }
    })
  })
}

function buildBlockCommand(ip: string): string {
  const os = platform()
  if (os === 'win32') {
    return `netsh advfirewall firewall add rule name="AegisEDR-Block-${ip}" dir=out action=block remoteip=${ip} && netsh advfirewall firewall add rule name="AegisEDR-Block-${ip}-in" dir=in action=block remoteip=${ip}`
  }
  if (os === 'darwin') {
    return `mkdir -p /etc/pf.anchors && echo "block drop from any to ${ip}" >> /etc/pf.anchors/aegisedr && echo "block drop from ${ip} to any" >> /etc/pf.anchors/aegisedr && (grep -q 'anchor "aegisedr"' /etc/pf.conf || echo 'anchor "aegisedr"\\nload anchor "aegisedr" from "/etc/pf.anchors/aegisedr"' >> /etc/pf.conf) && pfctl -f /etc/pf.conf -E`
  }
  return `iptables -A OUTPUT -d ${ip} -j DROP && iptables -A INPUT -s ${ip} -j DROP`
}

function buildUnblockCommand(ip: string): string {
  const os = platform()
  if (os === 'win32') {
    return `netsh advfirewall firewall delete rule name="AegisEDR-Block-${ip}" && netsh advfirewall firewall delete rule name="AegisEDR-Block-${ip}-in"`
  }
  if (os === 'darwin') {
    return `sed -i '' "/${ip.replace(/\./g, '\\.')}/d" /etc/pf.anchors/aegisedr && pfctl -f /etc/pf.conf -E`
  }
  return `iptables -D OUTPUT -d ${ip} -j DROP; iptables -D INPUT -s ${ip} -j DROP`
}

export async function blockIp(ip: string, reason: string): Promise<{ ok: boolean; error?: string }> {
  if (!isValidIp(ip)) {
    return { ok: false, error: 'Direccion IP con formato invalido.' }
  }
  if (blockedIps.has(ip)) return { ok: true }
  if (isPrivateOrLoopback(ip)) {
    return { ok: false, error: 'No se bloquean direcciones locales/privadas para evitar cortar la conectividad del equipo.' }
  }
  const result = await runElevated(buildBlockCommand(ip))
  if (result.ok) {
    blockedIps.add(ip)
    raiseAlert({
      severity: 'high',
      category: 'network',
      title: `IP bloqueada: ${ip}`,
      message: reason,
      sourceId: ip,
      autoBlocked: true
    })
  }
  return result
}

export async function unblockIp(ip: string): Promise<{ ok: boolean; error?: string }> {
  if (!isValidIp(ip)) {
    return { ok: false, error: 'Direccion IP con formato invalido.' }
  }
  const result = await runElevated(buildUnblockCommand(ip))
  if (result.ok) blockedIps.delete(ip)
  return result
}

let isolated = false

export function isHostIsolated(): boolean {
  return isolated
}

function buildIsolateCommand(): string {
  const os = platform()
  if (os === 'win32') {
    return 'netsh advfirewall set allprofiles firewallpolicy blockinbound,blockoutbound'
  }
  if (os === 'darwin') {
    return `mkdir -p /etc/pf.anchors && printf 'block all\\npass on lo0\\n' > /etc/pf.anchors/aegisedr_isolate && (grep -q 'aegisedr_isolate' /etc/pf.conf || echo 'anchor "aegisedr_isolate"\\nload anchor "aegisedr_isolate" from "/etc/pf.anchors/aegisedr_isolate"' >> /etc/pf.conf) && pfctl -f /etc/pf.conf -e`
  }
  return `iptables -N AEGIS_ISOLATE 2>/dev/null; iptables -F AEGIS_ISOLATE; iptables -A AEGIS_ISOLATE -o lo -j ACCEPT; iptables -A AEGIS_ISOLATE -i lo -j ACCEPT; iptables -A AEGIS_ISOLATE -j DROP; iptables -C OUTPUT -j AEGIS_ISOLATE 2>/dev/null || iptables -I OUTPUT -j AEGIS_ISOLATE; iptables -C INPUT -j AEGIS_ISOLATE 2>/dev/null || iptables -I INPUT -j AEGIS_ISOLATE`
}

function buildRestoreCommand(): string {
  const os = platform()
  if (os === 'win32') {
    return 'netsh advfirewall set allprofiles firewallpolicy blockinbound,allowoutbound'
  }
  if (os === 'darwin') {
    return `pfctl -d || true`
  }
  return `iptables -D OUTPUT -j AEGIS_ISOLATE; iptables -D INPUT -j AEGIS_ISOLATE; iptables -F AEGIS_ISOLATE; iptables -X AEGIS_ISOLATE`
}

export async function isolateHost(reason: string): Promise<{ ok: boolean; error?: string }> {
  const result = await runElevated(buildIsolateCommand())
  if (result.ok) {
    isolated = true
    raiseAlert({
      severity: 'critical',
      category: 'system',
      title: 'Endpoint aislado de la red',
      message: `Aislamiento de red activado: ${reason}. Solo el trafico local (loopback) permanece disponible.`,
      autoBlocked: true
    })
  }
  return result
}

export async function restoreNetwork(): Promise<{ ok: boolean; error?: string }> {
  const result = await runElevated(buildRestoreCommand())
  if (result.ok) {
    isolated = false
    raiseAlert({
      severity: 'info',
      category: 'system',
      title: 'Aislamiento de red desactivado',
      message: 'La conectividad de red del equipo ha sido restaurada.'
    })
  }
  return result
}

const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
const IPV6_RE = /^[0-9a-fA-F:]+$/

/** Valida que la cadena sea una IPv4/IPv6 con forma correcta antes de interpolarla en un comando de shell elevado. */
function isValidIp(ip: string): boolean {
  const m = ip.match(IPV4_RE)
  if (m) return m.slice(1, 5).every((octet) => Number(octet) <= 255)
  return ip.includes(':') && IPV6_RE.test(ip)
}

function isPrivateOrLoopback(ip: string): boolean {
  return (
    ip === '' ||
    ip === '::1' ||
    ip.startsWith('127.') ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  )
}
