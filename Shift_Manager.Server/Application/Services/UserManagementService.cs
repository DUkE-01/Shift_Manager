using Shift_Manager.Server.Application.Interfaces;
using Shift_Manager.Server.Domain.Entities;
using Shift_Manager.Server.Infrastructure.Context;

namespace Shift_Manager.Server.Application.Services
{
    public class UserManagementService(ShiftManagerDbContext db) : IUserManagementService
    {
        public async Task<UsuarioSistema> CreateUserAsync(string username, string password, string rol, int? agenteId)
        {
            // Hash password automáticamente
            var hash = BCrypt.Net.BCrypt.HashPassword(password);

            var user = new UsuarioSistema
            {
                Username = username,
                PasswordHash = hash,
                Rol = rol,
                ID_Agente = agenteId,
                Activo = true,
                FechaCreacion = DateTime.UtcNow
            };

            db.UsuariosSistema.Add(user);
            await db.SaveChangesAsync();
            return user;
        }

        public async Task<bool> ChangePasswordAsync(int userId, string newPassword)
        {
            var user = await db.UsuariosSistema.FindAsync(userId);
            if (user == null) return false;

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            await db.SaveChangesAsync();
            return true;
        }

        public async Task DeactivateUserAsync(int userId)
        {
            var user = await db.UsuariosSistema.FindAsync(userId);
            if (user != null)
            {
                user.Activo = false;
                await db.SaveChangesAsync();
            }
        }
    }
}
