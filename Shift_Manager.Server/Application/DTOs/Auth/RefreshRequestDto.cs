namespace Shift_Manager.Server.Application.DTOs.Auth
{
    public class RefreshRequestDto
    {
        public string RefreshToken { get; set; } = string.Empty;
        public string? AccessToken { get; set; }
    }
}
