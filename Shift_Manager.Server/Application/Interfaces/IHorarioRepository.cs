using Shift_Manager.Server.Application.DTOs.Dashboard;
using Shift_Manager.Server.Domain.Entities;

namespace Shift_Manager.Server.Application.Interfaces
{
    public interface IHorarioRepository
    {
        Task<IEnumerable<Horario>> GetAllAsync();

        Task<Horario?> GetByIdAsync(int id);

        Task<IEnumerable<Horario>> GetByAgenteAsync(int idAgente);

        Task<IEnumerable<Horario>> GetByCuadranteAsync(int idCuadrante);

        Task<IEnumerable<Horario>> GetByFechaAsync(DateOnly fecha);

        Task<IEnumerable<Horario>> GetByRangoFechasAsync(DateOnly inicio, DateOnly fin);

        Task<IEnumerable<Horario>> GetHorariosHoyAsync();

        Task<PagedResultDTO<Horario>> GetPagedAsync(int page);
        Task AddAsync(Horario horario);

        Task UpdateAsync(Horario horario);

        Task DeleteAsync(int id);
    }
}
