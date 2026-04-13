using System.Text.Json;
using System.Text.Json.Serialization;
using Serilog;
using Serilog.Formatting.Json;
using Shift_Manager.Server.Configuration;
using Shift_Manager.Server.Extensions;
using Shift_Manager.Server.Middleware;
using ShiftManagerCors = Shift_Manager.Server.Configuration.CorsOptions;

// Serilog primero
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
    Log.Information("✅ Iniciando Shift Manager API");

    var builder = WebApplication.CreateBuilder(args).LoadDotEnvIfDevelopment();
    builder.Host.UseSerilog();

    // Opciones de configuración
    builder.Services.AddAppOptions(builder.Configuration);

    // Base de datos, repositorios y servicios de dominio
    builder.Services.AddResilientDatabase(builder.Configuration);
    builder.Services.AddRepositories();
    builder.Services.AddDomainServices(); // registra ITokenService, IAgentService, ITurnoService

    // Controllers con JSON
    builder.Services.AddControllers()
        .AddJsonOptions(o =>
        {
            o.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
            o.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
            o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        });

    builder.Services.AddEndpointsApiExplorer();

    // Auth, CORS, Swagger, Rate Limiting, Health
    builder.Services.AddJwtAuthentication(builder.Configuration);
    builder.Services.AddCorsPolicy(builder.Configuration, builder.Environment);
    builder.Services.AddSwaggerWithBearer(builder.Environment);
    builder.Services.AddGlobalRateLimiting(builder.Configuration);
    builder.Services.AddDefaultHealthChecks();

    var app = builder.Build();

    // Conectividad a BD (aplica migraciones en Dev)
    await app.EnsureDatabaseConnectivityAsync();
    await Shift_Manager.Server.Infrastructure.Seeders.AdminSeeder.SeedAsync(app.Services);

    // Pipeline — ORDEN CRÍTICO
    if (app.Environment.IsDevelopment())
    {
        app.UseSwaggerWithUi();
        app.UseDeveloperExceptionPage();
    }

    app.UseMiddleware<SecurityHeadersMiddleware>();
    app.UseMiddleware<RequestMetricsMiddleware>();
    app.UseSerilogRequestLogging();

    app.UseHttpsRedirection();

    // CORS debe ir ANTES de Auth
    app.UseCors(ShiftManagerCors.PolicyName, policy =>{
         Console.WriteLine("Origin: " + origin);
                return true; // temporal para debug
    }); 
    app.Use(async (context, next) =>
{
    if (context.Request.Method == "OPTIONS")
    {
        context.Response.StatusCode = 200;
        return;
    }

    await next();
});

    app.UseAuthentication();
    app.UseAuthorization();

    app.UseRateLimiter();

    app.MapControllers();
    app.MapHealthChecks("/health");
    app.MapStaticFilesAndSpaFallback(app.Environment);

    Log.Information("✅ API ejecutándose");
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "❌ Aplicación falló al iniciar");
}
finally
{
    Log.CloseAndFlush();
}
