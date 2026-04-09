using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using Shift_Manager.Server.Application.DTOs.Turnos;
using Shift_Manager.Server.Domain.Common.Exceptions;
using Shift_Manager.Server.Extensions;
using Shift_Manager.Server.Application.Services;
using Shift_Manager.Server.Application.Interfaces;



namespace Shift_Manager.Server.Controllers;

/// <summary>
/// CRUD endpoints for shift (turno) management.
/// All business logic has been moved to <see cref="ITurnoService"/>.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TurnosController : ControllerBase
{
    private readonly ITurnoService _turnoService;
    private readonly ILogger<TurnosController> _logger;

    public TurnosController(ITurnoService turnoService, ILogger<TurnosController> logger)
    {
        _turnoService = turnoService;
        _logger = logger;
    }

    // ─── GET ──────────────────────────────────────────────────────────────────

    /// <summary>
    /// Gets paginated list of shifts
    /// </summary>
    /// <param name="page">Page number (min: 1)</param>
    /// <param name="pageSize">Items per page (1-500)</param>
    /// <returns>Paginated shifts</returns>
    [HttpGet]
    public async Task<ActionResult<PagedResult<TurnoDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(page, 1);
        ArgumentOutOfRangeException.ThrowIfLessThan(pageSize, 1);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(pageSize, 500);

        var result = await _turnoService.GetPagedAsync(page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TurnoDto>> GetById(int id)
    {
        var turno = await _turnoService.GetByIdAsync(id);
        return turno is null ? NotFound() : Ok(turno);
    }

    [HttpGet("agente/{agenteId:int}")]
    public async Task<ActionResult<IEnumerable<TurnoDto>>> GetByAgente(int agenteId)
        => Ok(await _turnoService.GetByAgenteAsync(agenteId));

    [HttpGet("cuadrante/{cuadranteId:int}")]
    public async Task<ActionResult<IEnumerable<TurnoDto>>> GetByCuadrante(int cuadranteId)
        => Ok(await _turnoService.GetByCuadranteAsync(cuadranteId));

    // ─── POST ─────────────────────────────────────────────────────────────────

    [HttpPost]
    public async Task<ActionResult<TurnoDto>> Create([FromBody] CrearTurnoDto dto)
        => await ResultFromService(async () => await _turnoService.CreateOrUpdateForDayAsync(dto));

    [HttpPost("batch")]
    public async Task<ActionResult<IEnumerable<TurnoDto>>> CreateBatch([FromBody] List<CrearTurnoDto> dtos)
    {
        if (dtos?.Count == 0)
            return BadRequest("La lista de turnos no puede estar vacía.");

        return await ResultFromService(async () => await _turnoService.CreateBatchAsync(dtos));
    }

    // ─── PUT ──────────────────────────────────────────────────────────────────

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TurnoDto>> Update(int id, [FromBody] ActualizarTurnoDto dto)
        => await ResultFromService(async () => await _turnoService.UpdateAsync(id, dto));

    // ─── DELETE ───────────────────────────────────────────────────────────────

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await ResultFromService<object>(async () => { await _turnoService.DeleteAsync(id); return null!; });
        return NoContent();
    }

    // ─── SHARED HELPER ────────────────────────────────────────────────────────

    private async Task<ActionResult<T>> ResultFromService<T>(Func<Task<T>> serviceCall)
    {
        try
        {
            var result = await serviceCall();
            return Ok(result);
        }
        catch (NotFoundException ex)
        {
            _logger.LogWarning(ex, "Resource not found: {Message}", ex.Message);
            return NotFound(ex.Message);
        }
        catch (ConflictException ex)
        {
            _logger.LogWarning(ex, "Conflict: {Message}", ex.Message);
            return Conflict(ex.Message);
        }
        catch (BusinessRuleException ex)
        {
            _logger.LogWarning(ex, "Business rule violation: {Message}", ex.Message);
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error");
            return StatusCode(500, "Error interno del servidor.");
        }
    }
}
