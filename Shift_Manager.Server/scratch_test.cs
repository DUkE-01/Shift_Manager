using System;
using System.Reflection;
using Microsoft.OpenApi;

public class TestSwag
{
    public void M()
    {
        var x = new OpenApiSecurityScheme();
        var y = new OpenApiSecurityRequirement();
        var t = typeof(Microsoft.OpenApi.OpenApiSecurityScheme).GetProperties();
        foreach (var p in t) Console.WriteLine(p.Name);
    }
}
