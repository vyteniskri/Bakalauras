using Connect2Game.Model;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddDbContext<ApiDbContext>();

var app = builder.Build();

app.MapControllers();

var profiles = app.MapGroup("/api");

profiles.MapGet("/p", () => "Get ALL");
app.Run();
