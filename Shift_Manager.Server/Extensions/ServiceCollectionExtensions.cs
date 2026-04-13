using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

using Shift_Manager.Server.Application.Interfaces;
using Shift_Manager.Server.Application.Services;
using Shift_Manager.Server.Configuration;
using Shift_Manager.Server.Infrastructure.Context;
using Shift_Manager.Server.Infrastructure.Repositories;

namespace Shift_Manager.Server.Extensions;

public static class ServiceCollectionExtensions
{
    // ── Options ───────────────────────────────────────────────────────────────
    public static IServiceCollection AddAppOptions(
        this IServiceCollection services, IConfiguration config)
    {
        services.Configure<JwtOptions>(config.GetSection(JwtOptions.Section));
        services.Configure<CorsOptions>(config.GetSection(CorsOptions.Section));
        services.Configure<RateLimitOptions>(config.GetSection(RateLimitOptions.Section));
        services.Configure<ClientPathOptions>(config.GetSection(ClientPathOptions.Section));
        return services;
    }

    // ── Database ──────────────────────────────────────────────────────────────
    public static IServiceCollection AddResilientDatabase(
        this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<ShiftManagerDbContext>(options =>
            options.UseNpgsql(
                config.GetConnectionString("DefaultConnection"),
                npgsql => npgsql.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(10),
                    errorCodesToAdd: null)));

        return services;
    }

    // ── Repositories ──────────────────────────────────────────────────────────
    public static IServiceCollection AddRepositories(this IServiceCollection services)
    {
        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped<ITurnoRepository, TurnoRepository>();
        services.AddScoped<IHorarioRepository, HorarioRepository>();
        services.AddScoped<IDashboardRepository, DashboardRepository>();
        return services;
    }

    // ── Domain / Application services ─────────────────────────────────────────
    public static IServiceCollection AddDomainServices(this IServiceCollection services)
    {
        services.AddScoped<IAgentService, AgentService>();
        services.AddScoped<ITurnoService, TurnoService>();
        services.AddScoped<ITokenService, TokenService>();
        return services;
    }

    // ── API Controllers & JSON ────────────────────────────────────────────────
    public static IServiceCollection AddApiControllers(this IServiceCollection services)
    {
        services.AddControllers()
            .AddJsonOptions(o =>
            {
                o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
                o.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
                o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
            });

        services.AddEndpointsApiExplorer();
        return services;
    }

    // ── JWT Authentication ────────────────────────────────────────────────────
    public static IServiceCollection AddJwtAuthentication(
        this IServiceCollection services, IConfiguration config)
    {
        var jwtSection = config.GetSection(JwtOptions.Section);
        var jwtKey = jwtSection["Key"] ?? throw new InvalidOperationException("JWT Key no configurada.");

        if (jwtKey.Length < 16)
            throw new InvalidOperationException("JWT Key debe tener al menos 16 caracteres.");

        var issuer = jwtSection["Issuer"] ?? throw new InvalidOperationException("JWT Issuer no configurada.");
        var audience = jwtSection["Audience"] ?? throw new InvalidOperationException("JWT Audience no configurada.");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                var env = config.GetValue<string>("ASPNETCORE_ENVIRONMENT");
                var isDevelopment = env == "Development";
                options.SaveToken = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = issuer,
                    ValidAudience = audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                    ClockSkew = TimeSpan.FromMinutes(5)
                };

                if (isDevelopment)
                {
                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            var authHeader = context.Request.Headers["Swagger-Auth"].FirstOrDefault();
                            if (!string.IsNullOrEmpty(authHeader))
                            {
                                // Remove 'Bearer ' if present, otherwise just take the string
                                context.Token = authHeader.Split(' ').Last().Trim();
                            }
                            return Task.CompletedTask;
                        }
                    };
                }
            });

        return services;
    }

    // ── CORS ──────────────────────────────────────────────────────────────────
    public static IServiceCollection AddCorsPolicy(
        this IServiceCollection services,
        IConfiguration config,
        IWebHostEnvironment env)
    {
        // Intenta leer de la sección Cors:AllowedOrigins o de una variable de entorno CORS_ALLOWED_ORIGINS
        var origins = config.GetSection($"{CorsOptions.Section}:AllowedOrigins").Get<string[]>();
        
        // Si no hay en config, intentamos leer una sola string separada por comas (típico en env vars)
        if (origins == null || origins.Length == 0)
        {
            var envOrigins = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS");
            if (!string.IsNullOrEmpty(envOrigins))
            {
                origins = envOrigins
        .Split(',', StringSplitOptions.RemoveEmptyEntries)
        .Select(o => o.Trim().TrimEnd('/')) // 👈 AQUÍ el fix
        .ToArray();
            }
        }

        // Si sigue vacío, usamos defaults de desarrollo
        origins ??= new[] { "http://localhost:5173", "https://localhost:5173" };

        services.AddCors(o =>
        {
            o.AddPolicy(CorsOptions.PolicyName, policy =>
            {
                if (env.IsDevelopment())
                {
                    policy.WithOrigins(origins)
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                }
                else
                {
                    policy.SetIsOriginAllowed(origin =>
                    {
                        var cleanOrigin = origin.Trim().TrimEnd('/');
                        return origins.Any(o => o == cleanOrigin);
                    })
                    .AllowAnyHeader()
                    .AllowAnyMethod()
.AllowCredentials();
                }
            });
        });

        return services;
    }

    // ── Rate Limiting ─────────────────────────────────────────────────────────
    public static IServiceCollection AddGlobalRateLimiting(
        this IServiceCollection services, IConfiguration config)
    {
        var opts = config.GetSection(RateLimitOptions.Section).Get<RateLimitOptions>()
                   ?? new RateLimitOptions();

        services.AddRateLimiter(options =>
        {
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: partition => new FixedWindowRateLimiterOptions
                    {
                        AutoReplenishment = true,
                        PermitLimit = opts.PermitLimit,
                        QueueLimit = opts.QueueLimit,
                        Window = TimeSpan.FromSeconds(opts.WindowSeconds)
                    }));

            options.AddPolicy("client", httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.User?.Identity?.Name ?? httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
                    factory: partition => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 100,
                        Window = TimeSpan.FromMinutes(1)
                    }));

            options.AddPolicy("login", httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: partition => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 5,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0
                    }));
            options.AddPolicy("refresh", httpContext =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                    factory: partition => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 10,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0
                    }));

            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = (context, cancellationToken) =>
            {
                // Avoid accessing non-existing members on the cancellationToken; set a conservative Retry-After header
                context.HttpContext.Response.Headers.Append("Retry-After", "1");
                return default;
            };


        });

        return services;
    }

    // ── Swagger ───────────────────────────────────────────────────────────────
    public static IServiceCollection AddSwaggerWithBearer(this IServiceCollection services, IWebHostEnvironment env)
    {
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "Shift Manager API",
                Version = "v1",
                Description = "API para gestión de turnos y agentes"
            });

            if (env.IsDevelopment())
            {
                var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
                var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
                if (File.Exists(xmlPath))
                    c.IncludeXmlComments(xmlPath);
            }

            c.OperationFilter<BearerSecurityOperationFilter>();
        });

        return services;
    }
}

