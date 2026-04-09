namespace Shift_Manager.Server.Application.DTOs.Usuarios
{
    public class CrearTurno
    {
        public int ID_Agente { get; set; }

        public int ID_Cuadrante { get; set; }

        public DateTime FechaProgramadaInicio { get; set; }

        public DateTime FechaProgramadaFin { get; set; }
    }
}
