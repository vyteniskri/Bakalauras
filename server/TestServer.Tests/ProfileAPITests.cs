using Connect2Game.Auth.Model;
using Connect2Game.Endpoints;
using Connect2Game.Model;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Threading.Tasks;
using TestServer.Tests;
using Xunit;
using static Connect2Game.Auth.AuthEndpoints;

namespace Connect2Game.Tests.Endpoints
{
    public class ProfileApiTests
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;

        public ProfileApiTests()
        {
            _factory = new CustomWebApplicationFactory(nameof(ProfileApiTests));
            _client = _factory.CreateClient(); // Assuming TestFixture initializes the HttpClient and the web application

            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<Profile>>();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            SeedDatabase(dbContext, userManager, roleManager).Wait(); // Seed data before any test runs
        }

        private async Task<string> GetAccessTokenAsync()
        {
            var loginDto = new
            {
                UserName = "test2",
                Password = "TestPassword123!" // must match the seeded test user
            };

            var response = await _client.PostAsJsonAsync("/api/login", loginDto);
            response.EnsureSuccessStatusCode();

            var loginResult = await response.Content.ReadFromJsonAsync<SuccessfulLoginDto>();
            return loginResult!.AccessToken;
        }



        private async Task SeedDatabase(ApiDbContext dbContext, UserManager<Profile> userManager, RoleManager<IdentityRole> roleManager)
        {
            if (!dbContext.Users.Any())
            {
                // Profiles and roles to be added
                var profiles = new List<(string Id, string UserName, string Email, string Role)>
                {
                    ("5", "test", "testuser@example.com", "Admin"),
                    ("4", "test2", "testuser@example.com", "User")
                };

                foreach (var (id, userName, email, role) in profiles)
                {
                    var profile = new Profile { Id = id, UserName = userName, Email = email };
                    var existingRole = await roleManager.FindByNameAsync(role) ?? new IdentityRole(role);

                    if (existingRole.Name == role)
                        await roleManager.CreateAsync(existingRole);

                    await userManager.CreateAsync(profile, "TestPassword123!");
                    await userManager.AddToRoleAsync(profile, role);

                    await dbContext.SaveChangesAsync();
                }
            }
        }



        [Fact]
        public async Task Get_Profiles_ReturnsOk_WhenAuthorized()
        {
            // Arrange: Get the token
            var token = await GetAccessTokenAsync(); // Assuming GetAccessTokenAsync returns a valid JWT token

            // Set the token in the request header for authorization
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            // Act: Make the API request
            var response = await _client.GetAsync("/api/profiles");

            // Assert: Check the response status code
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }


        // Test: Get profile by valid profile ID
        [Fact]
        public async Task Get_ProfileById_ReturnsOk()
        {
            // Arrange
            var profileId = "5"; // Replace with a valid profile ID in the database
            var response = await _client.GetAsync($"/api/profiles/{profileId}");

            // Act
            var statusCode = response.StatusCode;

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.OK, statusCode);
        }

        // Test: Get profile by invalid profile ID
        [Fact]
        public async Task Get_ProfileById_ReturnsNotFound()
        {
            // Arrange
            var profileId = "invalid-profile-id";
            var response = await _client.GetAsync($"/api/profiles/{profileId}");

            // Act
            var statusCode = response.StatusCode;

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.NotFound, statusCode);
        }

        // Test: Update profile with invalid data (username already taken)
        [Fact]
        public async Task Put_UpdateProfile_ReturnsOK()
        {
            // Arrange: Get the token
            var token = await GetAccessTokenAsync(); // Assuming GetAccessTokenAsync returns a valid JWT token

            // Set the token in the request header for authorization
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
            // Arrange
            var dto = new UpdateProfileDto("newUsername");


            var response = await _client.PutAsJsonAsync("/api/profiles", dto);

            // Act
            var statusCode = response.StatusCode;

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.OK, statusCode);
        }

        // Test: Search profiles by name
        [Fact]
        public async Task Get_ProfileSearch_ReturnsOk()
        {
            // Arrange
            var searchTerm = "test"; // Search term based on a profile that exists in the database
            var response = await _client.GetAsync($"/api/profiles/search/{searchTerm}");

            // Act
            var statusCode = response.StatusCode;

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.OK, statusCode);
        }

        // Test: Search profiles by name (no results)
        [Fact]
        public async Task Get_ProfileSearch_ReturnsNotFound()
        {
            // Arrange
            var searchTerm = "nonexistentname"; // Search term with no matching profiles
            var response = await _client.GetAsync($"/api/profiles/search/{searchTerm}");

            // Act
            var statusCode = response.StatusCode;

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.NotFound, statusCode);
        }

        // Test: Delete profile with invalid authorization (user not admin or not the profile owner)
        [Fact]
        public async Task Delete_Profile_ReturnsUnauthorized()
        {
            // Arrange
            var profileId = "5";
            var unauthorizedProfileId = "unauthorized-profile-id"; // A different profile ID to simulate the unauthorized user

            var response = await _client.DeleteAsync($"/api/profiles/{profileId}");

            // Act
            var statusCode = response.StatusCode;

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.Unauthorized, statusCode);
        }

        // Test: Get profiles in chunks (valid pagination)
        [Fact]
        public async Task Get_ProfilesChunks_ReturnsOk()
        {
            // Arrange
            var page = 1;
            var pageSize = 1;

            var response = await _client.GetAsync($"/api/profiles/Chunks?page={page}&pageSize={pageSize}");

            // Act
            var statusCode = response.StatusCode;

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.OK, statusCode);
        }

        // Test: Get profiles in chunks (invalid pagination)
        [Fact]
        public async Task Get_ProfilesChunks_ReturnsBadRequest()
        {
            // Arrange
            var page = -1; // Invalid page number
            var pageSize = 5;

            var response = await _client.GetAsync($"/api/profiles/Chunks?page={page}&pageSize={pageSize}");

            // Act
            var statusCode = response.StatusCode;

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.BadRequest, statusCode);
        }

    }
}
