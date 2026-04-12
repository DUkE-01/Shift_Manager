using Microsoft.EntityFrameworkCore;

using Shift_Manager.Server.Domain.Entities;
using Shift_Manager.Server.Infrastructure.Context;

namespace Shift_Manager.Server.Infrastructure.Seeders;

public static class AdminSeeder
{
    // Sin parámetro ILogger — lo resuelve internamente desde DI
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ShiftManagerDbContext>();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        var logger = scope.ServiceProvider
                         .GetRequiredService<ILoggerFactory>()
                         .CreateLogger("AdminSeeder");

        var adminUsername = config["AdminSeed:Username"] ?? "admin";
        var adminPassword = config["AdminSeed:Password"] ?? "Admin123!";

        try
        {
            var existing = await db.UsuariosSistema
                .FirstOrDefaultAsync(u => u.Username == adminUsername);

            if (existing is null)
            {
                db.UsuariosSistema.Add(new UsuarioSistema
                {
                    Username = adminUsername,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword),
                    Rol = "Administrador",
                    Activo = true,
                    FechaCreacion = DateTime.UtcNow
                });

                await db.SaveChangesAsync();
                logger.LogInformation(
                    "✅ Usuario administrador '{Username}' creado por seeder.", adminUsername);
            }
            else
            {
                if (!BCrypt.Net.BCrypt.Verify(adminPassword, existing.PasswordHash.Trim()))
                {
                    existing.PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPassword);
                    await db.SaveChangesAsync();
                    logger.LogInformation(
                        "🔑 Hash del admin '{Username}' regenerado correctamente.", adminUsername);
                }
                else
                {
                    logger.LogInformation(
                        "✅ Usuario administrador '{Username}' ya existe y su hash es válido.", adminUsername);
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "❌ Error en AdminSeeder para usuario '{Username}'", adminUsername);
        }
    }
}
