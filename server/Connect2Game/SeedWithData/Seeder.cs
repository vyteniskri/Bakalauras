using System.Collections.Generic;
using System.Net.Http;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Connect2Game.Model;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Connect2Game.SeedWithData
{

    public class GiantBombGenreResponse
    {
        [JsonPropertyName("results")]
        public List<GiantBombGenreDto> Results { get; set; } = new();
    }

    public class GiantBombGenreDto
    {

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
    }




    // Updated Rawg Platform response model
    public class RawgPlatformResponse
    {
        [JsonPropertyName("results")]
        public List<RawgPlatformDto> Results { get; set; } = new();
    }

    public class RawgPlatformDto
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
    }

    public class FreeToPlay
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;
    }


    public class Seeder
    {
        private readonly ApiDbContext _context;
        private readonly HttpClient _httpClient;
        private const string RawgApiUrl = "https://api.rawg.io/api/platforms";
        private const string RawgApiUrl2 = "https://api.rawg.io/api/genres";
        private const string RawgApiUrl3 = "https://api.rawg.io/api/games";
        private const string RawgApiKey = "a07693779e894217bb05dbd551149a69";
        private const string FreeToPlayUrl = "https://www.freetogame.com/api/games";

        public Seeder(ApiDbContext context, HttpClient httpClient)
        {
            _context = context;
            _httpClient = httpClient;
        }

        public async Task SeedAsync()
        {

            await SeedCategoriesAsync();

            await SeedFiltersAsync();
 
            await LinkFiltersToSubCategoryFiltersAsync();

            await SeedGameGenresFiltersAsync();
            //await SeedGamesAsync();
            //await RemoveSeededFiltersByNameAsync();


            //await SeedAllRAWGGamesAsync();


            //int totalResults = 87007;
            //int limit = 100;
            //int totalFetched = 0;

            //Console.WriteLine("Starting full fetch from GiantBomb API...\n");

            //for (int offset = 27756; offset < totalResults; offset += limit)
            //{
            //    Console.WriteLine($"Fetching games {offset + 1} to {offset + limit}...");

            //    await SeedGiantBombGenresAsync("games", limit, offset);

            //    totalFetched += offset;

            //    // TODO: Save each chunk to your database here
            //    // await SaveGamesAsync(gamesChunk);

            //    // Optional: Delay to avoid hitting rate limits
            //    await Task.Delay(500); // 0.5 second delay between requests
            //}

            //Console.WriteLine($"\n🎉 Finished fetching all games. Total fetched: {totalFetched}");
            //await SeedFreeToPlayGamesAsync();
 

        }

        private async Task SeedAllRAWGGamesAsync()
        {
            try
            {
                // 7366 is 22125 parsiusta (step) nuo jo predeti kita kart

                int totalGames = 884991;
                int pageSize = 40;

                int totalPages = (int)Math.Ceiling((double)totalGames / pageSize);
                Console.WriteLine("Total page size " + totalPages);

                for (int page = 11854; page <= totalPages; page++)
                {
                    Console.WriteLine($"Seeding page {page} of {totalPages}...");
                    await SeedRAWGGamesAsync(page);
                }

                Console.WriteLine("Seeding complete.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error seeding all games: {ex.Message}");
            }
        }


        private async Task SeedRAWGGamesAsync(int pageN)
        {
            try
            {

                var response = await _httpClient.GetAsync(
                    $"{RawgApiUrl3}?key={RawgApiKey}&page_size=100&page={pageN}"
                );
                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();
                var platformResponse = JsonSerializer.Deserialize<RawgPlatformResponse>(jsonString);

                if (platformResponse?.Results == null || !platformResponse.Results.Any())
                {
                    Console.WriteLine($"No results on page {pageN}, skipping.");
                    return;
                }

                var fetchedNames = platformResponse.Results
                                                 .Select(p => p.Name)
                                                 .ToList();


                var existingNames = await _context.filters
                    .Where(f => fetchedNames.Contains(f.Text))
                    .Select(f => f.Text)
                    .ToListAsync();

                var newGames = platformResponse.Results
                    .Where(p => !existingNames.Contains(p.Name))
                    .ToList();

                if (!newGames.Any())
                {
                    Console.WriteLine($"Page {pageN}: all {fetchedNames.Count} games already exist. Nothing to seed.");
                    return;
                }


                var newFilters = newGames
                    .Select(p => new Filter
                    {
                        Text = p.Name,
                        CreationDate = DateTimeOffset.UtcNow
                    })
                    .ToList();

                _context.filters.AddRange(newFilters);
                await _context.SaveChangesAsync();

                var gamingPref = await _context.subCategory2s
                    .FirstOrDefaultAsync(c => c.Id == 10);

                if (gamingPref != null)
                {
                    var subCategoryFilters = newFilters
                        .Select(f => new SubCategoryFilter
                        {
                            ForeignKeySubcategory2Id = gamingPref.Id,
                            ForeignKeyFilterId = f.Id
                        })
                        .ToList();

                    _context.subCategoriesFilter.AddRange(subCategoryFilters);
                    await _context.SaveChangesAsync();

                    Console.WriteLine($"Page {pageN}: seeded {newFilters.Count} new games and linked them.");
                }
                else
                {
                    Console.WriteLine($"Page {pageN}: seeded {newFilters.Count} new games, but subcategory not found.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error seeding page {pageN}: {ex.Message}");
            }
        }


        public async Task RemoveSeededFiltersByNameAsync()
        {
            try
            {

                var response = await _httpClient.GetAsync($"{RawgApiUrl3}?key={RawgApiKey}&page_size=200");
                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();
                var platformResponse = JsonSerializer.Deserialize<RawgPlatformResponse>(jsonString);

                if (platformResponse?.Results != null)
                {
                    var apiFilterNames = platformResponse.Results.Select(p => p.Name).ToList();

 
                    var filtersToDelete = await _context.filters
                        .Where(f => apiFilterNames.Contains(f.Text))
                        .ToListAsync();

                    if (!filtersToDelete.Any())
                    {
                        Console.WriteLine("No matching filters found to delete.");
                        return;
                    }

                    var filterIds = filtersToDelete.Select(f => f.Id).ToList();


                    _context.filters.RemoveRange(filtersToDelete);

                    await _context.SaveChangesAsync();

                    Console.WriteLine($"Deleted {filtersToDelete.Count} filters and their subcategory links.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error deleting seeded filters: {ex.Message}");
            }
        }



        private async Task SeedGiantBombGenresAsync(string name, int limit = 100, int offset = 0)
        {   
            var genres = await FetchFromGiantBombAsync(name, limit, offset);
            Console.WriteLine($"Getting {name} from API limit: {limit} offset {offset}");

            if (genres.Count == 0)
            {
                Console.WriteLine("No genres fetched from GiantBomb.");
                return;
            }

            var existingTexts = await _context.filters.Select(f => f.Text).ToListAsync();

            var newFilters = genres
                .Where(g => !existingTexts.Contains(g.Name))
                .Select(g => new Filter
                {
                    Text = g.Name,
                    CreationDate = DateTimeOffset.UtcNow
                }).ToList();

            if (newFilters.Count > 0)
            {
                _context.filters.AddRange(newFilters);
                await _context.SaveChangesAsync();
                Console.WriteLine($"Seeded {newFilters.Count} new GiantBomb genres as filters.");
            }
            else
            {
                Console.WriteLine("No new GiantBomb genres to seed.");
                return;
            }

            var genreSubCategory = await _context.subCategory2s.FirstOrDefaultAsync(c => c.Id == 9); // Adjust ID

            if (genreSubCategory != null)
            {
                var subCategoryFilters = newFilters.Select(f => new SubCategoryFilter
                {
                    ForeignKeySubcategory2Id = genreSubCategory.Id,
                    ForeignKeyFilterId = f.Id
                }).ToList();

                _context.subCategoriesFilter.AddRange(subCategoryFilters);
                await _context.SaveChangesAsync();
                Console.WriteLine($"Linked {newFilters.Count} genres to subcategories.");
            }
        }


        private async Task SeedCategoriesAsync()
        {
            if (await _context.category2s.AnyAsync())
            {
                Console.WriteLine("Categories already seeded. Skipping...");
                return;
            }

            var gamingPreferences = new Category2
            {
                Title = "Gaming Preferences",
                CreationDate = DateTimeOffset.UtcNow,
                Priority = 1
            };

            _context.category2s.Add(gamingPreferences);
            await _context.SaveChangesAsync(); 

            var subCategories = new List<SubCategory2>
        {
            new SubCategory2 { Title = "Favorite Game Genres", CreationDate = DateTimeOffset.UtcNow, Priority = 1, ForeignKeyCategory2Id = gamingPreferences.Id },
            new SubCategory2 { Title = "Platform", CreationDate = DateTimeOffset.UtcNow, Priority = 2, ForeignKeyCategory2Id = gamingPreferences.Id },
            new SubCategory2 { Title = "Casual or Competitive Player", CreationDate = DateTimeOffset.UtcNow, Priority = 3, ForeignKeyCategory2Id = gamingPreferences.Id },
            new SubCategory2 { Title = "Preferred Game Mode", CreationDate = DateTimeOffset.UtcNow, Priority = 4, ForeignKeyCategory2Id = gamingPreferences.Id },
            new SubCategory2 { Title = "Gaming Schedule", CreationDate = DateTimeOffset.UtcNow, Priority = 5, ForeignKeyCategory2Id = gamingPreferences.Id },
            new SubCategory2 { Title = "Favorite Game of All Time", CreationDate = DateTimeOffset.UtcNow, Priority = 6, ForeignKeyCategory2Id = gamingPreferences.Id }
        };

            _context.subCategory2s.AddRange(subCategories);
            await _context.SaveChangesAsync();

            Console.WriteLine("Gaming Preferences category with subcategories seeded.");
        }

        private async Task SeedFiltersAsync()
        {
            if (await _context.filters.AnyAsync())
            {
                Console.WriteLine("Filters already seeded. Skipping...");
                return;
            }

            try
            {
                var response = await _httpClient.GetAsync($"{RawgApiUrl}?key={RawgApiKey}");
                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();
                var platformResponse = JsonSerializer.Deserialize<RawgPlatformResponse>(jsonString);

                if (platformResponse?.Results != null)
                {
                    var filters = platformResponse.Results.Select(p => new Filter
                    {
                        Text = p.Name,
                        CreationDate = DateTimeOffset.UtcNow
                    }).ToList();

                    _context.filters.AddRange(filters);
                    await _context.SaveChangesAsync();

                    Console.WriteLine($"Seeded {filters.Count} filters.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error seeding filters: {ex.Message}");
            }
        }

        private async Task LinkFiltersToSubCategoryFiltersAsync()
        {

            if (await _context.subCategoriesFilter.AnyAsync())
            {
                Console.WriteLine("Filters already seeded. Skipping...");
                return;
            }

            var gamingPreferencesCategory = await _context.subCategory2s
                .FirstOrDefaultAsync(c => c.Id == 2);
      
            if (gamingPreferencesCategory != null)
            {
               

                var filters = await _context.filters.ToListAsync();

                var subCategoryFilters = filters.Select((filter, index) => new SubCategoryFilter
                {
                    ForeignKeySubcategory2Id = gamingPreferencesCategory.Id, 
                    ForeignKeyFilterId = filter.Id,

                }).ToList();

                _context.subCategoriesFilter.AddRange(subCategoryFilters);
                await _context.SaveChangesAsync();

                Console.WriteLine($"Linked {filters.Count} filters to subcategories under Gaming Preferences category.");
            }
        }

        private async Task SeedGameGenresFiltersAsync()
        {
            var val = await _context.filters.FirstOrDefaultAsync(c => c.Text == "RPG");
            if (val != null)
            {
                Console.WriteLine("Filters already seeded. Skipping...");
                return;
            }

            try
            {
                var response = await _httpClient.GetAsync($"{RawgApiUrl2}?key={RawgApiKey}");
                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();
                var platformResponse = JsonSerializer.Deserialize<RawgPlatformResponse>(jsonString);

                if (platformResponse?.Results != null)
                {
                    var filters = platformResponse.Results.Select(p => new Filter
                    {
                        Text = p.Name,
                        CreationDate = DateTimeOffset.UtcNow
                    }).ToList();

                    _context.filters.AddRange(filters);
                    await _context.SaveChangesAsync();


                    var gamingPreferencesCategory = await _context.subCategory2s
                        .FirstOrDefaultAsync(c => c.Id == 1);

                    if (gamingPreferencesCategory != null)
                    {

                        var subCategoryFilters = filters.Select((filter, index) => new SubCategoryFilter
                        {
                            ForeignKeySubcategory2Id = gamingPreferencesCategory.Id, 
                            ForeignKeyFilterId = filter.Id,

                        }).ToList();

                        _context.subCategoriesFilter.AddRange(subCategoryFilters);
                        await _context.SaveChangesAsync();

                        Console.WriteLine($"Linked {filters.Count} filters to subcategories under Gaming Preferences category.");
                    }



                    Console.WriteLine($"Seeded {filters.Count} filters.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error seeding filters: {ex.Message}");
            }
        }


        private async Task SeedGamesAsync(int pageN)
        {
            if (await _context.filters.FirstOrDefaultAsync(c => c.Text == "God of War (2018)") != null)
            {
                Console.WriteLine("Filters already seeded. Skipping...");
                return;
            }

            try
            {
                var response = await _httpClient.GetAsync($"{RawgApiUrl3}?key={RawgApiKey}&page_size=100&page={pageN}");
                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();
                var platformResponse = JsonSerializer.Deserialize<RawgPlatformResponse>(jsonString);

                if (platformResponse?.Results != null)
                {
                    var filters = platformResponse.Results.Select(p => new Filter
                    {
                        Text = p.Name,
                        CreationDate = DateTimeOffset.UtcNow
                    }).ToList();

                    _context.filters.AddRange(filters);
                    await _context.SaveChangesAsync();


                    var gamingPreferencesCategory = await _context.subCategory2s
                        .FirstOrDefaultAsync(c => c.Id == 10);

                    if (gamingPreferencesCategory != null)
                    {


                        var subCategoryFilters = filters.Select((filter, index) => new SubCategoryFilter
                        {
                            ForeignKeySubcategory2Id = gamingPreferencesCategory.Id, 
                            ForeignKeyFilterId = filter.Id,

                        }).ToList();

                        _context.subCategoriesFilter.AddRange(subCategoryFilters);
                        await _context.SaveChangesAsync();

                        Console.WriteLine($"Linked {filters.Count} filters to subcategories under Gaming Preferences category.");
                    }



                    Console.WriteLine($"Seeded {filters.Count} filters.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error seeding filters: {ex.Message}");
            }
        }

        private async Task SeedFreeToPlayGamesAsync()
        {
            try
            {

                var existingFilters = await _context.filters
                    .Select(c => c.Text)
                    .ToListAsync();

                var response = await _httpClient.GetAsync(FreeToPlayUrl);
                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();


                var platformResponse = JsonSerializer.Deserialize<List<FreeToPlay>>(jsonString);

                if (platformResponse != null && platformResponse.Any())
                {

                    var newFilters = platformResponse
                        .Where(p => !existingFilters.Contains(p.Title)) 
                        .Select(p => new Filter
                        {
                            Text = p.Title,
                            CreationDate = DateTimeOffset.UtcNow
                        }).ToList();


                    if (newFilters.Any())
                    {
                        _context.filters.AddRange(newFilters);
                        await _context.SaveChangesAsync();
                        Console.WriteLine($"Seeded {newFilters.Count} new filters.");
                    }
                    else
                    {
                        Console.WriteLine("No new filters to seed.");
                    }


                    var gamingPreferencesFreeToPlay = await _context.subCategory2s
                        .FirstOrDefaultAsync(c => c.Id == 8);

                    if (gamingPreferencesFreeToPlay != null && newFilters.Any())
                    {
                        var subCategoryFilters = newFilters.Select(filter => new SubCategoryFilter
                        {
                            ForeignKeySubcategory2Id = gamingPreferencesFreeToPlay.Id,
                            ForeignKeyFilterId = filter.Id,
                        }).ToList();

                        _context.subCategoriesFilter.AddRange(subCategoryFilters);
                        await _context.SaveChangesAsync();
                        Console.WriteLine($"Linked {newFilters.Count} new filters to subcategories.");
                    }
                }
                else
                {
                    Console.WriteLine("No games found in the response.");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error seeding filters: {ex.Message}");
            }
        }

        private async Task<List<GiantBombGenreDto>> FetchFromGiantBombAsync(string name, int limit = 100, int offset = 0, string? filter = null)
        {
            _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("Connect2Game/1.0 (vytensiukasv@gmail.com)");

            var baseUrl = $"https://www.giantbomb.com/api/{name}/";
            var apiKey = "24fc1b14097500234ac605dfb3412c357eeab929";

            var queryParams = $"?api_key={apiKey}&format=json&field_list=name&limit={limit}&offset={offset}";
            if (!string.IsNullOrWhiteSpace(filter))
            {
                queryParams += $"&filter={Uri.EscapeDataString(filter)}";
            }

            try
            {
                var response = await _httpClient.GetAsync(baseUrl + queryParams);
                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();

                var genreResponse = JsonSerializer.Deserialize<GiantBombGenreResponse>(jsonString);
                return genreResponse?.Results ?? new List<GiantBombGenreDto>();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching genres from GiantBomb: {ex.Message}");
                return new List<GiantBombGenreDto>();
            }
        }







    }



}
