using Connect2Game.Model;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.VisualStudio.TestPlatform.TestHost;
using System;
using System.Linq;

namespace TestServer.Tests
{
    public class CustomWebApplicationFactory : WebApplicationFactory<Program>
    {
        private readonly string _dbName;

        public CustomWebApplicationFactory(string dbName = null)
        {
            _dbName = dbName ?? Guid.NewGuid().ToString(); // Generate unique DB name if not provided
        }


        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureServices(services =>
            {
                // Remove the real DbContext
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<ApiDbContext>));
                if (descriptor != null)
                    services.Remove(descriptor);

                services.AddDbContext<ApiDbContext>(options =>
                {
                    options.UseInMemoryDatabase(_dbName);
                });

                // Build service provider and seed test data
                var sp = services.BuildServiceProvider();
                using var scope = sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApiDbContext>();

                db.Database.EnsureCreated(); // Ensure the in-memory database is created

              
            });
        }

    }
}
