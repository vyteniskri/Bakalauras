using Connect2Game.Auth.Model;
using Microsoft.AspNetCore.Identity;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Connect2Game.Auth
{
    public static class AuthEndpoints
    {
        public static void AddAuthApi(this WebApplication app)
        {

            app.MapPost("api/register", async (UserManager<Profile> userManager, RegisterUserDto dto) =>
            {
                var user = await userManager.FindByNameAsync(dto.UserName);
                if (user != null)
                {
                    return Results.UnprocessableEntity("Username already taken");
                }

                var newUser = new Profile()
                {
                    UserName = dto.UserName,
                    Email = dto.Email,
                    CreationDate = DateTimeOffset.UtcNow
                };

                var createUserResult = await userManager.CreateAsync(newUser, dto.Password);
                if (!createUserResult.Succeeded)
                {
                    return Results.UnprocessableEntity();
                }

                await userManager.AddToRoleAsync(newUser, Roles.User);

                return Results.Created();
            });

            app.MapPost("api/login", async (UserManager<Profile> userManager, JwtTokenService jwtTokenService, SessionService sessionService, HttpContext httpContext, LoginDto dto) =>
            {
                var user = await userManager.FindByNameAsync(dto.UserName);
                if (user == null)
                {
                    return Results.UnprocessableEntity("User does not exist");
                }

                var isPasswordValid = await userManager.CheckPasswordAsync(user, dto.Password);
                if (!isPasswordValid)
                {
                    return Results.UnprocessableEntity("Username or password was incorrect. ");
                }

                var roles = await userManager.GetRolesAsync(user);
                var accessToken = jwtTokenService.CreateAccessToken(user.UserName, user.Id, roles);

                var sessionId = Guid.NewGuid();
                var expiresAt = DateTime.UtcNow.AddDays(3);
                var refreshToken = jwtTokenService.CreateRefreshToken(sessionId, user.Id, expiresAt);

                await sessionService.CreateSessionAsync(sessionId, user.Id, refreshToken, expiresAt);

                var coockieOptions = new CookieOptions()
                {
                    HttpOnly = true,
                    SameSite = SameSiteMode.None, //SameSiteMode.None // Lax
                    Expires = expiresAt,
                    Secure = true
                    //Secure = false
                };

                httpContext.Response.Cookies.Append("RefreshToken", refreshToken, coockieOptions);

                return Results.Ok(new SuccessfulLoginDto(accessToken));
            });

            app.MapPost("api/accessToken", async (UserManager<Profile> userManager, JwtTokenService jwtTokenService, SessionService sessionService, HttpContext httpContext) =>
            {
                
                if (!httpContext.Request.Cookies.TryGetValue("RefreshToken", out var refreshToken))
                {
                    
                    return Results.UnprocessableEntity();
                }

                if (!jwtTokenService.TryParseRefreshToken(refreshToken, out var claims))
                {
                    
                    return Results.UnprocessableEntity();
                }

                var sessionId = claims.FindFirstValue("SessionId");
                if (string.IsNullOrWhiteSpace(sessionId))
                {
                   
                    return Results.UnprocessableEntity();
                }

                var sessionIdGuid = Guid.Parse(sessionId);
                if (!await sessionService.IsSessionValidAsync(sessionIdGuid, refreshToken))
                {

                    return Results.UnprocessableEntity();
                }

                
                var userId = claims.FindFirstValue(JwtRegisteredClaimNames.Sub);
                var user = await userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    return Results.UnprocessableEntity();
                }

                var roles = await userManager.GetRolesAsync(user);
                var accessToken = jwtTokenService.CreateAccessToken(user.UserName, user.Id, roles);
                var expiresAt = DateTime.UtcNow.AddDays(3);
                var newRefreshToken = jwtTokenService.CreateRefreshToken(sessionIdGuid, user.Id, expiresAt);

                var coockieOptions = new CookieOptions()
                {
                    HttpOnly = true,
                    SameSite = SameSiteMode.None, //SameSiteMode.None // Lax
                    Expires = expiresAt,
                    Secure = true //false
                };

                httpContext.Response.Cookies.Append("RefreshToken", newRefreshToken, coockieOptions);

                await sessionService.ExtendSessionAsync(sessionIdGuid, newRefreshToken, expiresAt);

                return Results.Ok(new SuccessfulLoginDto(accessToken));
            });

            app.MapPost("api/logout", async (UserManager<Profile> userManager, JwtTokenService jwtTokenService, SessionService sessionService, HttpContext httpContext) =>
            {
                if (!httpContext.Request.Cookies.TryGetValue("RefreshToken", out var refreshToken))
                {
                    return Results.UnprocessableEntity();
                }

                if (!jwtTokenService.TryParseRefreshToken(refreshToken, out var claims))
                {
                    return Results.UnprocessableEntity();
                }

                var sessionId = claims.FindFirstValue("SessionId");
                if (string.IsNullOrWhiteSpace(sessionId))
                {
                    return Results.UnprocessableEntity();
                }

                await sessionService.InvalidateSessionAsync(Guid.Parse(sessionId));
                httpContext.Response.Cookies.Delete("RefreshToken");




                return Results.Ok();
            });
        }

        public record RegisterUserDto(string UserName, string Email, string Password);
        public record LoginDto(string UserName, string Password);
        public record SuccessfulLoginDto(string AccessToken);
    }
}
