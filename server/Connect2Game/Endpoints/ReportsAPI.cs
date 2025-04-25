using Connect2Game.Auth.Model;
using Connect2Game.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SharpGrip.FluentValidation.AutoValidation.Endpoints.Extensions;
using System.Security.Claims;

namespace Connect2Game.Endpoints
{
    public static class ReportsAPI
    {
        public static void AddReportsAPI(this WebApplication app)
        {
            var reportsList = app.MapGroup("/api").AddFluentValidationAutoValidation();


            reportsList.MapPut("/reports/{foreignKey}", [Authorize(Roles = "Admin,Moderator")] async (int foreignKey, ApiDbContext dbContext, UpdateReportDto dto) =>
            {
                var report = await dbContext.reports.FirstOrDefaultAsync(t => t.Id == foreignKey);
                if (report == null)
                {
                    return Results.NotFound();
                }

                report.BanTime = dto.BanTime;

                dbContext.reports.Update(report);

                await dbContext.SaveChangesAsync();

                return Results.Ok(report.ToDto());
            });

            reportsList.MapGet("/reports/canLogin/{userId}", async (String userId, ApiDbContext dbContext) =>
            {
                var report = await dbContext.reports.FirstOrDefaultAsync(r => r.UserId == userId);

                if (report == null)
                {
                    return Results.NotFound("User not found.");
                }

                if (report.BanTime > DateTime.UtcNow)
                {   
                    return Results.Problem(
                        detail: report.BanTime.ToString("o"),
                        statusCode: StatusCodes.Status403Forbidden
                     );

                }

                return Results.Ok();
            });

            reportsList.MapPost("/reports/flag/{userId}", async (string userId, ApiDbContext dbContext, CreateReportDto dto) =>
            {
                var profile = await dbContext.Users.FirstOrDefaultAsync(p => p.Id == userId);
                if (profile == null)
                {
                    return Results.NotFound();
                }

                var existingReport = await dbContext.reports.FirstOrDefaultAsync(r => r.UserId == userId);

                if (existingReport != null)
                {
                    return Results.Conflict();
                }

                var newReport = new Report
                {
                    UserId = userId,
                    CreationDate = DateTimeOffset.UtcNow,
                    FlaggedCount = 1, 
                    Profile = profile
                };

                dbContext.reports.Add(newReport);
                await dbContext.SaveChangesAsync();

                return Results.Created($"/reports/{newReport.Id}", newReport.ToDto());
            });


            reportsList.MapPut("/reports/flag/{userId}", async (string userId, ApiDbContext dbContext) =>
            {
                var report = await dbContext.reports.FirstOrDefaultAsync(r => r.UserId == userId);

                if (report == null)
                {
                    return Results.NotFound();
                }

                if (report.BanTime != DateTimeOffset.MinValue && report.BanTime < DateTimeOffset.UtcNow)
                {
                    report.BanTime = DateTimeOffset.MinValue;
                }

                report.FlaggedCount += 1;
                report.CreationDate = DateTimeOffset.UtcNow;
                await dbContext.SaveChangesAsync();

                return Results.Ok(report.ToDto());
            });


            reportsList.MapDelete("/reports/{foreignKey}", [Authorize(Roles = "Admin,Moderator")] async (int foreignKey, ApiDbContext dbContext) =>
            {
                var report = await dbContext.reports.FirstOrDefaultAsync(t => t.Id == foreignKey);
                if (report == null)
                {
                    return Results.NotFound();
                }

                dbContext.reports.Remove(report);
                await dbContext.SaveChangesAsync();

                return Results.NoContent();
            });

            reportsList.MapGet("/reports", async (ApiDbContext dbContext, int page = 1, int pageSize = 5, bool? isBanned = null) =>
            {
                if (page < 1 || pageSize < 1)
                {
                    return Results.BadRequest("Page and pageSize must be greater than 0.");
                }


                var query = dbContext.reports.AsQueryable();

 
                if (isBanned.HasValue)
                {
                    if (isBanned.Value)
                    {
                        query = query.Where(r => r.BanTime == DateTimeOffset.MinValue || r.BanTime > DateTime.UtcNow);
                    }
                    else
                    {
                        query = query.Where(r => r.BanTime != DateTimeOffset.MinValue && r.BanTime <= DateTime.UtcNow);
                    }
                }


                var totalReports = await query.CountAsync();


                var reports = await query
                    .OrderBy(r => r.Id)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize) 
                    .Select(r => r.ToDto()) 
                    .ToListAsync();

                return Results.Ok(new
                {
                    TotalReports = totalReports,
                    Reports = reports
                });
            });

            reportsList.MapPost("/invalidate-sessions/{userId}", [Authorize(Roles = "Admin,Moderator")] async (String userId, ApiDbContext dbContext) =>
            {

                var activeSessions = await dbContext.Sessions
                    .Where(s => s.UserId == userId && !s.IsRevoked)
                    .ToListAsync();


                if (!activeSessions.Any())
                {
                    return Results.NotFound();
                }

                foreach (var session in activeSessions)
                {
                    session.IsRevoked = true;
                }

                await dbContext.SaveChangesAsync();

                return Results.Ok();

            });

        }
    }
}
