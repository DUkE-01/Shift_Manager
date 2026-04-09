namespace Shift_Manager.Server.Domain.Common.Exceptions;

/// <summary>
/// Thrown when a requested resource is not found. Maps to HTTP 404.
/// </summary>
public class NotFoundException(string message) : Exception(message);

/// <summary>
/// Thrown when a business rule is violated. Maps to HTTP 400.
/// </summary>
public class BusinessRuleException(string message) : Exception(message);

/// <summary>
/// Thrown when a data conflict occurs (e.g. schedule overlap). Maps to HTTP 409.
/// </summary>
public class ConflictException(string message) : Exception(message);

/// <summary>
/// Thrown by repositories on persistence failures. Wraps EF exceptions.
/// </summary>
public class RepositoryException : Exception
{
    public RepositoryException(string message) : base(message) { }
    public RepositoryException(string message, Exception inner) : base(message, inner) { }
}
