using System.ComponentModel.DataAnnotations;

namespace Connect2Game.Model
{
    public class SubCategory2
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public String Title { get; set; }

        [Required]
        public DateTimeOffset CreationDate { get; set; }

        [Required]
        public int Priority { get; set; }

        public int MaxNumberOfFilters { get; set; }

        public Category2? ForeignKeyCategory2 { get; set; }

        public int? ForeignKeyCategory2Id { get; set; }

        public bool CanChangeVisibility { get; set; } = false;

        public SubCategory2Dto ToDto()
        {
            return new SubCategory2Dto(Id, Title, Priority, MaxNumberOfFilters, CanChangeVisibility, ForeignKeyCategory2.Id);
        }
    }
}
