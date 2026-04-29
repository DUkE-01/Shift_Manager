using System.ComponentModel.DataAnnotations;

using Shift_Manager.Server.Domain.Entities;

namespace Shift_Manager.Server.Domain.Entities
{
    public class Cuadrante
    {
        public int ID_Cuadrante { get; set; }

        public required string Nombre { get; set; }
        public string? Sector { get; set; }
        public int Circunscripcion { get; set; }
        public bool Activo { get; set; }
        public DateTime FechaCreacion { get; set; }

        public ICollection<Agente> Agentes { get; set; } = new List<Agente>();
        public ICollection<Horario> Horarios { get; set; } = new List<Horario>();
        public ICollection<Turno> Turnos { get; set; } = new List<Turno>();
        public ICollection<Reporte> Reportes { get; set; } = new List<Reporte>();
    }
}
