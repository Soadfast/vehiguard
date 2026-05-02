# 🛡️ MIDDI — Sistema de Gestión Documental de Trabajadores

Sistema web empresarial para control de documentos de trabajadores con alertas de vencimiento, exportación y acceso separado por empresa.

---

## 📁 Estructura del Proyecto

```
middi/
├── config/
│   ├── database.js          # Conexión MongoDB
│   └── auth.js              # Credenciales y config empresas
├── controllers/
│   ├── authController.js    # Login / logout / sesión
│   ├── workerController.js  # CRUD trabajadores
│   ├── documentController.js # CRUD documentos + subida
│   └── exportController.js  # Exportación Excel y PDF
├── middleware/
│   ├── auth.js              # Validación sesión
│   └── upload.js            # Multer - subida archivos
├── models/
│   ├── Worker.js            # Modelo trabajador
│   └── Document.js          # Modelo documento
├── routes/
│   ├── auth.js              # /api/auth
│   ├── workers.js           # /api/workers
│   └── documents.js         # /api/documents
├── public/
│   ├── css/main.css         # Estilos globales
│   ├── js/utils.js          # Utilidades JS compartidas
│   ├── pages/
│   │   ├── login.html       # Login (compartido, detecta empresa por URL)
│   │   ├── dashboard.html   # Panel principal
│   │   └── worker-detail.html # Vista detalle trabajador
│   └── index.html           # Página selección empresa
├── uploads/                 # Archivos subidos (por empresa)
├── server.js                # Servidor principal
├── package.json
├── render.yaml              # Config deploy Render
└── .env.example
```

---

## 🚀 Instalación Local

### 1. Clonar y preparar

```bash
git clone <tu-repo>
cd middi
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env`:
```env
PORT=3000
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/middi
SESSION_SECRET=tu_secreto_aqui_cambia_esto
NODE_ENV=development
```

### 3. Ejecutar

```bash
# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start
```

Abrir: http://localhost:3000

---

## 🔑 Credenciales de Acceso

| Empresa | URL Login | Usuario | Contraseña |
|---------|-----------|---------|-----------|
| MIDDI X1 | /login/x1 | Muñeco | middi2024 |
| MIDDI X2 | /login/x2 | belona | middi2024 |
| MIDDI X3 | /login/x3 | bambono | middi2024 |

> Para cambiar contraseñas, editar `/config/auth.js`

---

## ☁️ Deploy en Render

1. Crear cuenta en [render.com](https://render.com)
2. Conectar repositorio GitHub
3. Crear **New Web Service**
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Variables de entorno:
   - `MONGODB_URI` → tu URI de MongoDB Atlas
   - `SESSION_SECRET` → cadena aleatoria larga
   - `NODE_ENV` → `production`

---

## 🍃 MongoDB Atlas (Base de datos en la nube)

1. Crear cuenta en [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Crear cluster gratuito (M0)
3. Crear usuario de base de datos
4. Permitir IP `0.0.0.0/0` (o IP de Render)
5. Obtener URI de conexión y pegar en `MONGODB_URI`

---

## 🚂 Deploy en Railway

```bash
# Instalar Railway CLI
npm i -g @railway/cli

# Login
railway login

# Crear proyecto
railway new

# Deploy
railway up
```

Agregar variables en el dashboard de Railway.

---

## 📡 API Reference

### Autenticación
```
POST /api/auth/login        → Login { empresa, username, password }
POST /api/auth/logout       → Cerrar sesión
GET  /api/auth/session      → Estado de sesión actual
```

### Trabajadores
```
GET    /api/workers              → Lista de trabajadores (filtrada por empresa)
GET    /api/workers/:id          → Detalle + documentos
POST   /api/workers              → Crear trabajador
PUT    /api/workers/:id          → Editar trabajador
DELETE /api/workers/:id          → Eliminar (soft delete)
```

### Exportación
```
GET /api/workers/export/excel/:id  → Descarga .xlsx
GET /api/workers/export/pdf/:id    → Descarga .pdf
```

### Documentos
```
GET    /api/documents/worker/:workerId  → Docs de un trabajador
POST   /api/documents/upload            → Subir documento (multipart/form-data)
DELETE /api/documents/:id               → Eliminar documento
GET    /api/documents/file/:id          → Ver archivo
```

---

## ✨ Funcionalidades

- **Multi-empresa**: 3 instancias completamente aisladas (X1, X2, X3)
- **Gestión de trabajadores**: CRUD completo con validaciones
- **Documentos**: Subida de PDF/imágenes con fecha de vencimiento
- **Alertas automáticas**: Verde (vigente) / Rojo (vencido) en tiempo real
- **Exportación Excel**: Hoja con datos del trabajador y tabla de documentos con colores
- **Exportación PDF**: Documento corporativo con diseño oscuro y estados visuales
- **Dashboard**: Tabla con filtros, búsqueda y estadísticas
- **Vista detalle**: Timeline de documentos con días restantes
- **Seguridad**: Sesiones HTTP-only, aislamiento estricto por empresa
- **Deploy-ready**: Configurado para Render y Railway con MongoDB Atlas

---

## 🔒 Seguridad

- Sesiones con `express-session` (cookie httpOnly + secure en producción)
- Todos los endpoints de API validan la sesión activa
- Los datos se filtran estrictamente por empresa en cada query MongoDB
- No hay forma de acceder a datos de otra empresa desde la API
- Archivos subidos se almacenan en carpetas separadas por empresa

---

## 🛠️ Tecnologías

| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Node.js | ≥18 | Runtime |
| Express | 4.x | Servidor web |
| MongoDB + Mongoose | 7.x | Base de datos |
| Multer | 1.x | Subida de archivos |
| ExcelJS | 4.x | Generación de Excel |
| PDFKit | 0.13 | Generación de PDF |
| express-session | 1.17 | Manejo de sesiones |
| DM Sans + Space Mono | — | Tipografía |
