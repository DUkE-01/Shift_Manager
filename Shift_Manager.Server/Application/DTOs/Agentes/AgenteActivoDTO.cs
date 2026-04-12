namespace Shift_Manager.Server.Application.DTOs.Agentes
{
    public class AgenteActivoDTO
    {
        public required string IdAgente { get; set; }
        public required string Nombre { get; set; }
        public required string Cuadrante { get; set; }

        public string? PuestoAsignado { get; set; }
    }
}
