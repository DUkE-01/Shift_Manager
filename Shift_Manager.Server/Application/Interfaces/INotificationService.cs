using System.Threading.Tasks;
using Shift_Manager.Server.Domain.Entities;

namespace Shift_Manager.Server.Application.Interfaces
{
    public interface INotificationService
    {
        Task NotifyShiftAssignmentAsync(Turno turno);
        Task SendNotificationAsync(int idAgente, string titulo, string mensaje, string tipo, int? referenciaId = null);
    }
}
