using Microsoft.EntityFrameworkCore;

using Shift_Manager.Server.Domain.Common.Exceptions;
using Shift_Manager.Server.Domain.Entities;
using Shift_Manager.Server.Infrastructure.Context;
using Shift_Manager.Server.Application.DTOs.Agentes;
using Shift_Manager.Server.Domain.Common.Helpers;
using System.Text.Json.Serialization;
using System.Text.Json;

namespace Shift_Manager.Server.Application.Services;

// ─── DTO ─────────────────────────────────────────────────────────────────────

public sealed class AgenteUpsertDto
{
    // Spanish names (canonical)
    [JsonPropertyName("Codigo_Agente")]
    public string? Codigo_Agente { get; set; }

    [JsonPropertyName("Nombre")]
    public string? Nombre { get; set; }

    [JsonPropertyName("Apellido")]
    public string? Apellido { get; set; }

    [JsonPropertyName("Cedula")]
    public string? Cedula { get; set; }

    [JsonPropertyName("Rango")]
    public string? Rango { get; set; }

    [JsonPropertyName("Contacto")]
    public string? Contacto { get; set; }

    [JsonPropertyName("ID_Cuadrante")]
    public int ID_Cuadrante { get; set; }

    [JsonPropertyName("Disponibilidad")]
    public bool? Disponibilidad { get; set; }

    [JsonPropertyName("Activo")]
    public bool Activo { get; set; } = true;

    [JsonPropertyName("PuestoAsignado")]
    public object? PuestoAsignado { get; set; }

    // English aliases (from legacy frontend schema)
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("badge")]
    public string? Badge { get; set; }

    [JsonPropertyName("rank")]
    public string? Rank { get; set; }

    [JsonPropertyName("phone")]
    public string? Phone { get; set; }

    /// <summary>"on_duty" | "off_duty"</summary>
    [JsonPropertyName("status")]
    public string? Status { get; set; }

    [JsonPropertyName("cuadrantes")]
    public string[]? Cuadrantes { get; set; }

    // Resolved helpers (prefer Spanish, fall back to English)
    internal string ResolvedCodigo => Codigo_Agente ?? Badge ?? string.Empty;
    internal string ResolvedNombre => Nombre ?? Name?.Split(' ').FirstOrDefault() ?? string.Empty;
    internal string ResolvedApellido => Apellido ?? (Name != null
        ? string.Join(" ", Name.Split(' ').Skip(1)) : string.Empty);
    internal string ResolvedRango => Rango ?? Rank ?? "Agente";
    internal string? ResolvedContacto => Contacto ?? Phone;
    internal bool ResolvedDisponibilidad => Disponibilidad ?? Status == "on_duty";
}

// ─── Contract ─────────────────────────────────────────────────────────────────

public interface IAgentService
{
    Task<IEnumerable<AgenteDto>> GetAllAsync();
    Task<AgenteDto?> GetByIdAsync(int id);
    Task<AgenteDto> CreateAsync(AgenteUpsertDto dto);
    Task<AgenteDto> UpdateAsync(int id, AgenteUpsertDto dto);
    Task DeleteAsync(int id);
}

// ─── Implementation ───────────────────────────────────────────────────────────

public sealed class AgentService(ShiftManagerDbContext db) : IAgentService
{
    public async Task<IEnumerable<AgenteDto>> GetAllAsync()
    {
        var agentes = await db.Agentes
            .Include(a => a.Cuadrante)
            .AsNoTracking()
            .ToListAsync();
        return agentes.Select(MapToDto);
    }

