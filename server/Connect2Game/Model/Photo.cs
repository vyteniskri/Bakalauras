using Connect2Game.Auth.Model;
using System.ComponentModel.DataAnnotations;

namespace Connect2Game.Model
{
    public class Photo
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public DateTimeOffset CreationDate { get; set; }

        [Required]
        public String FilePath { get; set; }

        public Message? ForeignMessage { get; set; }
        public int? ForeignMessageId { get; set; }

        public bool MainOrNot { get; set; } = false;

        public int Number {  get; set; }

        public Profile? Profile { get; set; }

        public String? ForeignKeyProfileId { get; set; }

        [Required]
        public required string UserId { get; set; }

        public PhotoDto ToDto()
        {
            return new PhotoDto(Id, FilePath, MainOrNot, Number, UserId);
        }
    }
}
