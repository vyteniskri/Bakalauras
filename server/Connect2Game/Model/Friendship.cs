using Connect2Game.Auth.Model;
using System.ComponentModel.DataAnnotations;

namespace Connect2Game.Model
{
    public class Friendship
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public bool IsFriendship { get; set; } = false;

        [Required]
        public DateTimeOffset CreationDate { get; set; }

        [Required]
        public required string UserId1 { get; set; }

        [Required]
        public required string UserId2 { get; set; }

        public Profile? Profile1 { get; set; }

        public String? ForeignKeyProfileId1 { get; set; }

        public Profile? Profile2 { get; set; }

        public String? ForeignKeyProfileId2 { get; set; }

        public FriendshipDto ToDto()
        {
            return new FriendshipDto(Id, UserId1, UserId2, IsFriendship);
        }
    }
}
