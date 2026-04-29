using System;

namespace Shift_Manager.Server.Application.DTOs.Turnos;

public sealed record ActualizarTurnoDto(
    int? ID_Agente = null,
    int? ID_Cuadrante = null,
    DateTime? FechaProgramadaInicio = null,
    DateTime? FechaProgramadaFin = null,
    string? Estado = null,
    string? Observaciones = null,
    string? TipoTurno = null,
    string? RequesterRole = null,
    int? RequesterAgenteId = null
);
