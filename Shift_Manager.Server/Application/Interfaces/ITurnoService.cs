using Shift_Manager.Server.Application.DTOs.Turnos;
using Shift_Manager.Server.Extensions;

namespace Shift_Manager.Server.Application.Interfaces
{
    public interface ITurnoService
    {
        Task<PagedResult<TurnoDto>> GetPagedAsync(int page, int pageSize);

        Task<TurnoDto?> GetByIdAsync(int id);

        Task<IEnumerable<TurnoDto>> GetByAgenteAsync(int agenteId);

        Task<IEnumerable<TurnoDto>> GetByCuadranteAsync(int cuadranteId);

        Task<TurnoDto> CreateOrUpdateForDayAsync(CrearTurnoDto dto);

        Task<IEnumerable<TurnoDto>> CreateBatchAsync(List<CrearTurnoDto> dto);

        Task<TurnoDto> UpdateAsync(int id, ActualizarTurnoDto dto);

        Task DeleteAsync(int id, string? requesterRole = null, int? requesterAgenteId = null);
    }
}
