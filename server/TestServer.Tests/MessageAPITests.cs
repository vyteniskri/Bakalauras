using Connect2Game.Auth.Model;
using Connect2Game.Azure;
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
    public class MessageApiTests
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;

        public MessageApiTests()
        {
            _factory = new CustomWebApplicationFactory(nameof(MessageApiTests));
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

                var friendship = new Friendship { UserId1 = "user1", UserId2 = "user2", IsFriendship = true };
                dbContext.Friendships.Add(friendship);

                dbContext.Messages.Add(new Message
                {
                    Text = "Hello!",
                    CreationDate = DateTimeOffset.UtcNow,
                    UserId = "user1",
                    ForeignKeyFriendship = friendship
                });

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
        public async Task GetMessages_ReturnsOk_WhenMessagesExist()
        {
            var token = await GetAccessTokenAsync("user1");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync("/api/messages/1?skip=0&take=10");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var messages = await response.Content.ReadFromJsonAsync<List<MessageDto>>();
            Assert.NotNull(messages);
            Assert.NotEmpty(messages);
        }

        [Fact]
        public async Task GetMessages_ReturnsNotFound_WhenNoMessagesExist()
        {
            var token = await GetAccessTokenAsync("user1");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync("/api/messages/999?skip=0&take=10");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetLastMessage_ReturnsOk_WhenMessageExists()
        {
            var token = await GetAccessTokenAsync("user1");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync("/api/messages/last/1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var lastMessage = await response.Content.ReadFromJsonAsync<MessageDto>();
            Assert.NotNull(lastMessage);
        }

        [Fact]
        public async Task GetLastMessage_ReturnsNotFound_WhenNoMessagesExist()
        {
            var token = await GetAccessTokenAsync("user1");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync("/api/messages/last/999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task PostMessage_CreatesMessage()
        {
            var token = await GetAccessTokenAsync("user1");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var createMessageDto = new CreateMessageDto("New message");
            var response = await _client.PostAsJsonAsync("/api/messages/1", createMessageDto);

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        }

        [Fact]
        public async Task PutMessage_UpdatesMessage()
        {
            var token = await GetAccessTokenAsync("user1");
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
            var message = dbContext.Messages.First();
            var updateMessageDto = new UpdateMessageDto("Updated message");

            var response = await _client.PutAsJsonAsync($"/api/messages/{message.Id}", updateMessageDto);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

     
    }
}