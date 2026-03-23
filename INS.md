# Happy Body Luxe — Sistema de Agenda

Sistema completo de agendamiento de citas para clínica de medicina estética.
Frontend estático (HTML/CSS/JS) + Backend Node.js + MongoDB Atlas.

---

## Arquitectura

```
Frontend (Netlify)          Backend (Railway)         Base de datos
─────────────────    ─────────────────────────    ──────────────────
index.html        →  GET /api/services          →  MongoDB Atlas
styles.css        →  GET /api/specialists       →  (colección services)
app.js            →  GET /api/appointments/     →  (colección specialists)
                       available                →  (colección appointments)
                  →  POST /api/appointments
```

---

## Requisitos previos

Antes de empezar necesitas tener instalado:
- **Node.js 18+** → https://nodejs.org (descarga la versión LTS)
- **Git** → https://git-scm.com
- Una cuenta gratuita en **MongoDB Atlas** → https://mongodb.com/atlas
- Una cuenta gratuita en **Netlify** → https://netlify.com
- Una cuenta gratuita en **Railway** → https://railway.app

---

## PASO 1 — Descargar el proyecto

```bash
# Clona el repositorio en tu computadora
git clone https://github.com/TU-USUARIO/happybody-luxe.git

# Entra a la carpeta del proyecto
cd happybody-luxe
```

---

## PASO 2 — Configurar MongoDB Atlas

### 2.1 Crear el cluster (base de datos gratuita)

1. Ve a https://mongodb.com/atlas y crea una cuenta
2. Haz clic en **"Build a Database"**
3. Elige la opción **FREE (M0 Sandbox)**
4. Selecciona un proveedor (AWS, Google, Azure — cualquiera) y la región más cercana a tu país
5. Dale un nombre al cluster, por ejemplo `happybody`
6. Haz clic en **"Create"** — tarda 1-2 minutos en crear

### 2.2 Crear usuario de base de datos

1. En el menú izquierdo, ve a **Security → Database Access**
2. Haz clic en **"Add New Database User"**
3. Método de autenticación: **Password**
4. Username: `happybody_admin` (o el que prefieras)
5. Password: genera uno seguro y **guárdalo** — lo necesitarás después
6. En "Database User Privileges" selecciona **"Atlas admin"**
7. Haz clic en **"Add User"**

### 2.3 Permitir conexiones desde cualquier IP

1. En el menú izquierdo, ve a **Security → Network Access**
2. Haz clic en **"Add IP Address"**
3. Haz clic en **"Allow Access from Anywhere"** (esto agrega `0.0.0.0/0`)
4. Haz clic en **"Confirm"**

> ⚠️ Para mayor seguridad en producción puedes limitar a la IP de Railway,
> pero para empezar con `0.0.0.0/0` funciona perfectamente.

### 2.4 Obtener el Connection String

1. En el menú izquierdo, ve a **Databases**
2. Haz clic en **"Connect"** junto a tu cluster
3. Selecciona **"Drivers"**
4. Driver: **Node.js**, Version: **5.5 or later**
5. Copia el connection string. Se verá así:
   ```
   mongodb+srv://happybody_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Reemplaza `<password>`** con la contraseña que creaste en el paso 2.2
7. **Agrega el nombre de la base de datos** antes del `?`:
   ```
   mongodb+srv://happybody_admin:TU_PASSWORD@cluster0.xxxxx.mongodb.net/happybody?retryWrites=true&w=majority
   ```
8. Guarda este string — lo usarás en el siguiente paso

---

## PASO 3 — Configurar el Backend localmente

```bash
# Entra a la carpeta del backend
cd backend

# Instala las dependencias
npm install

# Crea el archivo de variables de entorno
cp .env.example .env
```

Ahora abre el archivo `.env` con cualquier editor de texto y edítalo:

```env
MONGODB_URI=mongodb+srv://happybody_admin:TU_PASSWORD@cluster0.xxxxx.mongodb.net/happybody?retryWrites=true&w=majority
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5500
```

> Reemplaza el `MONGODB_URI` con el connection string del paso 2.4.

---

## PASO 4 — Poblar la base de datos (Seed)

Este comando crea todos los servicios y especialistas en MongoDB:

```bash
# Asegúrate de estar en la carpeta backend/
npm run seed
```

Deberías ver en la consola:
```
✅ Conectado a MongoDB
🗑️  Colecciones limpiadas
✅ Servicios insertados: 25
✅ Especialistas insertados: 5
🎉 Seed completado exitosamente
🔌 Desconectado de MongoDB
```

Si ves un error, verifica que el `MONGODB_URI` en `.env` sea correcto.

---

## PASO 5 — Correr el proyecto localmente

### Terminal 1 — Backend:
```bash
cd backend
npm run dev
```

Deberías ver:
```
✅ MongoDB conectado
🚀 Servidor corriendo en http://localhost:3001
```

### Verificar que el backend funciona:
Abre tu navegador y ve a http://localhost:3001/health

Deberías ver:
```json
{ "ok": true, "status": "ok", "db": "connected" }
```

### Terminal 2 — Frontend:
Puedes abrir el archivo `frontend/index.html` directamente en el navegador, o usar un servidor local:

```bash
# Opción A: con live-server (recomendado)
npx live-server frontend

