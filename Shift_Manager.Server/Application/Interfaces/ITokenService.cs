using System.Security.Claims;

using Shift_Manager.Server.Domain.Entities;

namespace Shift_Manager.Server.Application.Services;

public interface ITokenService
{
    string GenerateAccessToken(UsuarioSistema usuario);
    string GenerateRefreshToken();
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
    Task<bool> ValidateRefreshTokenAsync(int userId, string refreshToken);
    Task RevokeAllRefreshTokensAsync(int userId);
    string HashToken(string token);
}
