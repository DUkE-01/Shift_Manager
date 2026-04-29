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
                _logger.LogInformation("Iniciando proceso de notificación para Turno {TurnoId}, Agente {AgenteId}", turno.ID_Turno, turno.ID_Agente);

                // 1. Notificar al Oficial (Agente asignado)
                var agente = await _context.Agentes.AsNoTracking().FirstOrDefaultAsync(a => a.ID_Agente == turno.ID_Agente);
                if (agente != null)
                {
                    string mensaje = $"Se le ha asignado un turno el {turno.FechaProgramadaInicio:dd/MM/yyyy} a las {turno.FechaProgramadaInicio:HH:mm}.";
                    await SendNotificationAsync(
                        agente.ID_Agente,
                        "Nuevo Turno Asignado",
                        mensaje,
                        "Turno",
                        turno.ID_Turno
                    );
                    _logger.LogInformation("Notificación enviada al Agente {AgenteId}", agente.ID_Agente);
                }
                else
                {
                    _logger.LogWarning("No se pudo enviar notificación al Agente {AgenteId}: Registro no encontrado.", turno.ID_Agente);
                }

                // 2. Notificar a los Supervisores de la Circunscripción
                var cuadrante = await _context.Cuadrantes.AsNoTracking().FirstOrDefaultAsync(c => c.ID_Cuadrante == turno.ID_Cuadrante);
                int? circunscripcion = cuadrante?.Circunscripcion;
                
                // Si la DB no tiene la circunscripción aún (porque no se ha ejecutado el SQL), usamos el Helper como respaldo
                if (circunscripcion == null || circunscripcion == 0)
                {
                    circunscripcion = CuadranteMapping.GetCircunscripcion(turno.ID_Cuadrante);
                }

                if (circunscripcion != null)
                {
                    var supervisores = await _context.UsuariosSistema
                        .AsNoTracking()
                        .Include(u => u.Agente)
                        .ThenInclude(a => a!.Cuadrante)
                        .Where(u => u.Rol == "Supervisor" && u.ID_Agente != null)
                        .ToListAsync();

                    int countSup = 0;
                    foreach (var sup in supervisores)
                    {
                        if (sup.Agente?.Cuadrante != null)
                        {
                            // Comparamos por circunscripcion de la DB o del Helper
                            int? supCirc = sup.Agente.Cuadrante.Circunscripcion;
                            if (supCirc == null || supCirc == 0) supCirc = CuadranteMapping.GetCircunscripcion(sup.Agente.ID_Cuadrante);

                            if (supCirc == circunscripcion)
                            {
                                await SendNotificationAsync(
                                    sup.ID_Agente!.Value,
                                    "Turno en su Jurisdicción",
                                    $"Se asignó un turno al oficial {agente?.Nombre} {agente?.Apellido} en la Circunscripción {circunscripcion}.",
                                    "Turno",
                                    turno.ID_Turno
                                );
                                countSup++;
                            }
                        }
                    }
                    _logger.LogInformation("Notificaciones enviadas a {Count} supervisores de la Circunscripción {Circ}", countSup, circunscripcion);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error crítico al procesar notificaciones para Turno {TurnoId}", turno.ID_Turno);
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
