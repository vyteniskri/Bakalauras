using Connect2Game.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SharpGrip.FluentValidation.AutoValidation.Endpoints.Extensions;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Connect2Game.Endpoints
{
    public static class FilterAPI
    {
        public static void AddFilterAPI(this WebApplication app)
        {
            var filters = app.MapGroup("/api").AddFluentValidationAutoValidation();


            filters.MapGet("/filters/search/{text}", async (ApiDbContext dbContext, string text, int page = 1, int pageSize = 30) =>
            {
                var filters = await dbContext.filters
                    .Where(f => f.Text.ToLower().Contains(text.ToLower()))
                    .OrderByDescending(f => f.Text.ToLower() == text.ToLower()) 
                    .ThenBy(f => f.Text.ToLower().IndexOf(text.ToLower())) 
                    .ThenBy(f => f.Text)
                    .Skip((page - 1) * pageSize) 
                    .Take(pageSize) 
                    .Select(f => f.ToDto())
                    .ToListAsync();

                return Results.Ok(filters);
            });

            filters.MapGet("/filters/{foreignKey}", async (ApiDbContext dbContext, int foreignKey) =>
            {

                var filters = await dbContext.filters.FirstOrDefaultAsync(c => c.Id == foreignKey);

                if (filters == null)
                {
                    Results.NotFound();
                }

                return Results.Ok(filters.ToDto());
            });


            filters.MapGet("/filters/subcategoryFilter/{categoryId}/search/{text}", async (ApiDbContext dbContext, string text, int categoryId, int limit = 50, int offset = 0) =>
            {
                var filters = await dbContext.subCategoriesFilter
                    .Where(scf => scf.ForeignKeySubcategory2Id == categoryId &&
                                  scf.ForeignKeyFilter.Text.ToLower().Contains(text.ToLower()))
                    .OrderByDescending(scf => scf.ForeignKeyFilter.Text.ToLower() == text.ToLower()) 
                    .ThenBy(scf => scf.ForeignKeyFilter.Text.ToLower().IndexOf(text.ToLower()))
                    .ThenBy(scf => scf.ForeignKeyFilter.Text) 
                    .Select(scf => new
                    {
                        SubCategoryFilterId = scf.Id, 
                        Filter = scf.ForeignKeyFilter.ToDto() 
                    })
                    .Distinct()
                    .Skip(offset) 
                    .Take(limit)  
                    .ToListAsync();

                var result = filters.Select(f => new
                {
                    SubCategoryFilterId = f.SubCategoryFilterId,
                    Filter = f.Filter
                });

                return Results.Ok(result);
            });


        }
    }
}
