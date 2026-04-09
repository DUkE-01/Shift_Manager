using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using Shift_Manager.Server.Infrastructure.Context;

namespace Shift_Manager.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RefreshTokensController : ControllerBase
    {
        private readonly ShiftManagerDbContext _context;

        public RefreshTokensController(ShiftManagerDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var tokens = await _context.RefreshTokens
                .Include(t => t.Usuario)
                .ToListAsync();

            return Ok(tokens);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var token = await _context.RefreshTokens.FindAsync(id);

            if (token == null)
                return NotFound();

            _context.RefreshTokens.Remove(token);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}