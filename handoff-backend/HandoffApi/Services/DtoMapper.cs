using System.Globalization;
using HandoffApi.Dtos;
using HandoffApi.Models;

namespace HandoffApi.Services;

/// <summary>
/// Converts between EF entities and the wire DTOs. Dates cross the wire as
/// ISO strings (or "" / null where the frontend's Handoff type allows it) to
/// match src/types/domain.ts exactly.
/// </summary>
public static class DtoMapper
{
    private const string IsoFormat = "yyyy-MM-ddTHH:mm:ss.fffZ";

    public static string ToIso(DateTime dt) => dt.ToUniversalTime().ToString(IsoFormat, CultureInfo.InvariantCulture);

    public static string? ToIsoOrNull(DateTime? dt) => dt.HasValue ? ToIso(dt.Value) : null;

    public static string ToIsoOrEmpty(DateTime? dt) => dt.HasValue ? ToIso(dt.Value) : "";

    public static DateTime? ParseIsoOrNull(string? value) =>
        string.IsNullOrEmpty(value) ? null : DateTime.Parse(value, CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal);

    public static DateTime ParseIso(string value) => ParseIsoOrNull(value) ?? throw new FormatException($"Invalid date '{value}'");

    public static ClinicianDto ToDto(Clinician c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Role = c.Role,
        Unit = c.Unit,
    };

    public static PatientDto ToDto(Patient p) => new()
    {
        Id = p.Id,
        Mrn = p.Mrn,
        FamilyName = p.FamilyName,
        GivenName = p.GivenName,
        AgeYears = p.AgeYears,
        Sex = p.Sex,
        Room = p.Room,
        Unit = p.Unit,
        AdmittedOn = ToIso(p.AdmittedOn),
    };

    public static ActionItemDto ToDto(ActionItem a) => new()
    {
        Id = a.Id,
        Task = a.Task,
        Owner = a.Owner,
        DueAt = ToIsoOrEmpty(a.DueAt),
        Priority = a.Priority,
        Completed = a.Completed,
    };

    public static PendingStudyDto ToDto(PendingStudy s) => new()
    {
        Id = s.Id,
        Study = s.Study,
        FollowUpOwner = s.FollowUpOwner,
    };

    public static ContingencyDto ToDto(Contingency g) => new()
    {
        Id = g.Id,
        IfCondition = g.IfCondition,
        ThenAction = g.ThenAction,
    };

    public static HandoffDto ToDto(Handoff h) => new()
    {
        Id = h.Id,
        PatientId = h.PatientId,
        Status = h.Status,
        Severity = h.Severity,
        Summary = h.Summary,
        CodeStatus = h.CodeStatus,
        Allergies = h.Allergies,
        NoKnownDrugAllergies = h.NoKnownDrugAllergies,
        Actions = h.Actions.Select(ToDto).ToList(),
        PendingStudies = h.PendingStudies.Select(ToDto).ToList(),
        Contingencies = h.Contingencies.Select(ToDto).ToList(),
        Synthesis = h.Synthesis,
        ActionListReviewed = h.ActionListReviewed,
        OutgoingClinician = h.OutgoingClinician,
        IncomingClinician = h.IncomingClinician,
        ShiftLabel = h.ShiftLabel,
        UpdatedAt = ToIso(h.UpdatedAt),
        SubmittedAt = ToIsoOrNull(h.SubmittedAt),
        AcknowledgedAt = ToIsoOrNull(h.AcknowledgedAt),
    };

    public static HandoffRecordDto ToRecordDto(Patient p, Handoff h) => new()
    {
        Patient = ToDto(p),
        Handoff = ToDto(h),
    };

    /// <summary>
    /// Applies client-editable fields from the DTO onto the tracked entity,
    /// replacing the child collections wholesale (the frontend already owns
    /// id-generation for new rows, so there is nothing to reconcile beyond
    /// "what's in the DTO is the new truth").
    /// </summary>
    public static void ApplyEditableFields(Handoff target, HandoffDto dto)
    {
        target.Severity = dto.Severity;
        target.Summary = dto.Summary;
        target.CodeStatus = dto.CodeStatus;
        target.Allergies = dto.Allergies;
        target.NoKnownDrugAllergies = dto.NoKnownDrugAllergies;
        target.Synthesis = dto.Synthesis;
        target.ActionListReviewed = dto.ActionListReviewed;
        target.OutgoingClinician = dto.OutgoingClinician;
        target.IncomingClinician = dto.IncomingClinician;

        target.Actions = dto.Actions.Select(a => new ActionItem
        {
            Id = a.Id,
            HandoffId = target.Id,
            Task = a.Task,
            Owner = a.Owner,
            DueAt = ParseIsoOrNull(a.DueAt),
            Priority = a.Priority,
            Completed = a.Completed,
        }).ToList();

        target.PendingStudies = dto.PendingStudies.Select(s => new PendingStudy
        {
            Id = s.Id,
            HandoffId = target.Id,
            Study = s.Study,
            FollowUpOwner = s.FollowUpOwner,
        }).ToList();

        target.Contingencies = dto.Contingencies.Select(g => new Contingency
        {
            Id = g.Id,
            HandoffId = target.Id,
            IfCondition = g.IfCondition,
            ThenAction = g.ThenAction,
        }).ToList();
    }
}
