using System.Security.Claims;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using Shift_Manager.Server.Infrastructure.Context;

namespace Shift_Manager.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Administrador")]
    public class RefreshTokensController : ControllerBase
    {
        private readonly ShiftManagerDbContext _context;
        private readonly ILogger<RefreshTokensController> _logger;

        public RefreshTokensController(ShiftManagerDbContext context, ILogger<RefreshTokensController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized();

            var tokens = await _context.RefreshTokens
                .Where(t => t.UsuarioId == userId)
                .Select(t => new
                {
                    t.Id,
                    t.Created,
                    t.Expiration,
                    IsActive = t.IsActive,
                    IsExpired = t.IsExpired
                    
                })
                .OrderByDescending(t => t.Created)
                .ToListAsync();

            return Ok(tokens);
        }



        [Authorize(Roles = "Administrador")]
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserTokens(int userId)
        {
            var tokens = await _context.RefreshTokens
                .Where(t => t.UsuarioId == userId)
                .Include(t => t.Usuario) // Solo para admins
                .OrderByDescending(t => t.Created)
                .ToListAsync();

            return Ok(tokens);
        }


        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
            var token = await _context.RefreshTokens
                .FirstOrDefaultAsync(t => t.Id == id && t.UsuarioId == userId);

            if (token == null) return NotFound();

            _context.RefreshTokens.Remove(token);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Usuario {UserId} eliminó su token {TokenId}", userId, id);
            return NoContent();
        }
    }
}
