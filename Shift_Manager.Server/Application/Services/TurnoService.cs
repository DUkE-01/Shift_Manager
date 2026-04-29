using Microsoft.EntityFrameworkCore;

using Shift_Manager.Server.Application.DTOs.Turnos;
using Shift_Manager.Server.Application.Interfaces;
using Shift_Manager.Server.Domain.Common.Exceptions;
using Shift_Manager.Server.Domain.Entities;
using Shift_Manager.Server.Extensions;
using Shift_Manager.Server.Domain.Common.Helpers;
using Shift_Manager.Server.Infrastructure.Context;

namespace Shift_Manager.Server.Application.Services
{
    public class TurnoService : ITurnoService
    {
        private readonly ITurnoRepository _turnoRepository;
        private readonly IHorarioRepository _horarioRepository;
        private readonly IGenericRepository<Agente> _agenteRepository;
        private readonly ILogger<TurnoService> _logger;
        private readonly INotificationService _notificationService;

        public TurnoService(
            ITurnoRepository turnoRepository, 
            IHorarioRepository horarioRepository,
            IGenericRepository<Agente> agenteRepository,
            ILogger<TurnoService> logger,
            INotificationService notificationService)
        {
            _turnoRepository = turnoRepository;
            _horarioRepository = horarioRepository;
            _agenteRepository = agenteRepository;
            _logger = logger;
            _notificationService = notificationService;
        }

        public async Task<TurnoDto> CreateOrUpdateForDayAsync(CrearTurnoDto dto)
        {
            if (dto.ID_Agente <= 0)
                throw new BusinessRuleException("AgenteId inválido.");

            // Validación de jurisdicción
            if (dto.RequesterRole == "Supervisor")
            {
                if (dto.RequesterAgenteId == null)
                    throw new BusinessRuleException("ID del agente solicitante requerido.");

                var supervisor = await _agenteRepository.GetByIdAsync(dto.RequesterAgenteId.Value);
                var targetAgente = await _agenteRepository.GetByIdAsync(dto.ID_Agente);

                if (supervisor == null || targetAgente == null)
                    throw new BusinessRuleException("Supervisor o Agente no encontrado.");

                var supervisorCirc = CuadranteMapping.GetCircunscripcion(supervisor.ID_Cuadrante);
                var targetCirc = CuadranteMapping.GetCircunscripcion(targetAgente.ID_Cuadrante);

                if (supervisorCirc != targetCirc)
                    throw new BusinessRuleException("Jurisdicción inválida.");
            }

            if (dto.FechaProgramadaInicio.Date < DateTime.UtcNow.Date.AddDays(-1))
                throw new BusinessRuleException("No se permiten turnos con más de 1 día de antigüedad.");

            var existingTurnos = await _turnoRepository.GetByAgenteAsync(dto.ID_Agente);
            var existing = existingTurnos.FirstOrDefault(t =>
                t.FechaProgramadaInicio.Date == dto.FechaProgramadaInicio.Date);

            var turno = existing ?? new Turno();

            turno.UpdateFromDto(dto);
            turno.CreatedByRole = dto.RequesterRole ?? "Sistema";

            if (existing is null)
                await _turnoRepository.AddAsync(turno);
            else
                await _turnoRepository.UpdateAsync(turno);

            await SyncWithHorariosAsync(turno, dto.TipoTurno);

            // ✅ Notificación centralizada
            await _notificationService.NotifyShiftAssignmentAsync(turno);

            return turno.ToDto();
        }

        public async Task<TurnoDto> UpdateAsync(int id, ActualizarTurnoDto dto)
        {
            var turno = await _turnoRepository.GetByIdAsync(id)
                ?? throw new NotFoundException($"Turno {id} no encontrado");

            turno.UpdateFromDto(dto);

            await _turnoRepository.UpdateAsync(turno);
            await SyncWithHorariosAsync(turno);

            // ✅ Notificación centralizada
            await _notificationService.NotifyShiftAssignmentAsync(turno);

            return turno.ToDto();
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
                    _logger.LogWarning(ex,
                        "Error procesando turno batch para agente {AgenteId} en {Fecha}",
                        dto.ID_Agente, dto.FechaProgramadaInicio);
                }
            }

            return results;
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
                horario.TipoTurno = tipoTurno ?? horario.TipoTurno ?? "diurno";
                horario.Estado = turno.Estado ?? "Activo";

                if (horario.IdHorario == 0)
                    await _horarioRepository.AddAsync(horario);
                else
                    await _horarioRepository.UpdateAsync(horario);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sincronizando turno {TurnoId}", turno.ID_Turno);
            }
        }
    }
}