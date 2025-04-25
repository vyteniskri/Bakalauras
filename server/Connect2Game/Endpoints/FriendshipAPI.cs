using Connect2Game.Auth.Model;
using Connect2Game.Azure;
using Connect2Game.Model;
using Humanizer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using SharpGrip.FluentValidation.AutoValidation.Endpoints.Extensions;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Security.Claims;

namespace Connect2Game.Endpoints
{
    public static class FriendshipAPI
    {
        public static void AddFriendshipAPI(this WebApplication app)
        {
            var friendships = app.MapGroup("/api").AddFluentValidationAutoValidation();

            friendships.MapGet("/friendships/{foreignKey}", async (String foreignKey, ApiDbContext dbContext, HttpContext httpContext, UserManager<Profile> userManager) =>
            {
                var profile = await userManager.Users.FirstOrDefaultAsync(t => t.Id == httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub));

                if (profile == null)
                {
                    return Results.Unauthorized();
                }

                var friendships1 = await dbContext.Friendships
                    .FirstOrDefaultAsync(t => t.UserId1 == foreignKey && t.UserId2 == httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub));

                var friendships2 = await dbContext.Friendships
                   .FirstOrDefaultAsync(t => t.UserId1 == httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub) && t.UserId2 == foreignKey);


                if (friendships1 != null || friendships2 != null)
                {
                    return Results.Ok(true);
                }

                return Results.Ok(false);
            });

            friendships.MapGet("/friendships/search/{foreignKey}", async (String foreignKey, ApiDbContext dbContext, HttpContext httpContext, UserManager<Profile> userManager) =>
            {
                var profile = await userManager.Users.FirstOrDefaultAsync(t => t.Id == httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub));

                if (profile == null)
                {
                    return Results.Unauthorized();
                }

                var friendship1 = await dbContext.Friendships
                    .FirstOrDefaultAsync(t => t.UserId1 == foreignKey && t.UserId2 == httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub));

                var friendship2 = await dbContext.Friendships
                   .FirstOrDefaultAsync(t => t.UserId1 == httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub) && t.UserId2 == foreignKey && t.IsFriendship == true);


                if (friendship1 != null)
                {
                    return Results.Ok(friendship1.ToDto()); 
                }

                if (friendship2 != null)
                {
                    return Results.Ok(friendship2.ToDto()); 
                }

                return Results.NotFound(); 
            });


            friendships.MapGet("/friendships/pending/{foreignKey}", async (String foreignKey, ApiDbContext dbContext, HttpContext httpContext) =>
            {
                var friendships = await dbContext.Friendships
                    .FirstOrDefaultAsync(t => t.UserId1 == foreignKey && t.UserId2 == httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub) && t.IsFriendship == false);


                if (friendships != null)
                {
                    return true;
                }

                return false;
            });

            friendships.MapGet("/friendships/friends/{userId}", async (String userId, ApiDbContext dbContext, HttpContext httpContext, int skip, int take) =>
            {
                    var friendships = await dbContext.Friendships
                        .Where(t => (t.UserId1 == userId || t.UserId2 == userId) && t.IsFriendship == true)
                        .Skip(skip) 
                        .Take(take)
                        .Select(c => c.ToDto()) 
                        .ToListAsync();

                if (!friendships.Any())
                {
                    return Results.NotFound();
                }

                return Results.Ok(friendships);
            });

            friendships.MapGet("/friendships/fewPending/{userId}", async (String userId, ApiDbContext dbContext, HttpContext httpContext, int skip, int take) =>
            {
                var friendships = await dbContext.Friendships
                    .Where(t =>  t.UserId2 == userId && t.IsFriendship == false)
                    .Skip(skip) 
                    .Take(take) 
                    .Select(c => c.ToDto()) 
                    .ToListAsync();

                if (!friendships.Any())
                {
                    return Results.NotFound();
                }

                return Results.Ok(friendships);
            });


            friendships.MapPost("/friendships/{foreignKey}", [Authorize] async (String foreignKey, ApiDbContext dbContext, UserManager<Profile> userManager, HttpContext httpContext) =>
            {
                var profile = await userManager.Users.FirstOrDefaultAsync(p => p.Id == httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub));
                if (profile == null)
                {
                    return Results.Forbid();
                }
                
                var friend = await userManager.Users.FirstOrDefaultAsync(p => p.Id == foreignKey);
                if (friend == null)
                {
                    return Results.NotFound();
                }

                var friendships = new Friendship { UserId1 = profile.Id, UserId2 = friend.Id, CreationDate = DateTimeOffset.UtcNow, IsFriendship = false, Profile1 = profile, Profile2 = friend };

                dbContext.Friendships.Add(friendships);

                await dbContext.SaveChangesAsync();

                return Results.Created($"api/{foreignKey}/friendships", friendships.ToDto());
            });

            
            friendships.MapPut("/friendships/{foreignKey}", [Authorize] async (String foreignKey, ApiDbContext dbContext, HttpContext httpContext) =>
            {
                var friendship = await dbContext.Friendships
                    .FirstOrDefaultAsync(t => t.UserId1 == foreignKey && t.UserId2 == httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub) && t.IsFriendship == false);


                if (friendship == null)
                {
                    return Results.NotFound();
                }


                friendship.IsFriendship = true;

                dbContext.Friendships.Update(friendship);

                await dbContext.SaveChangesAsync();

                return Results.Ok(friendship.ToDto());
            });
            
            friendships.MapDelete("/friendships/{friendshipId}", [Authorize] async (int friendshipId, ApiDbContext dbContext, AzureBlobServicePhotos blobServicePhoto, HttpContext httpContext) =>
            {
                var friendship = await dbContext.Friendships.FindAsync(friendshipId);
                if (friendship == null)
                {
                    return Results.NotFound();
                }

                var photos = await dbContext.Photos
                   .Where(t => t.ForeignMessage.ForeignKeyFriendship.Id == friendshipId)
                   .ToListAsync();


                foreach (var photo in photos)
                {
                    var blobFileName = Path.GetFileName(new Uri(photo.FilePath).LocalPath);
                    await blobServicePhoto.DeleteFileAsync(blobFileName);
                }


                dbContext.Friendships.Remove(friendship);
                await dbContext.SaveChangesAsync();
                return Results.NoContent();
            });


            friendships.MapDelete("/friendships/newFriend/{foreignKey}", [Authorize] async (String foreignKey, ApiDbContext dbContext, AzureBlobServicePhotos blobServicePhoto, HttpContext httpContext) =>
            {
                var friendship1 = await dbContext.Friendships.FirstOrDefaultAsync(t => t.UserId1 == foreignKey && t.UserId2 == httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub));

                var friendship2 = await dbContext.Friendships.FirstOrDefaultAsync(t => t.UserId2 == foreignKey && t.UserId1 == httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub));


                if (friendship1 != null)
                {
                    dbContext.Friendships.Remove(friendship1);
                    await dbContext.SaveChangesAsync();
                    return Results.NoContent();
                }

                if (friendship2 != null)
                {
                    dbContext.Friendships.Remove(friendship2);
                    await dbContext.SaveChangesAsync();
                    return Results.NoContent();
                }


                return Results.NotFound();
            });
        }
    }
}
