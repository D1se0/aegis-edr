# Aegis EDR — sitio web

Landing oficial de Aegis EDR (`/`) mas una seccion completa de documentacion navegable (`/docs`),
en React + Vite + Tailwind + `react-router-dom`. El propio frontend consulta directamente la API
publica de GitHub (`GET https://api.github.com/repos/<owner>/<repo>/releases/latest`, cacheada 5
min en `sessionStorage`) para resolver los instaladores disponibles — por eso funciona igual como
sitio 100% estatico (GitHub Pages) que detras de un servidor propio.

Ademas se incluye un pequeño servidor Express (`server/index.js`) opcional para quien quiera
auto-hospedar el sitio (sirve `dist/` y expone `GET /api/releases/latest` como proxy cacheado
del lado servidor).

## Seccion /docs

`src/docs/content.ts` contiene todo el contenido de la documentacion (un array de secciones con
bloques tipados: parrafo, lista, codigo, aviso, tabla). `src/pages/DocsPage.tsx` renderiza el
sidebar de navegacion y el contenido segun el slug de la URL (`/docs/:slug`). Para añadir o
editar una seccion basta con tocar `content.ts` — no hace falta tocar el layout.

Como GitHub Pages sirve el sitio de forma 100% estatica, una recarga directa en `/docs/algo` (o
compartir ese enlace) pasa primero por `public/404.html`, que codifica la ruta real como query
string y redirige a `index.html`; un script en `index.html` la decodifica con
`history.replaceState` antes de que React monte, para que `react-router` reciba la URL correcta.
Es el patron estandar [spa-github-pages](https://github.com/rafgraph/spa-github-pages)
— `pathSegmentsToKeep = 1` en `404.html` porque el sitio vive bajo `/aegis-edr/`.

## GitHub Pages

El sitio se despliega automaticamente a GitHub Pages via `.github/workflows/deploy-pages.yml`
en cada push a `main` que toque `website/`. Como Pages sirve el repo bajo
`https://<owner>.github.io/<repo>/`, el build usa `VITE_BASE=/<repo>/` (ver `vite.config.ts`).
Para reproducir ese build en local: `VITE_BASE=/aegis-edr/ npm run build`.

## Desarrollo

```bash
npm install

# Frontend (Vite, puerto 5174) + API (Express, puerto 4001) a la vez:
npm run dev:all

# O por separado:
npm run dev          # solo frontend, con proxy /api -> :4001
npm run dev:server   # solo el servidor Express
```

## Build y produccion

```bash
npm run build   # genera dist/
npm start        # sirve dist/ + /api en un unico proceso (PORT, por defecto 8080)
```

## Variables de entorno

| Variable       | Descripcion                                  | Por defecto            |
|----------------|-----------------------------------------------|-------------------------|
| `PORT`         | Puerto del servidor en produccion             | `8080`                  |
| `GITHUB_OWNER` | Owner/organizacion del repo en GitHub         | `D1se0`  |
| `GITHUB_REPO`  | Nombre del repositorio                        | `aegis-edr`             |

Mientras el repositorio no tenga ninguna release publicada, `/api/releases/latest` devuelve
`{ available: false, ... }` y la web muestra el estado "Beta proxima" en la seccion de descargas
en lugar de romper.
