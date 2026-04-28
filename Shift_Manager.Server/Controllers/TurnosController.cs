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


    [HttpPost]
    [Authorize(Roles = "Administrador,Supervisor")]
    public async Task<IActionResult> Create([FromBody] CrearTurnoDto dto)
    {
        var rol = User.FindFirst(ClaimTypes.Role)?.Value;
        if (rol == "Supervisor")
        {
            var userCirc = await GetCircunscripcionDelUsuarioAsync();
            
            // Validar Agente
            var agent = await _db.Agentes.AsNoTracking().FirstOrDefaultAsync(a => a.ID_Agente == dto.ID_Agente);
            if (agent == null) return NotFound("Agente no encontrado.");
            
            var agentCirc = CuadranteMapping.GetCircunscripcion(agent.ID_Cuadrante);
            if (userCirc != agentCirc)
                return Forbid("No puede asignar turnos a agentes de otra circunscripción.");

            // Validar Cuadrante de destino
            var targetCirc = CuadranteMapping.GetCircunscripcion(dto.ID_Cuadrante);
            if (userCirc != targetCirc)
                return Forbid("No puede asignar turnos en cuadrantes de otra circunscripción.");
        }
        return await ResultFromService(async () => await _turnoService.CreateOrUpdateForDayAsync(dto));
    }

    [HttpPost("batch")]
    [Authorize(Roles = "Administrador,Supervisor")]
    public async Task<IActionResult> CreateBatch([FromBody] List<CrearTurnoDto> dtos)
    {
        if (dtos == null || dtos.Count == 0)
            return BadRequest("La lista de turnos no puede estar vacía.");

        // Para simplificar, si es supervisor, validamos el primer elemento o todos? 
        // Mejor todos para seguridad, pero por ahora el service manejará la lógica grupal.
        // Aquí podríamos agregar una validación rápida del rol.
        
        return await ResultFromService(async () => await _turnoService.CreateBatchAsync(dtos));
    }

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

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrador,Supervisor")]
    public async Task<IActionResult> Delete(int id)
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
                    return Forbid("No puede eliminar turnos de agentes de otra circunscripción.");
            }
        }
        return await ResultFromService(async () => { await _turnoService.DeleteAsync(id); });
    }

    

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

    private async Task<IActionResult> ResultFromService<T>(Func<Task<T>> serviceCall)
    {
        try
        {
            var result = await serviceCall();
            return Ok(result);
        }
        catch (NotFoundException ex)
        {
            _logger.LogWarning(ex, "Not found: {Message}", ex.Message);
            return NotFound(new { error = ex.Message });
        }
        catch (ConflictException ex)
        {
            _logger.LogWarning(ex, "Conflict: {Message}", ex.Message);
            return Conflict(new { error = ex.Message });
        }
        catch (BusinessRuleException ex)
        {
            _logger.LogWarning(ex, "Business rule: {Message}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in TurnosController: {Message}", ex.Message);
            return StatusCode(500, new { 
                error = "Error interno del servidor.", 
                details = ex.Message,
                innerError = ex.InnerException?.Message 
            });
        }
    }

    private async Task<IActionResult> ResultFromService(Func<Task> serviceCall)
    {
        try
        {
            await serviceCall();
            return Ok();
        }
        catch (NotFoundException ex)
        {
            _logger.LogWarning(ex, "Not found: {Message}", ex.Message);
            return NotFound(new { error = ex.Message });
        }
        catch (ConflictException ex)
        {
            _logger.LogWarning(ex, "Conflict: {Message}", ex.Message);
            return Conflict(new { error = ex.Message });
        }
        catch (BusinessRuleException ex)
        {
            _logger.LogWarning(ex, "Business rule: {Message}", ex.Message);
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in TurnosController: {Message}", ex.Message);
            return StatusCode(500, new { 
                error = "Error interno del servidor.", 
                details = ex.Message,
                innerError = ex.InnerException?.Message 
            });
        }
    }
}
