namespace Shift_Manager.Server.Application.DTOs.Turnos
{
    public class TurnoDto
    {
        public int ID_Turno { get; set; }
        public int ID_Agente { get; set; }
        public int ID_Cuadrante { get; set; }
        public required string Nombre { get; set; }
        public required string Cuadrante { get; set; }
        public required string AgenteNombre { get; set; }
        public DateTime FechaInicio { get; set; }
        public DateTime FechaFin { get; set; }
        public required string Estado { get; set; }
        public string? Observaciones { get; set; }
        public string? CreatedByRole { get; set; }
    }
}