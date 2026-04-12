namespace Shift_Manager.Server.Application.DTOs.Usuarios
{
    public class CreateUsuarioDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty; // Texto plano
        public string Rol { get; set; } = "Usuario";
        public int? IdAgente { get; set; }
    }
}
