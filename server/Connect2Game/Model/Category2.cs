using System.ComponentModel.DataAnnotations;

namespace Connect2Game.Model
{
    public class Category2
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public String Title { get; set; }

        [Required]
        public DateTimeOffset CreationDate { get; set; }

        [Required]
        public int Priority { get; set; }


        public Category2Dto ToDto()
        {
            return new Category2Dto(Id, Title, Priority);
        }
    }
}
