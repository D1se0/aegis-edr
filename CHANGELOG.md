# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Este proyecto
sigue [SemVer](https://semver.org/lang/es/).

## [0.3.0] - 2026-09-12

### Añadido — Asistente IA
- **Asistente IA integrado (Claude, BYOK)**: nueva seccion donde el usuario configura su propia
  clave de la API de Anthropic (cifrada con `safeStorage` de Electron: Keychain/libsecret/DPAPI
  segun SO), elige modelo (`claude-opus-5`/`claude-sonnet-5`/`claude-haiku-4-5`) y conversa con un
  asistente que puede consultar el estado real del equipo (procesos, red, alertas, cuarentena,
  persistencia, ajustes) y, si se le permite, actuar sobre el (finalizar procesos, bloquear IPs,
  cuarentena, restaurar, aislar red, activar/desactivar modulos).
- **Bucle agentico manual con streaming** (`app/electron/main/modules/aiAssistant.ts`) sobre
  `@anthropic-ai/sdk`, con 13 tools (7 de solo lectura, 6 de accion) que reutilizan literalmente
  las funciones internas ya validadas del resto de la app (nunca reimplementan logica).
- **Flujo de confirmacion humano-en-el-bucle**: toda accion pide aprobacion explicita en la
  interfaz antes de ejecutarse, salvo que el usuario active el opt-in "Modo autonomo"
  (desactivado por defecto), en cuyo caso cada accion autonoma queda igualmente registrada como
  alerta explicita para trazabilidad completa.
- Nueva seccion "Asistente IA" en la interfaz: pantalla de configuracion, chat con streaming en
  vivo, tarjeta de confirmacion de acciones, disclaimer permanente de privacidad.

### Añadido — Deteccion y respuesta
- **Honeytokens**: ficheros señuelo sembrados en carpetas de usuario; cualquier acceso dispara
  alerta critica y cuarentena automatica del proceso responsable.
- **Backups y rollback simplificado** (`fileBackup.ts`): copia versionada antes de cambios en
  rutas vigiladas, restaurable con un clic. Documentado explicitamente como NO equivalente a un
  snapshot nativo del sistema operativo (VSS/APFS/btrfs) — es un historial propio y simple,
  acotado a 300 copias / 14 dias / 25 MB por fichero.
- **Storyline de ataque** (`storylineEngine.ts`): correlacion de alertas relacionadas (mismo
  proceso, misma IP, ventana temporal corta) en incidentes con linea de tiempo, visibles en una
  pestaña nueva dentro de Alertas.
- **Etiquetado MITRE ATT&CK** en las alertas generadas por heuristicas conocidas.
- **Puntuacion explicable**: desglose de que factores concretos penalizan el score de seguridad,
  accesible pulsando el indicador del Dashboard.
- **Baseline de comportamiento** (`behaviorBaseline.ts`): marca conexiones "nunca vistas antes"
  por proceso, cuando ya existe un patron historico establecido.
- **Deteccion de LOLBins/fileless** (`lolbins.ts`): heuristica sobre binarios
  living-off-the-land (powershell, mshta, rundll32, certutil...) con parametros sospechosos.
- **Auditoria de extensiones de navegador** (`browserExtensions.ts`): enumera extensiones de
  Chrome/Chromium/Edge/Firefox y marca combinaciones de permisos de alto riesgo.
- **Modo Incidente** (`incidentMode.ts`): aisla red, finaliza procesos criticos y genera un
  paquete de evidencia, en un clic desde el Dashboard (con confirmacion previa).
- **Playbooks** (`playbooks.ts`): reglas de automatizacion "si esto entonces aquello" definibles
  por el usuario (categoria + severidad minima -> accion), con CRUD en Ajustes.
- **Webhooks de alerta critica**: notificacion HTTP configurable (Slack/Discord/generico).
- **Panel de transparencia de red propia** (`selfTelemetry.ts`): registra toda llamada de red
  saliente de la propia app (comprobacion de updates, consultas a la API de Claude).
- **Configuracion como codigo**: exportar/importar ajustes y playbooks como un unico JSON.
- **Insignia de puntuacion SVG** exportable desde el Dashboard.

### Añadido — Interfaz
- Radar de amenazas animado dentro del Dashboard real de la app (no solo en la web de marketing).
- Glow ambiental de fondo en el Dashboard que cambia de cian a ambar/rojo segun la puntuacion.
- Paleta de comandos global (`Ctrl`/`Cmd`+`K`) con busqueda difusa entre secciones.
- Modo presentacion: difumina datos sensibles (IPs, rutas, hostname) en pantalla, revelables al
  pasar el raton por encima — util para capturas o compartir pantalla.

### Documentacion
- README raiz ampliado con la seccion "Asistente IA (Claude)", tabla de modulos y secciones de
  interfaz actualizadas, y nuevos Known issues.
- 14 secciones nuevas en `/docs` de la web (una por funcion nueva), incluyendo una pagina
  exhaustiva dedicada al Asistente IA (privacidad, BYOK, flujo de confirmacion).

### Infraestructura
- `.github/workflows/sync-release-notes.yml`: sincroniza automaticamente la descripcion de cada
  Release de GitHub con la seccion correspondiente de `CHANGELOG.md` (usando `gh release edit`
  con el `GITHUB_TOKEN` propio de Actions, sin secretos adicionales) — corrige retroactivamente
  que v0.1.0 y v0.2.0 se publicaran sin ninguna descripcion.
- `releaseType: "release"` reforzado explicitamente en `app/package.json` (ver v0.2.0).

### Known issues (ver README para el detalle completo)
- Detectados y descartados deliberadamente para esta version: deteccion BadUSB, GeoIP/"impossible
  travel", fleet view multi-dispositivo, soporte de reglas YARA, CLI companion (`aegisctl`) y
  gamificacion/logros — exigen infraestructura nueva no incluida en esta pasada.

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
