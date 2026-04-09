using Shift_Manager.Server.Domain.Entities;

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

        public string Estado { get; set; }

        public string? Observaciones { get; set; }

        public DateTime FechaCreacion { get; set; }

        public byte[] RowVersion { get; set; }

        public Agente Agente { get; set; }

        public Cuadrante Cuadrante { get; set; }

        public ICollection<Reporte> Reportes { get; set; }

        public ICollection<Horario> Horarios { get; set; } = new List<Horario>();
    }
}
