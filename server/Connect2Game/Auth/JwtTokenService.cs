using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Connect2Game.Auth
{
    public class JwtTokenService
    {
        private SymmetricSecurityKey _authSigingKey;
        private string? _issuer;
        private string? _audience;

        public JwtTokenService(IConfiguration configuration)
        {
            _authSigingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Secret"]));
            _issuer = configuration["Jwt:ValidIssuer"];
            _audience = configuration["Jwt:ValidAudience"];
        }

        public string CreateAccessToken(string userName, string userId, IEnumerable<string> roles)
        {
            var authClaims = new List<Claim>
            {
                new(ClaimTypes.Name, userName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Sub, userId),
            };

            authClaims.AddRange(roles.Select(o => new Claim(ClaimTypes.Role, o)));

            var token = new JwtSecurityToken(
                issuer: _issuer,
                audience: _audience,
                expires: DateTime.Now.AddMinutes(30),
                claims: authClaims,
                signingCredentials: new SigningCredentials(_authSigingKey, SecurityAlgorithms.HmacSha256)
            );

            return new JwtSecurityTokenHandler().WriteToken(token);

        }

        public string CreateRefreshToken(Guid sessionId, string userId, DateTime expires)
        {
            var authClaims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Sub, userId),
                new Claim("SessionId", sessionId.ToString()),
            };

            var token = new JwtSecurityToken(
                issuer: _issuer,
                audience: _audience,
                expires: expires,
                claims: authClaims,
                signingCredentials: new SigningCredentials(_authSigingKey, SecurityAlgorithms.HmacSha256)
            );

            return new JwtSecurityTokenHandler().WriteToken(token);

        }

        public bool TryParseRefreshToken(string refreshToken, out ClaimsPrincipal? claims)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler() { MapInboundClaims = false };
                var validationParameters = new TokenValidationParameters()
                {
                    ValidIssuer = _issuer,
                    ValidAudience = _audience,
                    IssuerSigningKey = _authSigingKey,
                    ValidateLifetime = true
                };

                claims = tokenHandler.ValidateToken(refreshToken, validationParameters, out _);
                return true;
            }
            catch
            {
                claims = null;
                return false;
            }
        }
    }
}
