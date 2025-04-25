namespace Connect2Game.Auth.Model
{
    public class Roles
    {
        public const string Admin = nameof(Admin);
        public const string Moderator = nameof(Moderator);
        public const string User = nameof(User);

        public static readonly IReadOnlyCollection<string> All = new[] { Admin, Moderator, User };
    }
}
