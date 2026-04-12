using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Shift_Manager.Server.Application.Interfaces;
using Shift_Manager.Server.Infrastructure.Context;
using Shift_Manager.Server.Domain.Common.Helpers;

namespace Shift_Manager.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Administrador,Supervisor")] // Agentes no acceden al dashboard
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardRepository _dashboardRepository;
        private readonly ShiftManagerDbContext _context;

        public DashboardController(IDashboardRepository dashboardRepository, ShiftManagerDbContext context)
        {
            _dashboardRepository = dashboardRepository;
            _context = context;
        }

        // Estadísticas generales — solo Admin
        [HttpGet("estadisticas")]
        public async Task<IActionResult> GetEstadisticas()
        {
            var circunscripcion = await GetCircunscripcionAsync();
            var stats = await _dashboardRepository.GetEstadisticasAsync(circunscripcion);
            return Ok(stats);
        }

        // Turnos del día — Admin y Supervisor
        [HttpGet("turnos-hoy")]
        public async Task<IActionResult> GetTurnosHoy()
        {
            var circunscripcion = await GetCircunscripcionAsync();
            var turnos = await _dashboardRepository.GetTurnosHoyAsync(circunscripcion);
            return Ok(turnos);
        }

        // Agentes activos — Admin y Supervisor
        [HttpGet("agentes-activos")]
        public async Task<IActionResult> GetAgentesActivos()
        {
            var circunscripcion = await GetCircunscripcionAsync();
            var agentes = await _dashboardRepository.GetAgentesActivosAsync(circunscripcion);
            return Ok(agentes);
        }

        private async Task<int?> GetCircunscripcionAsync()
        {
            var rol = User.FindFirst(ClaimTypes.Role)?.Value;
            if (rol == "Administrador") return null;

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId)) return null;

            var idCuadrante = await _context.UsuariosSistema
                .AsNoTracking()
                .Where(u => u.ID_Usuario == userId)
                .Include(u => u.Agente)
                .Select(u => u.Agente != null ? (int?)u.Agente.ID_Cuadrante : null)
                .FirstOrDefaultAsync();

            if (idCuadrante.HasValue)
            {
                return CuadranteMapping.GetCircunscripcion(idCuadrante.Value);
            }

            return null;
        }
    }
}
