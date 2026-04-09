using Microsoft.EntityFrameworkCore;

using Shift_Manager.Server.Domain.Common.Exceptions;
using Shift_Manager.Server.Domain.Entities;
using Shift_Manager.Server.Infrastructure.Context;

namespace Shift_Manager.Server.Application.Services;

// ─── DTO ─────────────────────────────────────────────────────────────────────

public sealed class AgenteUpsertDto
{
    // Spanish names (canonical)
    public string? Codigo_Agente { get; init; }
    public string? Nombre { get; init; }
    public string? Apellido { get; init; }
    public string? Cedula { get; init; }
    public string? Rango { get; init; }
    public string? Contacto { get; init; }
    public int ID_Cuadrante { get; init; }
    public bool? Disponibilidad { get; init; }
    public bool Activo { get; init; } = true;
    public int? PuestoAsignado { get; init; }

    // English aliases (from legacy frontend schema)
    public string? Name { get; init; }
    public string? Badge { get; init; }
    public string? Rank { get; init; }
    public string? Phone { get; init; }
    /// <summary>"on_duty" | "off_duty"</summary>
    public string? Status { get; init; }

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
    Task<IEnumerable<Agente>> GetAllAsync();
    Task<Agente?> GetByIdAsync(int id);
    Task<Agente> CreateAsync(AgenteUpsertDto dto);
    Task<Agente> UpdateAsync(int id, AgenteUpsertDto dto);
    Task DeleteAsync(int id);
}

// ─── Implementation ───────────────────────────────────────────────────────────

public sealed class AgentService(ShiftManagerDbContext db) : IAgentService
{
    public Task<IEnumerable<Agente>> GetAllAsync()
        => db.Agentes
            .Include(a => a.Cuadrante)
            .AsNoTracking()
            .ToListAsync()
            .ContinueWith(t => (IEnumerable<Agente>)t.Result);

    public Task<Agente?> GetByIdAsync(int id)
        => db.Agentes
            .Include(a => a.Cuadrante)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.ID_Agente == id);

    public async Task<Agente> CreateAsync(AgenteUpsertDto dto)
    {
        if (!await db.Cuadrantes.AnyAsync(c => c.ID_Cuadrante == dto.ID_Cuadrante))
            throw new NotFoundException($"Cuadrante {dto.ID_Cuadrante} no existe.");

        var agente = MapToNewEntity(dto);
        db.Agentes.Add(agente);
        await db.SaveChangesAsync();
        return agente;
    }

    public async Task<Agente> UpdateAsync(int id, AgenteUpsertDto dto)
    {
        var agente = await db.Agentes.FindAsync(id)
            ?? throw new NotFoundException($"Agente {id} no encontrado.");

        ApplyUpdates(agente, dto);
        await db.SaveChangesAsync();
        return agente;
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
        PuestoAsignado = dto.PuestoAsignado ?? 1,
    };

    private static void ApplyUpdates(Agente agente, AgenteUpsertDto dto)
    {
        if (!string.IsNullOrEmpty(dto.ResolvedRango)) agente.Rango = dto.ResolvedRango;
        if (!string.IsNullOrEmpty(dto.ResolvedContacto)) agente.Contacto = dto.ResolvedContacto;
        if (dto.Status is not null) agente.Disponibilidad = dto.Status == "on_duty";
        if (dto.PuestoAsignado.HasValue) agente.PuestoAsignado = dto.PuestoAsignado.Value;
        if (dto.Disponibilidad.HasValue) agente.Disponibilidad = dto.Disponibilidad.Value;
        if (dto.ID_Cuadrante > 0) agente.ID_Cuadrante = dto.ID_Cuadrante;
        if (!string.IsNullOrEmpty(dto.ResolvedNombre)) agente.Nombre = dto.ResolvedNombre;
        if (!string.IsNullOrEmpty(dto.Apellido)) agente.Apellido = dto.Apellido;
        if (!string.IsNullOrEmpty(dto.Cedula)) agente.Cedula = dto.Cedula;
        if (!string.IsNullOrEmpty(dto.ResolvedCodigo)) agente.Codigo_Agente = dto.ResolvedCodigo;
        agente.FechaModificacion = DateTime.UtcNow;
    }
}
