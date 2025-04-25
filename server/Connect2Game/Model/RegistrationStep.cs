using Connect2Game.Auth.Model;
using System.ComponentModel.DataAnnotations;

namespace Connect2Game.Model
{
    public class RegistrationStep
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int CurrentStep { get; set; }

        [Required]
        public required string UserId { get; set; }

        [Required]
        public DateTimeOffset CreationDate { get; set; }

        public Profile? Profile { get; set; }

        public String? ForeignKeyProfileId { get; set; }

        public RegistrationStepDto ToDto()
        {
            return new RegistrationStepDto(Id, CurrentStep);
        }
    }
}
