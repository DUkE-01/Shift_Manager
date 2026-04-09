using Shift_Manager.Server.Domain.Entities;

namespace Shift_Manager.Server.Domain.Entities
{
    public class UsuarioSistema
    {
        public int ID_Usuario { get; set; }

        public string Username { get; set; }

        public string PasswordHash { get; set; }

        public string Rol { get; set; }

        public int? ID_Agente { get; set; }

        public bool Activo { get; set; }

        public DateTime FechaCreacion { get; set; }

        public byte[] RowVersion { get; set; }

        public Agente? Agente { get; set; }
        
        public ICollection<RefreshToken> RefreshTokens { get; set; }
    }
}
