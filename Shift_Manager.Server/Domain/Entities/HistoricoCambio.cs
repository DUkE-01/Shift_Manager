using Shift_Manager.Server.Domain.Entities;

using System.ComponentModel.DataAnnotations;

namespace Shift_Manager.Server.Domain.Entities
{
    public class HistoricoCambio
    {
        public int ID_Historico { get; set; }

        public string Tabla { get; set; }

        public int ID_Registro { get; set; }

        public string Accion { get; set; }

        public string Usuario { get; set; }

        public DateTime Fecha { get; set; }

        public string? Detalle { get; set; }
    }
}
