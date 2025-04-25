using Connect2Game.Auth.Model;
using Microsoft.AspNetCore.Identity;
using System.Data;

namespace Connect2Game.Auth
{
    public class AuthSeeder
    {
        public UserManager<Profile> _userManager { get; }
        public RoleManager<IdentityRole> _roleManager { get; }

        public AuthSeeder(UserManager<Profile> userManager, RoleManager<IdentityRole> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
        }


        public async Task SeedAsync()
        {
            await AddDefaultRolesAsync();
            await AddAdminUserAsync();
            await AddModeratorUserAsync();
        }

        private async Task AddAdminUserAsync()
        {
            var newAdminUser = new Profile()
            {
                UserName = "Admin",
                Email = "admin@admin.com"
            };

            var exsistAdminUser = await _userManager.FindByNameAsync(newAdminUser.UserName);
            if (exsistAdminUser == null)
            {
                var createAdminUserResult = await _userManager.CreateAsync(newAdminUser, "Admin123!");
                if (createAdminUserResult.Succeeded)
                {
                    await _userManager.AddToRolesAsync(newAdminUser, Roles.All);
                }
            }

        }

        private async Task AddModeratorUserAsync()
        {
            var newModeratorUser = new Profile()
            {
                UserName = "Moderator",
                Email = "moderator@moderator.com"
            };

            var exsistAdminUser = await _userManager.FindByNameAsync(newModeratorUser.UserName);
            if (exsistAdminUser == null)
            {
                var createAdminUserResult = await _userManager.CreateAsync(newModeratorUser, "Moderator123!");
                if (createAdminUserResult.Succeeded)
                {
                    await _userManager.AddToRolesAsync(newModeratorUser, new List<string> { Roles.Moderator, Roles.User });


                }
            }

        }


        private async Task AddDefaultRolesAsync()
        {
            foreach (var role in Roles.All)
            {
                var roleExists = await _roleManager.RoleExistsAsync(role);
                if (!roleExists)
                {
                    await _roleManager.CreateAsync(new IdentityRole(role));
                }
            }
        }
    }
}
