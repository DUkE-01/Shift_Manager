using System.Collections.Generic;
using System.Linq;

namespace Shift_Manager.Server.Domain.Common.Helpers
{
    public static class CuadranteMapping
    {
        // Definición de circunscripciones basada en IDs de cuadrantes
        // Replicando lógica del frontend:
        // C1: 1, 2, 7
        // C2: 5, 6
        // C3: 3, 4
        
        private static readonly Dictionary<int, int> _mapping = new Dictionary<int, int>
        {
            { 1, 1 }, { 2, 1 }, { 7, 1 },
            { 5, 2 }, { 6, 2 },
            { 3, 3 }, { 4, 3 }
        };

        public static int? GetCircunscripcion(int idCuadrante)
        {
            if (_mapping.TryGetValue(idCuadrante, out var circunscripcion))
            {
                return circunscripcion;
            }
            return null;
        }

        public static IEnumerable<int> GetCuadrantesByCircunscripcion(int circunscripcion)
        {
            return _mapping
                .Where(kvp => kvp.Value == circunscripcion)
                .Select(kvp => kvp.Key);
        }
    }
}
