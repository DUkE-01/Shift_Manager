using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

using Shift_Manager.Server.Domain.Entities;
using Shift_Manager.Server.Infrastructure.Context;

namespace Shift_Manager.Server.Controllers;

[ApiController]
[Authorize]
public class ReportesController(ShiftManagerDbContext db) : ControllerBase
{
    private static readonly Dictionary<string, string> PrioridadMap = new()
    {
        ["high"] = "Alta", ["medium"] = "Media", ["low"] = "Baja"
    };

    private static readonly Dictionary<string, string> TipoMap = new()
    {
        ["emergency"] = "Incidente", ["non_emergency"] = "Novedad",
        ["traffic"] = "Incidente",   ["domestic"] = "Incidente",
        ["theft"] = "Incidente",     ["assault"] = "Incidente"
    };

    private static readonly Dictionary<string, string> EstadoMap = new()
    {
        ["pending"] = "Pendiente", ["in_progress"] = "EnProceso",
        ["assigned"] = "EnProceso", ["resolved"] = "Cerrado", ["closed"] = "Cerrado"
    };


    [HttpGet]
    [Route("api/reportes")]
    [Route("api/emergency-reports")]
    public async Task<IActionResult> GetAll()
    {
        var rol = User.FindFirst(ClaimTypes.Role)?.Value;

        if (rol == "Administrador")
        {
            var todos = await db.Reportes
                .Include(r => r.Agente).Include(r => r.Cuadrante).Include(r => r.Turno)
                .AsNoTracking().ToListAsync();
            await AttachNotificacionFlags(todos);
            return Ok(todos);
        }

        if (rol == "Supervisor")
        {
            var cuadranteId = await GetCuadranteIdAsync();
            var reportesCuadrante = await db.Reportes
                .Include(r => r.Agente).Include(r => r.Cuadrante).Include(r => r.Turno)
                .AsNoTracking()
                .Where(r => r.ID_Cuadrante == cuadranteId)
                .ToListAsync();
            await AttachNotificacionFlags(reportesCuadrante);
            return Ok(reportesCuadrante);
        }

        // Agente/Oficial: solo sus reportes
        var agenteId = await GetAgenteIdAsync();
        var reportesAgente = await db.Reportes
            .Include(r => r.Agente).Include(r => r.Cuadrante).Include(r => r.Turno)
            .AsNoTracking()
            .Where(r => r.ID_Agente == agenteId)
            .ToListAsync();
        return Ok(reportesAgente);
    }

