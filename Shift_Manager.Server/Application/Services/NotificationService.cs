using Microsoft.EntityFrameworkCore;
using Shift_Manager.Server.Application.Interfaces;
using Shift_Manager.Server.Domain.Common.Helpers;
using Shift_Manager.Server.Domain.Entities;
using Shift_Manager.Server.Infrastructure.Context;

namespace Shift_Manager.Server.Application.Services
{
    public class NotificationService : INotificationService
    {
        private readonly ShiftManagerDbContext _context;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(ShiftManagerDbContext context, ILogger<NotificationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task NotifyShiftAssignmentAsync(Turno turno)
        {
            try
            {
                // 1. Notificar al Oficial (Agente asignado)
                var agente = await _context.Agentes.FindAsync(turno.ID_Agente);
                if (agente != null)
                {
                    await SendNotificationAsync(
                        agente.ID_Agente,
                        "Nuevo Turno Asignado",
                        $"Se le ha asignado un turno el {turno.FechaProgramadaInicio:dd/MM/yyyy} a las {turno.FechaProgramadaInicio:HH:mm}.",
                        "Turno",
                        turno.ID_Turno
                    );
                }

                // 2. Notificar a los Supervisores del Cuadrante
                var circunscripcion = CuadranteMapping.GetCircunscripcion(turno.ID_Cuadrante);
                
                // Buscar supervisores cuya circunscripción coincida
                // Nota: Un supervisor es un Usuario con Rol "Supervisor" vinculado a un Agente cuya ubicación define su área
                var supervisores = await _context.UsuariosSistema
                    .Include(u => u.Agente)
                    .Where(u => u.Rol == "Supervisor" && u.ID_Agente != null)
                    .ToListAsync();

                foreach (var sup in supervisores)
                {
                    if (sup.Agente != null)
                    {
                        var supCirc = CuadranteMapping.GetCircunscripcion(sup.Agente.ID_Cuadrante);
                        if (supCirc == circunscripcion)
                        {
                            await SendNotificationAsync(
                                sup.ID_Agente!.Value,
                                "Turno Asignado en su Jurisdicción",
                                $"Se asignó un turno al agente {agente?.Nombre} {agente?.Apellido} en el cuadrante {turno.ID_Cuadrante}.",
                                "Turno",
                                turno.ID_Turno
                            );
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al enviar notificaciones de turno {TurnoId}", turno.ID_Turno);
            }
        }

        public async Task SendNotificationAsync(int idAgente, string titulo, string mensaje, string tipo, int? referenciaId = null)
        {
            var notificacion = new Notificacion
            {
                IdAgente = idAgente,
                Titulo = titulo,
                Mensaje = mensaje,
                TipoReferencia = tipo,
                ReferenciaId = referenciaId,
                FechaCreacion = DateTime.UtcNow,
                Leida = false
            };

            _context.Notificaciones.Add(notificacion);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Notificación enviada a Agente {AgenteId}: {Titulo}", idAgente, titulo);
        }
    }
}
