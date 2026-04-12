namespace Shift_Manager.Server.Application.DTOs.Turnos
{
    public class TurnoHoyDTO
    {
        public required string Agente { get; set; }
        public required string Cuadrante { get; set; }
        public required string Turno { get; set; }

        public TimeOnly HoraInicio { get; set; }

        public TimeOnly HoraFin { get; set; }
    }
}
