using System.Net;
using System.Text.Json;

using Shift_Manager.Server.Domain.Common.Exceptions;

namespace Shift_Manager.Server.Middleware;

/// <summary>
/// Single, unified global exception handler.
/// Replaces the duplicated <c>ExceptionHandlingMiddleware</c> and <c>GlobalExceptionHandler</c>
/// that existed previously.
///
/// Maps domain exceptions to HTTP status codes so controllers stay clean.
/// </summary>
public sealed class GlobalExceptionMiddleware(
    RequestDelegate next,
    ILogger<GlobalExceptionMiddleware> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        var (statusCode, title) = ex switch
        {
            NotFoundException => (HttpStatusCode.NotFound, "Resource not found"),
            BusinessRuleException => (HttpStatusCode.BadRequest, "Business rule violation"),
            ConflictException => (HttpStatusCode.Conflict, "Conflict"),
            RepositoryException => (HttpStatusCode.InternalServerError, "Data access error"),
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "Unauthorized"),
            _ => (HttpStatusCode.InternalServerError, "An unexpected error occurred")
        };

        // Log 5xx at Error, 4xx at Warning
        if ((int)statusCode >= 500)
            logger.LogError(ex, "Unhandled exception: {Message}", ex.Message);
        else
            logger.LogWarning("Handled domain exception [{Status}]: {Message}", statusCode, ex.Message);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var body = JsonSerializer.Serialize(new
        {
            status = (int)statusCode,
            title,
            detail = ex.Message,
            traceId = context.TraceIdentifier
        }, JsonOptions);

        await context.Response.WriteAsync(body);
    }
}

/// <summary>Extension method for clean registration in Program.cs.</summary>
public static class GlobalExceptionMiddlewareExtensions
{
    public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
        => app.UseMiddleware<GlobalExceptionMiddleware>();
}
