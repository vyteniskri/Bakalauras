using Connect2Game.Endpoints;
using Connect2Game.Model;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http.Json;
using TestServer.Tests;
using Xunit;

namespace Connect2Game.Tests.Endpoints
{
    public class FilterApiTests
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;

        public FilterApiTests()
        {
            _factory = new CustomWebApplicationFactory(nameof(FilterApiTests));
            _client = _factory.CreateClient();

            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
            dbContext.Database.EnsureCreated();
            SeedDatabase(dbContext).Wait();
        }


        private async Task SeedDatabase(ApiDbContext dbContext)
        {
            dbContext.filters.RemoveRange(dbContext.filters);
            dbContext.subCategoriesFilter.RemoveRange(dbContext.subCategoriesFilter);
            await dbContext.SaveChangesAsync();

            dbContext.filters.Add(new Filter { Id = 1, Text = "Test Filter 1" });
            dbContext.filters.Add(new Filter { Id = 2, Text = "Test Filter 2" });
            dbContext.subCategoriesFilter.Add(new SubCategoryFilter { Id = 1, ForeignKeySubcategory2Id = 1, ForeignKeyFilterId = 1 });
            await dbContext.SaveChangesAsync();
        }



        [Fact]
        public async Task Get_Filters_Search_ReturnsOkResponse()
        {
            var response = await _client.GetAsync("/api/filters/search/Test");

            response.EnsureSuccessStatusCode(); // Ensures 2xx status code


        }

   
        [Fact]
        public async Task Get_FilterById_ReturnsExpectedFilter()
        {
            var response = await _client.GetAsync("/api/filters/1");

            response.EnsureSuccessStatusCode(); // Ensures 2xx status code
            var result = await response.Content.ReadFromJsonAsync<FilterDto>();
            Assert.Equal("Test Filter 1", result?.Text);
        }

   
        [Fact]
        public async Task Get_SubcategoryFilter_ReturnsOkResponse()
        {
            var response = await _client.GetAsync("/api/filters/subcategoryFilter/1/search/Test");

            response.EnsureSuccessStatusCode(); // Ensures 2xx status code
        }

        [Fact]
        public async Task Get_FilterById_ReturnsNotFoundForInvalidId()
        {
            int nonExistentId = 9999;

            // Act: Call the API with an invalid filter ID
          var response = await _client.GetAsync($"/api/filters/{nonExistentId}");

            // Assert: Ensure that the response is a 404 Not Found
            Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task Get_SubcategoryFilter_ReturnsEmptyForNoMatches()
        {
            var response = await _client.GetAsync("/api/filters/subcategoryFilter/1/search/SomeText");

            response.EnsureSuccessStatusCode(); // Ensures 2xx status code
        }


    }
}
