using Connect2Game.Auth.Model;
using Connect2Game.Azure;
using Connect2Game.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SharpGrip.FluentValidation.AutoValidation.Endpoints.Extensions;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Security.Claims;

namespace Connect2Game.Endpoints
{
    public static class PhotoAPI
    {
        public static void AddPhotoAPI(this WebApplication app)
        {
            var photos = app.MapGroup("/api").AddFluentValidationAutoValidation();

            photos.MapGet("/photos/profile/{foreignKey}", async (ApiDbContext dbContext, String foreignKey) =>
            {

                var photos = await dbContext.Photos
                    .Where(t => t.UserId == foreignKey && t.ForeignMessageId == null)
                    .Select(c => c.ToDto())
                    .ToListAsync();

                if (!photos.Any())
                {
                    return Results.NotFound();
                }

                return Results.Ok(photos);
            });

            photos.MapGet("/photos/messages/{foreignKey}", async (ApiDbContext dbContext, int foreignKey) =>
            {

                var photo = await dbContext.Photos.FirstOrDefaultAsync(t => t.ForeignMessage.Id == foreignKey);

                if (photo == null)
                {
                    return Results.NotFound();
                }

                return Results.Ok(photo.ToDto());
            });

            photos.MapPost("/photos/profile/{MainOrNot}/{Number}", [Authorize] async (HttpContext context, ApiDbContext dbContext, AzureBlobServicePhotos blobService, bool MainOrNot, int Number) =>
            {
                var profile = await dbContext.Users.FirstOrDefaultAsync(p => p.Id == context.User.FindFirstValue(JwtRegisteredClaimNames.Sub));
                if (profile == null)
                {
                    return Results.NotFound();
                }
                var form = await context.Request.ReadFormAsync();
                var file = form.Files["file"];

                if (file == null || file.Length == 0)
                {
                    return Results.BadRequest("No file uploaded.");
                }

                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

                using var stream = file.OpenReadStream();
                var blobUrl = await blobService.UploadFileAsync(stream, fileName);

                if (blobUrl == null)
                {
                    return Results.Problem("Failed to upload the image.");
                }

                var photo = new Photo
                {
                    FilePath = blobUrl,
                    CreationDate = DateTimeOffset.UtcNow,
                    UserId = context.User.FindFirstValue(JwtRegisteredClaimNames.Sub),
                    MainOrNot = MainOrNot,
                    Number = Number,
                    Profile = profile
                };

                dbContext.Photos.Add(photo);
                await dbContext.SaveChangesAsync();

                return Results.Created($"api/photos", photo.ToDto());
            });


            photos.MapPost("/photos/messages/{foreignKey}", [Authorize] async (HttpContext context, int foreignKey, ApiDbContext dbContext, AzureBlobServicePhotos blobService) =>
            {
                var profile = await dbContext.Users.FirstOrDefaultAsync(p => p.Id == context.User.FindFirstValue(JwtRegisteredClaimNames.Sub));
                if (profile == null)
                {
                    return Results.NotFound();
                }

                var message = await dbContext.Messages.FindAsync(foreignKey);

                if (message == null)
                {
                    return Results.NotFound();
                }

                var form = await context.Request.ReadFormAsync();
                var file = form.Files["file"];

                if (file == null || file.Length == 0)
                {
                    return Results.BadRequest("No file uploaded.");
                }

                var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

                using var stream = file.OpenReadStream();
                var blobUrl = await blobService.UploadFileAsync(stream, fileName);

                if (blobUrl == null)
                {
                    return Results.Problem("Failed to upload the image.");
                }

                var photo = new Photo
                {
                    FilePath = blobUrl,
                    CreationDate = DateTimeOffset.UtcNow,
                    ForeignMessage = message,
                    UserId = context.User.FindFirstValue(JwtRegisteredClaimNames.Sub),
                    Profile = profile,
                };

                dbContext.Photos.Add(photo);
                await dbContext.SaveChangesAsync();

                return Results.Created($"api/{foreignKey}/photos", photo.ToDto());
            });


            photos.MapDelete("/photos/{photoId}", [Authorize] async (int photoId, ApiDbContext dbContext, AzureBlobServicePhotos blobService, HttpContext httpContext) =>
            {
                var photo = await dbContext.Photos.FirstOrDefaultAsync(i => i.Id == photoId);
                if (photo == null)
                {
                    return Results.NotFound();
                }

                if (!httpContext.User.IsInRole(Roles.Admin) && httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub) != photo.UserId)
                {
                    return Results.Forbid();
                }


                var blobFileName = Path.GetFileName(new Uri(photo.FilePath).LocalPath);

                await blobService.DeleteFileAsync(blobFileName);

                dbContext.Photos.Remove(photo);
                await dbContext.SaveChangesAsync();

                return Results.NoContent();
            });
        }
    }
}
