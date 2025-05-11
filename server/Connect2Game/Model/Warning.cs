using Connect2Game.Auth.Model;
using System.ComponentModel.DataAnnotations;

namespace Connect2Game.Model
{
    public class Warning
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public DateTimeOffset CreationDate { get; set; }

        [Required]
        public String Text { get; set; }

        public Report Report { get; set; }

        public int? ForeignKeyReportId { get; set; }

        public WarningDto ToDto()
        {
            return new WarningDto(Id, Report.Id, Text, CreationDate);
        }
    }
}
