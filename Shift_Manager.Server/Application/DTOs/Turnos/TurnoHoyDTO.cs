namespace Shift_Manager.Server.Application.DTOs.Turnos
{
    public class TurnoHoyDTO
    {
        public string Agente { get; set; }

        public string Cuadrante { get; set; }

        public string Turno { get; set; }

        public TimeOnly HoraInicio { get; set; }

        public TimeOnly HoraFin { get; set; }
    }
}
