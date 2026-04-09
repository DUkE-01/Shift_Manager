using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http;
using Polly;
using Polly.Extensions.Http;
using Polly.Timeout;

namespace Shift_Manager.Server.Configuration;

public static class HttpClientConfig
{
    public static IServiceCollection AddResilientHttpClients(this IServiceCollection services)
    {
        // Política de timeout
        var timeoutPolicy = Policy.TimeoutAsync<HttpResponseMessage>(TimeSpan.FromSeconds(10));

        // Política de circuit breaker
        var circuitBreakerPolicy = Policy<HttpResponseMessage>
            .Handle<HttpRequestException>()
            .Or<OperationCanceledException>()
            .OrResult(r => !r.IsSuccessStatusCode)
            .CircuitBreakerAsync(
                handledEventsAllowedBeforeBreaking: 5,
                durationOfBreak: TimeSpan.FromSeconds(30));

        // Política de retry
        var retryPolicy = HttpPolicyExtensions
            .HandleTransientHttpError()
            .Or<OperationCanceledException>()
            .WaitAndRetryAsync(
                retryCount: 3,
                sleepDurationProvider: retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));

        services.AddHttpClient("ResilientClient")
            .AddPolicyHandler(retryPolicy)
            .AddPolicyHandler(circuitBreakerPolicy)
            .AddPolicyHandler(timeoutPolicy)
            .ConfigureHttpClient(client =>
            {
                client.Timeout = TimeSpan.FromSeconds(30);
            });

        return services;
    }
}
