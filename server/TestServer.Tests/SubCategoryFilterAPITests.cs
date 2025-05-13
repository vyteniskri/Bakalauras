using Connect2Game.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System.Linq;
using System.Net;
using System.Net.Http.Json;
using System.Threading.Tasks;
using TestServer.Tests;
using Xunit;

namespace Connect2Game.Tests.Endpoints
{
    public class SubCategoryFilterApiTests
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;

        public SubCategoryFilterApiTests()
        {
            _factory = new CustomWebApplicationFactory(nameof(SubCategoryFilterApiTests));
            _client = _factory.CreateClient();

            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
            dbContext.Database.EnsureDeleted();
            dbContext.Database.EnsureCreated();
            SeedDatabase(dbContext).Wait();
        }

        private async Task SeedDatabase(ApiDbContext dbContext)
        {
            if (dbContext.subCategoriesFilter.Any()) return;

            var subCategory2 = new SubCategory2 { Id = 1, Title = "SubCategory 1" };
            var filter = new Filter { Id = 1, Text = "Filter 1" };

            dbContext.subCategory2s.Add(subCategory2);
            dbContext.filters.Add(filter);

            dbContext.subCategoriesFilter.AddRange(
                new SubCategoryFilter
                {
                    Id = 1,
                    ForeignKeySubcategory2 = subCategory2,
                    ForeignKeyFilter = filter
                },
                new SubCategoryFilter
                {
                    Id = 2,
                    ForeignKeySubcategory2 = subCategory2,
                    ForeignKeyFilter = filter
                }
            );

            await dbContext.SaveChangesAsync();
        }

        [Fact]
        public async Task GetSubCategoryFiltersByForeignKey_ReturnsFilters()
        {
            var response = await _client.GetAsync("/api/subCategoryFilters/1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var filters = await response.Content.ReadFromJsonAsync<List<SubCategoryFilterDto>>();
            Assert.NotNull(filters);
            Assert.Equal(2, filters!.Count);
        }

        [Fact]
        public async Task GetSubCategoryFiltersByForeignKey_ReturnsNotFound_WhenNoFiltersExist()
        {
            var response = await _client.GetAsync("/api/subCategoryFilters/999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetSubCategoryFiltersWithLimitAndOffset_ReturnsLimitedResults()
        {
            var response = await _client.GetAsync("/api/subCategoryFilters/limit/1?limit=1&offset=1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var filters = await response.Content.ReadFromJsonAsync<List<SubCategoryFilterDto>>();
            Assert.NotNull(filters);
            Assert.Single(filters);
        }

        [Fact]
        public async Task GetSubCategoryFiltersWithLimitAndOffset_ReturnsNotFound_WhenNoFiltersExist()
        {
            var response = await _client.GetAsync("/api/subCategoryFilters/limit/999?limit=1&offset=0");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetSubCategoryFiltersByFilterForeignKey_ReturnsFilters()
        {
            var response = await _client.GetAsync("/api/subCategoryFilters/Filter/1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var filters = await response.Content.ReadFromJsonAsync<List<SubCategoryFilterDto>>();
            Assert.NotNull(filters);
            Assert.Equal(2, filters!.Count);
        }

        [Fact]
        public async Task GetSubCategoryFiltersByFilterForeignKey_ReturnsNotFound_WhenNoFiltersExist()
        {
            var response = await _client.GetAsync("/api/subCategoryFilters/Filter/999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetAllSubCategoryFilters_ReturnsAllFilters()
        {
            var response = await _client.GetAsync("/api/subCategoryFilters");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var filters = await response.Content.ReadFromJsonAsync<List<SubCategoryFilterDto>>();
            Assert.NotNull(filters);
            Assert.Equal(2, filters!.Count);
        }

        [Fact]
        public async Task GetAllSubCategoryFilters_ReturnsNotFound_WhenNoFiltersExist()
        {
            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
            dbContext.subCategoriesFilter.RemoveRange(dbContext.subCategoriesFilter);
            await dbContext.SaveChangesAsync();

            var response = await _client.GetAsync("/api/subCategoryFilters");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetSubCategoryFilterById_ReturnsFilter()
        {
            var response = await _client.GetAsync("/api/subCategoryFilters/Once/1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var filter = await response.Content.ReadFromJsonAsync<SubCategoryFilterDto>();
            Assert.NotNull(filter);
            Assert.Equal(1, filter!.Id);
        }

        [Fact]
        public async Task GetSubCategoryFilterById_ReturnsNotFound_WhenIdDoesNotExist()
        {
            var response = await _client.GetAsync("/api/subCategoryFilters/Once/999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}