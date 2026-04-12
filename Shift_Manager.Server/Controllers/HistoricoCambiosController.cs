using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using Shift_Manager.Server.Infrastructure.Context;

namespace Shift_Manager.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Administrador")] // Solo Admin puede ver el historial de cambios
    public class HistoricoCambiosController : ControllerBase
    {
        private readonly ShiftManagerDbContext _context;

        public HistoricoCambiosController(ShiftManagerDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var historial = await _context.HistoricoCambios
                .OrderByDescending(h => h.ID_Historico)
                .ToListAsync();
            return Ok(historial);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var cambio = await _context.HistoricoCambios
                .FirstOrDefaultAsync(h => h.ID_Historico == id);

            if (cambio == null) return NotFound();
            return Ok(cambio);
        }
    }
}
