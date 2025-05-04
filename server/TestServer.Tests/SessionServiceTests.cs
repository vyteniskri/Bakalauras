using Connect2Game.Auth;
using Connect2Game.Helpers;
using Connect2Game.Model;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Xunit;

namespace Connect2Game.Tests.Auth
{
    public class SessionServiceTests
    {
        private readonly DbContextOptions<ApiDbContext> _dbContextOptions;

        public SessionServiceTests()
        {
            _dbContextOptions = new DbContextOptionsBuilder<ApiDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
        }

        private ApiDbContext CreateDbContext()
        {
            return new ApiDbContext(_dbContextOptions);
        }

        [Fact]
        public async Task CreateSessionAsync_ShouldCreateSession()
        {
            // Arrange
            var dbContext = CreateDbContext();
            var sessionService = new SessionService(dbContext);

            var sessionId = Guid.NewGuid();
            var userId = "user1";
            var refreshToken = "refresh_token_123";
            var expiresAt = DateTime.UtcNow.AddDays(1);

            // Act
            await sessionService.CreateSessionAsync(sessionId, userId, refreshToken, expiresAt);

            // Assert
            var session = await dbContext.Sessions.FindAsync(sessionId);
            Assert.NotNull(session);
            Assert.Equal(userId, session.UserId);
            Assert.Equal(refreshToken.ToSHA256(), session.LastRefreshToken);
            Assert.Equal(expiresAt, session.ExpiredAt);
            Assert.False(session.IsRevoked);
        }

        [Fact]
        public async Task ExtendSessionAsync_ShouldUpdateSession()
        {
            // Arrange
            var dbContext = CreateDbContext();
            var sessionService = new SessionService(dbContext);

            var sessionId = Guid.NewGuid();
            var userId = "user1";
            var refreshToken = "refresh_token_123";
            var expiresAt = DateTime.UtcNow.AddDays(1);

            dbContext.Sessions.Add(new Session
            {
                Id = sessionId,
                UserId = userId,
                LastRefreshToken = refreshToken.ToSHA256(),
                ExpiredAt = DateTime.UtcNow.AddHours(1),
                IsRevoked = false
            });
            await dbContext.SaveChangesAsync();

            var newRefreshToken = "new_refresh_token_456";
            var newExpiresAt = DateTime.UtcNow.AddDays(2);

            // Act
            await sessionService.ExtendSessionAsync(sessionId, newRefreshToken, newExpiresAt);

            // Assert
            var session = await dbContext.Sessions.FindAsync(sessionId);
            Assert.NotNull(session);
            Assert.Equal(newRefreshToken.ToSHA256(), session.LastRefreshToken);
            Assert.Equal(newExpiresAt, session.ExpiredAt);
        }

        [Fact]
        public async Task InvalidateSessionAsync_ShouldRevokeSession()
        {
            // Arrange
            var dbContext = CreateDbContext();
            var sessionService = new SessionService(dbContext);

            var sessionId = Guid.NewGuid();
            dbContext.Sessions.Add(new Session
            {
                Id = sessionId,
                UserId = "user1",
                LastRefreshToken = "refresh_token_123".ToSHA256(),
                ExpiredAt = DateTime.UtcNow.AddDays(1),
                IsRevoked = false
            });
            await dbContext.SaveChangesAsync();

            // Act
            await sessionService.InvalidateSessionAsync(sessionId);

            // Assert
            var session = await dbContext.Sessions.FindAsync(sessionId);
            Assert.NotNull(session);
            Assert.True(session.IsRevoked);
        }

      

        [Fact]
        public async Task IsSessionValidAsync_ShouldReturnTrue_WhenSessionIsValid()
        {
            // Arrange
            var dbContext = CreateDbContext();
            var sessionService = new SessionService(dbContext);

            var sessionId = Guid.NewGuid();
            var refreshToken = "refresh_token_123";

            dbContext.Sessions.Add(new Session
            {
                Id = sessionId,
                UserId = "user1",
                LastRefreshToken = refreshToken.ToSHA256(),
                ExpiredAt = DateTime.UtcNow.AddDays(1),
                IsRevoked = false
            });
            await dbContext.SaveChangesAsync();

            // Act
            var isValid = await sessionService.IsSessionValidAsync(sessionId, refreshToken);

            // Assert
            Assert.True(isValid);
        }

        [Fact]
        public async Task IsSessionValidAsync_ShouldReturnFalse_WhenSessionIsRevoked()
        {
            // Arrange
            var dbContext = CreateDbContext();
            var sessionService = new SessionService(dbContext);

            var sessionId = Guid.NewGuid();
            var refreshToken = "refresh_token_123";

            dbContext.Sessions.Add(new Session
            {
                Id = sessionId,
                UserId = "user1",
                LastRefreshToken = refreshToken.ToSHA256(),
                ExpiredAt = DateTime.UtcNow.AddDays(1),
                IsRevoked = true
            });
            await dbContext.SaveChangesAsync();

            // Act
            var isValid = await sessionService.IsSessionValidAsync(sessionId, refreshToken);

            // Assert
            Assert.False(isValid);
        }
    }
}