# Shift Manager 👮‍♂️🚑📱

**Shift Manager** es una solución multiplataforma (Web & Mobile) de grado profesional diseñada para la gestión operativa de cuerpos de seguridad, policía municipal y servicios de emergencias. 

Esta plataforma permite la administración integral de turnos, seguimiento de agentes, gestión de cuadrantes y un sistema avanzado de reportes de incidencia con notificaciones en tiempo real, operando bajo un esquema robusto de **RBAC (Role-Based Access Control)**.

---

## 🚀 Arquitectura Moderna y Multiplataforma

El sistema se ha evolucionado para ofrecer una experiencia fluida tanto en escritorio como en dispositivos móviles:

1.  **Backend (API):** **ASP.NET Core 8 (.NET 8)** con arquitectura REST. Utiliza PostgreSQL (Supabase) con estrategias de conexión resilientes y pooling. Seguridad JWT con rotación de tokens.
2.  **Frontend Web (SPA):** Interfaz premium construida con **React + Vite + TypeScript**. Estilizada con **Tailwind CSS** y componentes accesibles de **Radix UI**.
3.  **App Móvil Nativa (Android/iOS):** Implementada mediante **Capacitor**, permitiendo la reutilización del 90% del código web mientras se accede a funciones nativas del dispositivo y se mantiene una interfaz adaptada al oficial de campo.

---

## ✨ Características de Grado Senior

-   🔐 **Segurida de Nivel Producción:** Autenticación JWT, gestión de variables de entorno seguras y políticas de CORS dinámicas controladas desde el servidor.
-   🔔 **Sistema de Notificaciones Bilaterales:** 
    -   Notificaciones instantáneas a Agentes sobre nuevos reportes o reaperturas.
    -   Alertas a Administradores/Supervisores cuando un reporte es resuelto (Read Receipts).
-   📊 **Confirmación de Lectura (Read Receipts):** Los supervisores pueden visualizar si el oficial asignado ya abrió y leyó la notificación en su celular (✓ Leído por el Agente).
-   📅 **Gestión por Cuadrantes Policiales:** Los supervisores solo gestionan el personal y los incidentes dentro de su jurisdicción geográfica.
-   🩺 **Health Checks & Telemetría:** Monitoreo de conectividad a la base de datos y logs estructurados con Serilog.

---

## 🛠️ Tecnologías

### Cloud & Infraestructura
- **Base de Datos:** Supabase (PostgreSQL) con Connection Pooling.
- **Hosting Backend:** Railway.
- **Hosting Frontend:** Vercel.
- **Mobile Bridge:** Capacitor JS.

### Stack Técnico
- **Backend:** .NET 8, EF Core (Npgsql), Serilog, JWT.
- **Frontend:** React 18, TanStack Query, Tailwind CSS, Lucide Icons.

---

## 📱 Generación de App Móvil

El proyecto utiliza Capacitor para generar ejecutables nativos.

1. **Requisitos:** Tener instalado Android Studio (para Android) o Xcode (para iOS).
2. **Ciclo de Build:**
   ```bash
   cd shift_manager.client
   npm run build
   npx cap copy
   npx cap open android # Abre Android Studio para generar el APK/AAB
   ```

---

## 🌐 Variables de Entorno (Producción)

Para el correcto funcionamiento en la nube, se deben configurar las siguientes variables:

### Railway (Backend)
- `CORS_ALLOWED_ORIGINS`: Lista de orígenes permitidos (ej: `capacitor://localhost,http://localhost,https://tusitio.vercel.app`).
- `ConnectionStrings__DefaultConnection`: Cadena de conexión a Supabase.
- `Jwt__Key`: Secreto de mínimo 32 caracteres.
- `ASPNETCORE_ENVIRONMENT`: `Production`.

### Vercel / Local Build (Frontend)
- `VITE_API_URL`: URL del backend de Railway (sin barra final).

---

## 📄 Licencia
Este proyecto es de uso privado para la modernización de servicios municipales. Todos los derechos reservados.
