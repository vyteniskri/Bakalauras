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
            _client = _factory.CreateClient(); 

            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<Profile>>();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            SeedDatabase(dbContext, userManager, roleManager).Wait(); 
        }

        private async Task<string> GetAccessTokenAsync()
        {
            var loginDto = new
            {
                UserName = "test2",
                Password = "TestPassword123!" 
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
            var token = await GetAccessTokenAsync(); 

            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _client.GetAsync("/api/profiles");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }


        [Fact]
        public async Task Get_ProfileById_ReturnsOk()
        {
            var profileId = "5"; 
            var response = await _client.GetAsync($"/api/profiles/{profileId}");

            var statusCode = response.StatusCode;

            Assert.Equal(System.Net.HttpStatusCode.OK, statusCode);
        }

        [Fact]
        public async Task Get_ProfileById_ReturnsNotFound()
        {
            var profileId = "invalid-profile-id";
            var response = await _client.GetAsync($"/api/profiles/{profileId}");

            var statusCode = response.StatusCode;

            Assert.Equal(System.Net.HttpStatusCode.NotFound, statusCode);
        }

        [Fact]
        public async Task Put_UpdateProfile_ReturnsOK()
        {
            var token = await GetAccessTokenAsync(); 

            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var dto = new UpdateProfileDto("newUsername");


            var response = await _client.PutAsJsonAsync("/api/profiles", dto);

            var statusCode = response.StatusCode;

            Assert.Equal(System.Net.HttpStatusCode.OK, statusCode);
        }

        [Fact]
        public async Task Get_ProfileSearch_ReturnsOk()
        {
            var searchTerm = "test"; 
            var response = await _client.GetAsync($"/api/profiles/search/{searchTerm}");

            var statusCode = response.StatusCode;

            Assert.Equal(System.Net.HttpStatusCode.OK, statusCode);
        }

        [Fact]
        public async Task Get_ProfileSearch_ReturnsNotFound()
        {
            var searchTerm = "nonexistentname"; 
            var response = await _client.GetAsync($"/api/profiles/search/{searchTerm}");

            var statusCode = response.StatusCode;

            Assert.Equal(System.Net.HttpStatusCode.NotFound, statusCode);
        }

        [Fact]
        public async Task Delete_Profile_ReturnsUnauthorized()
        {
            var profileId = "5";
            var unauthorizedProfileId = "unauthorized-profile-id";

            var response = await _client.DeleteAsync($"/api/profiles/{profileId}");

            var statusCode = response.StatusCode;

            Assert.Equal(System.Net.HttpStatusCode.Unauthorized, statusCode);
        }

        [Fact]
        public async Task Get_ProfilesChunks_ReturnsOk()
        {
            var page = 1;
            var pageSize = 1;

            var response = await _client.GetAsync($"/api/profiles/Chunks?page={page}&pageSize={pageSize}");

            var statusCode = response.StatusCode;

            Assert.Equal(System.Net.HttpStatusCode.OK, statusCode);
        }

        [Fact]
        public async Task Get_ProfilesChunks_ReturnsBadRequest()
        {
            var page = -1; 
            var pageSize = 5;

            var response = await _client.GetAsync($"/api/profiles/Chunks?page={page}&pageSize={pageSize}");

            var statusCode = response.StatusCode;

            Assert.Equal(System.Net.HttpStatusCode.BadRequest, statusCode);
        }

    }
}
