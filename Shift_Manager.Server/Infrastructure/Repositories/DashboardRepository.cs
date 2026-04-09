using Microsoft.EntityFrameworkCore;

using Shift_Manager.Server.Application.DTOs.Agentes;
using Shift_Manager.Server.Application.DTOs.Dashboard;
using Shift_Manager.Server.Application.DTOs.Turnos;
using Shift_Manager.Server.Application.Interfaces;
using Shift_Manager.Server.Infrastructure.Context;

namespace Shift_Manager.Server.Infrastructure.Repositories
{
    public class DashboardRepository : IDashboardRepository
    {
        private readonly ShiftManagerDbContext _context;

        public DashboardRepository(ShiftManagerDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardStatsDTO> GetEstadisticasAsync()
        {
            var hoy = DateOnly.FromDateTime(DateTime.Today);

            return new DashboardStatsDTO
            {
                TotalAgentes = await _context.Agentes.CountAsync(),

                TurnosHoy = await _context.Horarios
                    .Where(h => h.Fecha == hoy)
                    .CountAsync(),

                CuadrantesActivos = await _context.Cuadrantes.CountAsync(),

                HorariosActivos = await _context.Horarios
                    .Where(h => h.Estado == "Activo")
                    .CountAsync()
            };
        }

        public async Task<IEnumerable<TurnoHoyDTO>> GetTurnosHoyAsync()
        {
            var hoy = DateOnly.FromDateTime(DateTime.Today);

            return await _context.Horarios
                .Where(h => h.Fecha == hoy)
                .Include(h => h.Turno)
                .Include(h => h.Cuadrante)
                .Select(h => new TurnoHoyDTO
                {
                    Agente = h.Turno.Agente.Nombre,
                    Cuadrante = h.Cuadrante.Nombre,
                    Turno = h.TipoTurno,
                    HoraInicio = h.HoraInicio,
                    HoraFin = h.HoraFin
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<AgenteActivoDTO>> GetAgentesActivosAsync()
        {
            return await _context.Agentes
                .Include(a => a.Cuadrante)
                .Select(a => new AgenteActivoDTO
                {
                    IdAgente = a.ID_Agente.ToString(),
                    Nombre = a.Nombre,
                    Cuadrante = a.Cuadrante.Nombre
                })
                .ToListAsync();
        }
    }
}
