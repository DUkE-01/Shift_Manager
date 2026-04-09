using Shift_Manager.Server.Application.DTOs.Agentes;
using Shift_Manager.Server.Application.DTOs.Dashboard;
using Shift_Manager.Server.Application.DTOs.Turnos;

namespace Shift_Manager.Server.Application.Interfaces
{
    public interface IDashboardRepository
    {
        Task<DashboardStatsDTO> GetEstadisticasAsync();

        Task<IEnumerable<TurnoHoyDTO>> GetTurnosHoyAsync();

        Task<IEnumerable<AgenteActivoDTO>> GetAgentesActivosAsync();
    }
}
