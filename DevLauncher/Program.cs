using System.Diagnostics;

var startInfoBackend = new ProcessStartInfo
{
    FileName = "dotnet",
    Arguments = "run --project ..\\Shift_Manager.Server\\Shift_Manager.Server.csproj",
    WorkingDirectory = Environment.CurrentDirectory,
    RedirectStandardOutput = true,
    RedirectStandardError = true,
    UseShellExecute = false
};

var startInfoFrontend = new ProcessStartInfo
{
    FileName = "npm",
    Arguments = "run dev --prefix ..\\shift_manager.client",
    WorkingDirectory = Environment.CurrentDirectory,
    RedirectStandardOutput = true,
    RedirectStandardError = true,
    UseShellExecute = false
};

var backend = Process.Start(startInfoBackend);
var frontend = Process.Start(startInfoFrontend);

if (backend == null || frontend == null)
{
    Console.WriteLine("Failed to start backend or frontend process.");
    return;
}

_ = Task.Run(async () =>
{
    var buffer = new char[4096];
    while (!backend.HasExited)
    {
        var s = await backend.StandardOutput.ReadLineAsync();
        if (s != null) Console.WriteLine("[BACKEND] " + s);
    }
});

_ = Task.Run(async () =>
{
    while (!frontend.HasExited)
    {
        var s = await frontend.StandardOutput.ReadLineAsync();
        if (s != null) Console.WriteLine("[FRONTEND] " + s);
    }
});

Console.WriteLine("Press Ctrl+C to exit.");
await Task.Delay(-1);
