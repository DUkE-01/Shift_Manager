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
        private readonly ILogger<TurnoService> _logger;

        public TurnoService(ITurnoRepository turnoRepository, ILogger<TurnoService> logger)
        {
            _turnoRepository = turnoRepository;
            _logger = logger;
        }

        public async Task<PagedResult<TurnoDto>> GetPagedAsync(int page, int pageSize)
        {
            var allTurnos = (await _turnoRepository.GetAllAsync()).ToList();

            var total = allTurnos.Count;
            var items = allTurnos
                .OrderBy(t => t.FechaProgramadaInicio)
                .ThenBy(t => t.FechaProgramadaInicio)
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
            // Validar que el agente existe (esto debería venir del repository o servicio de agentes)
            if (dto.ID_Agente <= 0)
                throw new BusinessRuleException("AgenteId inválido.");

            if (dto.FechaProgramadaInicio < DateTime.Today)
                throw new BusinessRuleException("No se pueden crear turnos en fechas pasadas.");

            // Verificar conflicto existente
            var existingTurnos = await _turnoRepository.GetByAgenteAsync(dto.ID_Agente);
            var existing = existingTurnos.FirstOrDefault(t =>
                t.FechaProgramadaInicio.Date == dto.FechaProgramadaInicio.Date &&
                t.ID_Cuadrante == dto.ID_Cuadrante);

            var turno = existing ?? new Turno();

            turno.UpdateFromDto(dto);

            if (existing is null)
            {
                await _turnoRepository.AddAsync(turno);
            }
            else
            {
                await _turnoRepository.UpdateAsync(turno);
            }

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

            return turno.ToDto();
        }

        public async Task DeleteAsync(int id)
        {
            await _turnoRepository.DeleteAsync(id);
        }
    }
}
