namespace Shift_Manager.Server.Application.DTOs.Turnos;

/// <summary>DTO for partial updates to an existing turno (PATCH / PUT semantics).</summary>
public sealed class ActualizarTurnoDto
{
    public int? ID_Agente { get; init; }
    public int? ID_Cuadrante { get; init; }
    public DateTime? FechaProgramadaInicio { get; init; }
    public DateTime? FechaProgramadaFin { get; init; }
    public string? Estado { get; init; }
    public string? Observaciones { get; init; }
    public string? TipoTurno { get; init; }
    
    // Metadata para jerarquías
    public string? RequesterRole { get; init; }
    public int? RequesterAgenteId { get; init; }
}
