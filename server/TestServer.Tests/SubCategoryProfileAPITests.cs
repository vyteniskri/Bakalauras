using Connect2Game.Auth.Model;
using Connect2Game.Model;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Threading.Tasks;
using TestServer.Tests;
using Xunit;
using static Connect2Game.Auth.AuthEndpoints;

namespace Connect2Game.Tests.Endpoints
{
    public class SubCategoryProfileApiTests
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;

        public SubCategoryProfileApiTests()
        {
            _factory = new CustomWebApplicationFactory(nameof(SubCategoryProfileApiTests));
            _client = _factory.CreateClient();

            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<Profile>>();

            SeedDatabase(dbContext, userManager).Wait();
        }

        private async Task SeedDatabase(ApiDbContext dbContext, UserManager<Profile> userManager)
        {
            if (dbContext.Users.Any()) return;

            var users = new[]
            {
                new Profile { Id = "user1", UserName = "user1", Email = "user1@example.com" },
                new Profile { Id = "user2", UserName = "user2", Email = "user1@example.com" }
            };
            foreach (var user in users)
            {
                await userManager.CreateAsync(user, "TestPassword123!");
            }

            var subCategory = new SubCategory2 { Id = 1, Title = "SubCategory 1" };
            dbContext.subCategory2s.Add(subCategory);

            dbContext.subCategoriesProfile.AddRange(
                users.Select((user, index) => new SubCategoryProfile
                {
                    Id = index + 1, 
                    CreationDate = DateTimeOffset.UtcNow,
                    ForeignKeySubcategory2 = subCategory,
                    UserId = user.Id,
                    Profile = user
                })
            );

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
        public async Task PostSubCategoryProfile_CreatesNewProfile()
        {
            var token = await GetAccessTokenAsync("user1");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.PostAsync("/api/subCategoriesProfile/1", null);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }

        [Fact]
        public async Task PostSubCategoryProfile_ReturnsNotFound_WhenSubCategoryDoesNotExist()
        {
            var token = await GetAccessTokenAsync("user2");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            int number = 999;

            var response = await _client.PostAsync($"/api/subCategoriesProfile/{number}", null);

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetSubCategoryProfilesByUserId_ReturnsProfiles()
        {
            var response = await _client.GetAsync("/api/subCategoriesProfile/userId/user1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var profiles = await response.Content.ReadFromJsonAsync<List<SubCategoryProfileDto>>();
            Assert.NotNull(profiles);
            Assert.Single(profiles);
        }

        [Fact]
        public async Task GetSubCategoryProfilesBySubCategoryId_ReturnsProfiles()
        {
            var token = await GetAccessTokenAsync("user1");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync("/api/subCategoriesProfile/subId/1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var profiles = await response.Content.ReadFromJsonAsync<List<SubCategoryProfileDto>>();
            Assert.NotNull(profiles);
            Assert.Single(profiles);
        }

        [Fact]
        public async Task DeleteSubCategoryProfile_RemovesProfile()
        {
            var token = await GetAccessTokenAsync("user1");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.DeleteAsync("/api/subCategoriesProfile/1");

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
            var profile = await dbContext.subCategoriesProfile.FirstOrDefaultAsync(p => p.Id == 1);
            Assert.Null(profile);
        }

        [Fact]
        public async Task DeleteSubCategoryProfile_ReturnsNotFound_WhenProfileDoesNotExist()
        {
            var token = await GetAccessTokenAsync("user1");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.DeleteAsync("/api/subCategoriesProfile/999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}