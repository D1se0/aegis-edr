import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Clock, ExternalLink, MonitorSmartphone } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { useReleases, type ReleaseAsset } from '@/lib/useReleases'
import { detectOs, type DetectedOs } from '@/lib/platform'
import { GITHUB_URL } from '@/lib/site'

interface PlatformCard {
  os: DetectedOs
  title: string
  formats: string
  assetPlatforms: ReleaseAsset['platform'][]
  instructions: string
}

const CARDS: PlatformCard[] = [
  {
    os: 'windows',
    title: 'Windows',
    formats: 'Instalador .exe (NSIS) o version portable',
    assetPlatforms: ['windows'],
    instructions: 'Windows 10/11 · 64 bits'
  },
  {
    os: 'linux',
    title: 'Linux',
    formats: 'Paquete .deb o AppImage universal',
    assetPlatforms: ['linux-deb', 'linux-appimage'],
    instructions: 'Debian, Ubuntu, Kali y derivadas · 64 bits'
  },
  {
    os: 'mac',
    title: 'macOS',
    formats: 'Imagen .dmg o archivo .zip',
    assetPlatforms: ['mac-dmg', 'mac-zip'],
    instructions: 'macOS 12+ · Intel y Apple Silicon'
  }
]

function formatBytes(bytes: number) {
  if (!bytes) return ''
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(1)} MB`
}

export function Downloads() {
  const state = useReleases()
  const [os, setOs] = useState<DetectedOs>('unknown')

  useEffect(() => {
    setOs(detectOs())
  }, [])

  const releaseData = state.status === 'ready' ? state.data : null

  return (
    <section id="descargas" className="relative py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="section-eyebrow mx-auto">Descargas</div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-50 sm:text-4xl">
            Disponible para <span className="gradient-text">Windows, Linux y macOS</span>
          </h2>
          <p className="mt-4 text-slate-400">
            Los instaladores se publican automaticamente en las releases de GitHub en cada version estable.
          </p>

          {releaseData?.available && (
            <div className="badge mx-auto mt-5 border-aegis-cyan/25 bg-aegis-cyan/[0.08] text-aegis-cyan">
              <Download className="h-3 w-3" />
              Version {releaseData.version} publicada
            </div>
          )}
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {CARDS.map((card, i) => {
            const assets =
              releaseData?.assets.filter((a) => card.assetPlatforms.includes(a.platform)) ?? []
            const isDetected = os === card.os

            return (
              <motion.div
                key={card.os}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <GlassCard
                  strong={isDetected}
                  className={`relative flex h-full flex-col ${
                    isDetected ? 'border-aegis-cyan/40 shadow-glow' : ''
                  }`}
                >
                  {isDetected && (
                    <span className="badge absolute -top-3 left-5 border-aegis-cyan/40 bg-void-950 text-aegis-cyan">
                      <MonitorSmartphone className="h-3 w-3" />
                      Tu sistema
                    </span>
                  )}

                  <h3 className="text-lg font-bold text-slate-50">{card.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{card.instructions}</p>
                  <p className="mt-3 text-sm text-slate-400">{card.formats}</p>

                  <div className="mt-6 flex-1 space-y-2.5">
                    {state.status === 'loading' && (
                      <div className="h-11 animate-pulse rounded-xl bg-white/[0.05]" />
                    )}

                    {state.status === 'ready' && !releaseData?.available && (
                      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm text-slate-400">
                        <Clock className="h-4 w-4 shrink-0" />
                        Beta proxima — compila desde el codigo fuente mientras tanto.
                      </div>
                    )}

                    {state.status === 'ready' &&
                      releaseData?.available &&
                      assets.map((asset) => (
                        <a
                          key={asset.url}
                          href={asset.url}
                          className={isDetected ? 'glass-btn-primary w-full justify-center' : 'glass-btn w-full justify-center'}
                        >
                          <Download className="h-4 w-4" />
                          {asset.name}
                          {asset.sizeBytes ? (
                            <span className="text-xs opacity-70">({formatBytes(asset.sizeBytes)})</span>
                          ) : null}
                        </a>
                      ))}

                    {state.status === 'ready' && releaseData?.available && assets.length === 0 && (
                      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm text-slate-400">
                        <Clock className="h-4 w-4 shrink-0" />
                        Sin instalador para esta plataforma todavia.
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            )
          })}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <a
            href={releaseData?.releaseUrl ?? `${GITHUB_URL}/releases`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-aegis-cyan hover:underline"
          >
            Ver todas las releases en GitHub
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </section>
  )
}
