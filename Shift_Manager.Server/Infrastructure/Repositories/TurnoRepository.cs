using Microsoft.EntityFrameworkCore;

using Shift_Manager.Server.Application.Interfaces;
using Shift_Manager.Server.Domain.Entities;
using Shift_Manager.Server.Infrastructure.Context;

namespace Shift_Manager.Server.Infrastructure.Repositories
{
    public class TurnoRepository : ITurnoRepository
    {
        private readonly ShiftManagerDbContext _context;

        public TurnoRepository(ShiftManagerDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Turno>> GetAllAsync()
        {
            return await _context.Turnos
                .Include(t => t.Agente)
                .Include(t => t.Cuadrante)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Turno?> GetByIdAsync(int id)
        {
            return await _context.Turnos
                .Include(t => t.Agente)
                .Include(t => t.Cuadrante)
                .FirstOrDefaultAsync(t => t.ID_Turno == id);
        }

        public async Task<IEnumerable<Turno>> GetByAgenteAsync(int agenteId)
        {
            return await _context.Turnos
                .Where(t => t.ID_Agente == agenteId)
                .Include(t => t.Cuadrante)
                .ToListAsync();
        }

        public async Task<IEnumerable<Turno>> GetByCuadranteAsync(int cuadranteId)
        {
            return await _context.Turnos
                .Where(t => t.ID_Cuadrante == cuadranteId)
                .Include(t => t.Agente)
                .ToListAsync();
        }

        public async Task AddAsync(Turno turno)
        {
            await _context.Turnos.AddAsync(turno);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Turno turno)
        {
            _context.Turnos.Update(turno);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var turno = await _context.Turnos.FindAsync(id);

            if (turno != null)
            {
                _context.Turnos.Remove(turno);
                await _context.SaveChangesAsync();
            }
        }
    }
}
