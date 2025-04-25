using Connect2Game.Auth.Model;
using System.ComponentModel.DataAnnotations;

namespace Connect2Game.Model
{
    public class Report
    {
        [Key]
        public int Id { get; set; }


        public DateTimeOffset BanTime { get; set; }

        public int FlaggedCount { get; set; }

        [Required]
        public DateTimeOffset CreationDate { get; set; }

        [Required]
        public required string UserId { get; set; }

        public Profile? Profile { get; set; }

        public String? ForeignKeyProfileId { get; set; }

        public ReportDto ToDto()
        {
            return new ReportDto(Id, BanTime, FlaggedCount, UserId, CreationDate);
        }
    }
}
