using Connect2Game.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using SharpGrip.FluentValidation.AutoValidation.Endpoints.Extensions;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Connect2Game.Endpoints
{
    public static class WarningAPI
    {
        public static void AddWarningAPI(this WebApplication app)
        {
            var warnings = app.MapGroup("/api").AddFluentValidationAutoValidation();

            warnings.MapGet("/warnings/{foreignKey}", async (ApiDbContext dbContext, int foreignKey, HttpContext httpContext) =>
            {
                var report = await dbContext.reports.FirstOrDefaultAsync(p => p.Id == foreignKey);

                if (report == null)
                {
                    return Results.NotFound();
                }

                var warning = await dbContext.warnings.FirstOrDefaultAsync(c => c.Report.Id == foreignKey);

                if (warning == null)
                {
                    return Results.NotFound();
                }

                return Results.Ok(warning.ToDto());
            });

            warnings.MapPost("/warnings/{foreignKey}", [Authorize] async (int foreignKey, ApiDbContext dbContext, HttpContext httpContext, CreateWarningDto dto) =>
            {
                var report = await dbContext.reports.FirstOrDefaultAsync(p => p.Id == foreignKey);

                if (report == null)
                {
                    return Results.NotFound();
                }

                var warning = new Warning { CreationDate = DateTimeOffset.UtcNow, Report = report, Text = dto.Text };

                dbContext.warnings.Add(warning);

                await dbContext.SaveChangesAsync();

                return Results.Created($"api/warnings", warning.ToDto());
            });

            warnings.MapDelete("/warnings/{foreignKey}", [Authorize] async (int foreignKey, ApiDbContext dbContext, HttpContext httpContext) =>
            {
                var warning = await dbContext.warnings.FirstOrDefaultAsync(c => c.Report.Id == foreignKey);

                if (warning == null)
                {
                    return Results.NotFound();
                }

                dbContext.warnings.Remove(warning);

                await dbContext.SaveChangesAsync();

                return Results.NoContent();
            });

            warnings.MapPut("/warnings/{foreignKey}", [Authorize] async (int foreignKey, ApiDbContext dbContext, HttpContext httpContext) =>
            {
                var warning = await dbContext.warnings.FirstOrDefaultAsync(c => c.Id == foreignKey);

                if (warning == null)
                {
                    return Results.NotFound();
                }

                warning.Clicked = true;

                dbContext.warnings.Update(warning);
                await dbContext.SaveChangesAsync();

                return Results.Ok();
            });

        }
        
    }
}
