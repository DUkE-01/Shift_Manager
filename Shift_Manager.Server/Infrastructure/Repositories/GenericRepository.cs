using Microsoft.EntityFrameworkCore;

using Shift_Manager.Server.Application.Interfaces;
using Shift_Manager.Server.Domain.Common.Exceptions;
using Shift_Manager.Server.Infrastructure.Context;

using System.Linq.Expressions;

namespace Shift_Manager.Server.Infrastructure.Repositories;

/// <summary>
/// Generic EF Core repository providing standard CRUD operations.
/// Exceptions are wrapped in <see cref="RepositoryException"/> so callers
/// don't need to handle EF internals.
/// </summary>
public class GenericRepository<T>(
    ShiftManagerDbContext context,
    ILogger<GenericRepository<T>> logger) : IGenericRepository<T>
    where T : class
{
    private readonly DbSet<T> _dbSet = context.Set<T>();

    public async Task<IEnumerable<T>> GetAllAsync()
    {
        try
        {
            return await _dbSet.AsNoTracking().ToListAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error fetching all {Entity}", typeof(T).Name);
            throw new RepositoryException($"No se pudieron obtener registros de {typeof(T).Name}", ex);
        }
    }

    public async Task<T?> GetByIdAsync(int id)
    {
        try
        {
            return await _dbSet.FindAsync(id);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error fetching {Entity} with ID {Id}", typeof(T).Name, id);
            throw new RepositoryException($"No se pudo obtener el registro con ID {id}", ex);
        }
    }

    public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        try
        {
            return await _dbSet.AsNoTracking().Where(predicate).ToListAsync();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error querying {Entity}", typeof(T).Name);
            throw new RepositoryException($"Error al consultar {typeof(T).Name}", ex);
        }
    }

    public async Task AddAsync(T entity)
    {
        ArgumentNullException.ThrowIfNull(entity);
        try
        {
            await _dbSet.AddAsync(entity);
            await context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            logger.LogError(ex, "Error saving {Entity}", typeof(T).Name);
            throw new RepositoryException($"Error al guardar {typeof(T).Name}", ex);
        }
    }

    public async Task UpdateAsync(T entity)
    {
        ArgumentNullException.ThrowIfNull(entity);
        try
        {
            _dbSet.Update(entity);
            await context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            logger.LogError(ex, "Error updating {Entity}", typeof(T).Name);
            throw new RepositoryException($"Error actualizando {typeof(T).Name}", ex);
        }
    }

    public async Task DeleteAsync(int id)
    {
        try
        {
            var entity = await _dbSet.FindAsync(id)
                ?? throw new NotFoundException($"Entidad con ID {id} no encontrada");

            _dbSet.Remove(entity);
            await context.SaveChangesAsync();
        }
        catch (NotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error deleting {Entity} with ID {Id}", typeof(T).Name, id);
            throw new RepositoryException($"Error eliminando entidad con ID {id}", ex);
        }
    }

    public Task SaveAsync() => context.SaveChangesAsync();
}
