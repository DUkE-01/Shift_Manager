using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shift_Manager.Server.Application.DTOs.Auth;
using Shift_Manager.Server.Application.Services;
using Shift_Manager.Server.Application.DTOs;
using Shift_Manager.Server.Infrastructure.Context;

using System.Security.Claims;
using BCrypt.Net;
using Shift_Manager.Server.Domain.Entities;

namespace Shift_Manager.Server.Controllers;

/// <summary>
/// Handles authentication: login, token refresh, and logout.
/// Kept thin — all token logic lives in <see cref="ITokenService"/>.
/// </summary>
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
            // AsNoTracking + filter active only — never reveal whether account exists
            var usuario = await db.UsuariosSistema
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Username == username && u.Activo);

            if (usuario is null || !BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash))
            {
                logger.LogWarning("Failed login attempt for username: {Username}", username);
                return Unauthorized(new { error = "Credenciales inválidas." });
            }

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

            return Ok(new LoginResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                Expiracion = DateTime.UtcNow.AddMinutes(15),
                Username = usuario.Username,
                Rol = usuario.Rol
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Internal error during login for user: {Username}", username);
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }

    // ─── POST /api/auth/refresh ───────────────────────────────────────────────

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken) || string.IsNullOrWhiteSpace(request.AccessToken))
            return BadRequest(new { error = "Access token y refresh token requeridos." });

        try
        {
            var principal = tokenService.GetPrincipalFromExpiredToken(request.AccessToken);
            var userIdClaim = principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { error = "Access token inválido." });

            var isValid = await tokenService.ValidateRefreshTokenAsync(userId, request.RefreshToken);
            if (!isValid)
                return Unauthorized(new { error = "Refresh token inválido o expirado." });

            // Revoke existing tokens for user and issue new ones
            await tokenService.RevokeAllRefreshTokensAsync(userId);

            var usuario = await db.UsuariosSistema.FindAsync(userId);
            if (usuario is null) return Unauthorized(new { error = "Usuario no encontrado." });

            var newAccessToken = tokenService.GenerateAccessToken(usuario);
            var newRefreshToken = tokenService.GenerateRefreshToken();

            db.RefreshTokens.Add(new RefreshToken
            {
                Token = tokenService.HashToken(newRefreshToken),
                UsuarioId = userId,
                Expiration = DateTime.UtcNow.AddDays(7),
                Created = DateTime.UtcNow
            });

            await db.SaveChangesAsync();

            return Ok(new { accessToken = newAccessToken, refreshToken = newRefreshToken });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error refreshing token");
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
            return Ok(new { message = "Sesión cerrada correctamente." });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error during logout for user {UserId}", userId);
            return StatusCode(500, new { error = "Error interno del servidor." });
        }
    }
}
