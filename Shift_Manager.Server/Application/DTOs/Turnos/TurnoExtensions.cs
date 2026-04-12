using Shift_Manager.Server.Domain.Entities;

namespace Shift_Manager.Server.Application.DTOs.Turnos
{
    public static class TurnoExtensions
    {
        public static TurnoDto ToDto(this Turno turno) => new()
        {
            ID_Turno = turno.ID_Turno,
            ID_Agente = turno.ID_Agente,
            ID_Cuadrante = turno.ID_Cuadrante,
            Nombre = $"Turno {turno.ID_Turno}",
            Cuadrante = turno.Cuadrante?.Nombre ?? string.Empty,
            AgenteNombre = turno.Agente != null
                ? $"{turno.Agente.Nombre} {turno.Agente.Apellido}"
                : string.Empty,
            FechaInicio = turno.FechaProgramadaInicio,
            FechaFin = turno.FechaProgramadaFin,
            Estado = turno.Estado ?? string.Empty,
            Observaciones = turno.Observaciones
        };

        public static void UpdateFromDto(this Turno turno, CrearTurnoDto dto)
        {
            turno.FechaProgramadaInicio = dto.FechaProgramadaInicio;
            turno.FechaProgramadaFin = dto.FechaProgramadaFin;
            turno.ID_Agente = dto.ID_Agente;
            turno.ID_Cuadrante = dto.ID_Cuadrante;
            turno.Observaciones = dto.Observaciones;

            // Campos requeridos para INSERT — si es un turno nuevo, asignar estado y fecha
            if (string.IsNullOrEmpty(turno.Estado))
                turno.Estado = "Programado";
            if (turno.FechaCreacion == default)
                turno.FechaCreacion = DateTime.UtcNow;
        }

        public static void UpdateFromDto(this Turno turno, ActualizarTurnoDto dto)
        {
            if (dto.FechaProgramadaInicio.HasValue)
                turno.FechaProgramadaInicio = dto.FechaProgramadaInicio.Value;
            if (dto.FechaProgramadaFin.HasValue)
                turno.FechaProgramadaFin = dto.FechaProgramadaFin.Value;
            if (dto.ID_Agente.HasValue)
                turno.ID_Agente = dto.ID_Agente.Value;
            if (dto.ID_Cuadrante.HasValue)
                turno.ID_Cuadrante = dto.ID_Cuadrante.Value;
            if (!string.IsNullOrEmpty(dto.Observaciones))
                turno.Observaciones = dto.Observaciones;
            if (!string.IsNullOrEmpty(dto.Estado))
                turno.Estado = dto.Estado;
        }
    }
}
