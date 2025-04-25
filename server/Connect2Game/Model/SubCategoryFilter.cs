using System.ComponentModel.DataAnnotations;

namespace Connect2Game.Model
{
    public class SubCategoryFilter
    {
        [Key]
        public int Id { get; set; }

        public SubCategory2? ForeignKeySubcategory2 { get; set; }
        public int ForeignKeySubcategory2Id { get; set; }

        public Filter? ForeignKeyFilter { get; set; }
        public int ForeignKeyFilterId { get; set; }


        public SubCategoryFilterDto ToDto()
        {
            return new SubCategoryFilterDto(Id, ForeignKeySubcategory2.Id, ForeignKeyFilter.Id);
        }
    }
}
