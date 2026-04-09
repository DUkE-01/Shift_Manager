using Shift_Manager.Server.Domain.Entities;

namespace Shift_Manager.Server.Application.Interfaces
{
    public interface ITurnoRepository
    {
        Task<IEnumerable<Turno>> GetAllAsync();

        Task<Turno?> GetByIdAsync(int id);

        Task<IEnumerable<Turno>> GetByAgenteAsync(int agenteId);

        Task<IEnumerable<Turno>> GetByCuadranteAsync(int cuadranteId);

        Task AddAsync(Turno turno);

        Task UpdateAsync(Turno turno);

        Task DeleteAsync(int id);

    }
}
