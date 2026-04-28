using Microsoft.EntityFrameworkCore;

using Shift_Manager.Server.Application.DTOs.Turnos;
using Shift_Manager.Server.Application.Interfaces;
using Shift_Manager.Server.Domain.Common.Exceptions;
using Shift_Manager.Server.Domain.Entities;
using Shift_Manager.Server.Extensions;

namespace Shift_Manager.Server.Application.Services
{
    public class TurnoService : ITurnoService
    {
        private readonly ITurnoRepository _turnoRepository;
        private readonly IHorarioRepository _horarioRepository;
        private readonly ILogger<TurnoService> _logger;

        public TurnoService(ITurnoRepository turnoRepository, IHorarioRepository horarioRepository, ILogger<TurnoService> logger)
        {
            _turnoRepository = turnoRepository;
            _horarioRepository = horarioRepository;
            _logger = logger;
        }

        public async Task<PagedResult<TurnoDto>> GetPagedAsync(int page, int pageSize)
        {
            var allTurnos = (await _turnoRepository.GetAllAsync()).ToList();

            var total = allTurnos.Count;
            var items = allTurnos
                .OrderBy(t => t.FechaProgramadaInicio)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => t.ToDto())
                .ToList();

            return new PagedResult<TurnoDto>(items, total, page, pageSize);
        }

        public async Task<TurnoDto?> GetByIdAsync(int id)
        {
            var turno = await _turnoRepository.GetByIdAsync(id);
            return turno?.ToDto();
        }

        public async Task<IEnumerable<TurnoDto>> GetByAgenteAsync(int agenteId)
        {
            var turnos = await _turnoRepository.GetByAgenteAsync(agenteId);
            return turnos.Select(t => t.ToDto());
        }

        public async Task<IEnumerable<TurnoDto>> GetByCuadranteAsync(int cuadranteId)
        {
            var turnos = await _turnoRepository.GetByCuadranteAsync(cuadranteId);
            return turnos.Select(t => t.ToDto());
        }

        public async Task<TurnoDto> CreateOrUpdateForDayAsync(CrearTurnoDto dto)
        {
            if (dto.ID_Agente <= 0)
                throw new BusinessRuleException("AgenteId inválido.");

            // Permitir hasta 1 día de atraso para registros tardíos
            // Usamos UtcNow.Date para ser consistentes con la BD que es PostgreSQL timestamptz
            if (dto.FechaProgramadaInicio.Date < DateTime.UtcNow.Date.AddDays(-1))
                throw new BusinessRuleException("No se pueden crear turnos con más de 1 día de antigüedad.");

            // Buscar si el agente ya tiene un turno en esa fecha (en cualquier cuadrante)
            var existingTurnos = await _turnoRepository.GetByAgenteAsync(dto.ID_Agente);
            var existing = existingTurnos.FirstOrDefault(t => 
                t.FechaProgramadaInicio.Date == dto.FechaProgramadaInicio.Date);

            var turno = existing ?? new Turno();

            // Si ya existe pero en otro cuadrante, se actualizará al nuevo cuadrante
            turno.UpdateFromDto(dto);

            if (existing is null)
            {
                await _turnoRepository.AddAsync(turno);
            }
            else
            {
                await _turnoRepository.UpdateAsync(turno);
            }

            // Sincronizar con la tabla de Horarios para el Dashboard y Calendario
            await SyncWithHorariosAsync(turno, dto.TipoTurno);

            return turno.ToDto();
        }

        private async Task SyncWithHorariosAsync(Turno turno, string? tipoTurno = null)
        {
            try
            {
                var horarios = await _horarioRepository.GetAllAsync();
                var horario = horarios.FirstOrDefault(h => h.ID_Turno == turno.ID_Turno) ?? new Horario();

                horario.ID_Turno = turno.ID_Turno;
                horario.IdAgente = turno.ID_Agente.ToString();
                horario.IdCuadrante = turno.ID_Cuadrante;
                horario.Fecha = DateOnly.FromDateTime(turno.FechaProgramadaInicio);
                horario.HoraInicio = TimeOnly.FromDateTime(turno.FechaProgramadaInicio);
                horario.HoraFin = TimeOnly.FromDateTime(turno.FechaProgramadaFin);
                
                if (!string.IsNullOrEmpty(tipoTurno))
                    horario.TipoTurno = tipoTurno;
                else if (string.IsNullOrEmpty(horario.TipoTurno))
                    horario.TipoTurno = "diurno";

                horario.Estado = turno.Estado ?? "Activo";
                horario.Observaciones = turno.Observaciones;

                if (horario.IdHorario == 0)
                {
                    horario.FechaCreacion = DateTime.UtcNow;
                    horario.UsuarioCreacion = "System"; // Idealmente pasar el usuario actual
                    await _horarioRepository.AddAsync(horario);
                }
                else
                {
                    horario.FechaModificacion = DateTime.UtcNow;
                    horario.UsuarioModificacion = "System";
                    await _horarioRepository.UpdateAsync(horario);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sincronizando turno {TurnoId} con tabla Horarios", turno.ID_Turno);
            }
        }

        public async Task<IEnumerable<TurnoDto>> CreateBatchAsync(List<CrearTurnoDto> dtos)
        {
            var results = new List<TurnoDto>();

            foreach (var dto in dtos ?? new List<CrearTurnoDto>())
            {
                try
                {
                    var turno = await CreateOrUpdateForDayAsync(dto);
                    results.Add(turno);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error procesando turno batch para agente {AgenteId} en {Fecha}",
                        dto.ID_Agente, dto.FechaProgramadaInicio);
                    // Continúa con el siguiente
                }
            }

            return results;
        }

        public async Task<TurnoDto> UpdateAsync(int id, ActualizarTurnoDto dto)
        {
            var turno = await _turnoRepository.GetByIdAsync(id)
                ?? throw new NotFoundException($"Turno {id} no encontrado");

            turno.UpdateFromDto(dto);
            await _turnoRepository.UpdateAsync(turno);

            // Sincronizar actualización con Horarios
            await SyncWithHorariosAsync(turno);

            return turno.ToDto();
        }

        public async Task DeleteAsync(int id)
        {
            // Eliminar horario asociado primero
            var horarios = await _horarioRepository.GetAllAsync();
            var horario = horarios.FirstOrDefault(h => h.ID_Turno == id);
            if (horario != null)
            {
                await _horarioRepository.DeleteAsync(horario.IdHorario);
            }

            await _turnoRepository.DeleteAsync(id);
        }
    }
}
