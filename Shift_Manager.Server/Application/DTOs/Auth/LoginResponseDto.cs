namespace Shift_Manager.Server.Application.DTOs.Auth
{
    public class LoginResponseDto
    {
        public string AccessToken  { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public DateTime Expiracion { get; set; }
        public string Username     { get; set; } = string.Empty;
        public string Rol          { get; set; } = string.Empty;
    }
}