# Opción B: con Python (si tienes Python instalado)
cd frontend
python3 -m http.server 5500
```

Abre http://localhost:5500 en tu navegador. La página debe cargar los servicios y especialistas desde MongoDB.

---

## PASO 6 — Deploy del Backend en Railway

### 6.1 Subir el código a GitHub

```bash
# Desde la raíz del proyecto
git add .
git commit -m "Initial commit — Happy Body Luxe"
git push origin main
```

### 6.2 Crear el servicio en Railway

1. Ve a https://railway.app y crea una cuenta (puedes entrar con GitHub)
2. Haz clic en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Conecta tu cuenta de GitHub y selecciona el repositorio `happybody-luxe`
5. Railway detectará el proyecto. Cuando pregunte qué carpeta desplegar, selecciona **`backend`**
   - Si no lo pregunta, continúa y configura en el siguiente paso

### 6.3 Configurar variables de entorno en Railway

1. En tu proyecto de Railway, haz clic en el servicio del backend
2. Ve a la pestaña **"Variables"**
3. Agrega estas variables una por una:

| Variable | Valor |
|---|---|
| `MONGODB_URI` | Tu connection string de MongoDB Atlas |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://tu-sitio.netlify.app` (lo obtendrás en el paso 7) |

> Por ahora pon `https://tu-sitio.netlify.app` como placeholder — lo actualizarás después.

### 6.4 Configurar el directorio raíz en Railway

1. Ve a la pestaña **"Settings"** del servicio
2. En **"Root Directory"** escribe: `backend`
3. En **"Start Command"** escribe: `node server.js`
4. Haz clic en **"Deploy"**

### 6.5 Obtener la URL de Railway

1. Ve a la pestaña **"Settings"** → **"Networking"** → **"Generate Domain"**
2. Railway te dará una URL como: `https://happybody-luxe-production.up.railway.app`
3. **Guarda esta URL** — la necesitarás para el frontend

### 6.6 Verificar el deploy del backend

Abre en el navegador: `https://TU-URL.up.railway.app/health`

Debes ver: `{ "ok": true, "db": "connected" }`

### 6.7 Correr el seed en producción

```bash
# Desde tu computadora, con la URI de producción
MONGODB_URI="mongodb+srv://..." node backend/seed/seedData.js
```

O puedes ejecutarlo directamente en Railway desde la consola del servicio.

---

## PASO 7 — Deploy del Frontend en Netlify

### 7.1 Actualizar la URL de la API en el frontend

Abre `frontend/app.js` y busca esta línea (cerca del inicio del archivo):

```javascript
const API_URL = window.location.hostname === 'localhost' || ...
  ? 'http://localhost:3001'
  : 'https://TU-API.up.railway.app'; // ← REEMPLAZAR AQUÍ
```

Reemplaza `https://TU-API.up.railway.app` con la URL real de tu backend en Railway.

```bash
# Guarda el cambio y súbelo a GitHub
git add frontend/app.js
git commit -m "Update API URL for production"
git push origin main
```

### 7.2 Crear el sitio en Netlify

1. Ve a https://netlify.com y crea una cuenta
2. Haz clic en **"Add new site"** → **"Import an existing project"**
3. Selecciona **"Deploy with GitHub"**
4. Conecta tu cuenta de GitHub y selecciona el repositorio `happybody-luxe`
5. Netlify leerá el `netlify.toml` automáticamente. Verifica que muestre:
   - **Base directory**: `frontend`
   - **Publish directory**: `frontend`
   - **Build command**: (vacío o `echo 'no build'`)
6. Haz clic en **"Deploy site"**

### 7.3 Obtener la URL de Netlify

Netlify te asignará una URL como: `https://happy-body-luxe-abc123.netlify.app`

Puedes cambiarla a algo más legible en: **Site Settings → Domain management → Custom domains → Options → Edit site name**

### 7.4 Actualizar FRONTEND_URL en Railway

1. Ve a tu proyecto en Railway
2. En la pestaña **"Variables"**, actualiza `FRONTEND_URL` con la URL real de Netlify:
   ```
   FRONTEND_URL=https://happy-body-luxe.netlify.app
   ```
3. Railway hará redeploy automáticamente con la nueva variable

---

## PASO 8 — Verificación final

Abre tu sitio de Netlify en el navegador y verifica:

- [ ] La página carga correctamente con el logo
- [ ] Los servicios aparecen agrupados por categoría
- [ ] Al seleccionar un servicio, los especialistas se filtran
- [ ] Al seleccionar especialista y fecha, el calendario muestra los días disponibles
- [ ] Al hacer clic en una fecha, aparecen los horarios desde MongoDB
- [ ] Los slots ya ocupados aparecen tachados
- [ ] Al confirmar una cita, aparece el modal de éxito
- [ ] Verificar en MongoDB Atlas → Browse Collections → `appointments` que la cita fue guardada

