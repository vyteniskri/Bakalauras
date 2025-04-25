using Connect2Game.Auth.Model;
using Connect2Game.Azure;
using Connect2Game.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using NuGet.Configuration;
using SharpGrip.FluentValidation.AutoValidation.Endpoints.Extensions;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Security.Claims;

namespace Connect2Game.Endpoints
{
    public static class InformationFieldAPI
    {
        public static void AddInformationFieldAPI(this WebApplication app)
        {
            var informationFields = app.MapGroup("/api").AddFluentValidationAutoValidation();


            informationFields.MapGet("/informationField/{foreignKey}", async (ApiDbContext dbContext, String foreignKey) =>
            {
                var informationField = await dbContext.InformationFields.FirstOrDefaultAsync(i => i.UserId == foreignKey);

                if (informationField == null)
                {
                    return Results.NotFound();
                }

                return Results.Ok(informationField.ToDto());
            });


            informationFields.MapPost("/informationFieldProfile", [Authorize] async (ApiDbContext dbContext, CreateInformationFieldDto dto, UserManager<Profile> userManager, HttpContext httpContext) =>
            {
                var profile = await userManager.Users.FirstOrDefaultAsync(p => p.Id == httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub));
                if (profile == null)
                {
                    return Results.NotFound();
                }

                var informationField = new InformationField { Text = dto.Text,  CreationDate = DateTimeOffset.UtcNow, UserId = httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub), Profile = profile };

                dbContext.InformationFields.Add(informationField);

                await dbContext.SaveChangesAsync();

                return Results.Created($"api/informationField", informationField.ToDto());
            });

            informationFields.MapPut("/informationFieldProfile/{informationFieldId}", [Authorize] async (int informationFieldId, ApiDbContext dbContext, UpdateInformationFieldDto dto, HttpContext httpContext) =>
            {
                var informationField = await dbContext.InformationFields.FirstOrDefaultAsync(i => i.Id == informationFieldId);
                if (informationField == null)
                {
                    return Results.NotFound();
                }

                if (!httpContext.User.IsInRole(Roles.Admin) && httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub) != informationField.UserId)
                {
                    return Results.Forbid();
                }

                informationField.Text = dto.Text;

                dbContext.InformationFields.Update(informationField);

                await dbContext.SaveChangesAsync();

                return Results.Ok(informationField.ToDto());
            });

        }
    }
}
