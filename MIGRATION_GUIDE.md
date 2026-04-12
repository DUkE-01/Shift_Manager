# Guía de Migración - Shift Manager

Esta guía detalla los pasos necesarios para mover este proyecto a un nuevo dispositivo y ponerlo en funcionamiento.

## 1. Requisitos Previos

Asegúrate de tener instalado lo siguiente en el nuevo equipo:

- **.NET 8 SDK**: [Descargar aquí](https://dotnet.microsoft.com/download/dotnet/8.0)
- **Node.js (v18 o superior)**: [Descargar aquí](https://nodejs.org/)
- **SQL Server Express**: [Descargar aquí](https://www.microsoft.com/sql-server/sql-server-downloads)
- **SQL Server Management Studio (SSMS)**: Para gestionar la base de datos.

## 2. Preparación de los Archivos (Qué copiar)

Para evitar copiar archivos innecesarios (que pesan Gigabytes), **NO** copies las siguientes carpetas:
- `node_modules` (en la raíz y en `shift_manager.client`)
- `bin` y `obj` (dentro de `Shift_Manager.Server`)
- `.vs` (carpeta oculta de Visual Studio)
- `.git` (si no quieres mantener el historial de cambios)

> [!TIP]
> Puedes usar el archivo `prepare_copy.bat` que he creado en la raíz para limpiar automáticamente estas carpetas antes de comprimir el proyecto.

## 3. Configuración de la Base de Datos

El sistema utiliza SQL Server. Tienes dos opciones:

### Opción A: Usar Migraciones de Entity Framework (Recomendado)
1. Abre una terminal en la carpeta `Shift_Manager.Server`.
2. Ejecuta: `dotnet ef database update`
   *(Esto creará la estructura de tablas automáticamente en tu instancia local de SQL Server).*

### Opción B: Backup/Restore
1. Realiza un backup del archivo `.bak` de tu base de datos actual.
2. Restáuralo en el nuevo SQL Server con el nombre `ShiftManagerDB`.

## 4. Configuración del Entorno

1. **Backend**: Revisa `Shift_Manager.Server/appsettings.json`. Asegúrate de que `ConnectionStrings:DefaultConnection` apunte a tu nueva instancia de SQL Server.
2. **Frontend**: Crea un archivo `.env` en la raíz (puedes copiar el `.env.example`) si necesitas configurar variables específicas del cliente.

## 5. Instalación y Ejecución

### Paso 1: Instalación de dependencias
Abre una terminal en la raíz del proyecto y ejecuta:
```bash
npm install
cd shift_manager.client
npm install
```

### Paso 2: Ejecución (Entorno de Desarrollo)
Puedes usar **Visual Studio** (abriendo el `.sln`) o la terminal:

**Desde la terminal:**
1. Servidor: `cd Shift_Manager.Server && dotnet run`
2. Cliente: `cd shift_manager.client && npm run dev`

---
**Nota**: El usuario administrador por defecto suele ser el que configuraste inicialmente. Si necesitas crear uno nuevo, asegúrate de insertarlo en la tabla `UsuariosSistema` vinculado a un `Agente` con rol `Administrador`.
