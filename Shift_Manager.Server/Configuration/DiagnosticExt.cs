using System;
using System.IO;
using System.Linq;
using System.Reflection;
using Microsoft.AspNetCore.Builder;

// We will drop an endpoint that prints the types of Microsoft.OpenApi
public static class DiagnosticExt
{
    public static void MapDiagnostic(this WebApplication app)
    {
        app.MapGet("/api/debug-openapi", () => {
            var asm = AppDomain.CurrentDomain.GetAssemblies().FirstOrDefault(a => a.GetName().Name == "Microsoft.OpenApi");
            if (asm == null) return "No assembly found";
            var types = asm.GetTypes().Where(t => t.Name.Contains("Security") || t.Name.Contains("Reference"));
            return string.Join("\n", types.Select(t => t.FullName));
        });
    }
}
