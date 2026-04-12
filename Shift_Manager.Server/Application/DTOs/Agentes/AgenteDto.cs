namespace Shift_Manager.Server.Application.DTOs.Agentes
{
    public class AgenteDto
    {
        public int ID_Agente { get; set; }
        public string? Nombre { get; set; }
        public string? Apellido { get; set; }
        public string? Cedula { get; set; }
        public string? Codigo_Agente { get; set; }
        public string? Rango { get; set; }
        public string? Contacto { get; set; }
        public bool Disponibilidad { get; set; }
        public int PuestoAsignado { get; set; }
        public int ID_Cuadrante { get; set; }
        public DateTime FechaCreacion { get; set; }
    }
}
