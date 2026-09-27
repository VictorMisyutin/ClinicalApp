namespace HandoffApi.Models;

public class Handoff
{
    public string Id { get; set; } = "";
    public string PatientId { get; set; } = "";
    public Patient? Patient { get; set; }

    public string Status { get; set; } = "draft"; // draft | submitted | acknowledged

    // I — Illness severity
    public string? Severity { get; set; } // stable | watcher | unstable

    // P — Patient summary
    public string Summary { get; set; } = "";
    public string? CodeStatus { get; set; } // full | dnr | dnr-dni | comfort | unconfirmed
    public string Allergies { get; set; } = "";
    public bool NoKnownDrugAllergies { get; set; }

    // A — Action list
    public List<ActionItem> Actions { get; set; } = new();
    public List<PendingStudy> PendingStudies { get; set; } = new();

    // S — Situation awareness and contingency planning
    public List<Contingency> Contingencies { get; set; } = new();

    // S — Synthesis by the receiver
    public string Synthesis { get; set; } = "";
    public bool ActionListReviewed { get; set; }

    public string OutgoingClinician { get; set; } = "";
    public string IncomingClinician { get; set; } = "";
    public string ShiftLabel { get; set; } = "";
    public DateTime UpdatedAt { get; set; }
    public DateTime? SubmittedAt { get; set; }
    public DateTime? AcknowledgedAt { get; set; }
}
