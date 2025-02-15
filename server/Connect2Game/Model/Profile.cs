using System.ComponentModel.DataAnnotations;

namespace Connect2Game.Model
{
    public class Profile
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public String Username { get; set; }

        [Required]
        public String Email { get; set; }


    }
}
