using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

using Shift_Manager.Server.Domain.Entities;
using Shift_Manager.Server.Infrastructure.Context;

namespace Shift_Manager.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CuadrantesController : ControllerBase
    {
        private readonly ShiftManagerDbContext _context;

        public CuadrantesController(ShiftManagerDbContext context)
        {
            _context = context;
        }

        // ─── GET ──────────────────────────────────────────────────────────────
        // Admin: todos los cuadrantes
        // Supervisor y Agente: solo su cuadrante

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var rol = User.FindFirst(ClaimTypes.Role)?.Value;

            if (rol == "Administrador")
            {
                var todos = await _context.Cuadrantes
                    .Include(c => c.Agentes)
                    .AsNoTracking()
                    .ToListAsync();
                return Ok(todos);
            }

            // Supervisor y Agente: solo su cuadrante
            var cuadranteId = await GetCuadranteDelUsuarioAsync();
            if (cuadranteId is null) return Ok(Array.Empty<object>());

            var cuadrante = await _context.Cuadrantes
                .Include(c => c.Agentes)
                .AsNoTracking()
                .Where(c => c.ID_Cuadrante == cuadranteId)
                .ToListAsync();

            return Ok(cuadrante);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var rol = User.FindFirst(ClaimTypes.Role)?.Value;

            // Supervisor y Agente: solo pueden ver su cuadrante
            if (rol != "Administrador")
            {
                var cuadranteId = await GetCuadranteDelUsuarioAsync();
                if (cuadranteId != id) return Forbid();
            }

            var cuadrante = await _context.Cuadrantes
                .Include(c => c.Agentes)
                .FirstOrDefaultAsync(c => c.ID_Cuadrante == id);

            if (cuadrante == null) return NotFound();
            return Ok(cuadrante);
        }

        // ─── POST ─────────────────────────────────────────────────────────────
        // Solo Admin puede crear cuadrantes

        [HttpPost]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Post(Cuadrante cuadrante)
        {
            _context.Cuadrantes.Add(cuadrante);
            await _context.SaveChangesAsync();
            return Ok(cuadrante);
        }

        // ─── PUT ──────────────────────────────────────────────────────────────
        // Solo Admin puede editar cuadrantes

        [HttpPut("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Put(int id, Cuadrante cuadrante)
        {
            if (id != cuadrante.ID_Cuadrante) return BadRequest();
            _context.Entry(cuadrante).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ─── DELETE ───────────────────────────────────────────────────────────
        // Solo Admin puede eliminar cuadrantes

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrador")]
        public async Task<IActionResult> Delete(int id)
        {
            var cuadrante = await _context.Cuadrantes.FindAsync(id);
            if (cuadrante == null) return NotFound();

            _context.Cuadrantes.Remove(cuadrante);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        // ─── Helper ───────────────────────────────────────────────────────────

        private async Task<int?> GetCuadranteDelUsuarioAsync()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId)) return null;

            // Obtiene el cuadrante del agente vinculado al usuario
            return await _context.UsuariosSistema
                .AsNoTracking()
                .Where(u => u.ID_Usuario == userId && u.ID_Agente != null)
                .Select(u => u.Agente!.ID_Cuadrante)
                .FirstOrDefaultAsync();
        }
    }
}
