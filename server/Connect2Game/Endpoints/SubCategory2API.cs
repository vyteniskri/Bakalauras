using Connect2Game.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using SharpGrip.FluentValidation.AutoValidation.Endpoints.Extensions;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Connect2Game.Endpoints
{
    public static class SubCategory2API
    {
        public static void AddSubCategory2API(this WebApplication app)
        {
            var subCategories2 = app.MapGroup("/api").AddFluentValidationAutoValidation();

            subCategories2.MapGet("/subCategories2/{foreignKey}", async (ApiDbContext dbContext, int foreignKey) =>
            {
                var subCategories2 = await dbContext.subCategory2s
                                    .Include(t => t.ForeignKeyCategory2)
                                    .Where(t => t.ForeignKeyCategory2.Id == foreignKey)
                                    .Select(c => c.ToDto())
                                    .ToListAsync();

                if (!subCategories2.Any())
                {
                    return Results.NotFound();
                }

                return Results.Ok(subCategories2);
            });

            subCategories2.MapGet("/subCategories2/Title/{title}", async (ApiDbContext dbContext, String title) =>
            {
                var subCategories2 = await dbContext.subCategory2s.FirstOrDefaultAsync(c => c.Title == title);

                if (subCategories2 == null)
                {
                    return Results.NotFound();
                }

                return Results.Ok(subCategories2);
            });

            subCategories2.MapGet("/subCategories2/Id/{foreignKey}", async (ApiDbContext dbContext, int foreignKey) =>
            {
                var subCategories2 = await dbContext.subCategory2s
                                    .Include(c => c.ForeignKeyCategory2)
                                   .Where(t => t.Id == foreignKey)
                                    .Select(c => c.ToDto())
                                    .ToListAsync();

                if (!subCategories2.Any())
                {
                    return Results.NotFound();
                }

                return Results.Ok(subCategories2);
            });



        }
    }
}
