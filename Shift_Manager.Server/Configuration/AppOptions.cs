namespace Shift_Manager.Server.Configuration;


/// Bound to the "Jwt" section of appsettings / environment variables.
/// Register with: services.Configure&lt;JwtOptions&gt;(config.GetSection("Jwt"));

public sealed class JwtOptions
{
    public const string Section = "Jwt";

    /// <summary>Signing key — must be at least 32 characters. NEVER commit a real value.</summary>
    public string Key { get; init; } = string.Empty;

    public string Issuer { get; init; } = string.Empty;
    public string Audience { get; init; } = string.Empty;

    /// <summary>Access token lifetime in minutes. Default: 15.</summary>
    public int AccessTokenExpiryMinutes { get; init; } = 15;

    /// <summary>Refresh token lifetime in days. Default: 7.</summary>
    public int RefreshTokenExpiryDays { get; init; } = 7;
}


/// Bound to the "Cors" section of appsettings.

public sealed class CorsOptions
{
    public const string Section = "Cors";
    public const string PolicyName = "ReactPolicy";

    public string[] AllowedOrigins { get; init; } = Array.Empty<string>();
    public bool AllowCredentials { get; init; } = true;
    public bool AllowAnyHeader { get; init; } = true;
    public bool AllowAnyMethod { get; init; } = true;
}


/// Bound to the "RateLimit" section of appsettings.

public sealed class RateLimitOptions
{
    public const string Section = "RateLimit";

    public int PermitLimit { get; init; } = 100;
    public int QueueLimit { get; init; } = 10;
    public int WindowSeconds { get; init; } = 60;
}


/// Bound to the "ClientPath" section of appsettings.

public sealed class ClientPathOptions
{
    public const string Section = "ClientPath";

    public string DistFolder { get; init; } = "shift_manager.client/dist/public";
    public string FallbackFile { get; init; } = "index.html";
}
