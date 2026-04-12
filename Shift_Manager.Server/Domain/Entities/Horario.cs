using System.ComponentModel.DataAnnotations;

using Shift_Manager.Server.Domain.Entities.Common;

namespace Shift_Manager.Server.Domain.Entities
{
    public class Horario : IAuditable
    {
        public int IdHorario { get; set; }
        public string IdAgente { get; set; } = string.Empty;

        public DateOnly Fecha { get; set; }
        public TimeOnly HoraInicio { get; set; }
        public TimeOnly HoraFin { get; set; }
        public string TipoTurno { get; set; } = string.Empty;
        public int IdCuadrante { get; set; }
        public int ID_Turno { get; set; }
        public string Estado { get; set; } = string.Empty;
        public DateTime FechaCreacion { get; set; }
        public string UsuarioCreacion { get; set; } = string.Empty;
        public DateTime? FechaModificacion { get; set; }
        public string? UsuarioModificacion { get; set; }
        public string? Observaciones { get; set; }

        public Turno? Turno { get; set; }
        public Cuadrante? Cuadrante { get; set; }

    }
}