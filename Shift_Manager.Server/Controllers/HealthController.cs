using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Collections.Generic;

using Shift_Manager.Server.Infrastructure.Context;

namespace Shift_Manager.Server.Domain.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
[DisableRateLimiting]  // Health checks no deben ser rate-limitados
public class HealthController : ControllerBase
{
    private readonly ShiftManagerDbContext _context;
    private readonly ILogger<HealthController> _logger;

    public HealthController(ShiftManagerDbContext context, ILogger<HealthController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// Simple liveness probe (200 OK si está corriendo).
    [HttpGet("live")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Live()
    {
        return Ok(new { status = "alive", timestamp = DateTime.UtcNow });
    }

    /// Readiness check (incluye BD, Redis, etc.).
    [HttpGet("ready")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Ready()
    {
        var report = new HealthReport
        {
            Status = "healthy",
            Timestamp = DateTime.UtcNow,
            Services = new()
        };

        // BD
        try
        {
            await _context.Database.CanConnectAsync();
            report.Services["database"] = new ServiceHealth { Status = "healthy" };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Database health check failed");
            report.Services["database"] = new ServiceHealth { Status = "unhealthy", Error = ex.Message };
            report.Status = "unhealthy";
        }

        if (report.Status == "unhealthy")
            return StatusCode(StatusCodes.Status503ServiceUnavailable, report);

        return Ok(report);
    }

    [HttpGet("detailed")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Detailed()
    {
        var report = new
        {
            timestamp = DateTime.UtcNow,
            assembly = typeof(Program).Assembly.GetName().Version?.ToString(),
            environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
            database = await CheckDatabaseAsync()
        };
        return Ok(report);
    }

    private async Task<object> CheckDatabaseAsync()
    {
        try
        {
            var sw = System.Diagnostics.Stopwatch.StartNew();
            await _context.Database.CanConnectAsync();
            sw.Stop();
            return new { status = "connected", responseTime = $"{sw.ElapsedMilliseconds}ms" };
        }
        catch (Exception ex)
        {
            return new { status = "failed", error = ex.Message };
        }
    }
}

public class HealthReport
{
    public string Status { get; set; } = "healthy";
    public DateTime Timestamp { get; set; }
    public Dictionary<string, ServiceHealth> Services { get; set; } = new();
}

public class ServiceHealth
{
    public string Status { get; set; } = "unknown";
    public string? Error { get; set; }
}
