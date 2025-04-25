using Connect2Game.Model;
using Microsoft.AspNetCore.Identity;
using Microsoft.Build.Framework;

namespace Connect2Game.Auth.Model
{
    public class Profile : IdentityUser
    {
        [Required]
        public DateTimeOffset CreationDate { get; set; }

        public bool IsBlocked { get; set; } = false;

        public ProfileDto ToDto()
        {
            return new ProfileDto(this.Id, this.UserName);
        }

    }
}
