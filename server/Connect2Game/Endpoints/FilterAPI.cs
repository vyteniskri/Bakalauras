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
                var words = text
                  .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                  .Select(w => w.ToLower())
                  .ToList();

                var query = dbContext.filters.AsQueryable();

                foreach (var word in words)
                {
                    query = query.Where(f => EF.Functions.Like(f.Text.ToLower(), $"%{word}%"));
                }

                var sortedQuery = query
                    .OrderByDescending(f => f.Text.ToLower() == text.ToLower())
                    .ThenBy(f => f.Text.Length)
                    .ThenBy(f => f.Text);

                var filters = await sortedQuery
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
                    return Results.NotFound();
                }

                return Results.Ok(filters.ToDto());
            });


            filters.MapGet("/filters/subcategoryFilter/{categoryId}/search/{text}", async (ApiDbContext dbContext, string text, int categoryId, int limit = 50, int offset = 0) =>
            {
                var words = text
                   .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                   .Select(w => w.ToLower())
                   .ToList();


                var query = dbContext.subCategoriesFilter
                    .Where(scf => scf.ForeignKeySubcategory2Id == categoryId);


                foreach (var word in words)
                {
                    query = query.Where(scf => EF.Functions.Like(
                        scf.ForeignKeyFilter.Text.ToLower(), $"%{word}%"));
                }


                var sortedQuery = query
                    .OrderByDescending(scf => scf.ForeignKeyFilter.Text.ToLower() == text.ToLower())
                    .ThenBy(scf => scf.ForeignKeyFilter.Text.Length)
                    .ThenBy(scf => scf.ForeignKeyFilter.Text);

                var filters = await sortedQuery
                    .Select(scf => new
                    {
                        SubCategoryFilterId = scf.Id,
                        Filter = scf.ForeignKeyFilter.ToDto()
                    })
                    .Skip(offset)
                    .Take(limit)
                    .ToListAsync();

                return Results.Ok(filters);
            });


        }
    }
}
