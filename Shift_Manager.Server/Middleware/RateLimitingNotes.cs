namespace Shift_Manager.Server.Middleware;

/// <summary>
/// NOTE: The old custom <c>RateLimitingMiddleware</c> used a static
/// <c>Dictionary&lt;string, (int, DateTime)&gt;</c> which is NOT thread-safe
/// and would silently drop or corrupt counts under concurrent load.
///
/// It has been replaced by the built-in ASP.NET Core rate limiter
/// (registered in <see cref="Extensions.ServiceCollectionExtensions.AddGlobalRateLimiting"/>),
/// which uses <c>PartitionedRateLimiter</c> with proper locking and
/// a configurable fixed-window policy.
///
/// A stricter per-path limiter for auth endpoints is applied below via
/// endpoint-level attributes or policy names.
///
/// This file is kept as documentation only — no middleware class is needed here.
/// </summary>
internal static class RateLimitingNotes
{
    // If you need a tighter limit specifically on /api/auth/login,
    // add this attribute to the Login endpoint:
    //
    //   [EnableRateLimiting("auth")]
    //
    // And register a named policy in AddGlobalRateLimiting:
    //
    //   options.AddFixedWindowLimiter("auth", o =>
    //   {
    //       o.PermitLimit = 5;
    //       o.Window = TimeSpan.FromMinutes(1);
    //       o.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
    //       o.QueueLimit = 0;
    //   });
}