    public async Task<AgenteDto?> GetByIdAsync(int id)
    {
        var agente = await db.Agentes
            .Include(a => a.Cuadrante)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.ID_Agente == id);
        return agente != null ? MapToDto(agente) : null;
    }

    public async Task<AgenteDto> CreateAsync(AgenteUpsertDto dto)
    {
        if (!await db.Cuadrantes.AnyAsync(c => c.ID_Cuadrante == dto.ID_Cuadrante))
            throw new NotFoundException($"Cuadrante {dto.ID_Cuadrante} no existe.");

        var agente = MapToNewEntity(dto);
        db.Agentes.Add(agente);
        await db.SaveChangesAsync();
        return MapToDto(agente);
    }

    public async Task<AgenteDto> UpdateAsync(int id, AgenteUpsertDto dto)
    {
        var agente = await db.Agentes.FindAsync(id)
            ?? throw new NotFoundException($"Agente {id} no encontrado.");

        ApplyUpdates(agente, dto);
        db.Entry(agente).State = EntityState.Modified;
        await db.SaveChangesAsync();
        return MapToDto(agente);
    }

    public async Task DeleteAsync(int id)
    {
        var agente = await db.Agentes.FindAsync(id)
            ?? throw new NotFoundException($"Agente {id} no encontrado.");

        db.Agentes.Remove(agente);
        await db.SaveChangesAsync();
    }

    // ── Mapping helpers ───────────────────────────────────────────────────────

    private static Agente MapToNewEntity(AgenteUpsertDto dto) => new()
    {
        Codigo_Agente = dto.ResolvedCodigo,
        Nombre = dto.ResolvedNombre,
        Apellido = dto.ResolvedApellido,
        Cedula = dto.Cedula ?? string.Empty,
        Rango = dto.ResolvedRango,
        Contacto = dto.ResolvedContacto,
        ID_Cuadrante = dto.ID_Cuadrante > 0 ? dto.ID_Cuadrante : 1,
        Disponibilidad = dto.ResolvedDisponibilidad,
        Activo = true,
        FechaCreacion = DateTime.UtcNow,
        PuestoAsignado = ParsePuesto(dto.PuestoAsignado) ?? 1,
    };

    private static void ApplyUpdates(Agente agente, AgenteUpsertDto dto)
    {
        if (!string.IsNullOrEmpty(dto.ResolvedRango)) agente.Rango = dto.ResolvedRango;
        if (!string.IsNullOrEmpty(dto.ResolvedContacto)) agente.Contacto = dto.ResolvedContacto;
        if (dto.Status is not null) agente.Disponibilidad = dto.Status == "on_duty";
        
        var parsedPuesto = ParsePuesto(dto.PuestoAsignado);
        if (parsedPuesto.HasValue) agente.PuestoAsignado = parsedPuesto.Value;

        if (dto.Disponibilidad.HasValue) agente.Disponibilidad = dto.Disponibilidad.Value;
        
        // Handle Cuadrante ID from explicit property or from the string array sent by frontend
        if (dto.ID_Cuadrante > 0) 
        {
            agente.ID_Cuadrante = dto.ID_Cuadrante;
        }
        else if (dto.Cuadrantes != null && dto.Cuadrantes.Length > 0 && int.TryParse(dto.Cuadrantes[0], out var firstId))
        {
            agente.ID_Cuadrante = firstId;
        }
        if (!string.IsNullOrEmpty(dto.ResolvedNombre)) agente.Nombre = dto.ResolvedNombre;
        if (!string.IsNullOrEmpty(dto.ResolvedApellido)) agente.Apellido = dto.ResolvedApellido;
        if (!string.IsNullOrEmpty(dto.Cedula)) agente.Cedula = dto.Cedula;
        if (!string.IsNullOrEmpty(dto.ResolvedCodigo)) agente.Codigo_Agente = dto.ResolvedCodigo;
        agente.FechaModificacion = DateTime.UtcNow;
    }

    private static AgenteDto MapToDto(Agente a) => new()
    {
        ID_Agente = a.ID_Agente,
        Nombre = a.Nombre,
        Apellido = a.Apellido,
        Cedula = a.Cedula,
        Codigo_Agente = a.Codigo_Agente,
        Rango = a.Rango,
        Contacto = a.Contacto,
        Disponibilidad = a.Disponibilidad,
        PuestoAsignado = a.PuestoAsignado,
        ID_Cuadrante = a.ID_Cuadrante,
        FechaCreacion = a.FechaCreacion
    };

    private static int? ParsePuesto(object? val)
    {
        if (val == null) return null;
        
        // Handle JsonElement (default binder type for 'object' properties)
        if (val is JsonElement je)
        {
            if (je.ValueKind == JsonValueKind.Number && je.TryGetInt32(out var num)) return num;
            if (je.ValueKind == JsonValueKind.String)
            {
                var s = je.GetString();
                if (int.TryParse(s, out var p)) return p;
                return MapStringToPuesto(s);
            }
            return null;
        }

        if (val is int i) return i;
        if (val is long l) return (int)l;
        if (val is string str)
        {
            if (int.TryParse(str, out var p)) return p;
            return MapStringToPuesto(str);
        }
        return null;
    }

    private static int? MapStringToPuesto(string? s)
    {
        if (string.IsNullOrWhiteSpace(s)) return null;
        return s.Trim().ToLower() switch
        {
            "palacio" => 1,
            "patrullero" => 2,
            "puesto fijo" => 3,
            _ => null
        };
    }

    private static string MapPuestoToString(int p) => p switch
    {
        1 => "Palacio",
        2 => "Patrullero",
        3 => "Puesto Fijo",
        _ => "Patrullero"
    };
}
