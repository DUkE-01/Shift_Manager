using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shift_Manager.Server.Infrastructure.Context;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Shift_Manager.Server.Infrastructure.Context;
using System.Linq;
using System.Threading.Tasks;

namespace Shift_Manager.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificacionesController : ControllerBase
    {
        private readonly ShiftManagerDbContext _context;

        public NotificacionesController(ShiftManagerDbContext context)
        {
            _context = context;
        }

        private async Task<int?> GetAgenteIdAsync()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId)) return null;
            return await _context.UsuariosSistema.AsNoTracking()
                .Where(u => u.ID_Usuario == userId)
                .Select(u => u.ID_Agente)
                .FirstOrDefaultAsync();
        }

        // GET: api/notificaciones/mis-notificaciones
        [HttpGet("mis-notificaciones")]
        public async Task<IActionResult> GetNotificaciones()
        {
            var agenteId = await GetAgenteIdAsync();
            if (agenteId == null) return Ok(new string[] { });

            var notificaciones = await _context.Notificaciones
                .Where(n => n.IdAgente == agenteId)
                .OrderByDescending(n => n.FechaCreacion)
                .Take(50)
                .ToListAsync();

            return Ok(notificaciones);
        }

        // GET: api/notificaciones/no-leidas
        [HttpGet("no-leidas")]
        public async Task<IActionResult> GetNoLeidas()
        {
            var agenteId = await GetAgenteIdAsync();
            if (agenteId == null) return Ok(new { count = 0 });

            var count = await _context.Notificaciones
                .Where(n => n.IdAgente == agenteId && !n.Leida)
                .CountAsync();

            return Ok(new { count });
        }

        // PUT: api/notificaciones/marcar-leida/{id}
        [HttpPut("marcar-leida/{id}")]
        public async Task<IActionResult> MarcarLeida(int id)
        {
            var notificacion = await _context.Notificaciones.FindAsync(id);
            if (notificacion == null) return NotFound("Notificación no encontrada.");

            notificacion.Leida = true;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/notificaciones/marcar-todas-leidas
        [HttpPut("marcar-todas-leidas")]
        public async Task<IActionResult> MarcarTodasLeidas()
        {
            var agenteId = await GetAgenteIdAsync();
            if (agenteId == null) return NoContent();

            var noLeidas = await _context.Notificaciones
                .Where(n => n.IdAgente == agenteId && !n.Leida)
                .ToListAsync();

            foreach(var n in noLeidas)
            {
                n.Leida = true;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
