using Microsoft.EntityFrameworkCore;

using Polly;

using Shift_Manager.Server.Infrastructure.Context;

namespace Shift_Manager.Server.Extensions;

public static class DatabaseExtensions
{
    /// Configura retry policy para conexiones a BD con Polly.
    /// Método renombrado para evitar colisión con AddResilientDatabase existente.
    public static IServiceCollection AddResilientDatabaseWithPolly(this IServiceCollection services, IConfiguration configuration)
    {
        var retryPolicy = Policy
            .Handle<Exception>()
            .WaitAndRetry(
                retryCount: 3,
                sleepDurationProvider: retryAttempt =>
                    TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));

        services.AddDbContext<ShiftManagerDbContext>((provider, options) =>
        {
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                sqlServerOptions => sqlServerOptions
                    .EnableRetryOnFailure(
                        maxRetryCount: 3,
                        maxRetryDelay: TimeSpan.FromSeconds(10),
                        errorNumbersToAdd: null));
        });

        return services;
    }
}
