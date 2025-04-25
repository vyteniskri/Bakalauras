using Connect2Game.Model;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using Microsoft.EntityFrameworkCore;
using SharpGrip.FluentValidation.AutoValidation.Endpoints.Extensions;
using Connect2Game.Azure;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Connect2Game.Auth.Model;
using Microsoft.AspNetCore.Http;

namespace Connect2Game.Endpoints
{
    public static class VideoAPI
    {
        public static void AddVideoAPI(this WebApplication app)
        {
            var videos = app.MapGroup("/api").AddFluentValidationAutoValidation();


            videos.MapGet("/videos/profile/{foreignKey}", async (ApiDbContext dbContext, String foreignKey) =>
            {
                var videos = await dbContext.Videos
                   .Where(t => t.UserId == foreignKey)
                   .Select(c => c.ToDto())
                   .ToListAsync();

                if (!videos.Any())
                {
                    return Results.NotFound();
                }

                return Results.Ok(videos);
            });

            videos.MapPost("/videos/profile/{Number}", [Authorize] async (HttpContext context, ApiDbContext dbContext, AzureBlobServiceVideos blobService, HttpContext httpContext, int Number) =>
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

                var video = new Video
                {
                    FilePath = blobUrl,
                    CreationDate = DateTimeOffset.UtcNow,
                    UserId = httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub),
                    Number = Number,
                    Profile = profile,
                };

                dbContext.Videos.Add(video);
                await dbContext.SaveChangesAsync();

                return Results.Created($"api/videos", video.ToDto());
            });


            videos.MapDelete("/videos/{videoId}", [Authorize] async (int videoId, ApiDbContext dbContext, AzureBlobServiceVideos blobService, HttpContext httpContext) =>
            {
                var video = await dbContext.Videos.FirstOrDefaultAsync(i => i.Id == videoId);
                if (video == null)
                {
                    return Results.NotFound();
                }

                if (!httpContext.User.IsInRole(Roles.Admin) && httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub) != video.UserId)
                {
                    return Results.Forbid();
                }

                var blobFileName = Path.GetFileName(new Uri(video.FilePath).LocalPath);

                await blobService.DeleteFileAsync(blobFileName);

                dbContext.Videos.Remove(video);
                await dbContext.SaveChangesAsync();

                return Results.NoContent();
            });
        }
    }
}
