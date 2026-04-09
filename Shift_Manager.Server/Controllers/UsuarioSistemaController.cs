using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using Shift_Manager.Server.Domain.Entities;
using Shift_Manager.Server.Infrastructure.Context;

namespace Shift_Manager.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsuarioSistemaController : ControllerBase
    {
        private readonly ShiftManagerDbContext _context;

        public UsuarioSistemaController(ShiftManagerDbContext context)
        {
            _context = context;
        }

        // GET
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var usuarios = await _context.UsuariosSistema
                .Include(u => u.Agente)
                .AsNoTracking()
                .ToListAsync();

            return Ok(usuarios);
        }

        // GET by id
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var usuario = await _context.UsuariosSistema
                .Include(u => u.Agente)
                .FirstOrDefaultAsync(u => u.ID_Usuario == id);

            if (usuario == null)
                return NotFound();

            return Ok(usuario);
        }

        // POST
        [HttpPost]
        public async Task<IActionResult> Post(UsuarioSistema usuario)
        {
            _context.UsuariosSistema.Add(usuario);
            await _context.SaveChangesAsync();

            return Ok(usuario);
        }

        // PUT
        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, UsuarioSistema usuario)
        {
            if (id != usuario.ID_Usuario)
                return BadRequest();

            _context.Entry(usuario).State = EntityState.Modified;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE
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
