using System.ComponentModel.DataAnnotations;

namespace Shift_Manager.Server.Domain.Entities
{
    public class RefreshToken
    {
        public int Id { get; set; }

        // Foreign key to UsuarioSistema
        public int UsuarioId { get; set; }

        // Hashed token value (SHA-256)
        public string Token { get; set; } = string.Empty;

        // Expiration datetime (UTC)
        public DateTime Expiration { get; set; }

        // Creation datetime (UTC)
        public DateTime Created { get; set; }

        // Revoked datetime (UTC) if revoked
        public DateTime? Revoked { get; set; }

        // If this token was rotated, the new token value (hashed or raw depending on usage)
        public string? ReplacedByToken { get; set; }

        // Navigation property to the user owning the token
        public virtual UsuarioSistema? Usuario { get; set; }

        public bool IsExpired => DateTime.UtcNow >= Expiration;

        public bool IsActive => Revoked == null && !IsExpired;
    }
}
