using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Shift_Manager.Server.Domain.Entities
{
    public class Notificacion
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public int IdAgente { get; set; }
        
        [Required]
        [MaxLength(100)]
        public string Titulo { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(500)]
        public string Mensaje { get; set; } = string.Empty;
        
        [Required]
        [MaxLength(50)]
        public string TipoReferencia { get; set; } = string.Empty; // Ej. "Turno", "Reporte"
        
        public int? ReferenciaId { get; set; }
        
        public bool Leida { get; set; } = false;
        
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
        
        [ForeignKey("IdAgente")]
        public virtual Agente? Agente { get; set; }
    }
}
