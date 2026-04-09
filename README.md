# Shift Manager — Server

Backend API for the **Shift Manager** application: a police shift scheduling and incident reporting system built with ASP.NET Core 8 and SQL Server.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Project Structure](#project-structure)
- [Configuration Reference](#configuration-reference)
- [API Overview](#api-overview)
- [Security Notes](#security-notes)
- [Running in Production](#running-in-production)

---

## Tech Stack

| Concern | Library |
|---|---|
| Framework | ASP.NET Core 8 |
| ORM | Entity Framework Core 8 (SQL Server) |
| Auth | JWT Bearer + BCrypt password hashing |
| Logging | Serilog (JSON to console + rolling file) |
| Resilience | EF Core built-in retry-on-failure |
| Rate Limiting | ASP.NET Core built-in `RateLimiter` |
| Metrics | prometheus-net |
| Validation | FluentValidation |
| API Docs | Swagger / OpenAPI |

---

## Prerequisites

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8)
- SQL Server 2019+ (or Azure SQL)
- Node.js 20+ (for the React frontend)

---

## Local Setup

### 1. Clone and configure secrets

```bash
git clone <repo-url>
cd Shift_Manager.Server
```

Copy the environment template and fill in your values:

```bash
cp ../.env.example ../.env
```

Edit `../.env`:

```env
ConnectionStrings__DefaultConnection=Server=localhost;Database=ShiftManagerDB;Trusted_Connection=True;TrustServerCertificate=True
JWT__KEY=your-random-minimum-32-char-secret-here
JWT__ISSUER=ShiftManagerAPI
JWT__AUDIENCE=ShiftManagerClient
```

> ⚠️ **Never commit `.env` or any file containing real secrets.**

### 2. Apply database migrations

```bash
dotnet ef database update
```

### 3. Run the API

```bash
dotnet run
```

The API starts at `https://localhost:7001` by default. Swagger is available at `/swagger` in development.

### 4. Run with the frontend

```bash
# From the solution root
dotnet run --project Shift_Manager.Server
```

The SPA will be served from `shift_manager.client/dist/public` if it exists, otherwise the API runs standalone.

---

## Project Structure

```
Shift_Manager.Server/
│
├── Common/
│   └── Exceptions/          # Domain exceptions (NotFoundException, ConflictException, etc.)
│
├── Configuration/
│   └── AppOptions.cs        # Strongly-typed settings classes (JwtOptions, CorsOptions, etc.)
│
├── Context/
│   └── ShiftManagerDbContext.cs  # EF Core DbContext with all entity configurations
│
├── Controllers/             # Thin HTTP controllers — no business logic
│   ├── AgentesController.cs
│   ├── AuthController.cs
│   ├── HorariosController.cs
│   ├── ReportesController.cs
│   ├── TurnosController.cs
│   └── HealthController.cs
│
├── DTOs/                    # Request/response data transfer objects
│   ├── Auth/
│   ├── Dashboard/
│   └── Turnos/
│
├── Entities/                # EF Core entity classes (single source of truth)
│
├── Extensions/              # IServiceCollection and IApplicationBuilder extensions
│   ├── ServiceCollectionExtensions.cs   # All DI registrations
│   └── ApplicationBuilderExtensions.cs  # SPA static files
│
├── Features/                # Vertical slices: service + DTO per domain area
│   ├── Agentes/             # IAgentService + AgentService + AgenteUpsertDto
│   └── Turnos/              # ITurnoService + TurnoService
│
├── Middleware/
│   ├── GlobalExceptionMiddleware.cs   # Maps domain exceptions → HTTP status codes
│   └── SecurityHeadersMiddleware.cs   # X-Frame-Options, CSP, HSTS, etc.
│
├── Repositories/            # EF Core data access layer
│   ├── Interfaces/          # Repository contracts
│   ├── GenericRepository.cs
│   ├── TurnoRepository.cs
│   ├── HorarioRepository.cs
│   └── DashboardRepository.cs
│
├── Services/
│   ├── TokenService.cs      # JWT generation and refresh token lifecycle
│   └── AuthService.cs       # Login orchestration
│
├── appsettings.json         # Non-secret defaults (JWT key must come from env)
├── .env.example             # Secret template — copy to .env locally
└── Program.cs               # Minimal startup: wires extensions, builds pipeline
```

---

## Configuration Reference

All settings can be overridden by environment variables using double-underscore notation (`JWT__KEY`, `ConnectionStrings__DefaultConnection`).

| Key | Description | Default |
|---|---|---|
| `Jwt:Key` | **Secret** signing key (≥32 chars). Use env var. | — |
| `Jwt:Issuer` | JWT issuer claim | `ShiftManagerAPI` |
| `Jwt:Audience` | JWT audience claim | `ShiftManagerClient` |
| `Jwt:AccessTokenExpiryMinutes` | Access token TTL | `15` |
| `Jwt:RefreshTokenExpiryDays` | Refresh token TTL | `7` |
| `Cors:AllowedOrigins` | Array of allowed frontend origins | `localhost:5173` |
| `RateLimit:PermitLimit` | Requests per window | `100` |
| `RateLimit:WindowSeconds` | Rate limit window in seconds | `60` |
| `ClientPath:DistFolder` | Relative path to built React app | `shift_manager.client/dist/public` |

---

## API Overview

| Route | Description | Auth |
|---|---|---|
| `POST /api/auth/login` | Login, returns access + refresh tokens | Public |
| `POST /api/auth/refresh` | Rotate refresh token | Public |
| `POST /api/auth/logout` | Revoke all refresh tokens for user | Required |
| `GET /api/agentes` | List all agents | Required |
| `POST /api/agentes` | Create agent | Required |
| `GET /api/turnos` | Paginated shift list | Required |
| `POST /api/turnos` | Create / upsert shift | Required |
| `POST /api/turnos/batch` | Bulk create shifts | Required |
| `GET /api/horarios` | List schedules | Required |
| `GET /api/reportes` | List incident reports | Required |
| `GET /api/health/live` | Liveness check | Public |
| `GET /api/health/ready` | Readiness check (DB + memory) | Public |
| `GET /metrics` | Prometheus metrics | Internal |

---

## Security Notes

- Passwords hashed with BCrypt (work factor 12)
- Refresh tokens stored hashed (SHA-256) in DB
- Refresh token rotation on every use
- JWT `ClockSkew = TimeSpan.Zero` — no clock drift tolerance
- Rate limiting on all endpoints (100 req/min, configurable)
- Security headers: CSP, HSTS, X-Frame-Options, Referrer-Policy
- CORS locked to explicit origins in production

---

## Running in Production

1. Set all required environment variables (especially `JWT__KEY` and `ConnectionStrings__DefaultConnection`)
2. Set `ASPNETCORE_ENVIRONMENT=Production`
3. Publish:
   ```bash
   dotnet publish -c Release -o ./publish
   ```
4. Run behind a reverse proxy (nginx or Azure App Service) — **do not expose Kestrel directly**
5. Ensure `AllowedOrigins` in config matches your frontend domain
