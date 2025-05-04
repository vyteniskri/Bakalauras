using Connect2Game.Endpoints;
using Connect2Game.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using TestServer.Tests;
using Xunit;

namespace Connect2Game.Tests.Endpoints
{
    public class Category2ApiTests
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;

        public Category2ApiTests()
        {
            _factory = new CustomWebApplicationFactory(nameof(Category2ApiTests));
            _client = _factory.CreateClient(); // Assuming TestFixture initializes the HttpClient and the web application

            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
            dbContext.Database.EnsureCreated();
            SeedDatabase(dbContext).Wait();
        }



        private async Task SeedDatabase(ApiDbContext dbContext)
        {
            // Seed some category2s into the database
            if (!dbContext.category2s.Any())
            {
                dbContext.category2s.AddRange(new List<Category2>
                {
                    new Category2 { Id = 1, Title = "Category1" },
                    new Category2 { Id = 2, Title = "Category2" },
                    new Category2 { Id = 3, Title = "Category3" }
                });
                await dbContext.SaveChangesAsync();
            }
        }
      

        [Fact]
        public async Task Get_Categories2_ReturnsOk()
        {
            // Act: Make the API request
            var response = await _client.GetAsync("/api/categories2");

            // Assert: Check the response status code
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task Get_CategoryById_ReturnsOk_WhenValidId()
        {
            // Arrange
            var validId = 1; // Replace with an ID from the seeded data

            // Act: Make the API request
            var response = await _client.GetAsync($"/api/categories2/Id/{validId}");

            // Assert: Check the response status code
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task Get_CategoryById_ReturnsNotFound_WhenInvalidId()
        {
            // Arrange
            var invalidId = 9999; // ID that doesn't exist in the database

            // Act: Make the API request
            var response = await _client.GetAsync($"/api/categories2/Id/{invalidId}");

            // Assert: Check the response status code
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task Get_CategoryById_ReturnsBadRequest_WhenIdIsInvalid()
        {
            // Arrange
            var invalidId = "invalid-id"; // Invalid ID format

            // Act: Make the API request
            var response = await _client.GetAsync($"/api/categories2/Id/{invalidId}");

            // Assert: Check the response status code
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        // You can add more test cases for other edge cases like empty database, no categories, etc.
    }
}
