using Connect2Game.Auth.Model;
using Connect2Game.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SharpGrip.FluentValidation.AutoValidation.Endpoints.Extensions;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Connect2Game.Endpoints
{
    public static class RegistrationStepAPI
    {
        public static void AddRegistrationStepAPI(this WebApplication app)
        {
            var registrationStepsCall = app.MapGroup("/api").AddFluentValidationAutoValidation();

            registrationStepsCall.MapGet("/registrationSteps", [Authorize] async (ApiDbContext dbContext, HttpContext httpContext, UserManager<Profile> userManager) =>
            {
                var profile = await userManager.Users.FirstOrDefaultAsync(p => p.Id == httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub));
                if (profile == null)
                {
                    return Results.NotFound();
                }

                var registrationStep = await dbContext.registrationSteps.FirstOrDefaultAsync(c => c.UserId == httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub));
                if (registrationStep == null)
                {
                   return Results.NotFound();
                }

                return Results.Ok(registrationStep.ToDto());
            });

            registrationStepsCall.MapPost("/registrationSteps", [Authorize] async (ApiDbContext dbContext, CreatedRegistrationStepDto dto, UserManager<Profile> userManager, HttpContext httpContext) =>
            {
                var profile = await userManager.Users.FirstOrDefaultAsync(p => p.Id == httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub));
                if (profile == null)
                {
                    return Results.NotFound();
                }

                var registrationStep = new RegistrationStep { CurrentStep = dto.CurrentStep, UserId = httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub), CreationDate = DateTimeOffset.UtcNow, Profile = profile };

                dbContext.registrationSteps.Add(registrationStep);

                await dbContext.SaveChangesAsync();

                return Results.Created($"api/registrationSteps", registrationStep.ToDto());


            });

            registrationStepsCall.MapPut("/registrationSteps", [Authorize] async (ApiDbContext dbContext, UpdatedRegistrationStepDto dto, UserManager<Profile> userManager, HttpContext httpContext) =>
            {
                var registrationStep = await dbContext.registrationSteps.FirstOrDefaultAsync(c => c.UserId == httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub));

                if (registrationStep == null)
                {
                    Results.NotFound();
                }

                registrationStep.CurrentStep = dto.CurrentStep;

                dbContext.registrationSteps.Update(registrationStep);

                await dbContext.SaveChangesAsync();

                return Results.Ok(registrationStep.ToDto());


            });

        }

    }
}
