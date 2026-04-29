using System;
using System.ComponentModel.DataAnnotations;

namespace Shift_Manager.Server.Application.DTOs.Turnos
{
    public record CrearTurnoDto(
        [Required] int ID_Agente,
        [Required] int ID_Cuadrante,
        [Required] DateTime FechaProgramadaInicio,
        [Required] DateTime FechaProgramadaFin,
        string? TipoTurno = "diurno",
        string? Observaciones = null,
        string? RequesterRole = null,
        int? RequesterAgenteId = null
    );
}