    [HttpGet]
    [Route("api/reportes/{id:int}")]
    [Route("api/emergency-reports/{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var reporte = await db.Reportes
            .Include(r => r.Agente).Include(r => r.Cuadrante).Include(r => r.Turno)
            .FirstOrDefaultAsync(r => r.ID_Reporte == id);

        if (reporte is null) return NotFound($"Reporte {id} no encontrado.");

        var rol = User.FindFirst(ClaimTypes.Role)?.Value;

        if (rol == "Supervisor")
        {
            var cuadranteId = await GetCuadranteIdAsync();
            if (reporte.ID_Cuadrante != cuadranteId) return Forbid();
        }
        else if (rol != "Administrador")
        {
            var agenteId = await GetAgenteIdAsync();
            if (reporte.ID_Agente != agenteId) return Forbid();
        }

        return Ok(reporte);
    }


    [HttpPost]
    [Route("api/reportes")]
    [Route("api/emergency-reports")]
    [Authorize(Roles = "Administrador,Supervisor")]
    public async Task<IActionResult> Create([FromBody] ReporteUpsertDto dto)
    {
        try 
        {
            var turnoId = dto.ID_Turno > 0
                ? dto.ID_Turno
                : await ResolveDefaultTurnoIdAsync();

            var reporte = new Reporte
            {
                ID_Turno     = turnoId,
                ID_Agente    = ResolveId(dto.ID_Agente, dto.AssignedOfficerId),
                ID_Cuadrante = ResolveId(dto.ID_Cuadrante, dto.BeatId),
                Tipo         = dto.Tipo ?? MapValue(TipoMap, dto.Type, "Novedad"),
                Descripcion  = dto.Descripcion ?? dto.Description ?? string.Empty,
                Estado       = "Pendiente",
                Prioridad    = dto.Prioridad ?? MapValue(PrioridadMap, dto.Priority, "Media"),
                FechaCreacion = DateTime.UtcNow
            };

            db.Reportes.Add(reporte);
            await db.SaveChangesAsync();

            if (reporte.ID_Agente > 0)
            {
                db.Notificaciones.Add(new Notificacion {
                    IdAgente = reporte.ID_Agente,
                    Titulo = "Nuevo Reporte Asignado",
                    Mensaje = "Incidencia: " + reporte.Tipo + " | " + (reporte.Descripcion.Length > 50 ? reporte.Descripcion.Substring(0, 50) + "..." : reporte.Descripcion),
                    TipoReferencia = "Reporte",
                    ReferenciaId = reporte.ID_Reporte
                });
                await db.SaveChangesAsync();
            }

            return Ok(reporte);
        }
        catch (Exception ex)
        {
            var inner = ex.InnerException?.Message ?? "No inner exception";
            return BadRequest(new { Message = $"CATASTROPHIC DB ERROR: {ex.Message} | INNER: {inner}" });
        }
    }


    [HttpPut]
    [HttpPatch]
    [Route("api/reportes/{id:int}")]
    [Route("api/emergency-reports/{id:int}")]
    [Authorize(Roles = "Administrador,Supervisor,Oficial,Agente")]
    public async Task<IActionResult> Update(int id, [FromBody] ReporteUpsertDto dto)
    {
        var reporte = await db.Reportes.FindAsync(id);
        if (reporte is null) return NotFound($"Reporte {id} no encontrado.");

        var rol = User.FindFirst(ClaimTypes.Role)?.Value;

        var prevEstado = reporte.Estado;

        // Validación por Rol
        if (rol == "Supervisor")
        {
            var cuadranteId = await GetCuadranteIdAsync();
            if (reporte.ID_Cuadrante != cuadranteId) return Forbid();
        }
        else if (rol == "Oficial" || rol == "Agente")
        {
            var agenteId = await GetAgenteIdAsync();
            if (reporte.ID_Agente != agenteId) return Forbid();

            // Los oficiales SOLO pueden cambiar el estado y quizá agregar notas (si el DTO lo permite)
            if (!string.IsNullOrEmpty(dto.Status) && EstadoMap.TryGetValue(dto.Status, out var mappedEstadoOficial))
                reporte.Estado = mappedEstadoOficial;
            
            if (!string.IsNullOrEmpty(dto.Estado)) reporte.Estado = dto.Estado;

            bool isResolving = prevEstado != "Cerrado" && reporte.Estado == "Cerrado";
            await db.SaveChangesAsync();

            if (isResolving) await NotifyResolutionAsync(reporte);

            return Ok(reporte);
        }

        // Admin y Supervisor: pueden actualizar todo lo que permite el DTO
        if (!string.IsNullOrEmpty(dto.Status) && EstadoMap.TryGetValue(dto.Status, out var mappedEstado))
            reporte.Estado = mappedEstado;
        
        if (!string.IsNullOrEmpty(dto.Estado))        reporte.Estado = dto.Estado;
        if (!string.IsNullOrEmpty(dto.Tipo))          reporte.Tipo = dto.Tipo;
        if (!string.IsNullOrEmpty(dto.Descripcion ?? dto.Description))
            reporte.Descripcion = dto.Descripcion ?? dto.Description!;
        if (!string.IsNullOrEmpty(dto.Priority) && PrioridadMap.TryGetValue(dto.Priority, out var mappedPrio))
            reporte.Prioridad = mappedPrio;
        if (!string.IsNullOrEmpty(dto.Prioridad))     reporte.Prioridad = dto.Prioridad;

        bool isResolvingGlobal = prevEstado != "Cerrado" && reporte.Estado == "Cerrado";
        await db.SaveChangesAsync();

        if (isResolvingGlobal && rol != "Administrador") await NotifyResolutionAsync(reporte);

        return Ok(reporte);
    }


    [HttpDelete]
    [Route("api/reportes/{id:int}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Delete(int id)
    {
        var reporte = await db.Reportes.FindAsync(id);
        if (reporte is null) return NotFound($"Reporte {id} no encontrado.");

        db.Reportes.Remove(reporte);
        await db.SaveChangesAsync();
        return NoContent();
    }

    

    private async Task<int?> GetAgenteIdAsync()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId)) return null;
        return await db.UsuariosSistema.AsNoTracking()
            .Where(u => u.ID_Usuario == userId).Select(u => u.ID_Agente).FirstOrDefaultAsync();
    }

