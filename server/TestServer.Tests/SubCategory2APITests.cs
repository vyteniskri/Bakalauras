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
    public class SubCategory2ApiTests
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory _factory;

        public SubCategory2ApiTests()
        {
            _factory = new CustomWebApplicationFactory(nameof(SubCategory2ApiTests));
            _client = _factory.CreateClient();

            using var scope = _factory.Services.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
            SeedDatabase(dbContext).Wait();
        }

        private async Task SeedDatabase(ApiDbContext dbContext)
        {
            if (dbContext.subCategory2s.Any()) return;

            var category2 = new Category2
            {
                Id = 1,
                Title = "Parent Category 2"
            };

            dbContext.category2s.Add(category2);

            dbContext.subCategory2s.AddRange(
                new SubCategory2
                {
                    Id = 1,
                    Title = "SubCategory 1",
                    ForeignKeyCategory2 = category2
                },
                new SubCategory2
                {
                    Id = 2,
                    Title = "SubCategory 2",
                    ForeignKeyCategory2 = category2
                }
            );

            await dbContext.SaveChangesAsync();
        }

        [Fact]
        public async Task GetSubCategoriesByForeignKey_ReturnsSubcategories()
        {
            var response = await _client.GetAsync("/api/subCategories2/1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var subCategories = await response.Content.ReadFromJsonAsync<List<SubCategory2Dto>>();
            Assert.NotNull(subCategories);
            Assert.Equal(2, subCategories!.Count);
        }

        [Fact]
        public async Task GetSubCategoriesByForeignKey_ReturnsNotFound_WhenNoSubcategoriesExist()
        {
            var response = await _client.GetAsync("/api/subCategories2/999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetSubCategoryByTitle_ReturnsSubcategory()
        {
            var response = await _client.GetAsync("/api/subCategories2/Title/SubCategory 1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var subCategory = await response.Content.ReadFromJsonAsync<SubCategory2>();
            Assert.NotNull(subCategory);
            Assert.Equal("SubCategory 1", subCategory!.Title);
        }

        [Fact]
        public async Task GetSubCategoryByTitle_ReturnsNotFound_WhenTitleDoesNotExist()
        {
            var response = await _client.GetAsync("/api/subCategories2/Title/NonExistingTitle");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetSubCategoriesById_ReturnsSubcategory()
        {
            var response = await _client.GetAsync("/api/subCategories2/Id/1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var subCategories = await response.Content.ReadFromJsonAsync<List<SubCategory2Dto>>();
            Assert.NotNull(subCategories);
            Assert.Single(subCategories);
            Assert.Equal(1, subCategories[0].Id);
        }

        [Fact]
        public async Task GetSubCategoriesById_ReturnsNotFound_WhenIdDoesNotExist()
        {
            var response = await _client.GetAsync("/api/subCategories2/Id/999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}