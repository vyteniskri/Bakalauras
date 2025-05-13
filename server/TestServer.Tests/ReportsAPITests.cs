using Connect2Game.Auth.Model;
using Connect2Game.Helpers;
using Connect2Game.Model;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
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
    public class ReportsApiTests
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;

        public ReportsApiTests()
        {
            _factory = new CustomWebApplicationFactory(nameof(ReportsApiTests));
            _client = _factory.CreateClient();

            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<Profile>>();
            dbContext.Database.EnsureDeleted();
            dbContext.Database.EnsureCreated();
            SeedDatabase(dbContext, userManager).Wait();
        }

        private async Task SeedDatabase(ApiDbContext dbContext, UserManager<Profile> userManager)
        {
            if (dbContext.Users.Any()) return;

            var users = new[]
            {
                new Profile { Id = "user1", UserName = "user1", Email = "user1@example.com" },
                new Profile { Id = "user2", UserName = "user2", Email = "user2@example.com" },
                new Profile { Id = "admin", UserName = "admin", Email = "admin@example.com" },
                new Profile { Id = "user3", UserName = "user3", Email = "user3@example.com" }
            };

            foreach (var user in users)
            {
                await userManager.CreateAsync(user, user.UserName == "admin" ? "AdminPassword123!" : "TestPassword123!");
            }

            var roleManager = dbContext.GetService<RoleManager<IdentityRole>>();
            if (!await roleManager.RoleExistsAsync("Admin"))
            {
                await roleManager.CreateAsync(new IdentityRole("Admin"));
            }
            await userManager.AddToRoleAsync(users.First(u => u.UserName == "admin"), "Admin");

            dbContext.reports.AddRange(
                new Report
                {
                    UserId = "user3",
                    CreationDate = DateTimeOffset.UtcNow,
                    FlaggedCount = 1,
                    BanTime = DateTimeOffset.UtcNow.AddDays(100),
                    Profile = users[3]
                },
                new Report
                {
                    UserId = "user1",
                    CreationDate = DateTimeOffset.UtcNow,
                    FlaggedCount = 1,
                    BanTime = DateTimeOffset.MinValue,
                    Profile = users[0]
                }
            );

            Console.WriteLine("Seeding database...");
            Console.WriteLine($"user3 report created with BanTime: {DateTimeOffset.UtcNow.AddDays(100)}");

            dbContext.Sessions.Add(new Session
            {
                Id = Guid.NewGuid(),
                UserId = "user1",
                ExpiredAt = DateTime.UtcNow.AddHours(1),
                LastRefreshToken = "sample-refresh-token".ToSHA256(),
                IsRevoked = false
            });

            await dbContext.SaveChangesAsync();

            var report = await dbContext.reports.FirstOrDefaultAsync(r => r.UserId == "user3");
            Console.WriteLine($"user3 report found after seeding: {report?.UserId}, BanTime: {report?.BanTime}");
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
        public async Task PostReport_CreatesNewReport()
        {
            var dto = new CreateReportDto(DateTimeOffset.UtcNow.AddDays(10), 2);
            var response = await _client.PostAsJsonAsync("/api/reports/flag/user2", dto);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }

        [Fact]
        public async Task PutReport_UpdatesBanTime()
        {
            var token = await GetAccessTokenAsync("admin", "AdminPassword123!");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var dto = new UpdateReportDto(DateTimeOffset.UtcNow.AddDays(1));

            var response = await _client.PutAsJsonAsync("/api/reports/1", dto);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetCanLogin_ReturnsForbidden_WhenUserIsBanned()
        {
            var response = await _client.GetAsync("/api/reports/canLogin/user3");

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task FlagReport_IncreasesFlaggedCount()
        {
            var response = await _client.PutAsync("/api/reports/flag/user1", null);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
            var report = await dbContext.reports.FirstOrDefaultAsync(r => r.UserId == "user1");
            Assert.NotNull(report);
            Assert.Equal(2, report!.FlaggedCount);
        }

        [Fact]
        public async Task DeleteReport_RemovesReport()
        {
            var token = await GetAccessTokenAsync("admin", "AdminPassword123!");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.DeleteAsync("/api/reports/1");

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }

        [Fact]
        public async Task InvalidateSessions_SetsSessionsToRevoked()
        {
            var token = await GetAccessTokenAsync("admin", "AdminPassword123!");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.PostAsync("/api/invalidate-sessions/user1", null);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
            var sessions = await dbContext.Sessions.Where(s => s.UserId == "user1").ToListAsync();
            Assert.All(sessions, s => Assert.True(s.IsRevoked));
        }
    }
}