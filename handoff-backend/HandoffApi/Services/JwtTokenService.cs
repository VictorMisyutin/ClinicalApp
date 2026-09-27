using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HandoffApi.Models;
using Microsoft.IdentityModel.Tokens;

namespace HandoffApi.Services;

public class JwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string IssueToken(Clinician clinician)
    {
        var jwtSection = _configuration.GetSection("Jwt");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSection["Key"]!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, clinician.Id),
            new Claim("name", clinician.Name),
            new Claim(ClaimTypes.Role, clinician.Role),
            new Claim("unit", clinician.Unit),
        };

        // One shift's worth of validity — long enough to cover a night shift
        // without re-prompting for credentials mid-handoff.
        var token = new JwtSecurityToken(
            issuer: jwtSection["Issuer"],
            audience: jwtSection["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(12),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
