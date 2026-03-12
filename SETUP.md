# TubeCourse — Setup Guide

## 1. Crear proyecto en Google Cloud

### 1.1 Ir a Google Cloud Console
- Ve a: https://console.cloud.google.com/
- Crea un proyecto nuevo (ej: `tubecourse`)

### 1.2 Habilitar APIs
En "APIs & Services" → "Enable APIs":
- **Google+ API** (para OAuth)
- **YouTube Data API v3** (para las playlists)

### 1.3 Crear credenciales OAuth
- Ve a "APIs & Services" → "Credentials"
- Click "Create Credentials" → "OAuth 2.0 Client IDs"
- Tipo: **Web application**
- Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
- Copia el **Client ID** y **Client Secret**

### 1.4 Crear API Key para YouTube
- Ve a "APIs & Services" → "Credentials"
- Click "Create Credentials" → "API Key"
- Opcionalmente, restringe la key a "YouTube Data API v3"
- Copia la **API Key**

---

## 2. Configurar el proyecto

Edita `.env.local` con tus valores reales:

```env
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
YOUTUBE_API_KEY=tu_youtube_api_key_aqui
AUTH_SECRET=genera_con_openssl_rand_-base64_32
DATABASE_URL="file:./prisma/dev.db"
```

Para generar `AUTH_SECRET`:
```bash
openssl rand -base64 32
```

---

## 3. Iniciar el proyecto

```bash
# Instalar dependencias (si no lo has hecho)
npm install

# Inicializar la base de datos
npm run db:push

# Iniciar en modo desarrollo
npm run dev
```

Abre http://localhost:3000

---

## Notas sobre límites de YouTube API

La YouTube Data API v3 tiene una cuota de **10,000 unidades/día** (gratuito).
- Cada playlist importada consume ~3-5 unidades
- Las consultas de duración de videos consumen ~1 unidad por cada 50 videos
- Para uso personal, la cuota gratuita es más que suficiente

---

## Stack

- **Next.js 15** — Framework full-stack
- **NextAuth.js v5** — Autenticación con Google OAuth
- **Prisma v5 + SQLite** — Base de datos local para progreso
- **YouTube Data API v3** — Obtención de playlists y videos
- **Tailwind CSS v4** — Estilos
