using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

using Shift_Manager.Server.Application.Services;
using Shift_Manager.Server.Application.DTOs.Agentes;
using Shift_Manager.Server.Domain.Common.Exceptions;
using Shift_Manager.Server.Infrastructure.Context;
using Shift_Manager.Server.Domain.Common.Helpers;

namespace Shift_Manager.Server.Controllers;

[ApiController]
[Authorize]
public class AgentesController(IAgentService agentService, ShiftManagerDbContext db) : ControllerBase
{
    // ─── GET todos ────────────────────────────────────────────────────────────
    // Admin y Supervisor: ven todos los agentes
    // Agente/Oficial: solo se ve a sí mismo

    [HttpGet]
    [Route("api/agentes")]
    [Route("api/officers")]
    public async Task<IActionResult> GetAll()
    {
        var rol = User.FindFirst(ClaimTypes.Role)?.Value;

        if (rol == "Administrador")
            return Ok(await agentService.GetAllAsync());

        if (rol == "Supervisor")
        {
            var circ = await GetCircunscripcionDelUsuarioAsync();
            var all = await agentService.GetAllAsync();
            if (circ.HasValue)
            {
                var idsValidos = CuadranteMapping.GetCuadrantesByCircunscripcion(circ.Value).ToList();
                var results = all.Where(a => idsValidos.Contains(a.ID_Cuadrante));
                return Ok(results);
            }
            return Ok(Array.Empty<AgenteDto>());
        }

        // Agente/Oficial: devuelve solo su propio registro
        var agenteId = await GetAgenteIdDelUsuarioAsync();
        if (agenteId is null)
            return Ok(Array.Empty<AgenteDto>());
 
        var agente = await agentService.GetByIdAsync(agenteId.Value);
        return agente is null ? Ok(Array.Empty<AgenteDto>()) : Ok(new[] { agente });
    }

    [HttpGet]
    [Route("api/agentes/{id:int}")]
    [Route("api/officers/{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var rol = User.FindFirst(ClaimTypes.Role)?.Value;

        // Agente/Oficial: solo puede ver su propio registro
        if (rol != "Administrador" && rol != "Supervisor")
        {
            var agenteId = await GetAgenteIdDelUsuarioAsync();
            if (agenteId != id)
                return Forbid();
        }

        var agente = await agentService.GetByIdAsync(id);
        return agente is null ? NotFound($"Agente {id} no encontrado.") : Ok(agente);
    }

    // ─── POST ─────────────────────────────────────────────────────────────────
    // Solo Admin puede crear agentes

    [HttpPost]
    [Route("api/agentes")]
    [Route("api/officers")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Create([FromBody] AgenteUpsertDto dto)
    {
        try
        {
            var agente = await agentService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = agente.ID_Agente }, agente);
        }
        catch (NotFoundException ex) { return NotFound(ex.Message); }
        catch (BusinessRuleException ex) { return BadRequest(ex.Message); }
    }

    // ─── PUT / PATCH ──────────────────────────────────────────────────────────
    // Solo Admin puede editar agentes

    [HttpPut]
    [HttpPatch]
    [Route("api/agentes/{id:int}")]
    [Route("api/officers/{id:int}")]
    [Authorize(Roles = "Administrador,Supervisor")]
    public async Task<IActionResult> Update(int id, [FromBody] AgenteUpsertDto dto)
    {
        var rol = User.FindFirst(ClaimTypes.Role)?.Value;
        if (rol == "Supervisor")
        {
            var userCirc = await GetCircunscripcionDelUsuarioAsync();
            var targetAgent = await agentService.GetByIdAsync(id);
            
            if (targetAgent == null) return NotFound($"Agente {id} no encontrado.");
            
            var targetCirc = CuadranteMapping.GetCircunscripcion(targetAgent.ID_Cuadrante);
            
            if (userCirc != targetCirc)
                return Forbid("No tiene permisos para editar agentes de otra circunscripción.");
        }

        try
        {
            var agente = await agentService.UpdateAsync(id, dto);
            return Ok(agente);
        }
        catch (NotFoundException ex) { return NotFound(ex.Message); }
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────
    // Solo Admin puede eliminar agentes

    [HttpDelete]
    [Route("api/agentes/{id:int}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await agentService.DeleteAsync(id);
            return NoContent();
        }
        catch (NotFoundException ex) { return NotFound(ex.Message); }
    }

    // ─── Helper ───────────────────────────────────────────────────────────────

    private async Task<int?> GetAgenteIdDelUsuarioAsync()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(userIdClaim, out var userId)) return null;

        var usuario = await db.UsuariosSistema
            .AsNoTracking()
            .Where(u => u.ID_Usuario == userId)
            .Select(u => u.ID_Agente)
            .FirstOrDefaultAsync();

        return usuario;
    }

    private async Task<int?> GetCircunscripcionDelUsuarioAsync()
    {
        var agenteId = await GetAgenteIdDelUsuarioAsync();
        if (agenteId == null) return null;

        var idCuadrante = await db.Agentes
            .AsNoTracking()
            .Where(a => a.ID_Agente == agenteId)
            .Select(a => (int?)a.ID_Cuadrante)
            .FirstOrDefaultAsync();

        return idCuadrante.HasValue ? CuadranteMapping.GetCircunscripcion(idCuadrante.Value) : null;
    }
}
