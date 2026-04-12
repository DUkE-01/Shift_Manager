using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Shift_Manager.Server.Configuration;

public class BearerSecurityOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var hasAuthorize = context.MethodInfo.DeclaringType?.GetCustomAttributes(true).OfType<AuthorizeAttribute>().Any() == true ||
                           context.MethodInfo.GetCustomAttributes(true).OfType<AuthorizeAttribute>().Any();

        var allowAnonymous = context.MethodInfo.GetCustomAttributes(true).OfType<AllowAnonymousAttribute>().Any();

        if (hasAuthorize && !allowAnonymous)
        {
            if (operation.Parameters == null)
            {
                operation.Parameters = new List<IOpenApiParameter>();
            }
            operation.Parameters.Add(new OpenApiParameter
            {
                Name = "Swagger-Auth",
                In = ParameterLocation.Header,
                Description = "Token literal sin la palabra Bearer: eyJhb...",
                Required = true
            });
        }
    }
}
