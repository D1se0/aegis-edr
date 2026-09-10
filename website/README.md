# Aegis EDR — sitio web

Landing oficial de Aegis EDR: presentacion, funciones y descargas. Frontend en React + Vite +
Tailwind. El propio frontend consulta directamente la API publica de GitHub
(`GET https://api.github.com/repos/<owner>/<repo>/releases/latest`, cacheada 5 min en
`sessionStorage`) para resolver los instaladores disponibles — por eso funciona igual como sitio
100% estatico (GitHub Pages) que detras de un servidor propio.

Ademas se incluye un pequeño servidor Express (`server/index.js`) opcional para quien quiera
auto-hospedar el sitio (sirve `dist/` y expone `GET /api/releases/latest` como proxy cacheado
del lado servidor).

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
