using Connect2Game.Model;
using Microsoft.AspNetCore.Authorization;
using SharpGrip.FluentValidation.AutoValidation.Endpoints.Extensions;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.EntityFrameworkCore;
using Connect2Game.Auth.Model;
using Connect2Game.Azure;

namespace Connect2Game.Endpoints
{
    public static class ProfileFilterAPI
    {
        public static void AddProfileFilterAPI(this WebApplication app)
        {
            var profileFilters = app.MapGroup("/api").AddFluentValidationAutoValidation();

            profileFilters.MapPost("/profileFilters/{foreignKey}", [Authorize] async (ApiDbContext dbContext, HttpContext httpContext, int foreignKey) =>
            {
                var profile = await dbContext.Users.FirstOrDefaultAsync(p => p.Id == httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub));
                if (profile == null)
                {
                    return Results.NotFound();
                }

                var SubCategoryFiler = await dbContext.subCategoriesFilter.FirstOrDefaultAsync(c => c.Id == foreignKey);

                if (SubCategoryFiler == null)
                {
                    Results.NotFound();
                }
             
                var profileFilter = new ProfileFilter { CreationDate = DateTimeOffset.UtcNow, ForeignKeySubCategoryFilter = SubCategoryFiler, UserId = httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub), Profile = profile };

                dbContext.profileFilters.Add(profileFilter);

                await dbContext.SaveChangesAsync();

                return Results.Created($"api/profileFilters", profileFilter.ToDto());


            });

            profileFilters.MapGet("/profileFilters/{foreignKey}", async (ApiDbContext dbContext, HttpContext httpContext, String foreignKey) =>
            {

                var categories = await dbContext.profileFilters
                    .Include(c => c.ForeignKeySubCategoryFilter)
                    .Where(c => c.UserId == foreignKey)
                    .Select(c => c.ToDto())
                    .ToListAsync();

                return Results.Ok(categories);
            });

            profileFilters.MapGet("/profileFilters/forSubcategory/{foreignKey}", async (ApiDbContext dbContext, HttpContext httpContext, int foreignKey, int skip = 0, int take = 9) =>
            {
                var categories = await dbContext.profileFilters
                    .Include(c => c.ForeignKeySubCategoryFilter)
                    .Where(c => c.ForeignKeySubCategoryFilter.Id == foreignKey)
                    .Skip(skip) 
                    .Take(take) 
                    .Select(c => c.ToDto())
                    .ToListAsync();

                return Results.Ok(categories);
            });


            profileFilters.MapDelete("/profileFilters/{foreignKey}", [Authorize] async (int foreignKey, ApiDbContext dbContext, HttpContext httpContext) =>
            {
                var profileFilter = await dbContext.profileFilters.FirstOrDefaultAsync(i => i.ForeignKeySubCategoryFilter.Id == foreignKey && i.UserId == httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub));
                if (profileFilter == null)
                {
                    return Results.NotFound();
                }

                dbContext.profileFilters.Remove(profileFilter);
                await dbContext.SaveChangesAsync();

                return Results.NoContent();
            });

        }
    }
}
