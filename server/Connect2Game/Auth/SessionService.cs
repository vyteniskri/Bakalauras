using Connect2Game.Model;
using Connect2Game.Helpers;
using Microsoft.EntityFrameworkCore;

namespace Connect2Game.Auth
{
    public class SessionService(ApiDbContext dbContex)
    {
        public async Task CreateSessionAsync(Guid sessionId, string userId, string refreshToken, DateTime expiresAt)
        {
            dbContex.Sessions.Add(new Session
            {
                Id = sessionId,
                UserId = userId,
                ExpiredAt = expiresAt,
                LastRefreshToken = refreshToken.ToSHA256()
            });

            await dbContex.SaveChangesAsync();
        }

        public async Task ExtendSessionAsync(Guid sessionId, string refreshToken, DateTime expiresAt)
        {
            var session = await dbContex.Sessions.FindAsync(sessionId);
            session.ExpiredAt = expiresAt;
            session.LastRefreshToken = refreshToken.ToSHA256();

            await dbContex.SaveChangesAsync();
        }

        public async Task InvalidateSessionAsync(Guid sessionId)
        {
            var session = await dbContex.Sessions.FindAsync(sessionId);
            if (session is null)
            {
                return;
            }

            session.IsRevoked = true;

            await dbContex.SaveChangesAsync();
        }

        public async Task InvalidateUserSessionsBlockedAsync(Guid userId)
        {
            var activeSessions = await dbContex.Sessions
                .Where(s => s.Id == userId && !s.IsRevoked)
                .ToListAsync();

            if (!activeSessions.Any())
            {
                return; 
            }

            foreach (var session in activeSessions)
            {
                session.IsRevoked = true;
            }

            await dbContex.SaveChangesAsync();

        }

        public async Task<bool> IsSessionValidAsync(Guid sessionId, string refreshToken)
        {
            var session = await dbContex.Sessions.FindAsync(sessionId);
            return session is not null && session.ExpiredAt > DateTimeOffset.UtcNow && !session.IsRevoked && session.LastRefreshToken == refreshToken.ToSHA256();
        }

    }
}
