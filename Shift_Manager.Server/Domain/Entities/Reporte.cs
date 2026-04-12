using System.ComponentModel.DataAnnotations;

using Shift_Manager.Server.Domain.Entities;

namespace Shift_Manager.Server.Domain.Entities
{
    public class Reporte
    {
        public int ID_Reporte { get; set; }

        public int ID_Turno { get; set; }

        public int ID_Agente { get; set; }

        public int ID_Cuadrante { get; set; }

        public required string Tipo { get; set; }
        public required string Descripcion { get; set; }
        public required string Estado { get; set; }
        public required string Prioridad { get; set; }
        public DateTime FechaCreacion { get; set; }
        public DateTime? FechaCierre { get; set; }
        public byte[] RowVersion { get; set; } = null!;

        public Turno Turno { get; set; } = null!;
        public Agente Agente { get; set; } = null!;
        public Cuadrante Cuadrante { get; set; } = null!;
    }
}
