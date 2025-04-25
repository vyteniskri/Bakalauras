using Connect2Game.Auth.Model;
using System.ComponentModel.DataAnnotations;

namespace Connect2Game.Model
{
    public class Video
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public DateTimeOffset CreationDate { get; set; }

        [Required]
        public String FilePath { get; set; }

        public int Number { get; set; }

        [Required]
        public required string UserId { get; set; }

        public Profile? Profile { get; set; }

        public String? ForeignKeyProfileId { get; set; }

        public VideoDto ToDto()
        {
            return new VideoDto(Id, FilePath, Number);
        }
    }
}
