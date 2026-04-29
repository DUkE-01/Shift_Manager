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

                // ── 1. Cargar el agente desde la BD (no confiar en lo que trae el turno) ──
                var agente = await _context.Agentes
                    .AsNoTracking()
                    .FirstOrDefaultAsync(a => a.ID_Agente == turno.ID_Agente);

                if (agente == null)
                {
                    _logger.LogWarning("[Notif] Agente {AgenteId} no encontrado en BD. Abortando.", turno.ID_Agente);
                    return;
                }

                // ── 2. Notificar al Oficial ───────────────────────────────────────────────
                await SendNotificationAsync(
                    agente.ID_Agente,
                    "Nuevo Turno Asignado",
                    $"Se le ha asignado un turno el {turno.FechaProgramadaInicio:dd/MM/yyyy} " +
                    $"a las {turno.FechaProgramadaInicio:HH:mm}.",
                    "Turno",
                    turno.ID_Turno
                );
                _logger.LogInformation("[Notif] ✔ Oficial notificado → AgenteId={AgenteId}", agente.ID_Agente);

                // ── 3. Resolver circunscripción ───────────────────────────────────────────
                // Primero intentamos desde la BD, luego desde el Helper como fallback.
                var cuadranteTurno = await _context.Cuadrantes
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.ID_Cuadrante == turno.ID_Cuadrante);

                int? circunscripcion = null;

                if (cuadranteTurno?.Circunscripcion is int c && c != 0)
                    circunscripcion = c;
                else
                    circunscripcion = CuadranteMapping.GetCircunscripcion(turno.ID_Cuadrante);

                _logger.LogInformation(
                    "[Notif] Cuadrante={CuadranteId} → Circunscripción={Circ} (fuente: {Fuente})",
                    turno.ID_Cuadrante,
                    circunscripcion,
                    cuadranteTurno?.Circunscripcion != null ? "BD" : "Helper");

                if (circunscripcion == null)
                {
                    _logger.LogWarning(
                        "[Notif] Circunscripción no determinada para Cuadrante {CuadranteId}. " +
                        "Supervisores no notificados.", turno.ID_Cuadrante);
                    return;
                }

                // ── 4. Cargar supervisores con su cuadrante en una sola consulta ──────────
                var supervisores = await _context.UsuariosSistema
                    .AsNoTracking()
                    .Where(u => u.Rol == "Supervisor" && u.ID_Agente != null)
                    .Include(u => u.Agente)
                        .ThenInclude(a => a!.Cuadrante)
                    .ToListAsync();

                _logger.LogInformation("[Notif] Total supervisores encontrados: {Count}", supervisores.Count);

                // ── 5. Filtrar y notificar por circunscripción ───────────────────────────
                int countNotificados = 0;

                foreach (var sup in supervisores)
                {
                    if (sup.ID_Agente == null)
                    {
                        _logger.LogWarning("[Notif] Supervisor UsuarioId={Id} sin ID_Agente. Omitido.", sup.ID_Usuario);
                        continue;
                    }

                    if (sup.Agente == null)
                    {
                        _logger.LogWarning("[Notif] Supervisor AgenteId={Id} sin entidad Agente cargada. Omitido.", sup.ID_Agente);
                        continue;
                    }

                    if (sup.Agente.Cuadrante == null)
                    {
                        _logger.LogWarning("[Notif] Supervisor AgenteId={Id} sin Cuadrante asociado. Omitido.", sup.ID_Agente);
                        continue;
                    }

                    // Resolver circunscripción del supervisor igual que la del turno
                    int? supCirc = (sup.Agente.Cuadrante.Circunscripcion is int sc && sc != 0)
                        ? sc
                        : CuadranteMapping.GetCircunscripcion(sup.Agente.ID_Cuadrante);

                    _logger.LogDebug(
                        "[Notif] Supervisor AgenteId={SupId} → Cuadrante={CuadId} → Circunscripción={SupCirc} (turno necesita {TurnoCirc})",
                        sup.ID_Agente, sup.Agente.ID_Cuadrante, supCirc, circunscripcion);

                    if (supCirc != circunscripcion) continue;

                    await SendNotificationAsync(
                        sup.ID_Agente.Value,
                        "Turno en su Jurisdicción",
                        $"Se asignó un turno al oficial {agente.Nombre} {agente.Apellido} " +
                        $"en la Circunscripción {circunscripcion} el " +
                        $"{turno.FechaProgramadaInicio:dd/MM/yyyy} a las {turno.FechaProgramadaInicio:HH:mm}.",
                        "Turno",
                        turno.ID_Turno
                    );
                    countNotificados++;

                    _logger.LogInformation(
                        "[Notif] ✔ Supervisor notificado → AgenteId={SupId}", sup.ID_Agente);
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
                "[Notif] Guardada en BD → AgenteId={AgenteId} | Titulo={Titulo}",
                idAgente, titulo);
        }
    }
}