// ── WebApplication extensions ─────────────────────────────────────────────────
public static class WebApplicationExtensions
{
    public static WebApplicationBuilder LoadDotEnvIfDevelopment(this WebApplicationBuilder builder)
    {
        if (!builder.Environment.IsDevelopment()) return builder;

        var envPath = Path.Combine(builder.Environment.ContentRootPath, "..", ".env");
        if (!File.Exists(envPath)) return builder;

        foreach (var line in File.ReadAllLines(envPath)
            .Where(l => !l.StartsWith('#') && l.Contains('=')))
        {
            var parts = line.Split('=', 2);
            Environment.SetEnvironmentVariable(parts[0].Trim(), parts[1].Trim());
        }

        builder.Configuration.AddEnvironmentVariables();
        return builder;
    }

    public static IApplicationBuilder UseSwaggerWithUi(this IApplicationBuilder app)
    {
        app.UseSwagger();
        app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Shift Manager API v1"));
        return app;
    }

    // Con migraciones y  logging
    public static async Task EnsureDatabaseConnectivityAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var logger = scope.ServiceProvider
            .GetRequiredService<ILogger<Program>>(); 

        try
        {
            var context = scope.ServiceProvider.GetRequiredService<ShiftManagerDbContext>();

            // No aplicar MigrateAsync: la BD fue creada desde script SQL,
            // no desde EF Migrations. Solo verificamos conectividad.
            if (await context.Database.CanConnectAsync())
                logger.LogInformation("✅ Conexión a base de datos OK");
            else
                logger.LogError("❌ No se pudo conectar a la base de datos");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "💥 Error al conectar base de datos");
            throw; // Fail fast en desarrollo
        }
    }

    // Health Checks
    public static IServiceCollection AddDefaultHealthChecks(this IServiceCollection services)
    {
        // Register default health checks using the framework extension
        services.AddHealthChecks();
        return services;
    }
}

