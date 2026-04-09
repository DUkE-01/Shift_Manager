using Microsoft.EntityFrameworkCore;

using Shift_Manager.Server.Application.DTOs.Dashboard;
using Shift_Manager.Server.Application.Interfaces;
using Shift_Manager.Server.Domain.Entities;
using Shift_Manager.Server.Infrastructure.Context;

namespace Shift_Manager.Server.Infrastructure.Repositories
{
    public class HorarioRepository : IHorarioRepository
    {
        private readonly ShiftManagerDbContext _context;

        public HorarioRepository(ShiftManagerDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Horario>> GetAllAsync()
        {
            return await _context.Horarios
                .Include(h => h.Turno)
                .Include(h => h.Cuadrante)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Horario?> GetByIdAsync(int id)
        {
            return await _context.Horarios
                .Include(h => h.Turno)
                .Include(h => h.Cuadrante)
                .FirstOrDefaultAsync(h => h.IdHorario == id);
        }

        // Busca por Codigo_Agente (string) como esta en la DB
        public async Task<IEnumerable<Horario>> GetByAgenteAsync(int idAgente)
        {
            // Primero obtenemos el codigo del agente
            var agente = await _context.Agentes
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.ID_Agente == idAgente);

            if (agente == null) return Enumerable.Empty<Horario>();

            return await _context.Horarios
                .Where(h => h.IdAgente == agente.Codigo_Agente)
                .Include(h => h.Turno)
                .Include(h => h.Cuadrante)
                .ToListAsync();
        }

        public async Task<IEnumerable<Horario>> GetByCuadranteAsync(int idCuadrante)
        {
            return await _context.Horarios
                .Where(h => h.IdCuadrante == idCuadrante)
                .Include(h => h.Turno)
                .Include(h => h.Cuadrante)
                .ToListAsync();
        }

        public async Task<IEnumerable<Horario>> GetByFechaAsync(DateOnly fecha)
        {
            return await _context.Horarios
                .Where(h => h.Fecha == fecha)
                .Include(h => h.Turno)
                .Include(h => h.Cuadrante)
                .ToListAsync();
        }

        public async Task<IEnumerable<Horario>> GetByRangoFechasAsync(DateOnly inicio, DateOnly fin)
        {
            return await _context.Horarios
                .Where(h => h.Fecha >= inicio && h.Fecha <= fin)
                .Include(h => h.Turno)
                .Include(h => h.Cuadrante)
                .ToListAsync();
        }

        public async Task<IEnumerable<Horario>> GetHorariosHoyAsync()
        {
            var hoy = DateOnly.FromDateTime(DateTime.Today);
            return await _context.Horarios
                .Where(h => h.Fecha == hoy)
                .Include(h => h.Turno)
                .Include(h => h.Cuadrante)
                .ToListAsync();
        }

        public async Task<PagedResultDTO<Horario>> GetPagedAsync(int page)
        {
            int pageSize = 20;
            var query = _context.Horarios
                .Include(h => h.Cuadrante)
                .Include(h => h.Turno)
                .AsNoTracking()
                .OrderByDescending(h => h.Fecha)
                .ThenByDescending(h => h.HoraInicio);

            var totalRecords = await query.CountAsync();
            var data = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResultDTO<Horario>
            {
                Page         = page,
                PageSize     = pageSize,
                TotalRecords = totalRecords,
                TotalPages   = (int)Math.Ceiling((double)totalRecords / pageSize),
                Data         = data
            };
        }

        public async Task AddAsync(Horario horario)
        {
            horario.FechaCreacion = DateTime.Now;
            await _context.Horarios.AddAsync(horario);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Horario horario)
        {
            horario.FechaModificacion = DateTime.Now;
            _context.Horarios.Update(horario);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var horario = await _context.Horarios.FindAsync(id);
            if (horario != null)
            {
                _context.Horarios.Remove(horario);
                await _context.SaveChangesAsync();
            }
        }
    }
}
