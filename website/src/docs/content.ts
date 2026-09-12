export type DocBlock =
  | { type: 'p'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'code'; code: string; lang?: string }
  | { type: 'callout'; tone: 'info' | 'warning' | 'danger'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }

export interface DocSection {
  slug: string
  title: string
  group: string
  blocks: DocBlock[]
}

export const DOCS: DocSection[] = [
  {
    slug: 'introduccion',
    title: 'Introduccion',
    group: 'Empezando',
    blocks: [
      {
        type: 'p',
        text: 'Aegis EDR es un agente de deteccion y respuesta en el endpoint (EDR) que corre en espacio de usuario. Correlaciona telemetria de procesos, conexiones de red, integridad de ficheros y puntos de autoarranque para puntuar riesgo con un motor de heuristicas propio, y ofrece respuesta activa: finalizar procesos, bloquear IPs a nivel de firewall del sistema operativo, poner ficheros en cuarentena y aislar por completo la red del equipo.'
      },
      {
        type: 'callout',
        tone: 'info',
        text: 'Aegis EDR no sustituye a un EDR kernel-level ni a un antivirus con firmas certificadas. Es una capa adicional de visibilidad y contencion pensada para usuarios tecnicos y equipos pequeños que quieren monitorizacion activa sin desplegar infraestructura EDR corporativa.'
      },
      { type: 'h3', text: 'Que incluye' },
      {
        type: 'list',
        items: [
          'Aplicacion de escritorio (Electron + React + TypeScript) para Windows, Linux y macOS.',
          'Monitor de procesos, red, integridad de ficheros y persistencia en tiempo real.',
          'Motor de heuristicas de riesgo (threatEngine) con puntuacion 0-100 por proceso, conexion, fichero y entrada de autoarranque.',
          'Respuesta activa manual (un clic) y automatica (bloqueo automatico en severidad critica, configurable).',
          'Actualizaciones automaticas via electron-updater contra los Releases de este mismo repositorio de GitHub.'
        ]
      },
      { type: 'h3', text: 'Version actual' },
      { type: 'p', text: 'La version publicada actualmente es la que aparece en la seccion Descargas de la web y en la pagina de Releases de GitHub. Cada nueva version se documenta en CHANGELOG.md en la raiz del repositorio.' }
    ]
  },
  {
    slug: 'instalacion-windows',
    title: 'Instalacion en Windows',
    group: 'Instalacion',
    blocks: [
      {
        type: 'p',
        text: 'Descarga el instalador .exe (NSIS) desde la seccion de Descargas de esta web o directamente desde los Releases de GitHub. Tambien existe una version "portable" que no requiere instalacion.'
      },
      { type: 'h3', text: 'Instalador NSIS (recomendado)' },
      {
        type: 'list',
        items: [
          'Ejecuta el .exe descargado. El instalador no es "oneClick": te dejara elegir la carpeta de instalacion.',
          'Se crean accesos directos en el escritorio y en el menu de inicio automaticamente.',
          'Windows SmartScreen puede advertir de "editor desconocido" porque el binario no esta firmado con un certificado de firma de codigo comercial: pulsa "Mas informacion" -> "Ejecutar de todas formas" si confias en el origen (compilado por el propio workflow de GitHub Actions del repositorio).'
        ]
      },
      { type: 'h3', text: 'Version portable' },
      { type: 'p', text: 'Descarga el .exe portable, colocalo donde quieras y ejecutalo directamente sin instalar nada en el sistema. Util para pendrives o entornos donde no se puede instalar software.' },
      { type: 'h3', text: 'Permisos necesarios' },
      {
        type: 'p',
        text: 'Las acciones de bloqueo de red (bloquear IP, aislar el equipo) invocan netsh advfirewall y requieren una elevacion de privilegios de administrador. Windows mostrara el dialogo UAC nativo la primera vez que se ejecuta cada accion (o cuando caduque el permiso ya concedido). El resto de funciones (monitor de procesos, ficheros, persistencia) no requieren privilegios elevados.'
      }
    ]
  },
  {
    slug: 'instalacion-linux',
    title: 'Instalacion en Linux',
    group: 'Instalacion',
    blocks: [
      { type: 'p', text: 'Hay dos formatos disponibles: paquete .deb (Debian/Ubuntu y derivadas) y .AppImage (portable, funciona en la mayoria de distribuciones).' },
      { type: 'h3', text: 'Paquete .deb' },
      {
        type: 'code',
        lang: 'bash',
        code: 'sudo apt install ./aegis-edr_<version>_amd64.deb\n# o bien:\nsudo dpkg -i aegis-edr_<version>_amd64.deb\nsudo apt -f install   # solo si dpkg se queja de dependencias'
      },
      { type: 'h3', text: 'AppImage' },
      {
        type: 'code',
        lang: 'bash',
        code: 'chmod +x "Aegis EDR-<version>.AppImage"\n./"Aegis EDR-<version>.AppImage"'
      },
      { type: 'h3', text: 'Permisos necesarios' },
      {
        type: 'p',
        text: 'Las acciones de bloqueo de red (iptables) y aislamiento de red requieren privilegios de root. Aegis EDR invoca sudo-prompt, que muestra un dialogo grafico de autenticacion (pkexec/zenity/kdesudo segun el entorno de escritorio disponible) en el momento de ejecutar la accion; no hace falta lanzar la aplicacion entera como root.'
      },
      {
        type: 'callout',
        tone: 'warning',
        text: 'Si tu distribucion no tiene ningun agente de autenticacion grafico instalado (pkexec, gksu, kdesudo...), sudo-prompt no podra mostrar el dialogo y las acciones de bloqueo de red fallaran con un error. Instala policykit-1 (o equivalente) para resolverlo.'
      }
    ]
  },
  {
    slug: 'instalacion-macos',
    title: 'Instalacion en macOS',
    group: 'Instalacion',
    blocks: [
      { type: 'p', text: 'Se distribuyen builds .dmg y .zip para Intel (x64) y Apple Silicon (arm64).' },
      {
        type: 'list',
        items: [
          'Descarga el .dmg, abrelo y arrastra Aegis EDR a la carpeta Aplicaciones.',
          'Al abrirlo por primera vez, Gatekeeper puede bloquear la app por no estar firmada con un certificado de desarrollador de Apple pagado: ve a Ajustes del Sistema -> Privacidad y seguridad y pulsa "Abrir de todas formas".',
          'La alternativa .zip contiene el .app directamente, sin instalador.'
        ]
      },
      {
        type: 'callout',
        tone: 'warning',
        text: 'Los builds de macOS se generan sin notarizar (no hay Apple Developer ID configurado en el pipeline de CI). Esto es un "known issue" documentado: los usuarios deben autorizar la app manualmente en Gatekeeper la primera vez.'
      },
      { type: 'h3', text: 'Permisos necesarios' },
      { type: 'p', text: 'El bloqueo y aislamiento de red usan pf (Packet Filter) via el anchor "aegisedr", que requiere privilegios de administrador. macOS solicitara la contraseña de administrador la primera vez que se invoque cada accion.' }
    ]
  },
  {
    slug: 'compilar-desde-fuente',
    title: 'Compilar desde el codigo fuente',
    group: 'Instalacion',
    blocks: [
      { type: 'p', text: 'Requisitos: Node.js 20+ y npm. El proyecto usa Vite + vite-plugin-electron para compilar renderer y proceso principal en un unico paso.' },
      {
        type: 'code',
        lang: 'bash',
        code: 'git clone https://github.com/D1se0/aegis-edr.git\ncd aegis-edr/app\nnpm install\nnpm run electron:dev   # build + lanza Electron con la app compilada'
      },
      { type: 'h3', text: 'Empaquetar instaladores localmente' },
      {
        type: 'code',
        lang: 'bash',
        code: 'npm run dist:linux   # .deb + .AppImage (build en Linux)\nnpm run dist:win      # .exe NSIS + portable (build en Windows, o con wine en Linux)\nnpm run dist:mac      # .dmg + .zip (build en macOS)'
      },
      {
        type: 'p',
        text: 'electron-builder solo puede generar de forma fiable el instalador nativo de cada sistema operativo en ese mismo sistema operativo (o con wine para Windows desde Linux/macOS). Por eso el CI del repositorio compila en una matriz de Ubuntu, Windows y macOS en paralelo — ver la seccion Arquitectura tecnica.'
      }
    ]
  },
  {
    slug: 'primeros-pasos',
    title: 'Primeros pasos',
    group: 'Empezando',
    blocks: [
      {
        type: 'p',
        text: 'Al abrir Aegis EDR por primera vez, el agente arranca automaticamente todos los monitores (procesos, red, integridad de ficheros, persistencia y vitales del sistema) y registra una alerta informativa "Aegis EDR activo". No hace falta ninguna configuracion previa para empezar a ver datos reales del equipo.'
      },
      { type: 'h3', text: 'Interfaz general' },
      {
        type: 'list',
        items: [
          'Barra lateral: navegacion entre Panel general, Procesos, Red, Sistema de ficheros, Persistencia, Alertas, Cuarentena y Ajustes.',
          'Barra de titulo personalizada (frameless) con controles de minimizar/maximizar/cerrar propios, estilo ventana translucida con vibrancy nativo en macOS y acrylic en Windows.',
          'Cada 3 segundos la app recibe un "snapshot" completo del estado de seguridad (procesos, conexiones, alertas, persistencia, vitales) sin que el usuario tenga que refrescar nada.'
        ]
      },
      { type: 'h3', text: 'Primer analisis recomendado' },
      {
        type: 'list',
        items: [
          'Revisa el Panel general: la puntuacion de seguridad (0-100) resume el estado global segun las alertas activas sin reconocer.',
          'Pulsa "Analisis completo" para forzar un re-escaneo inmediato de los puntos de persistencia.',
          'Revisa Ajustes para confirmar los umbrales de deteccion (CPU, escaneo de puertos) y si quieres activar el Bloqueo automatico.'
        ]
      }
    ]
  },
  {
    slug: 'dashboard',
    title: 'Panel general (Dashboard)',
    group: 'Funciones',
    blocks: [
      {
        type: 'p',
        text: 'Vista principal con la puntuacion de seguridad, vitales del sistema en tiempo real (CPU, memoria, red entrante, disco), un feed de la actividad reciente (ultimas 6 alertas) y el panel de modulos de proteccion (interruptores).'
      },
      { type: 'h3', text: 'Puntuacion de seguridad' },
      {
        type: 'p',
        text: 'Se calcula restando a 100 una penalizacion por cada alerta activa (no reconocida): critica -28, alta -16, media -8, baja -3, informativa -0. Por encima de 90 es "Excelente", 70-89 "Bueno", 40-69 "En riesgo" y por debajo de 40 "Critico". Reconocer o limpiar alertas en la seccion Alertas sube la puntuacion inmediatamente.'
      },
      { type: 'h3', text: 'Acciones disponibles' },
      {
        type: 'list',
        items: [
          '"Analisis completo": relanza el escaneo de persistencia bajo demanda y refresca el snapshot.',
          '"Aislar equipo": corta toda la conectividad de red salvo trafico loopback (127.0.0.1). Accion drastica pensada para contener un incidente activo; requiere privilegios elevados y genera una alerta critica.'
        ]
      }
    ]
  },
  {
    slug: 'procesos',
    title: 'Monitor de procesos',
    group: 'Funciones',
    blocks: [
      {
        type: 'p',
        text: 'Lista en vivo (refresco cada 5s) de todos los procesos del sistema via la libreria systeminformation, ordenada por riesgo y luego por CPU. Cada proceso recibe una puntuacion 0-100 segun el motor de heuristicas.'
      },
      { type: 'h3', text: 'Que puntua como sospechoso' },
      {
        type: 'list',
        items: [
          'Coincidencia con nombres conocidos de mineros de criptomonedas (xmrig, cpuminer, ethminer...) +60.',
          'Coincidencia con herramientas ofensivas/post-explotacion conocidas (mimikatz, cobaltstrike, meterpreter, psexec...) +55.',
          'Ejecutable lanzado desde una ruta temporal atipica (/tmp, /dev/shm, %AppData%\\Local\\Temp, ProgramData) +30.',
          'Nombre que imita un proceso del sistema (svchost, lsass, systemd...) pero ejecutandose fuera de su ruta habitual +45.',
          'Nombre de proceso con apariencia generada/ofuscada (pocas vocales o muchos digitos seguidos) +20.',
          'Consumo de CPU por encima del umbral configurado (85% por defecto) +25.',
          'Consumo de memoria superior a 4 GB +8.',
          'Ejecutarse como root/SYSTEM cuando ya hay otras señales de riesgo +10.'
        ]
      },
      { type: 'h3', text: 'Acciones' },
      {
        type: 'list',
        items: [
          'Finalizar proceso: envia SIGTERM y, si sigue vivo 1.5s despues, SIGKILL.',
          'Bloquear red del proceso: busca su conexion remota activa mas reciente y bloquea esa IP a nivel de firewall.'
        ]
      },
      {
        type: 'callout',
        tone: 'info',
        text: 'Las alertas de proceso sospechoso tienen un enfriamiento (cooldown) de 10 minutos por combinacion nombre+ruta, para no inundar el centro de alertas con el mismo proceso en cada ciclo de sondeo.'
      }
    ]
  },
  {
    slug: 'red',
    title: 'Red y conexiones',
    group: 'Funciones',
    blocks: [
      {
        type: 'p',
        text: 'Lista en vivo (refresco cada 4s) de todas las conexiones de red del sistema. Puntua riesgo por puerto remoto conocido de shells reversas/C2 (4444, 1337, 31337, 6666...), servicios sensibles expuestos (RDP, SSH, SMB) y procesos ofensivos conocidos con conexiones activas.'
      },
      { type: 'h3', text: 'Deteccion de escaneo de puertos' },
      {
        type: 'p',
        text: 'Se lleva una ventana deslizante de 60 segundos por PID: si un mismo proceso contacta con mas combinaciones IP:puerto distintas que el umbral configurado (40 por defecto, ajustable en Ajustes), se dispara una alerta de "posible escaneo de puertos" de severidad alta.'
      },
      { type: 'h3', text: 'Bloqueo de IP' },
      {
        type: 'p',
        text: 'Un clic en "Bloquear IP" añade reglas de firewall del sistema operativo (netsh en Windows, pf en macOS, iptables en Linux) para cortar trafico de entrada y salida hacia esa IP. Nunca se bloquean IPs privadas/loopback (127.0.0.0/8, 10.0.0.0/8, 192.168.0.0/16, 172.16.0.0/12) para evitar que el propio usuario se corte la conectividad local.'
      }
    ]
  },
  {
    slug: 'firewall',
    title: 'Firewall y aislamiento de red',
    group: 'Funciones',
    blocks: [
      {
        type: 'p',
        text: 'Aegis EDR no trae un firewall propio: orquesta el firewall nativo del sistema operativo (netsh advfirewall en Windows, pf en macOS, iptables en Linux) a traves de comandos elevados via sudo-prompt.'
      },
      { type: 'h3', text: 'Bloqueo individual de IP' },
      { type: 'p', text: 'Añade reglas de entrada y salida especificas para una IP. Reversible con "Desbloquear".' },
      { type: 'h3', text: 'Aislamiento total' },
      {
        type: 'p',
        text: 'Bloquea todo el trafico de entrada y salida excepto loopback. En Windows cambia la politica de todos los perfiles del firewall; en macOS activa un anchor pf dedicado; en Linux crea una cadena iptables AEGIS_ISOLATE enganchada a INPUT/OUTPUT. Se revierte con "Restaurar red".'
      },
      {
        type: 'callout',
        tone: 'danger',
        text: 'El aislamiento de red es una accion drastica: cortara tambien tu propia conexion (RDP/SSH remoto, VPN, etc.) salvo loopback. Usalo solo cuando sospeches de un incidente activo y tengas acceso fisico o alternativo al equipo.'
      }
    ]
  },
  {
    slug: 'integridad-ficheros',
    title: 'Integridad de ficheros',
    group: 'Funciones',
    blocks: [
      {
        type: 'p',
        text: 'Vigila en tiempo real (via chokidar) las carpetas de usuario configuradas (Escritorio, Documentos y Descargas por defecto, o las rutas personalizadas de watchPaths en Ajustes) y calcula hashes SHA-256 periodicos de ficheros criticos del sistema.'
      },
      { type: 'h3', text: 'Deteccion de ransomware' },
      {
        type: 'p',
        text: 'Si se detectan 25 o mas eventos de fichero (creacion/modificacion) en una ventana de 20 segundos dentro de las rutas vigiladas, se dispara una alerta critica de "posible actividad de ransomware".'
      },
      { type: 'h3', text: 'Fichero hosts' },
      {
        type: 'p',
        text: 'Se comprueba cada 15 segundos el hash del fichero hosts del sistema (/etc/hosts en Linux/macOS, C:\\Windows\\System32\\drivers\\etc\\hosts en Windows). Un cambio de hash dispara una alerta; ademas se analizan las entradas en busca de redirecciones sospechosas de marcas conocidas (bancos, PayPal, Microsoft, Google, Apple, antivirus) que no apunten a localhost.'
      },
      { type: 'h3', text: 'Ficheros criticos adicionales' },
      { type: 'list', items: ['Linux: /etc/passwd, /etc/sudoers, ~/.bashrc, ~/.ssh/authorized_keys', 'macOS: ~/.bash_profile, ~/.zshrc'] }
    ]
  },
  {
    slug: 'persistencia',
    title: 'Puntos de persistencia / autoarranque',
    group: 'Funciones',
    blocks: [
      {
        type: 'p',
        text: 'Escanea cada 60 segundos los mecanismos de autoarranque del sistema operativo y alerta cuando aparece una entrada nueva no vista antes (tras un primer escaneo de referencia al arrancar la app).'
      },
      { type: 'h3', text: 'Fuentes escaneadas por sistema operativo' },
      {
        type: 'table',
        headers: ['SO', 'Fuentes'],
        rows: [
          ['Windows', 'HKCU y HKLM \\Software\\Microsoft\\Windows\\CurrentVersion\\Run (registro)'],
          ['Linux', 'crontab de usuario, ~/.config/autostart/*.desktop, ~/.config/systemd/user/*.service'],
          ['macOS', '~/Library/LaunchAgents, /Library/LaunchAgents, /Library/LaunchDaemons (*.plist)']
        ]
      },
      { type: 'h3', text: 'Puntuacion de riesgo' },
      {
        type: 'list',
        items: [
          'Comando que apunta a una ruta temporal +35.',
          'Comando ofuscado/codificado en base64 (powershell -enc, bash -e con base64) +50.',
          'El autoarranque descarga contenido remoto (curl, wget, Invoke-WebRequest) +25.',
          'Nombre de la entrada con apariencia generada +15.'
        ]
      }
    ]
  },
  {
    slug: 'cuarentena',
    title: 'Cuarentena',
    group: 'Funciones',
    blocks: [
      {
        type: 'p',
        text: 'Al poner un fichero en cuarentena, Aegis EDR calcula su SHA-256, lo mueve a una carpeta protegida dentro del directorio de datos de usuario de la app y le quita permisos (chmod 000 en Linux/macOS; en Windows es un best-effort). El fichero deja de estar accesible desde su ubicacion original.'
      },
      { type: 'h3', text: 'Restaurar' },
      { type: 'p', text: 'Desde la seccion Cuarentena se puede restaurar cualquier elemento a su ruta original con un clic, recuperando permisos de lectura/escritura normales.' },
      {
        type: 'callout',
        tone: 'info',
        text: 'El listado de cuarentena persiste entre reinicios de la app (guardado con electron-store en el directorio de datos de usuario), asi que no se pierde aunque cierres Aegis EDR.'
      }
    ]
  },
  {
    slug: 'alertas',
    title: 'Centro de alertas',
    group: 'Funciones',
    blocks: [
      {
        type: 'p',
        text: 'Historial de hasta 500 alertas generadas por cualquier modulo (procesos, red, ficheros, persistencia, hosts, USB, ransomware, sistema), con severidad, categoria, mensaje y marca de tiempo. Las alertas de severidad alta o critica ademas disparan una notificacion nativa del sistema operativo.'
      },
      { type: 'h3', text: 'Acciones' },
      { type: 'list', items: ['Reconocer una alerta individual.', 'Limpiar/reconocer todas las alertas activas de una vez (sube la puntuacion de seguridad si estaba penalizada).'] },
      {
        type: 'p',
        text: 'Las alertas de severidad "info" no generan notificacion toast en pantalla (para no saturar la interfaz con eventos rutinarios como el propio arranque del agente), pero si quedan registradas en el historial completo.'
      }
    ]
  },
  {
    slug: 'ajustes',
    title: 'Ajustes',
    group: 'Funciones',
    blocks: [
      { type: 'h3', text: 'Modulos de proteccion (Panel general)' },
      {
        type: 'list',
        items: [
          'Monitorizacion en tiempo real: activa/desactiva el sondeo continuo de procesos, red y ficheros.',
          'Escudo de red, Integridad de ficheros, Escudo anti-ransomware, Guardian de autoarranque: activan/desactivan cada monitor de forma independiente.',
          'Bloqueo automatico: ver mas abajo.'
        ]
      },
      { type: 'h3', text: 'Bloqueo automatico' },
      {
        type: 'p',
        text: 'Cuando esta activo, Aegis EDR bloquea automaticamente la IP remota de una conexion de red que alcance severidad critica, y pone en cuarentena automaticamente un fichero (o los ficheros afectados durante una rafaga detectada como posible ransomware) cuando esa deteccion alcanza severidad critica — sin pedir confirmacion. El umbral de severidad para el bloqueo automatico es configurable a nivel de datos (autoBlockSeverity) y por defecto es "critica"; no existe todavia un selector en la interfaz para cambiarlo a un nivel distinto (ver Known issues).'
      },
      {
        type: 'callout',
        tone: 'warning',
        text: 'El bloqueo automatico de IP sigue requiriendo la elevacion de privilegios del sistema operativo (UAC/sudo/pkexec) la primera vez, o cuando ese permiso ya elevado haya caducado. No es instantaneo si el sistema operativo exige credenciales en ese momento.'
      },
      { type: 'h3', text: 'Umbrales de deteccion' },
      { type: 'list', items: ['Alerta de CPU por proceso: 85% por defecto.', 'Umbral de escaneo de puertos: 40 destinos distintos por minuto y proceso, por defecto.'] },
      { type: 'h3', text: 'Actualizaciones' },
      { type: 'p', text: 'Boton para comprobar actualizaciones manualmente contra los Releases de GitHub del repositorio (ver Actualizaciones automaticas).' }
    ]
  },
  {
    slug: 'actualizaciones',
    title: 'Actualizaciones automaticas',
    group: 'Funciones',
    blocks: [
      {
        type: 'p',
        text: 'Aegis EDR usa electron-updater configurado contra el proveedor "github" (owner/repo de este mismo repositorio). Al arrancar la app, y al pulsar "Buscar actualizaciones" en Ajustes, se consulta el ultimo Release publicado.'
      },
      { type: 'h3', text: 'Flujo' },
      {
        type: 'list',
        items: [
          'checking -> se esta consultando GitHub.',
          'available -> hay una version mas reciente; la descarga se inicia automaticamente (autoDownload esta desactivado por defecto pero se fuerza la descarga al detectar disponibilidad).',
          'downloading -> progreso de descarga en curso.',
          'downloaded -> el instalador esta listo; se aplicara en el siguiente reinicio de la app.',
          'not-available / error -> no hay nada nuevo, o fallo la comprobacion (se registra en el log).'
        ]
      },
      {
        type: 'callout',
        tone: 'info',
        text: 'Requisito indispensable: los Releases de GitHub deben publicarse como release PUBLICO (no borrador/draft) para que electron-updater los vea. El pipeline de CI de este repositorio ya fuerza esto con releaseType: "release".'
      }
    ]
  },
  {
    slug: 'arquitectura',
    title: 'Arquitectura tecnica',
    group: 'Referencia tecnica',
    blocks: [
      { type: 'h3', text: 'Estructura de carpetas' },
      {
        type: 'code',
        code: 'aegis-edr/\n├── app/                        # Aplicacion de escritorio\n│   ├── electron/\n│   │   ├── main/index.ts       # Proceso principal: ventana, IPC, arranque de monitores\n│   │   ├── main/preload.ts     # contextBridge: expone window.aegis al renderer\n│   │   ├── main/modules/       # Un modulo por capacidad (ver tabla abajo)\n│   │   └── shared/types.ts     # Tipos + contrato IPC compartido main/renderer\n│   └── src/                    # Renderer: React + Zustand + Tailwind\n│       ├── store/useAppStore.ts\n│       ├── lib/ipcClient.ts    # window.aegis en Electron, mockApi.ts fuera de Electron\n│       └── components/         # Una vista por seccion de la sidebar\n└── website/                    # Landing + Docs (este sitio), Node/React'
      },
      { type: 'h3', text: 'Proceso main vs preload vs renderer' },
      {
        type: 'p',
        text: 'El proceso main (Node.js completo) es el unico con acceso a systeminformation, chokidar, sudo-prompt, etc. El renderer (React) corre con contextIsolation activado y nodeIntegration desactivado: no tiene acceso directo a Node. El script preload usa contextBridge.exposeInMainWorld para exponer un objeto window.aegis con metodos concretos (getSnapshot, killProcess, blockIp, etc.), cada uno mapeado 1:1 a un canal ipcRenderer.invoke que el main gestiona con ipcMain.handle. Los canales estan centralizados como constantes en shared/types.ts (objeto IPC) para evitar strings sueltos desincronizados entre preload e index.ts.'
      },
      { type: 'h3', text: 'Modulos del proceso main' },
      {
        type: 'table',
        headers: ['Modulo', 'Responsabilidad'],
        rows: [
          ['processMonitor', 'Sondeo de procesos (systeminformation), puntuacion de riesgo, finalizar proceso'],
          ['networkMonitor', 'Sondeo de conexiones, deteccion de escaneo de puertos, auto-bloqueo de IP en severidad critica'],
          ['firewall', 'Comandos elevados de bloqueo/desbloqueo de IP y aislamiento de red por SO'],
          ['fileIntegrity', 'chokidar sobre carpetas de usuario, hash de ficheros criticos, deteccion de rafagas tipo ransomware'],
          ['persistenceScan', 'Escaneo de autoarranque por SO (registro/cron/systemd/launchd)'],
          ['quarantine', 'Mover, aislar permisos y restaurar ficheros en cuarentena'],
          ['alerts', 'Bus de alertas en memoria (maximo 500), notificaciones a listeners'],
          ['threatEngine', 'Heuristicas de puntuacion de riesgo y calculo de la puntuacion de seguridad global'],
          ['systemInfo', 'Vitales del sistema (CPU/RAM/disco/red) y enumeracion de dispositivos USB'],
          ['store', 'Persistencia de ajustes y cuarentena en disco (electron-store)'],
          ['logger', 'Log a fichero en el directorio de datos de usuario, no interrumpe la app si falla'],
          ['updater', 'Integracion con electron-updater contra los Releases de GitHub']
        ]
      },
      { type: 'h3', text: 'CI/CD' },
      {
        type: 'list',
        items: [
          '.github/workflows/deploy-pages.yml: build de website/ (con VITE_BASE=/aegis-edr/) y publicacion a GitHub Pages en cada push a main.',
          '.github/workflows/release.yml: al empujar un tag vX.Y.Z, compila app/ en una matriz Ubuntu + Windows + macOS en paralelo y publica los instaladores como Release de GitHub via electron-builder --publish always.'
        ]
      }
    ]
  },
  {
    slug: 'seguridad-privacidad',
    title: 'Seguridad y privacidad',
    group: 'Referencia tecnica',
    blocks: [
      {
        type: 'p',
        text: 'Aegis EDR procesa toda la telemetria (procesos, conexiones, ficheros, autoarranque) localmente en el equipo del usuario. No existe ningun servidor propio al que se envien estos datos.'
      },
      { type: 'h3', text: 'La unica llamada de red que hace el agente' },
      { type: 'p', text: 'La comprobacion de actualizaciones contra la API de Releases de GitHub (electron-updater), que es la misma API publica que consulta esta web para mostrar los instaladores disponibles.' },
      { type: 'h3', text: 'Telemetria opcional' },
      { type: 'p', text: 'El ajuste telemetryOptIn existe en el esquema de configuracion pero esta desactivado (false) por defecto y no se envia ningun dato de telemetria a terceros en esta version.' },
      { type: 'h3', text: 'Hardening del proceso Electron' },
      {
        type: 'list',
        items: [
          'contextIsolation: true y nodeIntegration: false en el BrowserWindow — el renderer no tiene acceso directo a Node.',
          'Superficie IPC explicita y tipada via contextBridge, sin exponer ipcRenderer en crudo.',
          'Las direcciones IP se validan por formato antes de interpolarse en cualquier comando de firewall ejecutado con privilegios elevados.',
          'Nunca se bloquean rangos de IP privados/loopback, para evitar que una accion de bloqueo corte la conectividad local del propio usuario.'
        ]
      }
    ]
  },
  {
    slug: 'faq',
    title: 'Solucion de problemas / FAQ',
    group: 'Referencia tecnica',
    blocks: [
      { type: 'h3', text: 'El bloqueo de IP o el aislamiento de red no hacen nada' },
      { type: 'p', text: 'Comprueba que aceptaste el dialogo de elevacion de privilegios (UAC en Windows, pkexec/sudo en Linux, contraseña de administrador en macOS). En Linux, si no tienes ningun agente de autenticacion grafico instalado, instala policykit-1 o equivalente.' },
      { type: 'h3', text: 'Windows SmartScreen / macOS Gatekeeper bloquean la app al abrirla' },
      { type: 'p', text: 'Los binarios no estan firmados con un certificado de firma de codigo comercial (requiere una suscripcion de pago). Es un known issue documentado: en Windows pulsa "Mas informacion -> Ejecutar de todas formas"; en macOS autoriza la app en Ajustes del Sistema -> Privacidad y seguridad.' },
      { type: 'h3', text: 'La seccion de Descargas de esta web muestra "Beta proxima"' },
      { type: 'p', text: 'Significa que el repositorio todavia no tiene ningun Release publico (o que la ultima release aun esta en borrador). En cuanto exista un Release publicado, esta seccion lo detecta automaticamente sin necesidad de tocar la web.' },
      { type: 'h3', text: 'Quiero vigilar otras carpetas ademas de Escritorio/Documentos/Descargas' },
      { type: 'p', text: 'El campo watchPaths existe en el esquema de ajustes para personalizar las rutas vigiladas por el monitor de integridad de ficheros; en esta version no hay todavia un editor visual para esa lista en Ajustes (ver Known issues).' },
      { type: 'h3', text: 'Que datos ve la IA de la seccion Asistente IA' },
      { type: 'p', text: 'Solo lo que tu preguntes: cuando envias un mensaje, el asistente puede consultar el estado real del equipo (procesos, conexiones, alertas, cuarentena, persistencia, ajustes) usando herramientas concretas, y esos datos viajan a la API de Anthropic junto con tu pregunta para poder responderte. Nunca ocurre en segundo plano ni sin que tu escribas algo. Ver la seccion Asistente IA para el detalle completo.' }
    ]
  },
  {
    slug: 'asistente-ia',
    title: 'Asistente IA (Claude)',
    group: 'Asistente IA',
    blocks: [
      {
        type: 'p',
        text: 'Aegis EDR incluye un asistente conversacional basado en la API de Claude (Anthropic) que puede consultar el estado real de tu equipo y, si se lo permites, actuar sobre el: finalizar procesos, bloquear IPs, poner ficheros en cuarentena, aislar la red o activar/desactivar modulos de proteccion. Es "BYOK" (bring your own key): usa tu propia clave de API de Anthropic, nunca una clave compartida por Aegis EDR.'
      },
      {
        type: 'callout',
        tone: 'warning',
        text: 'Esta es la unica funcion de Aegis EDR que envia datos fuera de tu equipo por diseño. Se activa exclusivamente cuando tu escribes una pregunta en la seccion Asistente IA — nunca en segundo plano, nunca de forma programada.'
      },
      { type: 'h3', text: 'Configuracion (BYOK)' },
      {
        type: 'list',
        items: [
          'Ve a la seccion "Asistente IA" y pega tu clave de la API de Anthropic (empieza por sk-ant-...). Puedes crear una en console.anthropic.com.',
          'Elige el modelo: Claude Opus 5 (maxima calidad, recomendado para analisis complejos), Claude Sonnet 5 (equilibrado) o Claude Haiku 4.5 (el mas rapido y economico).',
          'La clave se cifra con safeStorage de Electron, que usa el almacen de credenciales nativo del sistema operativo (Keychain en macOS, libsecret/keyring en Linux, DPAPI en Windows) antes de guardarse en disco.'
        ]
      },
      {
        type: 'callout',
        tone: 'info',
        text: 'Si tu sistema Linux no tiene un keyring compatible con libsecret instalado, safeStorage no puede cifrar y Aegis EDR te avisa explicitamente en la interfaz (badge de advertencia) en vez de fingir que la clave esta protegida.'
      },
      { type: 'h3', text: 'Que puede consultar (solo lectura, siempre automatico)' },
      {
        type: 'list',
        items: [
          'Panel general: puntuacion de seguridad, vitales del sistema, estado de proteccion.',
          'Procesos en ejecucion con su puntuacion de riesgo.',
          'Conexiones de red activas.',
          'Historial de alertas.',
          'Ficheros en cuarentena.',
          'Puntos de persistencia detectados.',
          'Ajustes actuales de la aplicacion.'
        ]
      },
      { type: 'h3', text: 'Que puede hacer (acciones, con confirmacion por defecto)' },
      {
        type: 'list',
        items: [
          'Finalizar un proceso.',
          'Bloquear o desbloquear una direccion IP.',
          'Poner un fichero en cuarentena o restaurarlo.',
          'Aislar la red del equipo por completo.',
          'Activar o desactivar un modulo de proteccion concreto.'
        ]
      },
      {
        type: 'p',
        text: 'Estas acciones son exactamente las mismas funciones internas, ya validadas, que usan los botones del resto de la interfaz (por ejemplo, bloquear una IP sigue pasando por la misma validacion de formato de firewall.ts). El asistente no tiene ningun atajo ni permiso especial que el resto de la app no tenga ya.'
      },
      { type: 'h3', text: 'Flujo de confirmacion humano-en-el-bucle' },
      {
        type: 'p',
        text: 'Por defecto, cada vez que la IA quiere ejecutar una accion (no una consulta de solo lectura), Aegis EDR pausa el flujo y te muestra una tarjeta con: que accion quiere tomar, con que parametros exactos, y el razonamiento que dio el modelo antes de pedirla. Tu decides con un boton Aprobar o Denegar. Si denegas, la conversacion continua y el asistente respeta tu decision.'
      },
      { type: 'h3', text: 'Modo autonomo (opcional, desactivado por defecto)' },
      {
        type: 'callout',
        tone: 'danger',
        text: 'Si activas el "Modo autonomo" en la seccion Asistente IA, el asistente ejecutara las acciones que decida sin pedirte confirmacion previa. Cada accion autonoma queda registrada igualmente como una alerta explicita ("La IA ejecuto automaticamente: ... — motivo: ...") para que quede trazabilidad completa, pero no hay marcha atras antes de que ocurra. Actívalo solo si confias en el criterio del modelo para tu caso de uso.'
      },
      { type: 'h3', text: 'Limite de iteraciones' },
      { type: 'p', text: 'El bucle de conversacion con herramientas tiene un limite de 12 iteraciones por mensaje para evitar bucles infinitos si el modelo encadenara llamadas a herramientas sin llegar a una respuesta final.' },
      { type: 'h3', text: 'Errores comunes' },
      {
        type: 'table',
        headers: ['Situacion', 'Que significa'],
        rows: [
          ['"La clave de API no es valida"', 'La clave introducida fue rechazada por la API de Anthropic (Anthropic.AuthenticationError).'],
          ['"Limite de peticiones alcanzado"', 'Se ha superado el rate limit de tu cuenta de Anthropic; reintenta en unos segundos.'],
          ['Aviso de clave sin cifrar', 'Tu sistema operativo no tiene disponible un almacen de credenciales compatible con safeStorage.']
        ]
      }
    ]
  },
  {
    slug: 'honeytokens',
    title: 'Honeytokens (ficheros señuelo)',
    group: 'Funciones',
    blocks: [
      {
        type: 'p',
        text: 'Cuando estan activados en Ajustes, Aegis EDR siembra ficheros señuelo con nombres atractivos para un atacante o un ransomware (por ejemplo passwords.xlsx, aws_credentials.json) en carpetas habituales como Escritorio y Documentos, y los vigila con prioridad maxima.'
      },
      {
        type: 'p',
        text: 'Cualquier lectura, modificacion o cifrado de uno de estos ficheros dispara una alerta critica inmediata y pone en cuarentena automaticamente el proceso responsable — es uno de los tripwires mas eficaces contra ransomware y exfiltracion de datos, porque un fichero legitimo del usuario nunca deberia tocarlos.'
      },
      { type: 'h3', text: 'Donde verlos' },
      { type: 'p', text: 'La seccion "Sistema de ficheros" tiene un panel Honeytokens que muestra cada señuelo y si ha sido activado ("¡Activado!") o sigue vigilando sin incidentes.' }
    ]
  },
  {
    slug: 'backups-rollback',
    title: 'Copias de respaldo y rollback',
    group: 'Funciones',
    blocks: [
      {
        type: 'p',
        text: 'Con "Backup antes de cambios" activado en Ajustes, cada vez que el monitor de integridad de ficheros detecta un cambio en una ruta vigilada, Aegis EDR guarda antes una copia versionada del contenido en un directorio propio de la app (con su hash SHA-256).'
      },
      {
        type: 'callout',
        tone: 'info',
        text: 'Esto NO es una integracion con snapshots nativos del sistema operativo (no usa VSS de Windows, snapshots de APFS en macOS ni btrfs/ZFS en Linux) — seria una integracion muy distinta por cada sistema operativo y de alto riesgo de romper algo fuera del control de la app. Es, deliberadamente, un historial de copias propio y simple: cada evento crea una entrada nueva sin sobreescribir las anteriores, asi que si un evento posterior resulta ser ransomware, las copias de eventos anteriores siguen disponibles.'
      },
      { type: 'h3', text: 'Restaurar' },
      { type: 'p', text: 'Desde la pestaña "Backups" en Sistema de ficheros, cada copia tiene un boton Restaurar que la devuelve a su ruta original.' },
      { type: 'p', text: 'El historial esta acotado (300 copias mas recientes, maximo 14 dias, y no se respaldan ficheros mayores de 25 MB) para no crecer sin limite en disco.' }
    ]
  },
  {
    slug: 'storyline-mitre',
    title: 'Storyline de ataque y MITRE ATT&CK',
    group: 'Funciones',
    blocks: [
      {
        type: 'p',
        text: 'En vez de una lista plana de alertas sueltas, Aegis EDR correlaciona automaticamente alertas relacionadas (mismo proceso, misma IP, o ventana temporal corta con relacion causal) en "incidentes": una cadena de eventos ordenada cronologicamente que cuenta la historia completa de un ataque en vez de fragmentos aislados.'
      },
      { type: 'h3', text: 'Donde verlo' },
      { type: 'p', text: 'La seccion Alertas tiene una pestaña "Incidentes" con cada cadena agrupada y su linea de tiempo.' },
      { type: 'h3', text: 'Tecnicas MITRE ATT&CK' },
      { type: 'p', text: 'Cada alerta generada por una heuristica conocida incluye, cuando aplica, el identificador de la tecnica MITRE ATT&CK correspondiente (por ejemplo T1055), visible como una insignia en la propia alerta — util para correlacionar con otras herramientas o informes.' }
    ]
  },
  {
    slug: 'score-explicable',
    title: 'Puntuacion explicable',
    group: 'Funciones',
    blocks: [
      {
        type: 'p',
        text: 'La puntuacion de seguridad del Panel general nunca es una caja negra: al pulsar sobre el indicador circular se abre un desglose completo de que factores estan penalizando la puntuacion ahora mismo (categoria y severidad de las alertas activas, cuantos eventos hay en cada grupo, y cuanto resta cada uno al total).'
      }
    ]
  },
  {
    slug: 'baseline-comportamiento',
    title: 'Baseline de comportamiento',
    group: 'Funciones',
    blocks: [
      {
        type: 'p',
        text: 'Aegis EDR recuerda, por proceso, que destinos de red ha contactado historicamente. Cuando un proceso con un patron ya establecido (al menos 3 destinos distintos conocidos) contacta un destino completamente nuevo, esa conexion se marca con la insignia "Nueva" en la seccion Red y sube su puntuacion de riesgo — es una desviacion real del comportamiento habitual de ese proceso, no solo una regla estatica.'
      },
      {
        type: 'callout',
        tone: 'info',
        text: 'Es una simplificacion deliberada: el historial es acumulativo (no una ventana temporal con caducidad automatica de entradas antiguas) y acotado a 200 destinos por proceso. No genera alertas de "primera conexion" nada mas instalar la app, precisamente porque exige un baseline minimo ya establecido.'
      }
    ]
  },
  {
    slug: 'lolbins',
    title: 'Deteccion de LOLBins y fileless',
    group: 'Funciones',
    blocks: [
      {
        type: 'p',
        text: 'Ademas de las heuristicas generales de procesos, Aegis EDR reconoce binarios legitimos del sistema operativo frecuentemente abusados para ejecucion, descarga o evasion sin dejar caer malware nuevo en disco ("living-off-the-land binaries" o LOLBins): powershell, mshta, rundll32, certutil, regsvr32, wscript, cscript, bitsadmin y otros.'
      },
      {
        type: 'p',
        text: 'Cuando uno de estos binarios aparece junto a parametros tipicos de descarga o ejecucion ofuscada (-enc, downloadstring, invoke-expression, -windowstyle hidden...), el proceso se marca con la insignia "LOLBin" en la seccion Procesos.'
      },
      {
        type: 'callout',
        tone: 'info',
        text: 'Es un best-effort documentado: no siempre se dispone de la linea de comandos completa del proceso via la libreria systeminformation en todos los sistemas operativos, asi que esta deteccion puede no capturar todos los casos.'
      }
    ]
  },
  {
    slug: 'extensiones-navegador',
    title: 'Auditoria de extensiones de navegador',
    group: 'Funciones',
    blocks: [
      {
        type: 'p',
        text: 'Desde la pestaña "Extensiones" en Sistema de ficheros, Aegis EDR enumera las extensiones instaladas en los navegadores conocidos (Chrome, Chromium, Edge, Firefox) leyendo sus carpetas de perfil, y marca combinaciones de permisos de alto riesgo (por ejemplo acceso a todas las paginas web combinado con interceptar/modificar trafico de red) — un vector de infeccion habitual que la mayoria de EDR de escritorio no cubre.'
      }
    ]
  },
  {
    slug: 'modo-incidente',
    title: 'Modo Incidente',
    group: 'Funciones',
    blocks: [
      {
        type: 'p',
        text: 'Boton de un clic en el Panel general para una respuesta de contencion completa: aisla la red del equipo, finaliza los procesos actualmente marcados como criticos, y genera un paquete de evidencia (snapshot completo, alertas, hashes relevantes y linea de tiempo) listo para adjuntar a un informe o entregar a un equipo de respuesta a incidentes.'
      },
      {
        type: 'callout',
        tone: 'danger',
        text: 'Es una accion drastica y pide confirmacion antes de ejecutarse: aislara tambien tu propia conectividad (salvo loopback). Usalo solo ante una amenaza activa confirmada.'
      }
    ]
  },
  {
    slug: 'playbooks',
    title: 'Playbooks (automatizacion si-esto-entonces-aquello)',
    group: 'Funciones',
    blocks: [
      {
        type: 'p',
        text: 'En Ajustes > Playbooks puedes definir reglas propias: "si ocurre una alerta de esta categoria con al menos esta severidad, entonces ejecuta esta accion" (finalizar proceso, bloquear IP, poner en cuarentena, o solo notificar). Cada regla se puede activar/desactivar individualmente y muestra cuantas veces se ha disparado.'
      },
      {
        type: 'p',
        text: 'Es una automatizacion ligera tipo SOAR pensada para casos concretos que quieras resolver siempre de la misma forma, sin depender solo del Bloqueo automatico global.'
      }
    ]
  },
  {
    slug: 'webhooks',
    title: 'Webhooks de alertas criticas',
    group: 'Funciones',
    blocks: [
      {
        type: 'p',
        text: 'En Ajustes puedes configurar una URL de webhook (compatible con el formato de Slack, Discord, o un formato generico) para recibir una notificacion externa cada vez que se genere una alerta de severidad critica. Un fallo al enviar el webhook nunca bloquea ni interrumpe el resto de la deteccion.'
      }
    ]
  },
  {
    slug: 'transparencia-red',
    title: 'Transparencia de red propia',
    group: 'Funciones',
    blocks: [
      {
        type: 'p',
        text: 'Aegis EDR se vigila a si mismo: el panel "Transparencia" en Ajustes lista, con destino y proposito, cada llamada de red saliente que hace la propia aplicacion — la comprobacion de actualizaciones contra GitHub, y si usas el Asistente IA, cada consulta a la API de Anthropic. Ningun EDR corporativo suele ofrecer este nivel de auditoria sobre su propia telemetria; aqui es una funcion de primera clase, coherente con el compromiso de cero telemetria oculta del proyecto.'
      }
    ]
  },
  {
    slug: 'config-como-codigo',
    title: 'Configuracion como codigo',
    group: 'Funciones',
    blocks: [
      {
        type: 'p',
        text: 'Desde Ajustes puedes exportar toda tu configuracion (ajustes y playbooks) a un unico fichero JSON descargable, e importarlo de vuelta en otro equipo o tras una reinstalacion — util para replicar tu configuracion entre maquinas o versionarla junto a tus propios dotfiles.'
      }
    ]
  },
  {
    slug: 'interfaz-avanzada',
    title: 'Interfaz avanzada',
    group: 'Funciones',
    blocks: [
      { type: 'h3', text: 'Radar de amenazas y glow ambiental' },
      { type: 'p', text: 'El Panel general incluye un radar animado con un blip por cada alerta activa (coloreado segun severidad), y un resplandor ambiental de fondo que cambia de cian tranquilo a ambar o rojo segun tu puntuacion de seguridad global — el estado de tu equipo se percibe de un vistazo, incluso sin leer numeros.' },
      { type: 'h3', text: 'Paleta de comandos' },
      { type: 'p', text: 'Pulsa Ctrl+K (o Cmd+K en macOS) en cualquier momento para abrir una paleta de comandos con busqueda difusa y saltar directamente a cualquier seccion de la aplicacion.' },
      { type: 'h3', text: 'Modo presentacion' },
      { type: 'p', text: 'En Ajustes > Privacidad visual puedes activar el Modo presentacion, que difumina datos sensibles en pantalla (IPs, rutas de fichero, hostname) para hacer capturas o compartir pantalla sin exponerlos; pasar el raton por encima de un dato difuminado lo revela temporalmente.' },
      { type: 'h3', text: 'Insignia de puntuacion' },
      { type: 'p', text: 'El boton "Copiar insignia SVG" del Panel general genera una pequeña insignia estilo shields.io con tu puntuacion actual, lista para pegar donde quieras.' }
    ]
  }
]
