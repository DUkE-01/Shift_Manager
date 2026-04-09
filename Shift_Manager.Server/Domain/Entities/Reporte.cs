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

        public string Tipo { get; set; }

        public string Descripcion { get; set; }

        public string Estado { get; set; }

        public string Prioridad { get; set; }

        public DateTime FechaCreacion { get; set; }

        public DateTime? FechaCierre { get; set; }

        public byte[] RowVersion { get; set; }

        public Turno Turno { get; set; }

        public Agente Agente { get; set; }

        public Cuadrante Cuadrante { get; set; }
    }
}
