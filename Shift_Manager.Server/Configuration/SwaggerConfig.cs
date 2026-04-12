using Microsoft.OpenApi;

namespace Shift_Manager.Server.Configuration;

public static class SwaggerConfig
{
    public static void Configure(Swashbuckle.AspNetCore.SwaggerGen.SwaggerGenOptions c)
    {

        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            In = ParameterLocation.Header,
            Description = "Bearer JWT token"
        });
    }
}
