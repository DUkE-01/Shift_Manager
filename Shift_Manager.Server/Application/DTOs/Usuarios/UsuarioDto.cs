namespace Shift_Manager.Server.Application.DTOs.Usuarios
{
    public class UsuarioDto
    {
        public int Id { get; set; }

        public required string Username { get; set; }
        public required string Rol { get; set; }
    }
}
