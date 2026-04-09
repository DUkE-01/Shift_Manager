using System.Security.Cryptography;

namespace Shift_Manager.Server.Configuration;

public static class PathValidator
{
    private static readonly string[] ForbiddenPatterns = { "..", "~", "//", "\\\\" };

    /// <summary>
    /// Valida que una ruta sea segura y no contenga path traversal.
    /// </summary>
    public static string ValidatePath(string path)
    {
        if (string.IsNullOrWhiteSpace(path))
            throw new ArgumentNullException(nameof(path));

        // Convertir a ruta absoluta y normalizar
        var fullPath = Path.GetFullPath(path);

        // Verificar patrones peligrosos
        foreach (var pattern in ForbiddenPatterns)
        {
            if (fullPath.Contains(pattern))
                // Usar Exception genérica o custom (SecurityException no existe sin using)
                throw new InvalidOperationException($"Ruta contiene patrón prohibido: {pattern}");
        }

        // Verificar que la ruta existe
        if (!Directory.Exists(fullPath) && !File.Exists(fullPath))
            throw new FileNotFoundException($"Ruta no existe: {fullPath}");

        return fullPath;
    }
}
