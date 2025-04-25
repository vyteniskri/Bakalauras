using Connect2Game.Auth.Model;
using System.ComponentModel.DataAnnotations;

namespace Connect2Game.Model
{
    public class Session
    {
        public Guid Id { get; set; }

        public string LastRefreshToken { get; set; }

        public DateTimeOffset InitiatedAt { get; set; }

        public DateTimeOffset ExpiredAt { get; set; }

        public bool IsRevoked { get; set; }

        [Required]
        public required string UserId { get; set; }

        public Profile Profile { get; set; }
    }
}
