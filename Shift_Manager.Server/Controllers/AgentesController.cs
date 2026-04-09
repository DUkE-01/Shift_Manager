using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using Shift_Manager.Server.Application.Services;
using Shift_Manager.Server.Domain.Common.Exceptions;

namespace Shift_Manager.Server.Controllers;

/// <summary>
/// Manages agent (agente / officer) records.
/// Dual-route support (/api/agentes and /api/officers) for front-end compatibility.
/// </summary>
[ApiController]
[Authorize]
public class AgentesController(IAgentService agentService) : ControllerBase
{
    // ─── GET ──────────────────────────────────────────────────────────────────

    [HttpGet]
    [Route("api/agentes")]
    [Route("api/officers")]
    public async Task<IActionResult> GetAll()
        => Ok(await agentService.GetAllAsync());

    [HttpGet]
    [Route("api/agentes/{id:int}")]
    [Route("api/officers/{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var agente = await agentService.GetByIdAsync(id);
        return agente is null ? NotFound($"Agente {id} no encontrado.") : Ok(agente);
    }

    // ─── POST ─────────────────────────────────────────────────────────────────

    [HttpPost]
    [Route("api/agentes")]
    [Route("api/officers")]
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

    [HttpPut]
    [HttpPatch]
    [Route("api/agentes/{id:int}")]
    [Route("api/officers/{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] AgenteUpsertDto dto)
    {
        try
        {
            var agente = await agentService.UpdateAsync(id, dto);
            return Ok(agente);
        }
        catch (NotFoundException ex) { return NotFound(ex.Message); }
    }

    // ─── DELETE ───────────────────────────────────────────────────────────────

    [HttpDelete]
    [Route("api/agentes/{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await agentService.DeleteAsync(id);
            return NoContent();
        }
        catch (NotFoundException ex) { return NotFound(ex.Message); }
    }
}
