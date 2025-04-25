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
using System.Threading.Tasks;
using static NuGet.Packaging.PackagingConstants;
using static System.Net.Mime.MediaTypeNames;

namespace Connect2Game.Endpoints
{
    public static class ProfileAPI
    {
        public static void AddProfileApi(this WebApplication app)
        {
            var profiles = app.MapGroup("/api").AddFluentValidationAutoValidation();

            profiles.MapGet("/profiles", [Authorize] async (UserManager<Profile> userManager, RoleManager<IdentityRole> roleManager, ApiDbContext dbContext, HttpContext httpContext) =>
            {
                var currentUserId = httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub);

                var users = await userManager.Users
                    .Where(user => user.Id != currentUserId)
                    .OrderBy(_ => Guid.NewGuid()) 
                    .Take(50) 
                    .ToListAsync();

                var filteredUsers = new List<Profile>();

                foreach (var user in users)
                {

                    var roles = await userManager.GetRolesAsync(user);
                    if (roles.Contains("Admin") || roles.Contains("Moderator"))
                    {
                        continue;
                    }

                    var report = await dbContext.reports.FirstOrDefaultAsync(r => r.UserId == user.Id);
                    if (report != null && report.BanTime > DateTime.UtcNow)
                    {
                        continue;
                    }

                    var isFriendship = await dbContext.Friendships
                        .AnyAsync(f => (f.UserId1 == currentUserId && f.UserId2 == user.Id) ||
                                       (f.UserId1 == user.Id && f.UserId2 == currentUserId));

                    var isFriendshipPending = await dbContext.Friendships
                        .AnyAsync(f => f.UserId1 == user.Id && f.UserId2 == currentUserId && !f.IsFriendship);

                    if (!isFriendship || isFriendshipPending)
                    {
                        filteredUsers.Add(user);
                    }
                }

                var randomProfiles = filteredUsers
                    .OrderBy(_ => Guid.NewGuid())
                    .Take(5)
                    .Select(profile => profile.ToDto())
                    .ToList();

                return Results.Ok(randomProfiles);
            });

            profiles.MapGet("/profiles/{profileId}", async (String profileId, UserManager<Profile> userManager) =>
            {
                var profile = await userManager.Users.FirstOrDefaultAsync(p => p.Id == profileId);
                if (profile == null)
                {
                    return Results.NotFound();
                }

                return Results.Ok(profile.ToDto());
            });

            profiles.MapPut("/profiles", [Authorize] async (UpdateProfileDto dto, UserManager<Profile> userManager, HttpContext httpContext) =>
            {
                var profile = await userManager.Users.FirstOrDefaultAsync(p => p.Id == httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub));
                if (profile == null)
                {
                    return Results.NotFound();
                }

                var user = await userManager.FindByNameAsync(dto.Username);
                if (user != null)
                {
                    return Results.UnprocessableEntity("Username already taken");
                }

                profile.UserName = dto.Username;
                profile.SecurityStamp ??= Guid.NewGuid().ToString();
                await userManager.UpdateAsync(profile);

                return Results.Ok(profile.ToDto());
            });


            profiles.MapGet("/profiles/search/{name}", async (string name, UserManager<Profile> userManager) =>
            {
                var profiles = await userManager.Users
                    .Where(p => p.UserName.ToLower().Contains(name.ToLower()))
                    .OrderByDescending(p => p.UserName.ToLower() == name.ToLower()) 
                    .ThenBy(p => p.UserName.ToLower().IndexOf(name.ToLower())) 
                    .ThenBy(p => p.UserName) 
                    .Take(5)
                    .ToListAsync();

                if (!profiles.Any())
                {
                    return Results.NotFound();
                }

                return Results.Ok(profiles.Select(p => p.ToDto())); 
            });


            profiles.MapDelete("/profiles/{profileId}", [Authorize] async (string profileId, UserManager<Profile> userManager, ApiDbContext dbContext, AzureBlobServicePhotos blobServicePhoto, AzureBlobServiceVideos blobServiceVideo, HttpContext httpContext) =>
            {
                var profile = await userManager.Users.FirstOrDefaultAsync(p => p.Id == profileId);
                if (profile == null)
                {
                    return Results.NotFound();
                }
                if (!httpContext.User.IsInRole(Roles.Admin) && httpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub) != profile.Id)
                {
                    return Results.Forbid();
                }

                var photos = await dbContext.Photos
                    .Where(photo => photo.UserId == profileId) 
                    .ToListAsync();

                var videos = await dbContext.Videos
                    .Where(video => video.UserId == profileId) 
                    .ToListAsync();

                foreach (var photo in photos)
                {
                    var blobFileName = Path.GetFileName(new Uri(photo.FilePath).LocalPath);
                    await blobServicePhoto.DeleteFileAsync(blobFileName);
                }

                foreach (var video in videos)
                {
                    var blobFileName = Path.GetFileName(new Uri(video.FilePath).LocalPath);
                    await blobServiceVideo.DeleteFileAsync(blobFileName);
                }

                dbContext.Photos.RemoveRange(photos);
                dbContext.Videos.RemoveRange(videos);

                var result = await userManager.DeleteAsync(profile);
                if (!result.Succeeded)
                {
                    return Results.BadRequest();
                }

                await dbContext.SaveChangesAsync();

                return Results.NoContent();
            });


            profiles.MapGet("/profiles/Chunks", async (UserManager<Profile> userManager, int page = 1, int pageSize = 5) =>
            {
                if (page < 1 || pageSize < 1)
                {
                    return Results.BadRequest("Page and pageSize must be greater than 0.");
                }

                var pagedUsers = await userManager.Users
                    .OrderBy(p => p.Id)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var filteredUsers = new List<Profile>();

                foreach (var user in pagedUsers)
                {
                    var roles = await userManager.GetRolesAsync(user);
                    if (!roles.Contains("Admin") && !roles.Contains("Moderator"))
                    {
                        filteredUsers.Add(user);
                    }
                }

                var totalProfiles = await userManager.Users.CountAsync();

                var profileDtos = filteredUsers
                    .Select(u => u.ToDto())
                    .ToList();
               
                if (!profileDtos.Any())
                {
                    return Results.NotFound("No profiles found.");
                }

                return Results.Ok(new
                {
                    TotalProfiles = totalProfiles,
                    Profiles = profileDtos
                });
            });




        }
    }
}
