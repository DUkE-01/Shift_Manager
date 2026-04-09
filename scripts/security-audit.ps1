# Ejecutar regularmente
dotnet list package --vulnerable
dotnet outdated
dotnet add package Microsoft.IdentityModel.Tokens --version 8.0.1
dotnet add package System.IdentityModel.Tokens.Jwt --version 8.0.1