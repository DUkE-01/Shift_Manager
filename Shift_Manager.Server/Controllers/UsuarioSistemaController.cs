using System.Security.Claims;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using Shift_Manager.Server.Application.DTOs.Usuarios;
using Shift_Manager.Server.Domain.Entities;
using Shift_Manager.Server.Infrastructure.Context;

namespace Shift_Manager.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Administrador")] 
    public class UsuarioSistemaController : ControllerBase
    {
        private readonly ShiftManagerDbContext _context;

        public UsuarioSistemaController(ShiftManagerDbContext context)
        {
            _context = context;
        }

        // ─── GET ─────────────────────────────────────────────

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] int? agenteId)
        {
            var query = _context.UsuariosSistema
                .Include(u => u.Agente)
                .AsNoTracking()
                .AsQueryable();

            if (agenteId.HasValue)
            {
                query = query.Where(u => u.ID_Agente == agenteId);
            }

            var usuarios = await query
                .Select(u => new
                {
                    u.ID_Usuario,
                    u.Username,
                    u.Rol,
                    u.Activo,
                    u.ID_Agente,
                    AgenteNombre = u.Agente != null
                        ? $"{u.Agente.Nombre} {u.Agente.Apellido}"
                        : null
                })
                .ToListAsync();

            return Ok(usuarios);
        }

        // ─── GET ME ──────────────────────────────────────────

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            var usuario = await _context.UsuariosSistema
                .AsNoTracking()
                .Where(u => u.ID_Usuario == userId)
                .Select(u => new
                {
                    u.ID_Usuario,
                    u.Username,
                    u.Rol,
                    u.Activo
                })
                .FirstOrDefaultAsync();

            return usuario != null ? Ok(usuario) : NotFound();
        }

        // ─── POST ────────────────────────────────────────────

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] CreateUsuarioDto dto)
        {
            
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest(new { error = "Username y Password son obligatorios." });

            
            if (await _context.UsuariosSistema.AnyAsync(u => u.Username == dto.Username))
                return BadRequest(new { error = "El usuario ya existe." });

            
            var nuevoUsuario = new UsuarioSistema
            {
                Username = dto.Username,
                
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Rol = dto.Rol,
                ID_Agente = dto.IdAgente,
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            };

            _context.UsuariosSistema.Add(nuevoUsuario);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Usuario creado", id = nuevoUsuario.ID_Usuario });
        }

        // ─── PUT ─────────────────────────────────────────────

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] UsuarioSistema usuario)
        {
            if (id != usuario.ID_Usuario)
                return BadRequest();

            var existing = await _context.UsuariosSistema.FindAsync(id);

            if (existing == null)
                return NotFound();

            existing.Username = usuario.Username;
            existing.Rol = usuario.Rol;
            existing.Activo = usuario.Activo;
            existing.ID_Agente = usuario.ID_Agente;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // ─── DELETE ──────────────────────────────────────────

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var usuario = await _context.UsuariosSistema.FindAsync(id);

            if (usuario == null)
                return NotFound();

            _context.UsuariosSistema.Remove(usuario);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
