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
                _logger.LogInformation(
                    "[Notif] Turno={TurnoId} | Agente={AgenteId} | Cuadrante={CuadranteId}",
                    turno.ID_Turno, turno.ID_Agente, turno.ID_Cuadrante);

                // ── 1. Cargar el agente desde la BD ─────────────────────────────────────
                var agente = await _context.Agentes
                    .AsNoTracking()
                    .FirstOrDefaultAsync(a => a.ID_Agente == turno.ID_Agente);

                if (agente == null)
                {
                    _logger.LogWarning("[Notif] Agente {AgenteId} no encontrado. Abortando.", turno.ID_Agente);
                    return;
                }

                // ── 2. Notificar al Oficial ──────────────────────────────────────────────
                await SendNotificationAsync(
                    agente.ID_Agente,
                    "Nuevo Turno Asignado",
                    $"Se le ha asignado un turno el {turno.FechaProgramadaInicio:dd/MM/yyyy} " +
                    $"a las {turno.FechaProgramadaInicio:HH:mm}.",
                    "Turno",
                    turno.ID_Turno
                );
                _logger.LogInformation("[Notif] ✔ Oficial notificado → AgenteId={AgenteId}", agente.ID_Agente);

                // ── 3. Resolver circunscripción del turno ────────────────────────────────
                // Primero desde la BD; si Circunscripcion == 0 o null, usamos el Helper.
                var cuadranteTurno = await _context.Cuadrantes
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.ID_Cuadrante == turno.ID_Cuadrante);

                int? circunscripcion = (cuadranteTurno?.Circunscripcion is int c && c != 0)
                    ? c
                    : CuadranteMapping.GetCircunscripcion(turno.ID_Cuadrante);

                _logger.LogInformation(
                    "[Notif] Cuadrante={CuadranteId} → Circunscripción={Circ}",
                    turno.ID_Cuadrante, circunscripcion);

                if (circunscripcion == null)
                {
                    _logger.LogWarning(
                        "[Notif] Circunscripción no determinada para Cuadrante {CuadranteId}. " +
                        "Supervisores no notificados.", turno.ID_Cuadrante);
                    return;
                }

                // ── 4. Notificar a Supervisores de esa circunscripción ───────────────────
                var supervisores = await _context.UsuariosSistema
                    .AsNoTracking()
                    .Where(u => u.Rol == "Supervisor" && u.ID_Agente != null)
                    .Include(u => u.Agente)
                        .ThenInclude(a => a!.Cuadrante)
                    .ToListAsync();

                _logger.LogInformation("[Notif] Supervisores encontrados: {Count}", supervisores.Count);

                int countNotificados = 0;
                foreach (var sup in supervisores)
                {
                    if (sup.ID_Agente == null || sup.Agente == null)
                    {
                        _logger.LogWarning("[Notif] Supervisor UsuarioId={Id} sin Agente. Omitido.", sup.ID_Usuario);
                        continue;
                    }

                    // Resolver circunscripción del supervisor igual que la del turno
                    int? supCirc = (sup.Agente.Cuadrante?.Circunscripcion is int sc && sc != 0)
                        ? sc
                        : CuadranteMapping.GetCircunscripcion(sup.Agente.ID_Cuadrante);

                    _logger.LogDebug(
                        "[Notif] Sup AgenteId={SupId} Cuadrante={CuadId} Circ={SupCirc} (necesita {TurnoCirc})",
                        sup.ID_Agente, sup.Agente.ID_Cuadrante, supCirc, circunscripcion);

                    if (supCirc != circunscripcion) continue;

                    await SendNotificationAsync(
                        sup.ID_Agente.Value,
                        "Turno en su Jurisdicción",
                        $"Se asignó un turno al oficial {agente.Nombre} {agente.Apellido} " +
                        $"(Circ. {circunscripcion}) el " +
                        $"{turno.FechaProgramadaInicio:dd/MM/yyyy} a las {turno.FechaProgramadaInicio:HH:mm}.",
                        "Turno",
                        turno.ID_Turno
                    );
                    countNotificados++;
                    _logger.LogInformation("[Notif] ✔ Supervisor notificado → AgenteId={Id}", sup.ID_Agente);
                }

                _logger.LogInformation(
                    "[Notif] Resumen: 1 oficial + {Count} supervisores notificados para Turno {TurnoId}",
                    countNotificados, turno.ID_Turno);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Notif] Error crítico para Turno {TurnoId}", turno.ID_Turno);
            }
        }

        public async Task SendNotificationAsync(
            int idAgente, string titulo, string mensaje,
            string tipo, int? referenciaId = null)
        {
            var notificacion = new Notificacion
            {
                IdAgente       = idAgente,
                Titulo         = titulo,
                Mensaje        = mensaje,
                TipoReferencia = tipo,
                ReferenciaId   = referenciaId,
                FechaCreacion  = DateTime.UtcNow,
                Leida          = false
            };

            _context.Notificaciones.Add(notificacion);
            await _context.SaveChangesAsync();

            _logger.LogInformation(
                "[Notif] ✔ Guardada en BD → AgenteId={AgenteId} | Titulo={Titulo}",
                idAgente, titulo);
        }
    }
}