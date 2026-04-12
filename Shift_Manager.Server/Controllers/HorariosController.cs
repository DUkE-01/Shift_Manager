using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

using Shift_Manager.Server.Application.Interfaces;
using Shift_Manager.Server.Domain.Entities;
using Shift_Manager.Server.Infrastructure.Context;

namespace Shift_Manager.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HorariosController(IHorarioRepository horarioRepository, ShiftManagerDbContext db) : ControllerBase
{
    // ─── GET ──────────────────────────────────────────────────────────────────
    // Admin y Supervisor: ven todos los horarios
    // Agente/Oficial: solo sus propios horarios

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var rol = User.FindFirst(ClaimTypes.Role)?.Value;
        if (rol == "Administrador" || rol == "Supervisor")
            return Ok(await horarioRepository.GetAllAsync());

        // Agente: solo sus horarios
        var agenteId = await GetAgenteIdAsync();
        if (agenteId is null) return Ok(Array.Empty<object>());

        return Ok(await horarioRepository.GetByAgenteAsync(agenteId.Value));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var horario = await horarioRepository.GetByIdAsync(id);
        if (horario is null) return NotFound($"Horario {id} no encontrado.");

        var rol = User.FindFirst(ClaimTypes.Role)?.Value;
        if (rol != "Administrador" && rol != "Supervisor")
        {
            var agenteId = await GetAgenteIdAsync();
            if (horario.IdAgente != agenteId?.ToString())
                return Forbid();
        }

        return Ok(horario);
    }

    // Admin y Supervisor pueden buscar por agente
    [HttpGet("agente/{idAgente:int}")]
    [Authorize(Roles = "Administrador,Supervisor")]
    public async Task<IActionResult> GetByAgente(int idAgente)
        => Ok(await horarioRepository.GetByAgenteAsync(idAgente));

    // Admin y Supervisor pueden buscar por cuadrante
    [HttpGet("cuadrante/{idCuadrante:int}")]
    [Authorize(Roles = "Administrador,Supervisor")]
    public async Task<IActionResult> GetByCuadrante(int idCuadrante)
        => Ok(await horarioRepository.GetByCuadranteAsync(idCuadrante));

    [HttpGet("fecha/{fecha}")]
    public async Task<IActionResult> GetByFecha(DateOnly fecha)
        => Ok(await horarioRepository.GetByFechaAsync(fecha));

    [HttpGet("rango")]
    public async Task<IActionResult> GetByRango([FromQuery] DateOnly inicio, [FromQuery] DateOnly fin)
    {
        if (fin < inicio) return BadRequest("La fecha de fin no puede ser anterior a la de inicio.");
        return Ok(await horarioRepository.GetByRangoFechasAsync(inicio, fin));
    }

    [HttpGet("hoy")]
    public async Task<IActionResult> GetHoy()
        => Ok(await horarioRepository.GetHorariosHoyAsync());

    [HttpGet("paged")]
    [Authorize(Roles = "Administrador,Supervisor")]
    public async Task<IActionResult> GetPaged([FromQuery] int page = 1)
    {
        if (page <= 0) return BadRequest("El número de página debe ser mayor que 0.");
        return Ok(await horarioRepository.GetPagedAsync(page));
    }

    // ─── POST ─────────────────────────────────────────────────────────────────
    // Solo Admin y Supervisor pueden crear horarios

    [HttpPost]
    [Authorize(Roles = "Administrador,Supervisor")]
    public async Task<IActionResult> Create([FromBody] Horario horario)
    {
        await horarioRepository.AddAsync(horario);
        return CreatedAtAction(nameof(GetById), new { id = horario.IdHorario }, horario);
    }

    // ─── PUT ──────────────────────────────────────────────────────────────────
    // Solo Admin y Supervisor pueden editar horarios

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Administrador,Supervisor")]
    public async Task<IActionResult> Update(int id, [FromBody] Horario horario)
    {
        if (id != horario.IdHorario)
            return BadRequest("El ID de la ruta no coincide con el del cuerpo.");

        var existing = await horarioRepository.GetByIdAsync(id);
        if (existing is null) return NotFound($"Horario {id} no encontrado.");

        await horarioRepository.UpdateAsync(horario);
        return Ok(horario);
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────
    // Solo Admin puede eliminar horarios

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Delete(int id)
    {
        var existing = await horarioRepository.GetByIdAsync(id);
        if (existing is null) return NotFound($"Horario {id} no encontrado.");

        await horarioRepository.DeleteAsync(id);
        return NoContent();
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private async Task<int?> GetAgenteIdAsync()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId)) return null;
        return await db.UsuariosSistema.AsNoTracking()
            .Where(u => u.ID_Usuario == userId).Select(u => u.ID_Agente).FirstOrDefaultAsync();
    }
}
