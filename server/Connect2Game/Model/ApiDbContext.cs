using Microsoft.EntityFrameworkCore;

namespace Connect2Game.Model
{
    public class ApiDbContext : DbContext
    {
        private readonly IConfiguration _configuration;
        public DbSet<Profile> Profiles { get; set; }

        public ApiDbContext(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseNpgsql(_configuration.GetConnectionString("PostgreSQL"));
        }
    }
}
