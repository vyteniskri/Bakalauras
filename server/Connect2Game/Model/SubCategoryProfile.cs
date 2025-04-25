using Connect2Game.Auth.Model;
using System.ComponentModel.DataAnnotations;

namespace Connect2Game.Model
{
    public class SubCategoryProfile
    {
        [Key]
        public int Id { get; set; }

        public SubCategory2? ForeignKeySubcategory2 { get; set; }
        public int ForeignKeySubcategory2Id { get; set; }

        [Required]
        public DateTimeOffset CreationDate { get; set; }

        [Required]
        public required string UserId { get; set; }

        public Profile? Profile { get; set; }

        public String? ForeignKeyProfileId { get; set; }

        public SubCategoryProfileDto ToDto()
        {
            return new SubCategoryProfileDto(Id, ForeignKeySubcategory2.Id, UserId);
        }
    }
}
