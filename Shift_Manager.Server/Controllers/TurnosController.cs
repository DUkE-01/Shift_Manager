using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

using Shift_Manager.Server.Application.DTOs.Turnos;
using Shift_Manager.Server.Domain.Common.Exceptions;
using Shift_Manager.Server.Application.Interfaces;
using Shift_Manager.Server.Infrastructure.Context;
using Shift_Manager.Server.Domain.Common.Helpers;

namespace Shift_Manager.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TurnosController : ControllerBase
{
    private readonly ITurnoService _turnoService;
    private readonly ILogger<TurnosController> _logger;
    private readonly ShiftManagerDbContext _db;

    public TurnosController(ITurnoService turnoService, ILogger<TurnosController> logger, ShiftManagerDbContext db)
    {
        _turnoService = turnoService;
        _logger       = logger;
        _db           = db;
    }

    // ─── GET todos ────────────────────────────────────────────────────────────
    // Admin: todos los turnos paginados
    // Supervisor: todos (ve su cuadrante completo)
    // Agente/Oficial: solo sus propios turnos

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TurnoDto>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 500);

        var rol = User.FindFirst(ClaimTypes.Role)?.Value;

        if (rol == "Administrador" || rol == "Supervisor")
        {
            var result = await _turnoService.GetPagedAsync(page, pageSize);
            return Ok(result);
        }

        // Agente: solo sus turnos
        var agenteId = await GetAgenteIdAsync();
        if (agenteId is null) return Ok(Array.Empty<TurnoDto>());

        var turnos = await _turnoService.GetByAgenteAsync(agenteId.Value);
        return Ok(turnos);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TurnoDto>> GetById(int id)
    {
        var turno = await _turnoService.GetByIdAsync(id);
        if (turno is null) return NotFound();

        var rol = User.FindFirst(ClaimTypes.Role)?.Value;
        if (rol != "Administrador" && rol != "Supervisor")
        {
            var agenteId = await GetAgenteIdAsync();
            if (turno.ID_Agente != agenteId)
                return Forbid();
        }

        return Ok(turno);
    }

    // Admin y Supervisor pueden filtrar por agente
    [HttpGet("agente/{agenteId:int}")]
    [Authorize(Roles = "Administrador,Supervisor")]
    public async Task<IActionResult> GetByAgente(int agenteId)
        => Ok(await _turnoService.GetByAgenteAsync(agenteId));

    // Admin y Supervisor pueden filtrar por cuadrante
    [HttpGet("cuadrante/{cuadranteId:int}")]
    [Authorize(Roles = "Administrador,Supervisor")]
    public async Task<IActionResult> GetByCuadrante(int cuadranteId)
        => Ok(await _turnoService.GetByCuadranteAsync(cuadranteId));

    // ─── POST ─────────────────────────────────────────────────────────────────
    // Admin y Supervisor pueden crear turnos

    [HttpPost]
    [Authorize(Roles = "Administrador,Supervisor")]
    public async Task<IActionResult> Create([FromBody] CrearTurnoDto dto)
    {
        var rol = User.FindFirst(ClaimTypes.Role)?.Value;
        if (rol == "Supervisor")
        {
            var userCirc = await GetCircunscripcionDelUsuarioAsync();
            var agent = await _db.Agentes.AsNoTracking().FirstOrDefaultAsync(a => a.ID_Agente == dto.ID_Agente);
            if (agent == null) return NotFound("Agente no encontrado.");
            
            var targetCirc = CuadranteMapping.GetCircunscripcion(agent.ID_Cuadrante);
            if (userCirc != targetCirc)
                return Forbid("No puede asignar turnos a agentes de otra circunscripción.");
        }
        return await ResultFromService(async () => await _turnoService.CreateOrUpdateForDayAsync(dto));
    }

    [HttpPost("batch")]
    [Authorize(Roles = "Administrador,Supervisor")]
    public async Task<IActionResult> CreateBatch([FromBody] List<CrearTurnoDto> dtos)
    {
        if (dtos == null || dtos.Count == 0)
            return BadRequest("La lista de turnos no puede estar vacía.");

        return await ResultFromService(async () => await _turnoService.CreateBatchAsync(dtos));
    }

    // ─── PUT ──────────────────────────────────────────────────────────────────
    // Admin y Supervisor pueden editar turnos

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrador,Supervisor")]
    public async Task<IActionResult> Update(int id, [FromBody] ActualizarTurnoDto dto)
    {
        var rol = User.FindFirst(ClaimTypes.Role)?.Value;
        if (rol == "Supervisor")
        {
            var turno = await _turnoService.GetByIdAsync(id);
            if (turno == null) return NotFound("Turno no encontrado.");
            
            var userCirc = await GetCircunscripcionDelUsuarioAsync();
            var agent = await _db.Agentes.AsNoTracking().FirstOrDefaultAsync(a => a.ID_Agente == turno.ID_Agente);
            
            if (agent != null)
            {
                var targetCirc = CuadranteMapping.GetCircunscripcion(agent.ID_Cuadrante);
                if (userCirc != targetCirc)
                    return Forbid("No puede editar turnos de agentes de otra circunscripción.");
            }
        }
        return await ResultFromService(async () => await _turnoService.UpdateAsync(id, dto));
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────
    // Solo Admin puede eliminar turnos

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Delete(int id)
    {
        await ResultFromService(async () => { await _turnoService.DeleteAsync(id); });
        return NoContent();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private async Task<int?> GetAgenteIdAsync()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId)) return null;

        return await _db.UsuariosSistema
            .AsNoTracking()
            .Where(u => u.ID_Usuario == userId)
            .Select(u => u.ID_Agente)
            .FirstOrDefaultAsync();
    }

    private async Task<int?> GetCircunscripcionDelUsuarioAsync()
    {
        var agenteId = await GetAgenteIdAsync();
        if (agenteId == null) return null;

        var idCuadrante = await _db.Agentes
            .AsNoTracking()
            .Where(a => a.ID_Agente == agenteId)
            .Select(a => (int?)a.ID_Cuadrante)
            .FirstOrDefaultAsync();

        return idCuadrante.HasValue ? CuadranteMapping.GetCircunscripcion(idCuadrante.Value) : null;
    }

    private async Task<ActionResult> ResultFromService(Func<Task> serviceCall)
    {
        try
        {
            await serviceCall();
            return Ok();
        }
        catch (NotFoundException ex)
        {
            _logger.LogWarning(ex, "Not found");
            return NotFound(ex.Message);
        }
        catch (ConflictException ex)
        {
            _logger.LogWarning(ex, "Conflict");
            return Conflict(ex.Message);
        }
        catch (BusinessRuleException ex)
        {
            _logger.LogWarning(ex, "Business rule");
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error");
            return StatusCode(500, "Error interno.");
        }
    }
}
