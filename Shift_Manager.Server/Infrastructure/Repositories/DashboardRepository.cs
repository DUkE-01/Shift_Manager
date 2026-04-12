using Microsoft.EntityFrameworkCore;

using Shift_Manager.Server.Application.DTOs.Agentes;
using Shift_Manager.Server.Application.DTOs.Dashboard;
using Shift_Manager.Server.Application.DTOs.Turnos;
using Shift_Manager.Server.Application.Interfaces;
using Shift_Manager.Server.Infrastructure.Context;
using Shift_Manager.Server.Domain.Common.Helpers;

namespace Shift_Manager.Server.Infrastructure.Repositories
{
    public class DashboardRepository : IDashboardRepository
    {
        private readonly ShiftManagerDbContext _context;

        public DashboardRepository(ShiftManagerDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardStatsDTO> GetEstadisticasAsync(int? circunscripcion = null)
        {
            var hoy = DateOnly.FromDateTime(DateTime.Today);
            
            var agentesQuery = _context.Agentes.AsQueryable();
            var horariosQuery = _context.Horarios.AsQueryable();
            var cuadrantesQuery = _context.Cuadrantes.AsQueryable();

            if (circunscripcion.HasValue)
            {
                var idsValidos = CuadranteMapping.GetCuadrantesByCircunscripcion(circunscripcion.Value).ToList();
                agentesQuery = agentesQuery.Where(a => idsValidos.Contains(a.ID_Cuadrante));
                horariosQuery = horariosQuery.Where(h => idsValidos.Contains(h.IdCuadrante));
                cuadrantesQuery = cuadrantesQuery.Where(c => idsValidos.Contains(c.ID_Cuadrante));
            }

            return new DashboardStatsDTO
            {
                TotalAgentes = await agentesQuery.CountAsync(),

                TurnosHoy = await horariosQuery
                    .Where(h => h.Fecha == hoy)
                    .CountAsync(),

                CuadrantesActivos = await cuadrantesQuery.CountAsync(),

                HorariosActivos = await horariosQuery
                    .Where(h => h.Estado == "Activo")
                    .CountAsync()
            };
        }

        public async Task<IEnumerable<TurnoHoyDTO>> GetTurnosHoyAsync(int? circunscripcion = null)
        {
            var hoy = DateOnly.FromDateTime(DateTime.Today);
            var query = _context.Horarios.Where(h => h.Fecha == hoy);

            if (circunscripcion.HasValue)
            {
                var idsValidos = CuadranteMapping.GetCuadrantesByCircunscripcion(circunscripcion.Value).ToList();
                query = query.Where(h => idsValidos.Contains(h.IdCuadrante));
            }

            return await query
                .Include(h => h.Turno)
                .Include(h => h.Cuadrante)
                .Select(h => new TurnoHoyDTO
                {
                    Agente = h.Turno!.Agente!.Nombre!,
                    Cuadrante = h.Cuadrante!.Nombre,
                    Turno = h.TipoTurno,
                    HoraInicio = h.HoraInicio,
                    HoraFin = h.HoraFin
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<AgenteActivoDTO>> GetAgentesActivosAsync(int? circunscripcion = null)
        {
            var query = _context.Agentes.AsQueryable();

            if (circunscripcion.HasValue)
            {
                var idsValidos = CuadranteMapping.GetCuadrantesByCircunscripcion(circunscripcion.Value).ToList();
                query = query.Where(a => idsValidos.Contains(a.ID_Cuadrante));
            }

            query = query.Where(a => a.Activo && a.Disponibilidad);

            var result = await query
                .Include(a => a.Cuadrante)
                .ToListAsync();

            return result.Select(a => new AgenteActivoDTO
            {
                IdAgente = a.ID_Agente.ToString(),
                Nombre = a.Nombre ?? "N/A",
                Cuadrante = a.Cuadrante!.Nombre,
                PuestoAsignado = a.PuestoAsignado switch
                {
                    1 => "Palacio",
                    2 => "Patrullero",
                    3 => "Puesto Fijo",
                    _ => "Patrullero"
                }
            });
        }
    }
}
