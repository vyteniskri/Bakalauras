using Connect2Game.Auth.Model;
using Connect2Game.Azure;
using Connect2Game.Model;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Threading.Tasks;
using TestServer.Tests;
using Xunit;
using static Connect2Game.Auth.AuthEndpoints;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace Connect2Game.Tests.Endpoints
{
    public class PhotoApiTests
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;

        public PhotoApiTests()
        {
            _factory = new CustomWebApplicationFactory(nameof(PhotoApiTests));
            _client = _factory.CreateClient();

            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<Profile>>();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            SeedDatabase(dbContext, userManager, roleManager).Wait();
        }

        private async Task SeedDatabase(ApiDbContext dbContext, UserManager<Profile> userManager, RoleManager<IdentityRole> roleManager)
        {
            if (!dbContext.Users.Any())
            {
                var user1 = new Profile { Id = "user1", UserName = "user1", Email = "user1@example.com" };
                var user2 = new Profile { Id = "user2", UserName = "user2", Email = "user2@example.com" };

                await userManager.CreateAsync(user1, "TestPassword123!");
                await userManager.CreateAsync(user2, "TestPassword123!");

                var message = new Message { Id = 2, Text = "Test Message", UserId = "user1" };
                dbContext.Messages.Add(message);

                var photo = new Photo
                {
                    FilePath = "http://example.com/photo.jpg",
                    UserId = "user1",
                    MainOrNot = true,
                    Number = 1,
                    ForeignMessage = message,
                    Profile = user1
                };
                dbContext.Photos.Add(photo);

                var photo2 = new Photo
                {
                    FilePath = "http://example.com/photo.jpg",
                    UserId = "user2",
                    MainOrNot = true,
                    Number = 1,
                };
                dbContext.Photos.Add(photo2);

                await dbContext.SaveChangesAsync();
            }
        }

        private async Task<string> GetAccessTokenAsync(string username)
        {
            var loginDto = new { UserName = username, Password = "TestPassword123!" };
            var response = await _client.PostAsJsonAsync("/api/login", loginDto);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<SuccessfulLoginDto>();
            return result!.AccessToken;
        }

        [Fact]
        public async Task GetProfilePhotos_ReturnsOk_WhenPhotosExist()
        {
            var response = await _client.GetAsync("/api/photos/profile/user2");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var photos = await response.Content.ReadFromJsonAsync<List<PhotoDto>>();
            Assert.NotNull(photos);
            Assert.NotEmpty(photos);
        }

        [Fact]
        public async Task GetProfilePhotos_ReturnsNotFound_WhenNoPhotosExist()
        {
            var response = await _client.GetAsync("/api/photos/profile/nonexistent-user");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetMessagePhoto_ReturnsOk_WhenPhotoExists()
        {
            int number = 2;
            var response = await _client.GetAsync($"/api/photos/messages/{number}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var photo = await response.Content.ReadFromJsonAsync<PhotoDto>();
            Assert.NotNull(photo);
        }

        [Fact]
        public async Task GetMessagePhoto_ReturnsNotFound_WhenPhotoDoesNotExist()
        {
            var response = await _client.GetAsync("/api/photos/messages/999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }


      
    }
}