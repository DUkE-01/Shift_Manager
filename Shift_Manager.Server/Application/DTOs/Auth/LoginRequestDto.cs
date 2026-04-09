using System.ComponentModel.DataAnnotations;

namespace Shift_Manager.Server.Application.DTOs.Auth
{
    public class LoginRequestDto
    {
        [Required(ErrorMessage = "El usuario es obligatorio")]
        [MinLength(3, ErrorMessage = "El usuario debe tener al menos 3 caracteres")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "La contraseña es obligatoria")]
        [MinLength(6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres")]
        public string Password { get; set; } = string.Empty;
    }
}
