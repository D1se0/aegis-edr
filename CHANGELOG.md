# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Este proyecto
sigue [SemVer](https://semver.org/lang/es/).

## [0.2.0] - 2026-09-12

### Añadido
- Seccion `/docs` completa en la web: sidebar de navegacion + 18 secciones de documentacion
  exhaustiva (instalacion por SO, cada funcion de la app, arquitectura tecnica, seguridad y
  privacidad, FAQ), con routing real (`react-router-dom`) y soporte de enlaces directos/recarga
  en GitHub Pages via el patron `spa-github-pages` (`public/404.html` + decodificacion en
  `index.html`).
- Pagina 404 propia en la web para rutas inexistentes.
- Favicon del sitio.
- README raiz exhaustivo con tabla de contenidos, arquitectura completa, tabla de modulos,
  proceso de release y known issues.
- `CHANGELOG.md`.
- Version de la app expuesta dinamicamente en Ajustes (`__APP_VERSION__` inyectado desde
  `package.json` via Vite `define`, en vez de un literal desactualizable).

### Corregido
- **Bug critico de release**: `electron-builder`/`electron-publish` crea los Releases de GitHub
  como borrador (draft) invisible salvo que se fije `releaseType: "release"` explicitamente. La
  v0.1.0 se habia subido correctamente pero no aparecia en la pagina publica de Releases ni en
  la API que consume la web. Corregido en `app/package.json` (`build.publish`).
- **Bloqueo automatico no funcional**: el interruptor "Bloqueo automatico" (Ajustes) se
  persistia pero ninguna ruta de codigo lo consultaba realmente. Ahora, en severidad critica y
  con el interruptor activo, `networkMonitor` bloquea automaticamente la IP remota de una
  conexion de riesgo y `fileIntegrity` pone en cuarentena automaticamente los ficheros afectados
  por una rafaga tipo ransomware o un evento de fichero de riesgo maximo. `autoBlockSeverity` pasa
  a valer `"critical"` por defecto (antes `"off"`, lo que dejaba el interruptor inerte incluso
  activado).
- **Validacion de direcciones IP en el firewall**: `blockIp`/`unblockIp` ahora validan el formato
  de la IP antes de interpolarla en cualquier comando de shell ejecutado con privilegios
  elevados (defensa en profundidad).

### Infraestructura
- `.github/workflows/deploy-pages.yml`: build y publicacion de `website/` a GitHub Pages en cada
  push a `main`.
- `.github/workflows/release.yml`: build multi-OS (Ubuntu/Windows/macOS) y publicacion de
  instaladores como Release de GitHub al empujar un tag `vX.Y.Z`.

## [0.1.0] - 2026-09-10

### Añadido
- Aplicacion de escritorio inicial (Electron + React + TypeScript + Tailwind): monitor de
  procesos, red, integridad de ficheros, persistencia, cuarentena, centro de alertas y ajustes.
  Estetica glassmorphism/blur inspirada en Heimdal Security.
- Web de marketing inicial (Node.js + React + Express): hero, cobertura de amenazas, funciones,
  descargas conectadas a la API de Releases de GitHub, instalacion por SO.
- CI inicial (build + publish) y repositorio de GitHub.
