using Shift_Manager.Server.Domain.Entities;

using System.ComponentModel.DataAnnotations;

namespace Shift_Manager.Server.Domain.Entities
{
    public class Agente
    {
        public int ID_Agente { get; set; }

        public string? Codigo_Agente { get; set; }

        public string? Nombre { get; set; }

        public string? Apellido { get; set; }

        public string? Cedula { get; set; }

        public string? Rango { get; set; }

        public string? Contacto { get; set; }

        public int PuestoAsignado { get; set; }

        public int ID_Cuadrante { get; set; }

        public int? Antiguedad { get; set; }

        public bool Disponibilidad { get; set; }

        public bool Activo { get; set; }

        public DateTime FechaCreacion { get; set; }

        public DateTime? FechaModificacion { get; set; }

        public byte[] RowVersion { get; set; } = null!;

        public Cuadrante Cuadrante { get; set; } = null!;

        public ICollection<Turno> Turnos { get; set; } = new List<Turno>();
        public ICollection<Horario> Horarios { get; set; } = new List<Horario>();
        public ICollection<Reporte> Reportes { get; set; } = new List<Reporte>();

        public ICollection<UsuarioSistema> UsuariosSistema { get; set; } = new List<UsuarioSistema>();

    }
}
