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
            _dbName = dbName ?? Guid.NewGuid().ToString(); 
        }


        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<ApiDbContext>));
                if (descriptor != null)
                    services.Remove(descriptor);

                services.AddDbContext<ApiDbContext>(options =>
                {
                    options.UseInMemoryDatabase(_dbName);
                });

                var sp = services.BuildServiceProvider();
                using var scope = sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApiDbContext>();

                db.Database.EnsureCreated(); 

              
            });
        }

    }
}
