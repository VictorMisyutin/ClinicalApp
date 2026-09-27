namespace HandoffApi.Dtos;

public class ClinicianDto
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Role { get; set; } = "";
    public string Unit { get; set; } = "";
}

public class ShiftDto
{
    public string Unit { get; set; } = "";
    public string Label { get; set; } = "";
    public string ChangeoverAt { get; set; } = "";
}

public class PatientDto
{
    public string Id { get; set; } = "";
    public string Mrn { get; set; } = "";
    public string FamilyName { get; set; } = "";
    public string GivenName { get; set; } = "";
    public int AgeYears { get; set; }
    public string Sex { get; set; } = "";
    public string Room { get; set; } = "";
    public string Unit { get; set; } = "";
    public string AdmittedOn { get; set; } = "";
}

public class ActionItemDto
{
    public string Id { get; set; } = "";
    public string Task { get; set; } = "";
    public string Owner { get; set; } = "";
    public string DueAt { get; set; } = "";
    public string Priority { get; set; } = "this-shift";
    public bool Completed { get; set; }
}

public class PendingStudyDto
{
    public string Id { get; set; } = "";
    public string Study { get; set; } = "";
    public string FollowUpOwner { get; set; } = "";
}

public class ContingencyDto
{
    public string Id { get; set; } = "";
    public string IfCondition { get; set; } = "";
    public string ThenAction { get; set; } = "";
}

public class HandoffDto
{
    public string Id { get; set; } = "";
    public string PatientId { get; set; } = "";
    public string Status { get; set; } = "draft";

    public string? Severity { get; set; }

    public string Summary { get; set; } = "";
    public string? CodeStatus { get; set; }
    public string Allergies { get; set; } = "";
    public bool NoKnownDrugAllergies { get; set; }

    public List<ActionItemDto> Actions { get; set; } = new();
    public List<PendingStudyDto> PendingStudies { get; set; } = new();
    public List<ContingencyDto> Contingencies { get; set; } = new();

    public string Synthesis { get; set; } = "";
    public bool ActionListReviewed { get; set; }

    public string OutgoingClinician { get; set; } = "";
    public string IncomingClinician { get; set; } = "";
    public string ShiftLabel { get; set; } = "";
    public string UpdatedAt { get; set; } = "";
    public string? SubmittedAt { get; set; }
    public string? AcknowledgedAt { get; set; }
}

public class HandoffRecordDto
{
    public PatientDto Patient { get; set; } = new();
    public HandoffDto Handoff { get; set; } = new();
}

public class ToggleActionRequest
{
    public bool Completed { get; set; }
}

public class ErrorResponse
{
    public string Title { get; set; } = "";
    public List<SafetyIssueDto> Issues { get; set; } = new();
}