    private async Task<int?> GetCuadranteIdAsync()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId)) return null;
        return await db.UsuariosSistema.AsNoTracking()
            .Where(u => u.ID_Usuario == userId && u.ID_Agente != null)
            .Select(u => u.Agente!.ID_Cuadrante).FirstOrDefaultAsync();
    }

    private async Task<int> ResolveDefaultTurnoIdAsync()
    {
        var turno = await db.Turnos.Where(t => t.Estado == "Activo").FirstOrDefaultAsync()
                    ?? await db.Turnos.FirstOrDefaultAsync();
        return turno?.ID_Turno ?? 1;
    }

    private async Task AttachNotificacionFlags(List<Reporte> reportes)
    {
        if (!reportes.Any()) return;
        var rIds = reportes.Select(r => r.ID_Reporte).ToList();
        var notifs = await db.Notificaciones.AsNoTracking()
            .Where(n => n.TipoReferencia == "Reporte" && n.ReferenciaId != null && rIds.Contains(n.ReferenciaId.Value))
            .ToListAsync();

        foreach (var r in reportes)
        {
            var n = notifs.FirstOrDefault(x => x.ReferenciaId == r.ID_Reporte);
            r.VistoPorAgente = n?.Leida;
        }
    }

    private async Task NotifyResolutionAsync(Reporte reporte)
    {
        var targets = await db.UsuariosSistema
            .Include(u => u.Agente)
            .Where(u => u.Activo && u.ID_Agente != null && (u.Rol == "Administrador" || (u.Rol == "Supervisor" && u.Agente!.ID_Cuadrante == reporte.ID_Cuadrante)))
            .Select(u => u.ID_Agente!.Value)
            .Distinct()
            .ToListAsync();

        foreach (var tId in targets)
        {
            db.Notificaciones.Add(new Notificacion {
                IdAgente = tId,
                Titulo = "⚠️ Reporte Resuelto",
                Mensaje = $"Oficial resolvió la incidencia: {reporte.Tipo}. ID: {reporte.ID_Reporte:D4}",
                TipoReferencia = "Reporte",
                ReferenciaId = reporte.ID_Reporte
            });
        }
        if (targets.Any()) {
            await db.SaveChangesAsync();
        }
    }

    private static int ResolveId(int primary, string? fallbackString)
    {
        if (primary > 0) return primary;
        return int.TryParse(fallbackString, out var parsed) ? parsed : 1;
    }

    private static string MapValue(Dictionary<string, string> map, string? key, string defaultValue)
        => key != null && map.TryGetValue(key, out var value) ? value : defaultValue;
}

public sealed class ReporteUpsertDto
{
    public int ID_Turno { get; init; }
    public int ID_Agente { get; init; }
    public int ID_Cuadrante { get; init; }
    public string? Tipo { get; init; }
    public string? Descripcion { get; init; }
    public string? Estado { get; init; }
    public string? Prioridad { get; init; }
    public string? AssignedOfficerId { get; init; }
    public string? BeatId { get; init; }
    public string? Type { get; init; }
    public string? Description { get; init; }
    public string? Status { get; init; }
    public string? Priority { get; init; }
}
