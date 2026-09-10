# Aegis EDR

Plataforma profesional de detección y respuesta en el endpoint (EDR), inspirada en la
protección y la estética de [Heimdal Security](https://heimdalsecurity.com/). Monitoriza
procesos, red, integridad de ficheros y persistencia en tiempo real, con alertas y bloqueo
activo ante comportamiento sospechoso — disponible para **Windows, Linux y macOS**.

🌐 Web oficial: `https://D1se0.github.io/aegis-edr/`
📦 Descargas: [Releases](https://github.com/D1se0/aegis-edr/releases)

## Estructura del repositorio

```
aegis-edr/
├── app/        # Aplicación de escritorio (Electron + React + TypeScript + Tailwind)
└── website/    # Web de marketing (Node.js + React + Vite), desplegada en GitHub Pages
```

## La aplicación (`app/`)

- **Monitor de procesos** — detección de procesos maliciosos y comportamiento anómalo.
- **Red y conexiones** — visibilidad de tráfico y conexiones sospechosas.
- **Firewall activo** — bloqueo dependiendo de lo detectado.
- **Integridad de ficheros** — vigilancia de rutas críticas del sistema.
- **Puntos de persistencia/autoarranque** — detección de mecanismos de persistencia.
- **Cuarentena** — aislamiento de amenazas confirmadas.
- **Centro de alertas** — histórico y severidad de eventos.
- **Auto-actualización** vía `electron-updater` contra los releases de este repositorio.

Interfaz con estética de ventanas translúcidas (glassmorphism/blur), inspirada en Heimdal.

### Desarrollo

```bash
cd app
npm install
npm run dev            # solo frontend (Vite)
npm run electron:dev   # build + Electron
```

### Empaquetado local

```bash
npm run dist:linux   # .deb + .AppImage
npm run dist:win      # .exe (NSIS + portable)
npm run dist:mac      # .dmg + .zip
```

## La web (`website/`)

Landing de presentación del producto: hero, cobertura de amenazas, funciones, descargas
(resueltas en vivo contra la API de releases de GitHub) e instalación paso a paso por sistema
operativo. Ver [`website/README.md`](website/README.md) para desarrollo local.

## CI/CD

- **`.github/workflows/deploy-pages.yml`** — construye y publica `website/` en GitHub Pages en
  cada push a `main`.
- **`.github/workflows/release.yml`** — al empujar un tag `vX.Y.Z`, compila la app en Ubuntu,
  Windows y macOS en paralelo y publica los instaladores como GitHub Release mediante
  `electron-builder --publish always`.

Para publicar una nueva versión:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Licencia

[MIT](LICENSE)
