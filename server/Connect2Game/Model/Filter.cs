using System.ComponentModel.DataAnnotations;

namespace Connect2Game.Model
{
    public class Filter
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public String Text { get; set; }

        [Required]
        public DateTimeOffset CreationDate { get; set; }

        public FilterDto ToDto()
        {
            return new FilterDto(Id, Text);
        }

    }
}
