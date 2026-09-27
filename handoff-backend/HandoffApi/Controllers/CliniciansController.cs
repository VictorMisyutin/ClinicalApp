using HandoffApi.Data;
using HandoffApi.Dtos;
using HandoffApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HandoffApi.Controllers;

[ApiController]
[Authorize]
[Route("api/clinicians")]
public class CliniciansController : ControllerBase
{
    private readonly HandoffDbContext _db;

    public CliniciansController(HandoffDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<ClinicianDto>>> GetAll()
    {
        var clinicians = await _db.Clinicians.OrderBy(c => c.Name).ToListAsync();
        return Ok(clinicians.Select(DtoMapper.ToDto).ToList());
    }
}
