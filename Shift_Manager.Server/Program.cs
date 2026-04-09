using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using ShiftManagerCors = Shift_Manager.Server.Configuration.CorsOptions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Serilog;
using Serilog.Formatting.Json;
using Shift_Manager.Server.Configuration;
using Shift_Manager.Server.Infrastructure.Context;
using Shift_Manager.Server.Middleware;
using Shift_Manager.Server.Infrastructure.Repositories;
using Shift_Manager.Server.Application.Interfaces;
using Shift_Manager.Server.Application.DTOs;
using Shift_Manager.Server.Extensions;
using Swashbuckle.AspNetCore;

using StackExchange.Redis;

// Serilog PRIMERO
Log.Logger = new LoggerConfiguration()
    .Enrich.FromLogContext()
    .Enrich.WithProperty("Environment", Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production")
    .WriteTo.Console(new JsonFormatter())
    .WriteTo.File(new JsonFormatter(), "logs/log-.json",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30)
    .MinimumLevel.Information()
    .CreateLogger();

try
{
    Log.Information("🚀 Iniciando Shift Manager API");

    var builder = WebApplication.CreateBuilder(args);
    builder.Host.UseSerilog();

    // Cargar opciones
    builder.Services.AddAppOptions(builder.Configuration);

    // Redis (graceful)
    var redisConnection = builder.Configuration.GetConnectionString("Redis") ?? "localhost:6379";
    try
    {
        builder.Services.AddSingleton<IConnectionMultiplexer>(
            ConnectionMultiplexer.Connect(redisConnection));
        Log.Information("✅ Redis conectado: {RedisConnection}", redisConnection);
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "⚠️ Redis no disponible. Rate limiting en memoria");
    }

    // Database & Repos
    builder.Services.AddResilientDatabase(builder.Configuration);
    builder.Services.AddRepositories();
    builder.Services.AddDomainServices();
    builder.Services.AddResilientHttpClients();

    // Usa tu extensión
    builder.Services.AddApiControllers();

    // Auth, CORS, Swagger, Rate Limiting
    builder.Services.AddJwtAuthentication(builder.Configuration);
    builder.Services.AddCorsPolicy(builder.Configuration, builder.Environment);
    builder.Services.AddSwaggerWithBearer(builder.Environment);
    builder.Services.AddSwaggerGen(SwaggerConfig.Configure);
    builder.Services.AddGlobalRateLimiting(builder.Configuration);
    builder.Services.AddDefaultHealthChecks();


    var app = builder.Build();

    // Pipeline (orden CRÍTICO)
    await app.EnsureDatabaseConnectivityAsync();

    if (app.Environment.IsDevelopment())
        app.UseSwaggerWithUi();

    // Middlewares de seguridad/monitoring
    app.UseRateLimiter();
    app.UseMiddleware<GlobalExceptionMiddleware>();
    app.UseMiddleware<SecurityHeadersMiddleware>();
    app.UseMiddleware<RequestMetricsMiddleware>();
    app.UseSerilogRequestLogging();

    app.UseHttpsRedirection();

    // Cors
    app.UseCors(ShiftManagerCors.PolicyName);

    app.UseAuthentication();
    app.UseAuthorization();

    // Endpoints
    app.MapControllers();
    app.MapHealthChecks("/health");
    app.MapStaticFilesAndSpaFallback(app.Environment);

    var port = app.Urls.FirstOrDefault()?.Split(':').Last() ?? "????";
    Log.Information("✅ API ejecutándose en https://localhost:{Port}/swagger", port);

    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "💥 Aplicación falló al iniciar");
}
finally
{
    Log.CloseAndFlush();
}
