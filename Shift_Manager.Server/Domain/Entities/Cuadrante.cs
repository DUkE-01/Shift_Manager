using System.ComponentModel.DataAnnotations;

using Shift_Manager.Server.Domain.Entities;

namespace Shift_Manager.Server.Domain.Entities
{
    public class Cuadrante
    {
        public int ID_Cuadrante { get; set; }

        public string Nombre { get; set; }

        public string? Sector { get; set; }

        public bool Activo { get; set; }

        public DateTime FechaCreacion { get; set; }

        public ICollection<Agente> Agentes { get; set; }

        public ICollection<Horario> Horarios { get; set; }

        public ICollection<Turno> Turnos { get; set; }

        public ICollection<Reporte> Reportes { get; set; }
    }
}