---

## PASO 9 — Reemplazar el logo (opcional)

Si quieres usar el logo en archivo PNG en lugar del logo embebido:

1. Coloca tu archivo `logo.png` en la carpeta `frontend/`
2. En `frontend/index.html`, busca la etiqueta `<img src="data:image/...">` y reemplázala por:
   ```html
   <img src="logo.png" alt="Happy Body Luxe" style="height:48px;width:auto;object-fit:contain;display:block;">
   ```
3. Sube los cambios a GitHub — Netlify re-deployará automáticamente

---

## Solución de problemas comunes

### ❌ "No se pudo conectar con el servidor"
- Verifica que el backend en Railway esté corriendo (ve a railway.app → tu proyecto)
- Verifica que la URL en `app.js` sea exactamente la URL de Railway (sin `/` al final)
- Abre `TU-URL.up.railway.app/health` en el navegador para confirmar

### ❌ "CORS error" en la consola del navegador
- Verifica que `FRONTEND_URL` en Railway sea exactamente la URL de Netlify
- Asegúrate de no tener `/` al final de la URL en la variable
- Haz redeploy del backend en Railway después de cambiar la variable

### ❌ "MongoDB connection failed" en Railway
- Verifica el `MONGODB_URI` en Railway — cópialo directamente desde Atlas
- Verifica que el Network Access en Atlas tenga `0.0.0.0/0`
- Verifica que el usuario y contraseña en el URI sean correctos

### ❌ Los slots no cargan
- Abre la consola del navegador (F12) y busca el error en la pestaña Network
- Verifica que el seed se ejecutó correctamente (`GET /api/specialists` debe devolver 5 especialistas)
- Verifica que la especialista trabaje el día seleccionado

### ❌ El seed falla
- Verifica que el `.env` existe en la carpeta `backend/` (no en la raíz)
- Verifica que `MONGODB_URI` no tenga espacios ni caracteres especiales no escapados

---

## Estructura del proyecto

```
happybody-luxe/
├── frontend/
│   ├── index.html      ← Página principal (HTML puro, sin build)
│   ├── styles.css      ← Todos los estilos
│   ├── app.js          ← Toda la lógica JS + conexión a la API
│   └── logo.png        ← Logo (opcional, ya está embebido en el HTML)
│
├── backend/
│   ├── server.js       ← Servidor Express principal
│   ├── package.json    ← Dependencias Node.js
│   ├── .env.example    ← Plantilla de variables de entorno
│   ├── .gitignore      ← Excluye node_modules y .env
│   ├── models/
│   │   ├── Service.js       ← Esquema de servicios
│   │   ├── Specialist.js    ← Esquema de especialistas
│   │   └── Appointment.js   ← Esquema de citas
│   ├── routes/
│   │   ├── services.js      ← GET /api/services
│   │   ├── specialists.js   ← GET /api/specialists
│   │   └── appointments.js  ← GET /api/appointments/available, POST /api/appointments
│   └── seed/
│       └── seedData.js  ← Pobla la BD con datos iniciales
│
├── netlify.toml    ← Configuración de deploy en Netlify
├── .gitignore      ← Ignora node_modules y .env
└── README.md       ← Esta guía
```

---

## API Reference

### GET /health
Verifica que el servidor y la BD están corriendo.

### GET /api/services
Devuelve todos los servicios activos.

### GET /api/specialists
Devuelve todos los especialistas activos con sus horarios.

### GET /api/appointments/available
```
Query params:
  specialistId    string    'sp1'
  date            string    'YYYY-MM-DD'
  serviceDuration number    minutos (30, 60, 180...)

Respuesta:
{
  "ok": true,
  "available": ["11:00","11:30","12:00"],
  "blocked":   ["13:00","13:30"]
}
```

### POST /api/appointments
```json
Body:
{
  "patientName":     "María García",
  "patientPhone":    "55 1234 5678",
  "specialistId":    "sp1",
  "serviceId":       "s01",
  "date":            "2026-04-15",
  "startTime":       "15:30",
  "durationMinutes": 30
}
```

### GET /api/appointments
```
Query params opcionales:
  date          'YYYY-MM-DD'
  specialistId  'sp1'
  status        'confirmed' | 'cancelled' | 'completed'
```

### PATCH /api/appointments/:id/cancel
Cancela una cita por su MongoDB `_id`.


mongodb+srv://HappyBodyLuxe_user:happyBodyLuxe2134.@happybodyluxe.vhpnzup.mongodb.net/HappyBody?appName=HappyBodyLuxe


app.js
const API_URL = 'http://localhost:3001';

routes/apoiment.js
// Hora de entrada/salida ese día
    // Mongoose Map → acceder con .get() o convertir a objeto
const startHoursObj = spec.startHours || {};
const endHoursObj   = spec.endHours || {};

MongoDB
happybody_user
Happy2134.

mongodb+srv://happybody_user:Happy2134.@cluster0.wqa8e7y.mongodb.net/?appName=Cluster0
