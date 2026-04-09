namespace Shift_Manager.Server.Domain.Entities.Common
{
    public interface IAuditable
    {
        DateTime FechaCreacion { get; set; }
        string UsuarioCreacion { get; set; }

        DateTime? FechaModificacion { get; set; }
        string? UsuarioModificacion { get; set; }
    }
}
