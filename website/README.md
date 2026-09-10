# Aegis EDR — sitio web

Landing oficial de Aegis EDR: presentacion, funciones y descargas. Frontend en React + Vite +
Tailwind, servido en produccion por un pequeño servidor Express que ademas expone
`GET /api/releases/latest`, un proxy cacheado (5 min) hacia la API de releases de GitHub.

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
