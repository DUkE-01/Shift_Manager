using System.Linq.Expressions;

namespace Shift_Manager.Server.Application.Interfaces;

/// <summary>
/// Standard CRUD contract for all EF Core repositories.
/// Uses strongly typed <c>int</c> id to match SQL Server identity columns.
/// </summary>
public interface IGenericRepository<T> where T : class
{
    Task<IEnumerable<T>> GetAllAsync();
    Task<T?> GetByIdAsync(int id);
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(int id);
    Task SaveAsync();
}
