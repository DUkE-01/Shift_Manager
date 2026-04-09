using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using Shift_Manager.Server.Domain.Common.Exceptions;
using Shift_Manager.Server.Domain.Entities;
using Shift_Manager.Server.Infrastructure.Context;

namespace Shift_Manager.Server.Controllers;

/// <summary>
/// Manages incident/emergency reports (reportes).
/// Dual-route support for /api/reportes and /api/emergency-reports.
/// </summary>
[ApiController]
[Authorize]
public class ReportesController(ShiftManagerDbContext db) : ControllerBase
{
    // ── Static lookup tables (defined once, not re-created per request) ────────

    private static readonly Dictionary<string, string> PrioridadMap = new()
    {
        ["high"] = "Alta",
        ["medium"] = "Media",
        ["low"] = "Baja"
    };

    private static readonly Dictionary<string, string> TipoMap = new()
    {
        ["emergency"] = "Incidente",
        ["non_emergency"] = "Novedad",
        ["traffic"] = "Incidente",
        ["domestic"] = "Incidente",
        ["theft"] = "Incidente",
        ["assault"] = "Incidente"
    };

    private static readonly Dictionary<string, string> EstadoMap = new()
    {
        ["pending"] = "Pendiente",
        ["in_progress"] = "EnProceso",
        ["assigned"] = "EnProceso",
        ["resolved"] = "Cerrado",
        ["closed"] = "Cerrado"
    };

    // ─── GET ──────────────────────────────────────────────────────────────────

    [HttpGet]
    [Route("api/reportes")]
    [Route("api/emergency-reports")]
    public async Task<IActionResult> GetAll()
    {
        var reportes = await db.Reportes
            .Include(r => r.Agente)
            .Include(r => r.Cuadrante)
            .Include(r => r.Turno)
            .AsNoTracking()
            .ToListAsync();

        return Ok(reportes);
    }

    [HttpGet]
    [Route("api/reportes/{id:int}")]
    [Route("api/emergency-reports/{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var reporte = await db.Reportes
            .Include(r => r.Agente)
            .Include(r => r.Cuadrante)
            .Include(r => r.Turno)
            .FirstOrDefaultAsync(r => r.ID_Reporte == id);

        return reporte is null ? NotFound($"Reporte {id} no encontrado.") : Ok(reporte);
    }

    // ─── POST ─────────────────────────────────────────────────────────────────

    [HttpPost]
    [Route("api/reportes")]
    [Route("api/emergency-reports")]
    public async Task<IActionResult> Create([FromBody] ReporteUpsertDto dto)
    {
        var turnoId = dto.ID_Turno > 0
            ? dto.ID_Turno
            : await ResolveDefaultTurnoIdAsync();

        var reporte = new Reporte
        {
            ID_Turno = turnoId,
            ID_Agente = ResolveId(dto.ID_Agente, dto.AssignedOfficerId),
            ID_Cuadrante = ResolveId(dto.ID_Cuadrante, dto.BeatId),
            Tipo = dto.Tipo ?? MapValue(TipoMap, dto.Type, "Novedad"),
            Descripcion = dto.Descripcion ?? dto.Description ?? string.Empty,
            Estado = "Pendiente",
            Prioridad = dto.Prioridad ?? MapValue(PrioridadMap, dto.Priority, "Media"),
            FechaCreacion = DateTime.UtcNow
        };

        db.Reportes.Add(reporte);
        await db.SaveChangesAsync();
        return Ok(reporte);
    }

    // ─── PUT / PATCH ──────────────────────────────────────────────────────────

    [HttpPut]
    [HttpPatch]
    [Route("api/reportes/{id:int}")]
    [Route("api/emergency-reports/{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] ReporteUpsertDto dto)
    {
        var reporte = await db.Reportes.FindAsync(id);
        if (reporte is null) return NotFound($"Reporte {id} no encontrado.");

        // Apply whichever fields are provided (partial update)
        if (!string.IsNullOrEmpty(dto.Status) && EstadoMap.TryGetValue(dto.Status, out var mappedEstado))
            reporte.Estado = mappedEstado;
        if (!string.IsNullOrEmpty(dto.Estado))
            reporte.Estado = dto.Estado;
        if (!string.IsNullOrEmpty(dto.Tipo))
            reporte.Tipo = dto.Tipo;
        if (!string.IsNullOrEmpty(dto.Descripcion ?? dto.Description))
            reporte.Descripcion = dto.Descripcion ?? dto.Description!;
        if (!string.IsNullOrEmpty(dto.Priority) && PrioridadMap.TryGetValue(dto.Priority, out var mappedPrio))
            reporte.Prioridad = mappedPrio;
        if (!string.IsNullOrEmpty(dto.Prioridad))
            reporte.Prioridad = dto.Prioridad;

        await db.SaveChangesAsync();
        return Ok(reporte);
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────

    [HttpDelete]
    [Route("api/reportes/{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var reporte = await db.Reportes.FindAsync(id);
        if (reporte is null) return NotFound($"Reporte {id} no encontrado.");

        db.Reportes.Remove(reporte);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private async Task<int> ResolveDefaultTurnoIdAsync()
    {
        var turno = await db.Turnos
            .Where(t => t.Estado == "Activo")
            .FirstOrDefaultAsync()
            ?? await db.Turnos.FirstOrDefaultAsync();

        return turno?.ID_Turno ?? 1;
    }

    private static int ResolveId(int primary, string? fallbackString)
    {
        if (primary > 0) return primary;
        return int.TryParse(fallbackString, out var parsed) ? parsed : 1;
    }

    private static string MapValue(Dictionary<string, string> map, string? key, string defaultValue)
        => key != null && map.TryGetValue(key, out var value) ? value : defaultValue;
}

// ─── DTO ──────────────────────────────────────────────────────────────────────

/// <summary>
/// Unified create/update DTO accepting both Spanish and English field names.
/// </summary>
public sealed class ReporteUpsertDto
{
    // Spanish (canonical)
    public int ID_Turno { get; init; }
    public int ID_Agente { get; init; }
    public int ID_Cuadrante { get; init; }
    public string? Tipo { get; init; }
    public string? Descripcion { get; init; }
    public string? Estado { get; init; }
    public string? Prioridad { get; init; }

    // English aliases (from legacy frontend)
    public string? AssignedOfficerId { get; init; }
    public string? BeatId { get; init; }
    public string? Type { get; init; }
    public string? Description { get; init; }
    public string? Status { get; init; }
    public string? Priority { get; init; }
}
