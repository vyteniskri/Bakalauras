using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Connect2Game.Model;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Linq;
using System.Threading.Tasks;
using TestServer.Tests;
using Xunit;
using Connect2Game.Auth.Model;
using static Connect2Game.Auth.AuthEndpoints;

namespace Connect2Game.Tests.Endpoints
{
    public class WarningApiTests
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;

        public WarningApiTests()
        {
            _factory = new CustomWebApplicationFactory(nameof(WarningApiTests));
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
                var users = new[]
                {
                    new Profile { Id = "user1", UserName = "user1", Email = "user1@example.com" },
                    new Profile { Id = "user2", UserName = "user2", Email = "user2@example.com" }
                };

                foreach (var user in users)
                {
                    await userManager.CreateAsync(user, "TestPassword123!");
                }

                var reports = users.Select((user, index) => new Report
                {
                    Id = index + 1,
                    CreationDate = DateTimeOffset.UtcNow,
                    UserId = user.Id
                }).ToList();

                dbContext.reports.AddRange(reports);

                dbContext.warnings.AddRange(reports.Select(report => new Warning
                {
                    Text = "Initial Warning",
                    CreationDate = DateTimeOffset.UtcNow,
                    Report = report
                }));

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
        public async Task GetWarning_ReturnsOk_WhenWarningExists()
        {
            var response = await _client.GetAsync("/api/warnings/1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var warning = await response.Content.ReadFromJsonAsync<WarningDto>();
            Assert.NotNull(warning);
        }

        [Fact]
        public async Task GetWarning_ReturnsNotFound_WhenWarningDoesNotExist()
        {
            var response = await _client.GetAsync("/api/warnings/999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task PostWarning_CreatesWarning()
        {
            var token = await GetAccessTokenAsync("user1");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var createWarningDto = new CreateWarningDto ("New Warning");
            var response = await _client.PostAsJsonAsync("/api/warnings/1", createWarningDto);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }

        [Fact]
        public async Task PostWarning_ReturnsNotFound_WhenReportDoesNotExist()
        {
            var token = await GetAccessTokenAsync("user1");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var createWarningDto = new CreateWarningDto("New Warning");
            var response = await _client.PostAsJsonAsync("/api/warnings/999", createWarningDto);

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task DeleteWarning_RemovesWarning()
        {
            var token = await GetAccessTokenAsync("user2");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.DeleteAsync("/api/warnings/2");

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

            var checkResponse = await _client.GetAsync("/api/warnings/2");
            Console.WriteLine("CODEEs" + checkResponse);
            Assert.Equal(HttpStatusCode.NotFound, checkResponse.StatusCode);
        }

        [Fact]
        public async Task DeleteWarning_ReturnsNotFound_WhenWarningDoesNotExist()
        {
            var token = await GetAccessTokenAsync("user1");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.DeleteAsync("/api/warnings/999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}