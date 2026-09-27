using HandoffApi.Data;
using HandoffApi.Dtos;
using HandoffApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HandoffApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly HandoffDbContext _db;
    private readonly PasswordService _passwordService;
    private readonly JwtTokenService _tokenService;

    public AuthController(HandoffDbContext db, PasswordService passwordService, JwtTokenService tokenService)
    {
        _db = db;
        _passwordService = passwordService;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request)
    {
        var employeeId = request.EmployeeId.Trim();
        var clinician = await _db.Clinicians.FirstOrDefaultAsync(c => c.EmployeeId == employeeId);

        if (clinician is null || !_passwordService.Verify(clinician, request.Password))
        {
            return Unauthorized(new ErrorResponse { Title = "Invalid employee ID or password." });
        }

        var token = _tokenService.IssueToken(clinician);
        return Ok(new LoginResponse { Token = token, Clinician = DtoMapper.ToDto(clinician) });
    }
}
