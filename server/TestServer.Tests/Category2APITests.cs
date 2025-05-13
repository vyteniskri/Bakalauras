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
            _client = _factory.CreateClient(); 

            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
            dbContext.Database.EnsureCreated();
            SeedDatabase(dbContext).Wait();
        }



        private async Task SeedDatabase(ApiDbContext dbContext)
        {

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

            var response = await _client.GetAsync("/api/categories2");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task Get_CategoryById_ReturnsOk_WhenValidId()
        {

            var validId = 1; 

   
            var response = await _client.GetAsync($"/api/categories2/Id/{validId}");


            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task Get_CategoryById_ReturnsNotFound_WhenInvalidId()
        {
            var invalidId = 9999; 

            var response = await _client.GetAsync($"/api/categories2/Id/{invalidId}");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task Get_CategoryById_ReturnsBadRequest_WhenIdIsInvalid()
        {

            var invalidId = "invalid-id"; 

            var response = await _client.GetAsync($"/api/categories2/Id/{invalidId}");

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

    }
}
