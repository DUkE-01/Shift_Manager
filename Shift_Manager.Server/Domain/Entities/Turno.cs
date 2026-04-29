using System.ComponentModel.DataAnnotations;

namespace Shift_Manager.Server.Domain.Entities
{
    public class Turno
    {
        public int ID_Turno { get; set; }

        public int ID_Agente { get; set; }

        public int ID_Cuadrante { get; set; }

        public DateTime FechaProgramadaInicio { get; set; }

        public DateTime FechaProgramadaFin { get; set; }

        public DateTime? FechaInicioReal { get; set; }

        public DateTime? FechaFinReal { get; set; }

        public string Estado { get; set; } = string.Empty;

        /// <summary>
        /// Tipo de turno: "diurno", "vespertino_lj", "vespertino_vd", "nocturno"
        /// </summary>
        [MaxLength(20)]
        public string TipoTurno { get; set; } = "diurno";

        public string? Observaciones { get; set; }
        public string? CreatedByRole { get; set; }
        public DateTime FechaCreacion { get; set; }

        public byte[] RowVersion { get; set; } = null!;

        public Agente Agente { get; set; } = null!;
        public Cuadrante Cuadrante { get; set; } = null!;

        public ICollection<Reporte> Reportes { get; set; } = new List<Reporte>();
        public ICollection<Horario> Horarios { get; set; } = new List<Horario>();
    }
}