using System.Diagnostics;
public class RequestMetricsMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestMetricsMiddleware> _logger;
    public RequestMetricsMiddleware(RequestDelegate next, ILogger<RequestMetricsMiddleware> logger) { _next = next; _logger = logger; }
    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Request error {Path} {Method} {TraceId}", context.Request.Path, context.Request.Method, context.TraceIdentifier);
            throw;
        }
        finally
        {
            sw.Stop();
            _logger.LogInformation("RequestMetrics {Method} {Path} {StatusCode} {ElapsedMs} {TraceId}",
                context.Request.Method, context.Request.Path, context.Response.StatusCode, sw.ElapsedMilliseconds, context.TraceIdentifier);
        }
    }
}