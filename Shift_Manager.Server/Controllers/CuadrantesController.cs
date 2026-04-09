using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using Shift_Manager.Server.Domain.Entities;
using Shift_Manager.Server.Infrastructure.Context;

namespace Shift_Manager.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CuadrantesController : ControllerBase
    {
        private readonly ShiftManagerDbContext _context;

        public CuadrantesController(ShiftManagerDbContext context)
        {
            _context = context;
        }

        // GET
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var cuadrantes = await _context.Cuadrantes
                .Include(c => c.Agentes)
                .AsNoTracking()
                .ToListAsync();

            return Ok(cuadrantes);
        }

        // GET by id
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var cuadrante = await _context.Cuadrantes
                .Include(c => c.Agentes)
                .FirstOrDefaultAsync(c => c.ID_Cuadrante == id);

            if (cuadrante == null)
                return NotFound();

            return Ok(cuadrante);
        }

        // POST
        [HttpPost]
        public async Task<IActionResult> Post(Cuadrante cuadrante)
        {
            _context.Cuadrantes.Add(cuadrante);
            await _context.SaveChangesAsync();

            return Ok(cuadrante);
        }

        // PUT
        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, Cuadrante cuadrante)
        {
            if (id != cuadrante.ID_Cuadrante)
                return BadRequest();

            _context.Entry(cuadrante).State = EntityState.Modified;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var cuadrante = await _context.Cuadrantes.FindAsync(id);

            if (cuadrante == null)
                return NotFound();

            _context.Cuadrantes.Remove(cuadrante);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
