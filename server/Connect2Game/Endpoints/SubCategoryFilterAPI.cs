using Connect2Game.Model;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using SharpGrip.FluentValidation.AutoValidation.Endpoints.Extensions;

namespace Connect2Game.Endpoints
{
    public static class SubCategoryFilterAPI
    {
        public static void AddSubCategoryFilterAPI(this WebApplication app)
        {
            var joinTables = app.MapGroup("/api").AddFluentValidationAutoValidation();

            joinTables.MapGet("/subCategoryFilters/{foreignKey}", async (ApiDbContext dbContext, int foreignKey) =>
            {
                var subCategories2 = await dbContext.subCategoriesFilter
                                    .Include(c => c.ForeignKeySubcategory2)
                                    .Include(c => c.ForeignKeyFilter)
                                    .Where(t => t.ForeignKeySubcategory2.Id == foreignKey)
                                    .Select(c => c.ToDto())
                                    .ToListAsync();

                if (!subCategories2.Any())
                {
                    return Results.NotFound();
                }

                return Results.Ok(subCategories2);
            });

            joinTables.MapGet("/subCategoryFilters/limit/{foreignKey}", async (ApiDbContext dbContext, int foreignKey, int limit, int offset) =>
            {
 

                var subCategories2 = await dbContext.subCategoriesFilter
                    .Include(c => c.ForeignKeySubcategory2)
                    .Include(c => c.ForeignKeyFilter)
                    .Where(t => t.ForeignKeySubcategory2.Id == foreignKey)
                    .Skip(offset) 
                    .Take(limit)  
                    .Select(c => c.ToDto())
                    .ToListAsync();

                if (!subCategories2.Any())
                {
                    return Results.NotFound();
                }

                return Results.Ok(subCategories2);
            });

            joinTables.MapGet("/subCategoryFilters/Filter/{foreignKey}", async (ApiDbContext dbContext, int foreignKey) =>
            {
                var subCategories2 = await dbContext.subCategoriesFilter
                                    .Include(c => c.ForeignKeySubcategory2)
                                    .Include(c => c.ForeignKeyFilter)
                                    .Where(t => t.ForeignKeyFilter.Id == foreignKey)
                                    .Select(c => c.ToDto())
                                    .ToListAsync();

                if (!subCategories2.Any())
                {
                    return Results.NotFound();
                }

                return Results.Ok(subCategories2);
            });


            joinTables.MapGet("/subCategoryFilters", async (ApiDbContext dbContext) =>
            {
                var subCategories2 = await dbContext.subCategoriesFilter
                                .Include(c => c.ForeignKeySubcategory2)
                                .Include(c => c.ForeignKeyFilter)
                                .Select(c => c.ToDto())
                                .ToListAsync();

                if (!subCategories2.Any())
                {
                    return Results.NotFound();
                }

                return Results.Ok(subCategories2);
            });


            joinTables.MapGet("/subCategoryFilters/Once/{foreignKey}", async (ApiDbContext dbContext, int foreignKey) =>
            {
                var subCategories2 = await dbContext.subCategoriesFilter
                    .Include(c => c.ForeignKeySubcategory2)
                    .Include(c => c.ForeignKeyFilter)
                    .FirstOrDefaultAsync(c => c.Id == foreignKey);

                if (subCategories2 == null)
                {
                    return Results.NotFound();
                }

                return Results.Ok(subCategories2.ToDto());
            });



        }
    }
}
