using Connect2Game.Auth.Model;
using Connect2Game.Azure;
using Connect2Game.Model;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
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
    public class FriendshipApiTests
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;

        public FriendshipApiTests()
        {
            _factory = new CustomWebApplicationFactory(nameof(FriendshipApiTests));
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

                var role = await roleManager.FindByNameAsync("User");
                if (role == null)
                {
                    role = new IdentityRole("User");
                    await roleManager.CreateAsync(role);
                }

                await userManager.AddToRoleAsync(user1, "User");
                await userManager.AddToRoleAsync(user2, "User");

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
        public async Task GetFriendship_ReturnsOk_WhenFriendshipExists()
        {
            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
            dbContext.Friendships.Add(new Friendship { UserId1 = "user1", UserId2 = "user2", IsFriendship = true });
            await dbContext.SaveChangesAsync();

            var token = await GetAccessTokenAsync("user1");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync("/api/friendships/user2");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var result = await response.Content.ReadFromJsonAsync<bool>();
            Assert.True(result);
        }

        [Fact]
        public async Task GetFriendship_ReturnsFalse_WhenNoFriendshipExists()
        {
            var token = await GetAccessTokenAsync("user1");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync("/api/friendships/user3");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var result = await response.Content.ReadFromJsonAsync<bool>();
            Assert.False(result);
        }

        [Fact]
        public async Task PostFriendship_CreatesFriendship()
        {
            var token = await GetAccessTokenAsync("user1");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.PostAsync("/api/friendships/user2", null);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }

        [Fact]
        public async Task PutFriendship_UpdatesFriendship()
        {
            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
            dbContext.Friendships.Add(new Friendship { UserId1 = "user2", UserId2 = "user1", IsFriendship = false });
            await dbContext.SaveChangesAsync();

            var token = await GetAccessTokenAsync("user1");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.PutAsync("/api/friendships/user2", null);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task SearchFriendship_ReturnsFriendshipDto()
        {
            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
            dbContext.Friendships.Add(new Friendship { UserId1 = "user1", UserId2 = "user2", IsFriendship = true });
            await dbContext.SaveChangesAsync();

            var token = await GetAccessTokenAsync("user1");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync("/api/friendships/search/user2");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var result = await response.Content.ReadFromJsonAsync<FriendshipDto>();
            Assert.NotNull(result);

            Assert.Equal("user1", result.ForeignKeyProfile2);
            Assert.Equal("user2", result.ForeignKeyProfile1);
        }

        [Fact]
        public async Task GetPendingFriendships_ReturnsPendingFriends()
        {
            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
            dbContext.Friendships.Add(new Friendship { UserId1 = "user1", UserId2 = "user2", IsFriendship = false });
            await dbContext.SaveChangesAsync();

            var token = await GetAccessTokenAsync("user2");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync("/api/friendships/pending/user1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var result = await response.Content.ReadFromJsonAsync<bool>();
            Assert.True(result);
        }
    }
}