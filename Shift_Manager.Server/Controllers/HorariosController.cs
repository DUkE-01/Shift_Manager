using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using Shift_Manager.Server.Application.Interfaces;
using Shift_Manager.Server.Domain.Entities;

namespace Shift_Manager.Server.Controllers;

/// <summary>
/// Schedule (horario) endpoints.
/// Exception handling delegated to <see cref="Middleware.GlobalExceptionMiddleware"/>.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HorariosController(IHorarioRepository horarioRepository) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await horarioRepository.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var horario = await horarioRepository.GetByIdAsync(id);
        return horario is null ? NotFound($"Horario {id} no encontrado.") : Ok(horario);
    }

    [HttpGet("agente/{idAgente:int}")]
    public async Task<IActionResult> GetByAgente(int idAgente)
        => Ok(await horarioRepository.GetByAgenteAsync(idAgente));

    [HttpGet("cuadrante/{idCuadrante:int}")]
    public async Task<IActionResult> GetByCuadrante(int idCuadrante)
        => Ok(await horarioRepository.GetByCuadranteAsync(idCuadrante));

    [HttpGet("fecha/{fecha}")]
    public async Task<IActionResult> GetByFecha(DateOnly fecha)
        => Ok(await horarioRepository.GetByFechaAsync(fecha));

    [HttpGet("rango")]
    public async Task<IActionResult> GetByRango([FromQuery] DateOnly inicio, [FromQuery] DateOnly fin)
    {
        if (fin < inicio)
            return BadRequest("La fecha de fin no puede ser anterior a la de inicio.");

        return Ok(await horarioRepository.GetByRangoFechasAsync(inicio, fin));
    }

    [HttpGet("hoy")]
    public async Task<IActionResult> GetHoy()
        => Ok(await horarioRepository.GetHorariosHoyAsync());

    [HttpGet("paged")]
    public async Task<IActionResult> GetPaged([FromQuery] int page = 1)
    {
        if (page <= 0) return BadRequest("El número de página debe ser mayor que 0.");
        return Ok(await horarioRepository.GetPagedAsync(page));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Horario horario)
    {
        await horarioRepository.AddAsync(horario);
        return CreatedAtAction(nameof(GetById), new { id = horario.IdHorario }, horario);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Horario horario)
    {
        if (id != horario.IdHorario)
            return BadRequest("El ID de la ruta no coincide con el del cuerpo.");

        var existing = await horarioRepository.GetByIdAsync(id);
        if (existing is null) return NotFound($"Horario {id} no encontrado.");

        await horarioRepository.UpdateAsync(horario);
        return Ok(horario);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await horarioRepository.GetByIdAsync(id);
        if (existing is null) return NotFound($"Horario {id} no encontrado.");

        await horarioRepository.DeleteAsync(id);
        return NoContent();
    }
}
