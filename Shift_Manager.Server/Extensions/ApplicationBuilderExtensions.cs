using System.IO;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Options;
using Shift_Manager.Server.Configuration;

namespace Shift_Manager.Server.Extensions;

public static class ApplicationBuilderExtensions
{
    /// <summary>
    /// Serves the React SPA from the configured dist folder.
    /// Falls back to wwwroot if the dist folder doesn't exist (CI environments).
    /// </summary>
    public static void MapStaticFilesAndSpaFallback(
        this WebApplication app,
        IWebHostEnvironment env)
    {
        var clientOpts = app.Services
            .GetRequiredService<IOptions<ClientPathOptions>>().Value;

        // Candidate paths to look for the built SPA
        var candidates = new[] {
            Path.GetFullPath(Path.Combine(env.ContentRootPath, "..", clientOpts.DistFolder)),
            Path.GetFullPath(Path.Combine(env.ContentRootPath, "..", "shift_manager.client", clientOpts.DistFolder)),
            Path.GetFullPath(Path.Combine(env.ContentRootPath, "..", "shift_manager.client", "dist"))
        };

        string? distPath = candidates.FirstOrDefault(Directory.Exists);

        if (!string.IsNullOrEmpty(distPath))
        {
            var fileProvider = new PhysicalFileProvider(distPath);

            app.UseDefaultFiles(new DefaultFilesOptions
            {
                FileProvider = fileProvider,
                DefaultFileNames = new[] { clientOpts.FallbackFile }
            });

            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = fileProvider,
                RequestPath = string.Empty
            });

            // Robust fallback: serve the SPA fallback file using the same file provider
            app.MapFallback(async context =>
            {
                var file = fileProvider.GetFileInfo(clientOpts.FallbackFile);
                if (file.Exists)
                {
                    context.Response.ContentType = "text/html";
                    await context.Response.SendFileAsync(file);
                }
                else
                {
                    context.Response.StatusCode = StatusCodes.Status404NotFound;
                }
            });
        }
        else
        {
            // Development without a built frontend
            app.UseDefaultFiles();
            app.UseStaticFiles();
            app.MapFallbackToFile("/index.html");
        }
    }
}
