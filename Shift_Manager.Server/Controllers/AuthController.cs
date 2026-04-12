using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using BCrypt.Net;
using Shift_Manager.Server.Application.DTOs.Auth;
using Shift_Manager.Server.Application.Services;
using Shift_Manager.Server.Application.DTOs;
using Shift_Manager.Server.Infrastructure.Context;
using Shift_Manager.Server.Domain.Entities;

namespace Shift_Manager.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    ShiftManagerDbContext db,
    ITokenService tokenService,
    ILogger<AuthController> logger) : ControllerBase
{
    // ─── POST /api/auth/login ─────────────────────────────────────────────────
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) ||
            string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { error = "Usuario y contraseña son obligatorios." });

        var username = request.Username.Trim();

        try
        {
            var (usuario, error) = await ValidateUserAsync(username, request.Password);

            if (usuario is null)
                return Unauthorized(new { error = error ?? "Credenciales inválidas." });

            // CreateExecutionStrategy es obligatorio con EnableRetryOnFailure
            LoginResponseDto? response = null;
            var strategy = db.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await db.Database.BeginTransactionAsync();
                try
                {
                    var accessToken = tokenService.GenerateAccessToken(usuario);
                    var refreshToken = tokenService.GenerateRefreshToken();

                    db.RefreshTokens.Add(new RefreshToken
                    {
                        Token = tokenService.HashToken(refreshToken),
                        UsuarioId = usuario.ID_Usuario,
                        Expiration = DateTime.UtcNow.AddDays(7),
                        Created = DateTime.UtcNow
                    });

                    await db.SaveChangesAsync();
                    await transaction.CommitAsync();

                    response = new LoginResponseDto
                    {
                        AccessToken = accessToken,
                        RefreshToken = refreshToken,
                        Expiracion = DateTime.UtcNow.AddMinutes(15),
                        Username = usuario.Username,
                        Rol = usuario.Rol
                    };
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            });

            logger.LogInformation("✅ Login exitoso: {Username} | ID: {UserId}",
                usuario.Username, usuario.ID_Usuario);

            return Ok(response);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "❌ Error en login");
            return StatusCode(500, new
            {
                error = ex.Message,
                inner = ex.InnerException?.Message,
                stack = ex.StackTrace
            });
        }
    }

    // ─── POST /api/auth/refresh ───────────────────────────────────────────────
    [EnableRateLimiting("refresh")]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
            return BadRequest(new { error = "Refresh token requerido." });

        try
        {
            int? userId = null;
            if (!string.IsNullOrWhiteSpace(request.AccessToken))
            {
                var (uid, _) = await ValidateAccessTokenAsync(request.AccessToken);
                userId = uid;
            }
            if (userId is null)
            {
                var hashed = tokenService.HashToken(request.RefreshToken);
                var stored = await db.RefreshTokens.AsNoTracking()
                    .FirstOrDefaultAsync(rt => rt.Token == hashed);
                if (stored != null) userId = stored.UsuarioId;
            }
            if (userId is null)
                return Unauthorized(new { error = "No se pudo identificar el usuario." });

            if (!await tokenService.ValidateRefreshTokenAsync(userId.Value, request.RefreshToken))
                return Unauthorized(new { error = "Refresh token inválido o expirado." });

            // CreateExecutionStrategy es obligatorio con EnableRetryOnFailure
            object? refreshResult = null;
            var strategy = db.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await db.Database.BeginTransactionAsync();
                try
                {
                    await tokenService.RevokeAllRefreshTokensAsync(userId.Value);

                    var usuario = await db.UsuariosSistema
                        .AsNoTracking()
                        .FirstOrDefaultAsync(u => u.ID_Usuario == userId.Value && u.Activo);

                    if (usuario is null)
                    {
                        await transaction.RollbackAsync();
                        return;
                    }

                    var newAccessToken = tokenService.GenerateAccessToken(usuario);
                    var newRefreshToken = tokenService.GenerateRefreshToken();

                    db.RefreshTokens.Add(new RefreshToken
                    {
                        Token = tokenService.HashToken(newRefreshToken),
                        UsuarioId = userId.Value,
                        Expiration = DateTime.UtcNow.AddDays(7),
                        Created = DateTime.UtcNow
                    });

                    await db.SaveChangesAsync();
                    await transaction.CommitAsync();

                    refreshResult = new { accessToken = newAccessToken, refreshToken = newRefreshToken };
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            });

            if (refreshResult is null)
                return Unauthorized(new { error = "Usuario no encontrado o inactivo." });

            logger.LogInformation("🔄 Tokens renovados para usuario {UserId}", userId.Value);
            return Ok(refreshResult);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "💥 Error renovando tokens");
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }

    // ─── POST /api/auth/logout ────────────────────────────────────────────────
    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim is null || !int.TryParse(userIdClaim.Value, out var userId))
            return Unauthorized(new { error = "Usuario no autenticado." });

        try
        {
            await tokenService.RevokeAllRefreshTokensAsync(userId);
            logger.LogInformation("🚪 Usuario {UserId} cerró sesión", userId);
            return Ok(new { message = "Sesión cerrada correctamente." });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "💥 Error durante logout para usuario {UserId}", userId);
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }

    // ─── GET /api/auth/me ─────────────────────────────────────────────────────
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim is null || !int.TryParse(userIdClaim.Value, out var userId))
            return Unauthorized(new { error = "Usuario no autenticado." });

        try
        {
            var usuario = await db.UsuariosSistema
                .AsNoTracking()
                .Where(u => u.ID_Usuario == userId && u.Activo)
                .Select(u => new
                {
                    u.ID_Usuario,
                    u.Username,
                    u.Rol,
                    u.Activo
                })
                .FirstOrDefaultAsync();

            if (usuario is null)
                return Unauthorized(new { error = "Usuario no encontrado." });

            return Ok(usuario);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "💥 Error obteniendo datos del usuario {UserId}", userId);
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }

    // ─── PRIVATE METHODS ──────────────────────────────────────────────────────

    private async Task<(UsuarioSistema? usuario, string? error)> ValidateUserAsync(
        string username, string password)
    {
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
            return (null, "Credenciales inválidas.");

        var usuario = await db.UsuariosSistema
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Username == username && u.Activo);

        if (usuario is null)
            return (null, "Credenciales inválidas.");

        if (!BCrypt.Net.BCrypt.Verify(password, usuario.PasswordHash.Trim()))
            return (null, "Credenciales inválidas.");

        return (usuario, null);
    }

    private Task<(int? userId, string? error)> ValidateAccessTokenAsync(string accessToken)
    {
        var principal = tokenService.GetPrincipalFromExpiredToken(accessToken);
        var userIdClaim = principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!int.TryParse(userIdClaim, out var userId))
        {
            logger.LogWarning("❌ Access token inválido");
            return Task.FromResult<(int? userId, string? error)>((null, "Access token inválido."));
        }

        return Task.FromResult<(int? userId, string? error)>((userId, null));
    }
}
