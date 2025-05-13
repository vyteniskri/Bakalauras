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
    public class RegistrationStepApiTests
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;

        public RegistrationStepApiTests()
        {
            _factory = new CustomWebApplicationFactory(nameof(RegistrationStepApiTests));
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
                var user2 = new Profile { Id = "user2", UserName = "user2", Email = "user1@example.com" };
                await userManager.CreateAsync(user1, "TestPassword123!");
                await userManager.CreateAsync(user2, "TestPassword123!");

                var registrationStep = new RegistrationStep
                {
                    CurrentStep = 1,
                    UserId = "user1",
                    CreationDate = DateTimeOffset.UtcNow,
                    Profile = user1
                };

                var registrationStep2 = new RegistrationStep
                {
                    CurrentStep = 1,
                    UserId = "user2",
                    CreationDate = DateTimeOffset.UtcNow,
                    Profile = user2
                };

                dbContext.registrationSteps.Add(registrationStep);
                dbContext.registrationSteps.Add(registrationStep2);
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
        public async Task GetRegistrationStep_ReturnsOk_WhenStepExists()
        {
            var token = await GetAccessTokenAsync("user2");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync("/api/registrationSteps");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var registrationStep = await response.Content.ReadFromJsonAsync<RegistrationStepDto>();
            Assert.NotNull(registrationStep);
            Assert.Equal(1, registrationStep.CurrentStep);
        }

        [Fact]
        public async Task GetRegistrationStep_ReturnsNotFound_WhenStepDoesNotExist()
        {
            var token = await GetAccessTokenAsync("user1");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            using (var scope = _factory.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
                var step = dbContext.registrationSteps.FirstOrDefault(s => s.UserId == "user1");
                if (step != null)
                {
                    dbContext.registrationSteps.Remove(step);
                    await dbContext.SaveChangesAsync();
                }
            }

            var response = await _client.GetAsync("/api/registrationSteps");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task PostRegistrationStep_CreatesNewStep()
        {
            var token = await GetAccessTokenAsync("user1");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var dto = new CreatedRegistrationStepDto(2);

            var response = await _client.PostAsJsonAsync("/api/registrationSteps", dto);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }

        [Fact]
        public async Task PutRegistrationStep_UpdatesExistingStep()
        {
            var token = await GetAccessTokenAsync("user2");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var dto = new UpdatedRegistrationStepDto(3);

            var response = await _client.PutAsJsonAsync("/api/registrationSteps", dto);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            using (var scope = _factory.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
                var step = dbContext.registrationSteps.FirstOrDefault(s => s.UserId == "user2");
                Assert.NotNull(step);
                Assert.Equal(3, step.CurrentStep);
            }
        }
    }
}