using Connect2Game.Auth;
using Connect2Game.Auth.Model;
using Connect2Game.Model;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using TestServer.Tests;
using Xunit;

namespace Connect2Game.Tests.Endpoints
{
    public class AuthEndpointsTests
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;
        private readonly Mock<JwtTokenService> _mockJwtTokenService;
        private readonly Mock<SessionService> _mockSessionService;

        public AuthEndpointsTests()
        {
            _factory = new CustomWebApplicationFactory(nameof(AuthEndpointsTests));
            _mockJwtTokenService = new Mock<JwtTokenService>();
            _mockSessionService = new Mock<SessionService>();
            _client = _factory.CreateClient();

            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<Profile>>();

            SeedDatabase(dbContext, userManager).Wait();
        }

        private async Task SeedDatabase(ApiDbContext dbContext, UserManager<Profile> userManager)
        {
            if (dbContext.Users.Any()) return;

            var user = new Profile { UserName = "user1", Email = "user1@example.com" };
            await userManager.CreateAsync(user, "Password123!");
        }


        [Fact]
        public async Task Register_ReturnsUnprocessableEntity_WhenUsernameTaken()
        {
            // Arrange
            var dto = new AuthEndpoints.RegisterUserDto("user1", "user1@example.com", "Password123!");

            // Act
            var response = await _client.PostAsJsonAsync("api/register", dto);

            // Assert
            Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        }

       

        [Fact]
        public async Task Login_ReturnsUnprocessableEntity_WhenUserDoesNotExist()
        {
            // Arrange
            var dto = new AuthEndpoints.LoginDto("nonexistentuser", "Password123!");

            // Act
            var response = await _client.PostAsJsonAsync("api/login", dto);

            // Assert
            Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        }

        [Fact]
        public async Task Login_ReturnsUnprocessableEntity_WhenPasswordIsInvalid()
        {
            // Arrange
            var dto = new AuthEndpoints.LoginDto("user1", "WrongPassword");

            // Act
            var response = await _client.PostAsJsonAsync("api/login", dto);

            // Assert
            Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        }



        [Fact]
        public async Task Logout_ReturnsUnprocessableEntity_WhenRefreshTokenIsMissing()
        {
            // Act
            var response = await _client.PostAsync("api/logout", null);

            // Assert
            Assert.Equal(HttpStatusCode.UnprocessableEntity, response.StatusCode);
        }
    }
}