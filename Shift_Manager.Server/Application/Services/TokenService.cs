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

public sealed class TokenService(
    IOptions<JwtOptions> jwtOptions,
    ShiftManagerDbContext db,
    ILogger<TokenService> logger) : ITokenService
{
    private readonly JwtOptions _jwt = jwtOptions.Value;

    // TODOS los métodos implementados
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
            ValidateAudience = true,
            ValidateIssuer = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = GetSigningKey(),
            ValidIssuer = _jwt.Issuer,
            ValidAudience = _jwt.Audience,
            ValidateLifetime = false
        };
        try
        {
            var principal = new JwtSecurityTokenHandler()
                .ValidateToken(token, validationParams, out _);
            return principal;
        }
        catch
        {
            return null;
        }
    }

    public async Task<bool> ValidateRefreshTokenAsync(int userId, string refreshToken)
    {
        var hashed = HashToken(refreshToken);
        var stored = await db.RefreshTokens
            .AsNoTracking()
            .FirstOrDefaultAsync(rt => rt.UsuarioId == userId && rt.Token == hashed);
        return stored != null && stored.Expiration > DateTime.UtcNow && stored.Revoked == null;
    }

    public async Task RevokeAllRefreshTokensAsync(int userId)
    {
        await db.RefreshTokens
            .Where(rt => rt.UsuarioId == userId)
            .ExecuteDeleteAsync();
        logger.LogInformation("Tokens revocados para usuario {UserId}", userId);
    }

    public string HashToken(string token)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(hash);
    }

    private SymmetricSecurityKey GetSigningKey() =>
        new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key));

    private static IEnumerable<Claim> BuildClaims(UsuarioSistema usuario) => [
        new(ClaimTypes.NameIdentifier, usuario.ID_Usuario.ToString()),
        new(ClaimTypes.Name, usuario.Username),
        new(ClaimTypes.Role, usuario.Rol ?? "User"),
        new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
    ];
}
