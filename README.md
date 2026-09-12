# Aegis EDR

Plataforma profesional de deteccion y respuesta en el endpoint (EDR), inspirada en la
proteccion y la estetica de [Heimdal Security](https://heimdalsecurity.com/). Corre en espacio
de usuario y correlaciona telemetria de procesos, red, integridad de ficheros y autoarranque
para puntuar riesgo y ofrecer respuesta activa — bloquear IPs, poner ficheros en cuarentena,
finalizar procesos y aislar la red del equipo — disponible para **Windows, Linux y macOS**.

Desde la v0.3.0 incluye ademas un **Asistente IA** basado en Claude (BYOK, con tu propia clave),
honeytokens anti-ransomware, copias de respaldo con rollback, correlacion de incidentes con
etiquetado MITRE ATT&CK, playbooks de automatizacion, webhooks de alerta, y una interfaz con
radar de amenazas, paleta de comandos y modo presentacion — ver [Que hay de nuevo en v0.3.0](#que-hay-de-nuevo-en-v030).

🌐 Web oficial y documentacion: **https://D1se0.github.io/aegis-edr/** · **[/docs](https://D1se0.github.io/aegis-edr/docs)**
📦 Descargas: **[Releases de GitHub](https://github.com/D1se0/aegis-edr/releases)**

## Tabla de contenidos

- [Que es Aegis EDR](#que-es-aegis-edr)
- [Que hay de nuevo en v0.3.0](#que-hay-de-nuevo-en-v030)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Arquitectura](#arquitectura)
- [Modulos del proceso main](#modulos-del-proceso-main)
- [Secciones de la interfaz](#secciones-de-la-interfaz)
- [Asistente IA (Claude)](#asistente-ia-claude)
- [Instalacion](#instalacion)
- [Desarrollo](#desarrollo)
- [Versionado y proceso de release](#versionado-y-proceso-de-release)
- [Seguridad y privacidad](#seguridad-y-privacidad)
- [Troubleshooting / FAQ](#troubleshooting--faq)
- [Known issues / roadmap](#known-issues--roadmap)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

## Que es Aegis EDR

Aegis EDR **no** sustituye a un EDR kernel-level ni a un antivirus con firmas certificadas: es
una capa adicional de visibilidad y contencion pensada para usuarios tecnicos y equipos
pequeños. Todo el procesamiento ocurre localmente en el equipo del usuario; la unica llamada de
red que hace el agente es la comprobacion de actualizaciones contra los Releases publicos de
este repositorio de GitHub.

## Que hay de nuevo en v0.3.0

- **Asistente IA (Claude), BYOK** — seccion nueva donde configuras tu propia clave de la API de
  Anthropic; el asistente puede consultar el estado real del equipo y, con confirmacion explicita
  (o en modo autonomo si lo activas), ejecutar acciones. Detalle completo en
  [Asistente IA (Claude)](#asistente-ia-claude).
- **Honeytokens** — ficheros señuelo que disparan alerta critica y cuarentena automatica ante
  cualquier acceso.
- **Backups y rollback simplificado** — copia local versionada antes de cambios en rutas
  vigiladas, restaurable con un clic (no es un snapshot nativo del sistema operativo).
- **Storyline de ataque + MITRE ATT&CK** — alertas relacionadas agrupadas como una cadena de
  incidente, con tecnicas MITRE etiquetadas.
- **Puntuacion explicable** — desglose de que factores penalizan tu puntuacion de seguridad.
- **Baseline de comportamiento** — marca conexiones "nunca vistas antes" por proceso.
- **Deteccion de LOLBins / fileless.**
- **Auditoria de extensiones de navegador.**
- **Modo Incidente** — aislar red + matar procesos criticos + generar bundle de evidencia, en un
  clic.
- **Playbooks** — automatizacion "si esto entonces aquello" configurable por el usuario.
- **Webhooks** de alerta critica (Slack/Discord/generico).
- **Panel de transparencia** — la propia app audita su tráfico de red saliente.
- **Configuracion como codigo** — exportar/importar ajustes y playbooks en un JSON.
- **Interfaz**: radar de amenazas animado en el Dashboard, glow ambiental segun tu puntuacion,
  paleta de comandos (Ctrl/Cmd+K), modo presentacion (difumina datos sensibles), insignia SVG de
  puntuacion exportable.

Detalle completo de cada una en [`/docs`](https://D1se0.github.io/aegis-edr/docs) y en
[`CHANGELOG.md`](CHANGELOG.md).

## Estructura del repositorio

```
aegis-edr/
├── app/                     # Aplicacion de escritorio (Electron + React + TypeScript + Tailwind)
│   ├── electron/
│   │   ├── main/index.ts     # Proceso principal: ventana, registro de IPC, arranque de monitores
│   │   ├── main/preload.ts   # contextBridge: expone window.aegis al renderer
│   │   ├── main/modules/     # Un modulo por capacidad (ver tabla mas abajo)
│   │   └── shared/types.ts   # Tipos + contrato de canales IPC compartido main/renderer
│   └── src/                  # Renderer: React + Zustand + Tailwind
│       ├── store/useAppStore.ts
│       ├── lib/ipcClient.ts  # window.aegis en Electron; lib/mockApi.ts como fallback fuera de Electron
│       └── components/       # Una vista por seccion de la barra lateral
├── website/                 # Landing + seccion /docs (este mismo contenido en formato web)
│   ├── src/pages/            # Home y DocsPage (react-router)
│   ├── src/docs/content.ts   # Contenido de la documentacion web, seccion por seccion
│   └── server/index.js       # Servidor Express opcional para auto-hosting
└── .github/workflows/       # CI: deploy-pages.yml y release.yml
```

## Arquitectura

**Proceso main vs preload vs renderer.** El proceso main (Node.js completo) es el unico con
acceso a `systeminformation`, `chokidar`, `sudo-prompt`, el sistema de ficheros, etc. El
renderer (React) corre con `contextIsolation: true` y `nodeIntegration: false`: no tiene acceso
directo a Node. El script `preload.ts` usa `contextBridge.exposeInMainWorld` para exponer un
objeto `window.aegis` con metodos concretos (`getSnapshot`, `killProcess`, `blockIp`, etc.), cada
uno mapeado 1:1 a un canal `ipcRenderer.invoke` que el main resuelve con `ipcMain.handle`. Los
nombres de canal viven centralizados como constantes en `electron/shared/types.ts` (objeto
`IPC`) para que preload e `index.ts` nunca se desincronicen.

Cada 3 segundos el main construye un "snapshot" completo (`buildSnapshot()`) con procesos,
conexiones, alertas, persistencia, vitales del sistema y estado de proteccion, y lo empuja al
renderer via el canal `aegis:on-snapshot-update`. Las alertas nuevas se empujan aparte via
`aegis:on-alert` en el momento en que se generan (no esperan al siguiente snapshot).

Fuera de Electron (por ejemplo corriendo `npm run dev` en un navegador normal durante el
desarrollo del renderer), `getAegisApi()` cae automaticamente a `src/lib/mockApi.ts`, que
implementa el mismo contrato `AegisApi` con datos simulados y temporizadores, para poder
iterar la interfaz sin arrancar Electron.

## Modulos del proceso main

| Modulo | Responsabilidad |
|---|---|
| `processMonitor` | Sondeo de procesos (systeminformation) cada 5s, puntuacion de riesgo, finalizar proceso |
| `networkMonitor` | Sondeo de conexiones cada 4s, deteccion de escaneo de puertos, auto-bloqueo de IP en severidad critica |
| `firewall` | Comandos elevados (sudo-prompt) de bloqueo/desbloqueo de IP y aislamiento de red, por sistema operativo |
| `fileIntegrity` | `chokidar` sobre carpetas de usuario, hash SHA-256 de ficheros criticos, deteccion de rafagas tipo ransomware |
| `persistenceScan` | Escaneo de autoarranque cada 60s por SO (registro/cron/systemd/launchd) |
| `quarantine` | Mover, aislar permisos y restaurar ficheros en cuarentena (con hash SHA-256) |
| `alerts` | Bus de alertas en memoria (maximo 500), notifica a listeners y dispara notificaciones nativas en severidad alta/critica |
| `threatEngine` | Heuristicas de puntuacion de riesgo (0-100) y calculo de la puntuacion de seguridad global |
| `systemInfo` | Vitales del sistema (CPU/RAM/disco/red) y enumeracion de dispositivos USB |
| `store` | Persistencia de ajustes y cuarentena en disco (`electron-store`) |
| `logger` | Log a fichero en el directorio de datos de usuario; nunca lanza excepciones que tumben la app |
| `updater` | Integracion con `electron-updater` contra los Releases de GitHub de este repositorio |
| `aiAssistant` | Bucle agentico con la API de Claude (BYOK), tools que espejan el resto del contrato IPC, flujo de confirmacion |
| `honeytokens` | Siembra y vigilancia de ficheros señuelo anti-ransomware |
| `fileBackup` | Copias de respaldo versionadas y restauracion (rollback simplificado, no nativo del SO) |
| `storylineEngine` | Correlacion de alertas relacionadas en incidentes con linea de tiempo |
| `behaviorBaseline` | Historial de destinos de red por proceso para marcar conexiones "nunca vistas antes" |
| `lolbins` | Heuristica de binarios living-off-the-land con parametros sospechosos |
| `browserExtensions` | Enumeracion y auditoria de extensiones instaladas por navegador |
| `incidentMode` | Aislamiento + respuesta + generacion de paquete de evidencia en un clic |
| `playbooks` | Reglas de automatizacion si-esto-entonces-aquello persistidas |
| `scoreBadge` | Generacion de la insignia SVG de puntuacion |
| `selfTelemetry` | Registro de las propias llamadas de red salientes de la app (transparencia) |

Documentacion detallada de cada modulo, con la logica de puntuacion completa: ver
[`/docs` en la web](https://D1se0.github.io/aegis-edr/docs/arquitectura).

## Secciones de la interfaz

| Seccion | Que ofrece |
|---|---|
| Panel general | Puntuacion de seguridad (con desglose explicable), radar de amenazas animado, glow ambiental segun riesgo, vitales en tiempo real, actividad reciente, interruptores de proteccion, analisis completo, aislar equipo, Modo Incidente, insignia SVG exportable |
| Procesos | Listado en vivo ordenado por riesgo, insignia LOLBin, finalizar proceso, bloquear red del proceso |
| Red | Conexiones activas, insignia "nunca vista antes" (baseline), deteccion de escaneo de puertos, bloquear/desbloquear IP |
| Sistema de ficheros | Actividad de ficheros, backups/rollback, auditoria de extensiones de navegador, estado del fichero hosts, honeytokens |
| Persistencia | Puntos de autoarranque descubiertos, alerta ante entradas nuevas |
| Alertas | Historial completo con tecnicas MITRE ATT&CK, pestaña de incidentes correlacionados (storyline) |
| Cuarentena | Ficheros aislados con hash SHA-256, restaurar a su ubicacion original |
| Asistente IA | Chat con Claude (BYOK), consultas de solo lectura automaticas, acciones con confirmacion (o modo autonomo) |
| Ajustes | Modulos de proteccion, honeytokens/backup, webhooks, umbrales, playbooks, transparencia de red propia, config-as-code, modo presentacion, actualizaciones |

Paleta de comandos global (`Ctrl`/`Cmd` + `K`) para saltar a cualquier seccion desde cualquier
parte de la aplicacion.

## Asistente IA (Claude)

Aegis EDR incluye un asistente conversacional basado en la [API de Claude](https://www.anthropic.com/api)
(Anthropic). Es **BYOK** (bring your own key): usa tu propia clave de API, nunca una compartida
por el proyecto, y **nunca se invoca en segundo plano** — solo cuando escribes una pregunta en la
seccion Asistente IA.

- **Modelo:** eliges entre `claude-opus-5` (recomendado), `claude-sonnet-5` o `claude-haiku-4-5`.
- **Almacenamiento de la clave:** cifrada con `safeStorage` de Electron (Keychain en macOS,
  libsecret/keyring en Linux, DPAPI en Windows). Si tu sistema no tiene un almacen compatible
  disponible, la interfaz te lo advierte explicitamente en vez de fingir que esta cifrada.
- **Herramientas de solo lectura** (se ejecutan siempre automaticamente): snapshot del panel,
  procesos, conexiones, alertas, cuarentena, persistencia, ajustes.
- **Herramientas de accion** (finalizar proceso, bloquear/desbloquear IP, cuarentena, restaurar,
  aislar red, activar/desactivar un modulo): son las mismas funciones internas ya validadas que
  usa el resto de la interfaz — el asistente no tiene ningun atajo ni permiso especial.
- **Confirmacion humana por defecto:** antes de ejecutar una accion, la app te muestra que quiere
  hacer, con que parametros y por que, y espera tu aprobacion o rechazo.
- **Modo autonomo (opt-in, desactivado por defecto):** si lo activas, el asistente ejecuta
  acciones sin pedir confirmacion previa. Cada accion autonoma queda igualmente registrada como
  alerta explicita para trazabilidad completa, pero no hay marcha atras antes de que ocurra —
  activalo con criterio.

Documentacion exhaustiva (flujo completo, tabla de errores, ejemplos de uso):
[seccion Asistente IA en `/docs`](https://D1se0.github.io/aegis-edr/docs/asistente-ia).

## Instalacion

Instrucciones completas y detalladas por sistema operativo (requisitos de permisos, formatos
disponibles, avisos de SmartScreen/Gatekeeper) en **[la seccion Instalacion de `/docs`](https://D1se0.github.io/aegis-edr/docs/instalacion-windows)**. Resumen:

| SO | Formato | Comando/accion |
|---|---|---|
| Windows | `.exe` (NSIS) o portable | Ejecutar el instalador, o el portable directamente |
| Linux | `.deb` | `sudo apt install ./aegis-edr_<version>_amd64.deb` |
| Linux | `.AppImage` | `chmod +x "Aegis EDR-<version>.AppImage" && ./"Aegis EDR-<version>.AppImage"` |
| macOS | `.dmg` / `.zip` | Arrastrar a Aplicaciones; autorizar en Gatekeeper la primera vez |

## Desarrollo

**Requisitos:** Node.js 20+ y npm.

```bash
git clone https://github.com/D1se0/aegis-edr.git

# Aplicacion de escritorio
cd aegis-edr/app
npm install
npm run dev            # solo frontend (Vite), util para iterar UI con mockApi
npm run electron:dev   # build completo + lanza Electron

# Web (landing + /docs)
cd ../website
npm install
npm run dev            # Vite en :5174
```

### Empaquetado local de la app

```bash
cd app
npm run dist:linux   # .deb + .AppImage (build en Linux)
npm run dist:win      # .exe NSIS + portable (build en Windows, o con wine)
npm run dist:mac      # .dmg + .zip (build en macOS)
```

`electron-builder` solo genera de forma fiable el instalador nativo de cada sistema operativo en
ese mismo sistema operativo. Por eso el CI compila en una matriz Ubuntu + Windows + macOS en
paralelo (ver mas abajo).

## Versionado y proceso de release

Se sigue [SemVer](https://semver.org/lang/es/). Cada release se documenta en
[`CHANGELOG.md`](CHANGELOG.md).

**Flujo para publicar una version nueva:**

1. Actualizar la version en `app/package.json` y `website/package.json`.
2. Añadir la entrada correspondiente en `CHANGELOG.md`.
3. Actualizar `README.md` y el contenido de `/docs` (`website/src/docs/content.ts`) si el cambio
   afecta a como se usa o instala la herramienta.
4. Commitear y empujar a `main`.
5. `git tag vX.Y.Z && git push origin vX.Y.Z`.

Ese tag dispara **`.github/workflows/release.yml`**, que compila `app/` en Ubuntu, Windows y
macOS en paralelo y publica los instaladores con `electron-builder --publish always`. La
configuracion de publish fija `"releaseType": "release"` explicitamente — sin esto,
`electron-publish` crea el Release como **borrador invisible** por defecto (bug real que se dio
en la v0.1.0 inicial: los assets se subieron correctamente pero el release no aparecia ni en la
pagina publica de Releases ni en la API que consume la web).

Cada push a `main` que toque `website/` dispara ademas **`.github/workflows/deploy-pages.yml`**,
que reconstruye y publica la web (incluyendo `/docs`) en GitHub Pages.

## Seguridad y privacidad

- Toda la telemetria (procesos, conexiones, ficheros, autoarranque) se procesa localmente; no
  existe un servidor propio al que se envien estos datos.
- La unica llamada de red del agente es la comprobacion de actualizaciones contra la API publica
  de Releases de GitHub.
- El ajuste `telemetryOptIn` existe en el esquema de configuracion pero esta desactivado por
  defecto y no se usa para enviar datos a terceros en esta version.
- `contextIsolation: true` / `nodeIntegration: false` en el `BrowserWindow`; superficie IPC
  explicita y tipada, sin exponer `ipcRenderer` en crudo.
- Las direcciones IP se validan por formato antes de interpolarse en cualquier comando de
  firewall ejecutado con privilegios elevados; nunca se bloquean rangos de IP privados/loopback.
- **Unica excepcion deliberada:** el Asistente IA envia datos a la API de Anthropic, y solo lo
  hace cuando tu escribes una pregunta en esa seccion — nunca en segundo plano. Tu clave de API
  se cifra con el almacen de credenciales del sistema operativo. Ver
  [Asistente IA (Claude)](#asistente-ia-claude).

Detalle completo: [seccion Seguridad y privacidad en `/docs`](https://D1se0.github.io/aegis-edr/docs/seguridad-privacidad).

## Troubleshooting / FAQ

Ver la [seccion FAQ en `/docs`](https://D1se0.github.io/aegis-edr/docs/faq) (bloqueo de red que
no hace nada, SmartScreen/Gatekeeper, "Beta proxima" en Descargas, personalizar rutas vigiladas).

## Known issues / roadmap

- **`autoBlockSeverity` sin selector en la interfaz.** El campo existe en el esquema de ajustes
  y por defecto vale `"critical"` (umbral en el que se dispara el bloqueo automatico de IP y la
  cuarentena automatica de ficheros), pero todavia no hay un control visual en Ajustes para
  cambiarlo a otro nivel — solo se puede editar directamente en el fichero de configuracion
  persistido por `electron-store`.
- **`watchPaths` personalizables solo por configuracion.** El monitor de integridad de ficheros
  vigila Escritorio/Documentos/Descargas por defecto; añadir rutas propias requiere editar
  `watchPaths` en el fichero de ajustes persistido, no hay todavia un editor visual en Ajustes.
- **El build de macOS en CI solo produce artefactos `arm64`.** El runner `macos-latest` de GitHub
  Actions es Apple Silicon; el target `x64` configurado en `app/package.json` no genera assets en
  el Release publicado (probablemente necesita Rosetta/configuracion adicional para
  cross-compilar). Pendiente de investigar y, si aplica, separar en dos jobs de matriz
  (`macos-latest` para arm64 y un runner Intel o cross-build explicito para x64).
- **Builds de Windows y macOS sin firmar/notarizar.** El pipeline de CI no tiene configurado un
  certificado de firma de codigo (Windows) ni un Apple Developer ID (macOS notarization), asi
  que SmartScreen y Gatekeeper muestran una advertencia la primera vez que se ejecuta el binario.
  Obtener y configurar esos certificados queda fuera del alcance de este proyecto por ahora.
- **Bundle del renderer de `app/` sin code-splitting.** Tras añadir el Asistente IA y el resto de
  vistas nuevas de la v0.3.0, el chunk principal del renderer ronda los 700 KB (framer-motion,
  recharts, iconos y las nuevas vistas); funciona correctamente pero podria dividirse con
  `import()` dinamico para mejorar el tiempo de arranque. `@anthropic-ai/sdk` solo se usa en el
  proceso main de Electron y no forma parte de este bundle del renderer.
- **BadUSB (heuristica de velocidad HID), deteccion de "impossible travel"/GeoIP, fleet view
  multi-dispositivo, soporte de reglas YARA, CLI companion (`aegisctl`) y gamificacion/logros.**
  Quedaron fuera de la v0.3.0 deliberadamente: cada una exige infraestructura nueva (bases de
  datos GeoIP embebidas, bindings nativos de YARA, un binario CLI separado, descubrimiento de
  dispositivos en red) que no encajaba con calidad suficiente en esta pasada. Roadmap para
  futuras versiones.

## Contribuir

Este es un proyecto personal/educativo. Si encuentras un bug o quieres proponer una mejora,
abre un [issue](https://github.com/D1se0/aegis-edr/issues) describiendo el problema y, si es
posible, los pasos para reproducirlo.

## Licencia

[MIT](LICENSE)
