using Connect2Game.Auth.Model;
using Connect2Game.Azure;
using Connect2Game.Model;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using TestServer.Tests;
using Xunit;
using static Connect2Game.Auth.AuthEndpoints;

namespace Connect2Game.Tests.Endpoints
{
    public class VideoApiTests
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;
        private readonly Mock<AzureBlobServiceVideos> _mockBlobService;

        public VideoApiTests()
        {
            _factory = new CustomWebApplicationFactory(nameof(VideoApiTests));
            _mockBlobService = new Mock<AzureBlobServiceVideos>();
            _client = _factory.CreateClient();

            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<Profile>>();

            SeedDatabase(dbContext, userManager).Wait();
        }

        private async Task SeedDatabase(ApiDbContext dbContext, UserManager<Profile> userManager)
        {
            if (dbContext.Users.Any()) return;

            // Seed Users
            var user = new Profile { Id = "user1", UserName = "user1", Email = "user1@example.com" };
            var admin = new Profile { Id = "admin", UserName = "admin", Email = "admin@example.com" };
            await userManager.CreateAsync(user, "TestPassword123!");
            await userManager.CreateAsync(admin, "AdminPassword123!");

            // Seed Videos
            dbContext.Videos.Add(new Video
            {
                Id = 1,
                FilePath = "https://fake.blob.core.windows.net/videos/video1.mp4",
                CreationDate = DateTimeOffset.UtcNow,
                UserId = "user1",
                Number = 1,
                Profile = user
            });

            await dbContext.SaveChangesAsync();
        }

        private async Task<string> GetAccessTokenAsync(string username, string password = "TestPassword123!")
        {
            var loginDto = new { UserName = username, Password = password };
            var response = await _client.PostAsJsonAsync("/api/login", loginDto);
            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadFromJsonAsync<SuccessfulLoginDto>();
            return result!.AccessToken;
        }

        [Fact]
        public async Task GetVideosByProfile_ReturnsVideos()
        {
            // Act
            var response = await _client.GetAsync("/api/videos/profile/user1");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var videos = await response.Content.ReadFromJsonAsync<List<VideoDto>>();
            Assert.NotNull(videos);
            Assert.Single(videos);
        }

        [Fact]
        public async Task GetVideosByProfile_ReturnsNotFound_WhenNoVideosExist()
        {
            // Act
            var response = await _client.GetAsync("/api/videos/profile/nonexistentuser");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

      
     
       
    }
}