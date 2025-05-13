using Connect2Game.Auth.Model;
using Connect2Game.Model;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Linq;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Threading.Tasks;
using TestServer.Tests;
using Xunit;
using static Connect2Game.Auth.AuthEndpoints;

namespace Connect2Game.Tests.Endpoints
{
    public class ProfileFilterApiTests
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;

        public ProfileFilterApiTests()
        {
            _factory = new CustomWebApplicationFactory(nameof(ProfileFilterApiTests));
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
                await userManager.CreateAsync(user1, "TestPassword123!");

                var subCategoryFilter = new SubCategoryFilter { Id = 1 };
                dbContext.subCategoriesFilter.Add(subCategoryFilter);

                var profileFilter = new ProfileFilter
                {
                    UserId = "user1",
                    ForeignKeySubCategoryFilter = subCategoryFilter,
                    CreationDate = DateTimeOffset.UtcNow
                };
                dbContext.profileFilters.Add(profileFilter);

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
        public async Task PostProfileFilter_CreatesProfileFilter()
        {
            var token = await GetAccessTokenAsync("user1");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.PostAsJsonAsync<object>("/api/profileFilters/1", null);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }

        [Fact]
        public async Task GetProfileFilters_ReturnsOk_WhenFiltersExist()
        {
            var response = await _client.GetAsync("/api/profileFilters/user1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var filters = await response.Content.ReadFromJsonAsync<List<ProfileFilterDto>>();
            Assert.NotNull(filters);
            Assert.NotEmpty(filters);
        }

        [Fact]
        public async Task GetProfileFiltersForSubCategory_ReturnsOk_WhenFiltersExist()
        {
            var response = await _client.GetAsync("/api/profileFilters/forSubcategory/1?skip=0&take=9");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var filters = await response.Content.ReadFromJsonAsync<List<ProfileFilterDto>>();
            Assert.NotNull(filters);
            Assert.NotEmpty(filters);
        }

        [Fact]
        public async Task DeleteProfileFilter_RemovesFilter()
        {
            var token = await GetAccessTokenAsync("user1");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.DeleteAsync("/api/profileFilters/1");

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }

        [Fact]
        public async Task DeleteProfileFilter_ReturnsNotFound_WhenFilterDoesNotExist()
        {
            var token = await GetAccessTokenAsync("user1");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.DeleteAsync("/api/profileFilters/999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}