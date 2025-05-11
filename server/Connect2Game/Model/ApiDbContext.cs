using Connect2Game.Auth.Model;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Runtime.ExceptionServices;
using static NuGet.Packaging.PackagingConstants;

namespace Connect2Game.Model
{
    public class ApiDbContext : IdentityDbContext<Profile>
    {
        private readonly IConfiguration _configuration;
        //public DbSet<Profile> Profiles { get; set; }
        public DbSet<InformationField> InformationFields { get; set; }
        public DbSet<Photo> Photos { get; set; } 
        public DbSet<Video> Videos { get; set; }
        public DbSet<Friendship> Friendships { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Session> Sessions { get; set; }


        public DbSet<Category2> category2s { get; set; }
        public DbSet<SubCategory2> subCategory2s { get; set; }
        public DbSet<Filter> filters { get; set; }
        public DbSet<SubCategoryFilter> subCategoriesFilter { get; set; }
        public DbSet<ProfileFilter> profileFilters { get; set; }
        public DbSet<RegistrationStep> registrationSteps { get; set; }
        public DbSet<SubCategoryProfile> subCategoriesProfile { get; set; }
        public DbSet<Report> reports { get; set; }

        public DbSet<Warning> warnings { get; set; }

        public ApiDbContext(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            // Configure the database only if options are not already configured (e.g., in tests)
            if (!optionsBuilder.IsConfigured && _configuration != null)
            {
                optionsBuilder.UseNpgsql(_configuration.GetConnectionString("PostgreSQL"));
            }
        }

        // Add this constructor for testing with DbContextOptions
        //public ApiDbContext(DbContextOptions<ApiDbContext> options) : base(options)
        //{
        //}

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);


            modelBuilder.Entity<Message>()
                .HasOne(m => m.ForeignKeyFriendship)
                .WithMany()
                .HasForeignKey(m => m.ForeignKeyFriendshipId)
                .OnDelete(DeleteBehavior.Cascade);


            modelBuilder.Entity<Photo>()
               .HasOne(p => p.ForeignMessage)
               .WithMany()
               .HasForeignKey(p => p.ForeignMessageId)
               .OnDelete(DeleteBehavior.Cascade);


            modelBuilder.Entity<ProfileFilter>()
               .HasOne(p => p.ForeignKeySubCategoryFilter)
               .WithMany()
               .HasForeignKey(p => p.ForeignKeySubCategoryFilterId)
               .OnDelete(DeleteBehavior.Cascade);




            modelBuilder.Entity<SubCategoryFilter>()
               .HasOne(p => p.ForeignKeyFilter)
               .WithMany()
               .HasForeignKey(p => p.ForeignKeyFilterId)
               .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SubCategoryFilter>()
               .HasOne(p => p.ForeignKeySubcategory2)
               .WithMany()
               .HasForeignKey(p => p.ForeignKeySubcategory2Id)
               .OnDelete(DeleteBehavior.Cascade);



            modelBuilder.Entity<SubCategoryProfile>()
               .HasOne(p => p.ForeignKeySubcategory2)
               .WithMany()
               .HasForeignKey(p => p.ForeignKeySubcategory2Id)
               .OnDelete(DeleteBehavior.Cascade);


            modelBuilder.Entity<SubCategory2>()
              .HasOne(p => p.ForeignKeyCategory2)
              .WithMany()
              .HasForeignKey(p => p.ForeignKeyCategory2Id)
              .OnDelete(DeleteBehavior.Cascade);


            modelBuilder.Entity<InformationField>()
             .HasOne(p => p.Profile)
             .WithMany()
             .HasForeignKey(p => p.ForeignKeyProfileId)
             .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Video>()
                .HasOne(p => p.Profile)
                .WithMany()
                .HasForeignKey(p => p.ForeignKeyProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Photo>()
                .HasOne(p => p.Profile)
                .WithMany()
                .HasForeignKey(p => p.ForeignKeyProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RegistrationStep>()
                .HasOne(p => p.Profile)
                .WithMany()
                .HasForeignKey(p => p.ForeignKeyProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Message>()
                .HasOne(p => p.Profile)
                .WithMany()
                .HasForeignKey(p => p.ForeignKeyProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Friendship>()
               .HasOne(p => p.Profile1)
               .WithMany()
               .HasForeignKey(p => p.ForeignKeyProfileId1)
               .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Friendship>()
              .HasOne(p => p.Profile2)
              .WithMany()
              .HasForeignKey(p => p.ForeignKeyProfileId2)
              .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProfileFilter>()
               .HasOne(p => p.Profile)
               .WithMany()
               .HasForeignKey(p => p.ForeignKeyProfileId)
               .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SubCategoryProfile>()
               .HasOne(p => p.Profile)
               .WithMany()
               .HasForeignKey(p => p.ForeignKeyProfileId)
               .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Report>()
               .HasOne(p => p.Profile)
               .WithMany()
               .HasForeignKey(p => p.ForeignKeyProfileId)
               .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Warning>()
               .HasOne(p => p.Report)
               .WithMany()
               .HasForeignKey(p => p.ForeignKeyReportId)
               .OnDelete(DeleteBehavior.Cascade);
        }

    }
}
