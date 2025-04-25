using Connect2Game.Auth.Model;
using Connect2Game.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SendGrid;
using SharpGrip.FluentValidation.AutoValidation.Endpoints.Extensions;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Connect2Game.Endpoints
{
    public static class Category2API
    {
        public static void AddCategory2API(this WebApplication app)
        {
            var categories2 = app.MapGroup("/api").AddFluentValidationAutoValidation();

            categories2.MapGet("/categories2", async (ApiDbContext dbContext) =>
            {

                var categories = await dbContext.category2s.ToListAsync();

                return categories.Select(profile => profile.ToDto());
            });


            categories2.MapGet("/categories2/Id/{foreignKey}", async (ApiDbContext dbContext, int foreignKey) =>
            {

                var categories = await dbContext.category2s
                    .Where(c => c.Id == foreignKey)
                    .Select(c => c.ToDto())
                    .ToListAsync();

                return Results.Ok(categories);
            });

        }
    }
}
