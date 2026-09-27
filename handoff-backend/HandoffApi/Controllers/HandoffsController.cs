using HandoffApi.Data;
using HandoffApi.Dtos;
using HandoffApi.Models;
using HandoffApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HandoffApi.Controllers;

[ApiController]
[Authorize]
[Route("api/handoffs")]
public class HandoffsController : ControllerBase
{
    private readonly HandoffDbContext _db;
    private readonly HandoffValidator _validator;

    public HandoffsController(HandoffDbContext db, HandoffValidator validator)
    {
        _db = db;
        _validator = validator;
    }

    private IQueryable<Patient> PatientsWithHandoff() =>
        _db.Patients
            .Include(p => p.Handoff!).ThenInclude(h => h.Actions)
            .Include(p => p.Handoff!).ThenInclude(h => h.PendingStudies)
            .Include(p => p.Handoff!).ThenInclude(h => h.Contingencies);

    [HttpGet]
    public async Task<ActionResult<List<HandoffRecordDto>>> GetAll()
    {
        var patients = await PatientsWithHandoff().OrderBy(p => p.Room).ToListAsync();
        return Ok(patients.Where(p => p.Handoff is not null)
            .Select(p => DtoMapper.ToRecordDto(p, p.Handoff!))
            .ToList());
    }

    // The frontend fetches a record by patient id, not handoff id — see
    // handoff-frontend/src/api/handoff.ts's fetchRecord(patientId).
    [HttpGet("{patientId}")]
    public async Task<ActionResult<HandoffRecordDto>> GetByPatient(string patientId)
    {
        var patient = await PatientsWithHandoff().FirstOrDefaultAsync(p => p.Id == patientId);
        if (patient?.Handoff is null)
        {
            return NotFound(new ErrorResponse { Title = "That patient is not on this ward." });
        }
        return Ok(DtoMapper.ToRecordDto(patient, patient.Handoff));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<HandoffDto>> SaveDraft(string id, HandoffDto dto)
    {
        var handoff = await FindHandoffAsync(id);
        if (handoff is null) return NotFound(new ErrorResponse { Title = "That handoff no longer exists." });

        DtoMapper.ApplyEditableFields(handoff, dto);
        handoff.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(DtoMapper.ToDto(handoff));
    }

    [HttpPost("{id}/submit")]
    public async Task<ActionResult<HandoffDto>> Submit(string id, HandoffDto dto)
    {
        var handoff = await FindHandoffAsync(id);
        if (handoff is null) return NotFound(new ErrorResponse { Title = "That handoff no longer exists." });

        var issues = _validator.CheckHandoff(dto);
        if (HandoffValidator.HasBlocking(issues))
        {
            return UnprocessableEntity(new ErrorResponse
            {
                Title = "The server rejected this handoff. See the safety check.",
                Issues = issues,
            });
        }

        DtoMapper.ApplyEditableFields(handoff, dto);
        handoff.Status = "submitted";
        handoff.SubmittedAt = DateTime.UtcNow;
        handoff.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(DtoMapper.ToDto(handoff));
    }

    [HttpPost("{id}/acknowledge")]
    public async Task<ActionResult<HandoffDto>> Acknowledge(string id, HandoffDto dto)
    {
        var handoff = await FindHandoffAsync(id);
        if (handoff is null) return NotFound(new ErrorResponse { Title = "That handoff no longer exists." });

        var issues = _validator.CheckAcknowledgement(dto);
        if (HandoffValidator.HasBlocking(issues))
        {
            return UnprocessableEntity(new ErrorResponse
            {
                Title = "The server rejected this handoff. See the safety check.",
                Issues = issues,
            });
        }

        DtoMapper.ApplyEditableFields(handoff, dto);
        handoff.Status = "acknowledged";
        handoff.AcknowledgedAt = DateTime.UtcNow;
        handoff.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(DtoMapper.ToDto(handoff));
    }

    [HttpPatch("{id}/actions/{actionId}")]
    public async Task<ActionResult<HandoffDto>> ToggleAction(string id, string actionId, ToggleActionRequest request)
    {
        var handoff = await FindHandoffAsync(id);
        if (handoff is null) return NotFound(new ErrorResponse { Title = "That handoff no longer exists." });

        var action = handoff.Actions.FirstOrDefault(a => a.Id == actionId);
        if (action is not null) action.Completed = request.Completed;
        handoff.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(DtoMapper.ToDto(handoff));
    }

    private Task<Handoff?> FindHandoffAsync(string id) =>
        _db.Handoffs
            .Include(h => h.Actions)
            .Include(h => h.PendingStudies)
            .Include(h => h.Contingencies)
            .FirstOrDefaultAsync(h => h.Id == id);
}
