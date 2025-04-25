using Connect2Game.Auth.Model;
using System.ComponentModel.DataAnnotations;

namespace Connect2Game.Model
{
    public class Message
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public String Text { get; set; }

        [Required]
        public DateTimeOffset CreationDate { get; set; }

        public Friendship? ForeignKeyFriendship { get; set; }

        public int? ForeignKeyFriendshipId { get; set; }

        public Profile? Profile { get; set; }

        public String? ForeignKeyProfileId { get; set; }

        [Required]
        public required string UserId { get; set; }

        public MessageDto ToDto()
        {
            return new MessageDto(Id, UserId, ForeignKeyFriendship.Id, Text, CreationDate);
        }
    }
}
