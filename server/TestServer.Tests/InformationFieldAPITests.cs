using Connect2Game.Auth.Model;
using Connect2Game.Model;
using Microsoft.AspNetCore.Identity;
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
    public class InformationFieldApiTests
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;

        public InformationFieldApiTests()
        {
            _factory = new CustomWebApplicationFactory(nameof(InformationFieldApiTests));
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
                var profile = new Profile { Id = "10", UserName = "testuser", Email = "testuser@example.com" };

                await userManager.CreateAsync(profile, "TestPassword123!");

                var role = new IdentityRole("User");
                await roleManager.CreateAsync(role);
                await userManager.AddToRoleAsync(profile, "User");

                dbContext.InformationFields.Add(new InformationField
                {
                    Id = 100,
                    UserId = "10",
                    Text = "Test info field",
                    CreationDate = DateTimeOffset.UtcNow,
                    Profile = profile
                });

                await dbContext.SaveChangesAsync();
            }
        }

        private async Task<string> GetAccessTokenAsync()
        {
            var loginDto = new { UserName = "testuser", Password = "TestPassword123!" };

            var response = await _client.PostAsJsonAsync("/api/login", loginDto);
            response.EnsureSuccessStatusCode();

            var loginResult = await response.Content.ReadFromJsonAsync<SuccessfulLoginDto>();
            return loginResult!.AccessToken;
        }

        [Fact]
        public async Task Get_InformationField_ReturnsOk_WhenExists()
        {
            var response = await _client.GetAsync("/api/informationField/10");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task Get_InformationField_ReturnsNotFound_WhenMissing()
        {
            var response = await _client.GetAsync("/api/informationField/missing-id");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task Post_InformationFieldProfile_ReturnsCreated_WhenAuthorized()
        {
            var token = await GetAccessTokenAsync();
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var dto = new { Text = "New info text" };
            var response = await _client.PostAsJsonAsync("/api/informationFieldProfile", dto);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }

        [Fact]
        public async Task Put_InformationFieldProfile_ReturnsOk_WhenAuthorized()
        {
            var token = await GetAccessTokenAsync();
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var updateDto = new { Text = "Updated info text" };
            var response = await _client.PutAsJsonAsync("/api/informationFieldProfile/100", updateDto);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task Put_InformationFieldProfile_ReturnsNotFound_WhenMissing()
        {
            var token = await GetAccessTokenAsync();
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var updateDto = new { Text = "Updated info text" };
            var response = await _client.PutAsJsonAsync("/api/informationFieldProfile/99999", updateDto);

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}
