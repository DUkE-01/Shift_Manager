using Shift_Manager.Server.Application.DTOs.Agentes;
using Shift_Manager.Server.Application.DTOs.Dashboard;
using Shift_Manager.Server.Application.DTOs.Turnos;

namespace Shift_Manager.Server.Application.Interfaces
{
    public interface IDashboardRepository
    {
        Task<DashboardStatsDTO> GetEstadisticasAsync(int? circunscripcion = null);

        Task<IEnumerable<TurnoHoyDTO>> GetTurnosHoyAsync(int? circunscripcion = null);

        Task<IEnumerable<AgenteActivoDTO>> GetAgentesActivosAsync(int? circunscripcion = null);
    }
}
