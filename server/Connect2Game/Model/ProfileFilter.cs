using Connect2Game.Auth.Model;
using System.ComponentModel.DataAnnotations;

namespace Connect2Game.Model
{
    public class ProfileFilter
    {
        [Key]
        public int Id { get; set; }

        public SubCategoryFilter? ForeignKeySubCategoryFilter { get; set; }
        public int ForeignKeySubCategoryFilterId { get; set; }

        [Required]
        public DateTimeOffset CreationDate { get; set; }

        [Required]
        public required string UserId { get; set; }

        public Profile? Profile { get; set; }

        public String? ForeignKeyProfileId { get; set; }

        public ProfileFilterDto ToDto()
        {
            return new ProfileFilterDto(Id, UserId, ForeignKeySubCategoryFilter.Id);
        }
    }
}
