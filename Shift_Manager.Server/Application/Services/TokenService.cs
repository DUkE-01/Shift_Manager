using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

using Shift_Manager.Server.Configuration;
using Shift_Manager.Server.Domain.Entities;
using Shift_Manager.Server.Infrastructure.Context;

namespace Shift_Manager.Server.Application.Services;

// ─── Contract ─────────────────────────────────────────────────────────────────

public interface ITokenService
{
    string GenerateAccessToken(UsuarioSistema usuario);
    string GenerateRefreshToken();
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
    Task<bool> ValidateRefreshTokenAsync(int userId, string refreshToken);
    Task RevokeAllRefreshTokensAsync(int userId);
    string HashToken(string token);
}

// ─── Implementation ───────────────────────────────────────────────────────────

/// <summary>
/// Handles JWT access token creation and secure refresh token lifecycle.
/// Uses <see cref="JwtOptions"/> (strongly typed) instead of reading
/// IConfiguration with magic strings.
/// </summary>
public sealed class TokenService(
    IOptions<JwtOptions> jwtOptions,
    ShiftManagerDbContext db,
    ILogger<TokenService> logger) : ITokenService
{
    private readonly JwtOptions _jwt = jwtOptions.Value;

    // ── Access token ──────────────────────────────────────────────────────────

    public string GenerateAccessToken(UsuarioSistema usuario)
    {
        var key = GetSigningKey();
        var claims = BuildClaims(usuario);

        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwt.AccessTokenExpiryMinutes),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // ── Refresh token ─────────────────────────────────────────────────────────

    public string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        RandomNumberGenerator.Fill(bytes);
        return Convert.ToBase64String(bytes);
    }

    public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var validationParams = new TokenValidationParameters
        {
            ValidateAudience = false,
            ValidateIssuer = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = GetSigningKey(),
            ValidateLifetime = false // Intentional: caller validates expiry separately
        };

        try
        {
            var principal = new JwtSecurityTokenHandler()
                .ValidateToken(token, validationParams, out var securityToken);

            if (securityToken is not JwtSecurityToken jwt ||
                !jwt.Header.Alg.Equals(
                    SecurityAlgorithms.HmacSha256,
                    StringComparison.OrdinalIgnoreCase))
            {
                logger.LogWarning("Token with invalid algorithm detected");
                return null;
            }

            return principal;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error validating expired token");
            return null;
        }
    }

    public async Task<bool> ValidateRefreshTokenAsync(int userId, string refreshToken)
    {
        var hashed = HashToken(refreshToken);
        var stored = await db.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.UsuarioId == userId && rt.Token == hashed);

        if (stored is null)
        {
            logger.LogWarning("Refresh token not found for user {UserId}", userId);
            return false;
        }

        if (stored.Expiration < DateTime.UtcNow)
        {
            logger.LogWarning("Refresh token expired for user {UserId}", userId);
            await db.RefreshTokens
                .Where(rt => rt.UsuarioId == userId)
                .ExecuteDeleteAsync();
            return false;
        }

        return true;
    }

    public async Task RevokeAllRefreshTokensAsync(int userId)
    {
        await db.RefreshTokens
            .Where(rt => rt.UsuarioId == userId)
            .ExecuteDeleteAsync();

        logger.LogInformation("Refresh tokens revoked for user {UserId}", userId);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private SymmetricSecurityKey GetSigningKey()
    {
        if (string.IsNullOrWhiteSpace(_jwt.Key))
            throw new InvalidOperationException(
                "JWT signing key is not configured. Set the JWT__KEY environment variable.");

        return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key));
    }

    private static IEnumerable<Claim> BuildClaims(UsuarioSistema usuario) =>
    [
        new(ClaimTypes.NameIdentifier, usuario.ID_Usuario.ToString()),
        new(ClaimTypes.Name, usuario.Username),
        new(ClaimTypes.Role, usuario.Rol),
        new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        new(JwtRegisteredClaimNames.Iat,
            DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(),
            ClaimValueTypes.Integer64)
    ];

    /// <summary>
    /// Refresh tokens are stored hashed (SHA-256) so a DB leak doesn't expose raw tokens.
    /// </summary>
    public string HashToken(string token)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(hash);
    }
}
