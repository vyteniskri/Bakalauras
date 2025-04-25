using Connect2Game.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SharpGrip.FluentValidation.AutoValidation.Endpoints.Extensions;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Connect2Game.Endpoints
{
    public static class SubCategoryProfileAPI
    {
        public static void AddSubCategoryProfileAPI(this WebApplication app)
        {
            var subCategoiresProfiles = app.MapGroup("/api").AddFluentValidationAutoValidation();


            subCategoiresProfiles.MapPost("/subCategoriesProfile/{foreignKey}", [Authorize] async (ApiDbContext dbContext, HttpContext httpContext, int foreignKey) =>
            {
                var profile = await dbContext.Users.FirstOrDefaultAsync(p => p.Id == httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub));
                if (profile == null)
                {
                    return Results.NotFound();
                }

                var subCategory = await dbContext.subCategory2s.FirstOrDefaultAsync(c => c.Id == foreignKey);

                if (subCategory == null )
                {
                    Results.NotFound();
                }

                var subCategoryProfile = new SubCategoryProfile { CreationDate = DateTimeOffset.UtcNow, ForeignKeySubcategory2 = subCategory, UserId = httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub), Profile = profile };

                dbContext.subCategoriesProfile.Add(subCategoryProfile);

                await dbContext.SaveChangesAsync();

                return Results.Created($"subCategoriesProfile", subCategoryProfile.ToDto());


            });

            subCategoiresProfiles.MapGet("/subCategoriesProfile/userId/{foreignKey}", async (ApiDbContext dbContext, HttpContext httpContext, String foreignKey) =>
            {

                var subCategoryProfile = await dbContext.subCategoriesProfile
                    .Include(c => c.ForeignKeySubcategory2)
                    .Where(c => c.UserId == foreignKey)
                    .Select(c => c.ToDto())
                    .ToListAsync();

                return Results.Ok(subCategoryProfile);
            });

            subCategoiresProfiles.MapGet("/subCategoriesProfile/subId/{foreignKey}", async (ApiDbContext dbContext, HttpContext httpContext, int foreignKey) =>
            {

                var subCategoryProfile = await dbContext.subCategoriesProfile
                    .Include(c => c.ForeignKeySubcategory2)
                    .Where(c => c.ForeignKeySubcategory2.Id == foreignKey && c.UserId == httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub))
                    .Select(c => c.ToDto())
                    .ToListAsync();

                return Results.Ok(subCategoryProfile);
            });

            subCategoiresProfiles.MapDelete("/subCategoriesProfile/{foreignKey}", [Authorize] async (int foreignKey, ApiDbContext dbContext, HttpContext httpContext) =>
            {
                var subCategoryProfile = await dbContext.subCategoriesProfile.FirstOrDefaultAsync(i => i.ForeignKeySubcategory2.Id == foreignKey && i.UserId == httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub));
                if (subCategoryProfile == null)
                {
                    return Results.NotFound();
                }

                dbContext.subCategoriesProfile.Remove(subCategoryProfile);
                await dbContext.SaveChangesAsync();

                return Results.NoContent();
            });

        }
    }
}
