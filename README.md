# Shift Manager 👮‍♂️🚑

**Shift Manager** es una solución Full-Stack profesional diseñada para la gestión operativa de cuerpos de seguridad y emergencias. Permite la administración de turnos, seguimiento de agentes en tiempo real y generación de reportes de incidentes, todo bajo un estricto sistema de control de acceso basado en roles (RBAC) y circunscripciones geográficas.

---

### 📦 Portabilidad y Migración
Si deseas mover este proyecto a otro dispositivo, consulta la [Guía de Migración](MIGRATION_GUIDE.md). He incluido un script llamado `prepare_copy.bat` en la raíz para ayudarte a limpiar archivos temporales antes de copiar el proyecto.

---

## 🚀 Arquitectura del Sistema

La aplicación está dividida en dos componentes principales:

1.  **Backend (API):** Construido con **ASP.NET Core 8**, utilizando SQL Server con Entity Framework Core. Implementa seguridad JWT con rotación de refresh tokens y validaciones de reglas de negocio complejas.
2.  **Frontend (SPA):** Una interfaz moderna y reactiva construida con **React + Vite** y **TypeScript**. Utiliza **Tailwind CSS** para un diseño premium, **Radix UI** para componentes accesibles y **TanStack Query** para la sincronización eficiente de datos.

---

## ✨ Características Principales

-   🔐 **Autenticación Robusta:** Login con JWT, protección de rutas y manejo inteligente de sesiones.
-   👥 **Gestión de Personal:** CRUD completo de agentes con perfiles detallados y rangos.
-   📅 **Calendario de Turnos:** Sistema visual para asignar y supervisar turnos (Diurnos, Vespertinos, Nocturnos).
-   📊 **Dashboard Inteligente:** Visualización de métricas críticas (Agentes activos, Gaps en turnos, Reportes pendientes).
-   🗺️ **Control por Circunscripciones:**
    -   **Administradores:** Visión y control global de todas las áreas.
    -   **Supervisores:** Gestión limitada únicamente a los agentes y sectores de su jurisdicción.
    -   **Agentes:** Acceso de solo lectura a sus propios turnos y reportes.

---

## 🛠️ Tecnologías

### Backend
- .NET 8 Web API
- Entity Framework Core (SQL Server)
- JWT Bearer Authentication
- Serilog (Logging estructurado)
- Swagger / OpenAPI (Documentación de API)

### Frontend
- React 18 + Vite
- TypeScript
- TanStack Query (React Query)
- Tailwind CSS + Lucide Icons
- Radix UI + Framer Motion (Animaciones)

---

## ⚙️ Configuración Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/Shift_Manager.git
cd Shift_Manager
```

### 2. Configurar Variables de Entorno
Copia el archivo de plantilla y edítalo con tus credenciales locales:
```bash
cp .env.example .env
```
*Asegúrate de configurar `DB_CONNECTION` con tu instancia de SQL Server y generar una `JWT_KEY` segura (mínimo 32 caracteres).*

### 3. Levantar el Backend
```bash
cd Shift_Manager.Server
dotnet ef database update
dotnet run
```

### 4. Levantar el Frontend
```bash
cd shift_manager.client
npm install
npm run dev
```

---

## 🌐 Despliegue (Deployment)

### Frontend (Vercel)
Este proyecto está optimizado para desplegarse en **Vercel**:
1. Conecta tu repositorio de GitHub a Vercel.
2. Configura el **Root Directory** como `shift_manager.client`.
3. Añade la variable de entorno `VITE_API_URL` apuntando a la URL de tu API de producción.

### Backend (.NET)
Para el backend, se recomienda el uso de **Railway**, **Azure App Service** o **AWS**:
1. Configura el servidor para leer las variables de entorno desde el sistema (no subas el `.env`).
2. Setea `ASPNETCORE_ENVIRONMENT=Production`.
3. Asegúrate de que las `CORS_ORIGINS` incluyan el dominio de tu frontend en Vercel.

---

## 🔒 Seguridad y Git
**IMPORTANTE:** El archivo `.env` está incluido en el `.gitignore`. **Nunca** subas tus secretos (DB Connection strings o JWT Keys) a GitHub. Utiliza el panel de "Secrets" de tu plataforma de despliegue o GitHub Actions.

---

## 📄 Licencia
Este proyecto es de uso privado. Todos los derechos reservados.
