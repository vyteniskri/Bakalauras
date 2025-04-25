using Connect2Game.Auth.Model;
using System.ComponentModel.DataAnnotations;

namespace Connect2Game.Model
{
    public class InformationField
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public String Text { get; set; }

        [Required]
        public DateTimeOffset CreationDate { get; set; }


        [Required]
        public required string UserId { get; set; }
            
        public Profile? Profile { get; set; }

        public String? ForeignKeyProfileId { get; set; }

        public InformationFieldDto ToDto()
        {
            return new InformationFieldDto(Id, Text);
        }

    }
}
