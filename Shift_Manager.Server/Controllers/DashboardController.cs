using Microsoft.AspNetCore.Mvc;

using Shift_Manager.Server.Application.Interfaces;

namespace Shift_Manager.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardRepository _dashboardRepository;

        public DashboardController(IDashboardRepository dashboardRepository)
        {
            _dashboardRepository = dashboardRepository;
        }

        // Estadísticas generales
        [HttpGet("estadisticas")]
        public async Task<IActionResult> GetEstadisticas()
        {
            var stats = await _dashboardRepository.GetEstadisticasAsync();
            return Ok(stats);
        }

        // Turnos del día
        [HttpGet("turnos-hoy")]
        public async Task<IActionResult> GetTurnosHoy()
        {
            var turnos = await _dashboardRepository.GetTurnosHoyAsync();
            return Ok(turnos);
        }

        // Agentes activos
        [HttpGet("agentes-activos")]
        public async Task<IActionResult> GetAgentesActivos()
        {
            var agentes = await _dashboardRepository.GetAgentesActivosAsync();
            return Ok(agentes);
        }
    }
}