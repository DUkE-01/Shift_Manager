using Shift_Manager.Server.Domain.Entities;

namespace Shift_Manager.Server.Application.Interfaces
{
    public interface IUserManagementService
    {
        Task<UsuarioSistema> CreateUserAsync(string username, string password, string rol, int? agenteId);
        Task<bool> ChangePasswordAsync(int userId, string newPassword);
        Task DeactivateUserAsync(int userId);
    }
}
