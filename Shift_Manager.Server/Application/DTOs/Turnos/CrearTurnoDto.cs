using System.ComponentModel.DataAnnotations;

namespace Shift_Manager.Server.Application.DTOs.Turnos
{
    public class CrearTurnoDto
    {
        [Required]
        public int ID_Agente { get; set; }

        [Required]
        public int ID_Cuadrante { get; set; }

        [Required]
        public DateTime FechaProgramadaInicio { get; set; }

        [Required]
        public DateTime FechaProgramadaFin { get; set; }
        public string? TipoTurno { get; set; } = "diurno";
        public string? Observaciones { get; set; }
    }
}
