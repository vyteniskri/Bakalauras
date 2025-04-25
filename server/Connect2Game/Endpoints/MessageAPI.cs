using Connect2Game.Auth.Model;
using Connect2Game.Azure;
using Connect2Game.Model;
using Humanizer;
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
    public static class MessageAPI
    {
        public static void AddMessageAPI(this WebApplication app)
        {
            var messages = app.MapGroup("/api").AddFluentValidationAutoValidation();


            messages.MapGet("/messages/{foreignKey}", async (int foreignKey, ApiDbContext dbContext, int skip, int take) =>
            {
                var messages = await dbContext.Messages
                    .Include(f => f.ForeignKeyFriendship)
                    .Where(m => m.ForeignKeyFriendship.Id == foreignKey)
                    .OrderByDescending(m => m.CreationDate) 
                    .Skip(skip)
                    .Take(take)
                    .Select(m => m.ToDto())
                    .ToListAsync();

                if (!messages.Any())
                {
                    return Results.NotFound();
                }

                return Results.Ok(messages);
            });

            messages.MapGet("/messages/last/{foreignKey}", async (int foreignKey, ApiDbContext dbContext) =>
            {
                var lastMessage = await dbContext.Messages
                    .Include(f => f.ForeignKeyFriendship)
                    .Where(t => t.ForeignKeyFriendship.Id == foreignKey)
                    .OrderByDescending(m => m.CreationDate) 
                    .Select(c => c.ToDto())
                    .FirstOrDefaultAsync(); 

                if (lastMessage == null)
                {
                    return Results.NotFound();
                }

                return Results.Ok(lastMessage);
            });



            messages.MapPost("/messages/{foreignKey}", [Authorize] async (int foreignKey, ApiDbContext dbContext, CreateMessageDto dto, UserManager<Profile> userManager, HttpContext httpContext) =>
            {

                var profile = await userManager.Users.FirstOrDefaultAsync(p => p.Id == httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub));
                if (profile == null)
                {
                    return Results.NotFound();
                }

                var friendship = await dbContext.Friendships.FindAsync(foreignKey);
                if (friendship == null)
                {
                    return Results.NotFound();
                }


                var message = new Message { Text = dto.Text,  CreationDate = DateTimeOffset.UtcNow, UserId = httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub), ForeignKeyFriendship = friendship, Profile = profile };
                dbContext.Messages.Add(message);
                await dbContext.SaveChangesAsync();

                return Results.Created($"api/{foreignKey}/messages", message.ToDto());
            });

            messages.MapPut("/messages/{messageId}", [Authorize] async (int messageId, ApiDbContext dbContext, UpdateMessageDto dto, HttpContext httpContext) =>
            {

                var message = await dbContext.Messages
                    .Include(f => f.ForeignKeyFriendship)
                    .FirstOrDefaultAsync(f => f.Id == messageId);

                if (message == null)
                {
                    return Results.NotFound();
                }

                if (!httpContext.User.IsInRole(Roles.Admin) && httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub) != message.UserId)
                {
                    return Results.Forbid();
                }

                message.Text = dto.Text;

                dbContext.Messages.Update(message);

                await dbContext.SaveChangesAsync();

                return Results.Ok(message.ToDto());
            });

            messages.MapDelete("/messages/{messageId}", [Authorize] async (int messageId, ApiDbContext dbContext, AzureBlobServicePhotos blobService, HttpContext httpContext) =>
            {
                var message = await dbContext.Messages.FindAsync(messageId);
                if (message == null)
                {
                    return Results.NotFound();
                }

                if (!httpContext.User.IsInRole(Roles.Admin) && httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub) != message.UserId)
                {
                    return Results.Forbid();
                }

                var photos = await dbContext.Photos
                    .Where(photo => photo.ForeignMessage.Id == messageId) 
                    .ToListAsync();

                foreach (var photo in photos)
                {
                    var blobFileName = Path.GetFileName(new Uri(photo.FilePath).LocalPath);
                    await blobService.DeleteFileAsync(blobFileName);
                }

                dbContext.Photos.RemoveRange(photos);


                dbContext.Messages.Remove(message);

                await dbContext.SaveChangesAsync();

                return Results.NoContent();
            });
        }
    }
}
