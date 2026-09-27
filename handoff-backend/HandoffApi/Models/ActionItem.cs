namespace HandoffApi.Models;

public class ActionItem
{
    public string Id { get; set; } = "";
    public string HandoffId { get; set; } = "";
    public Handoff? Handoff { get; set; }

    public string Task { get; set; } = "";
    public string Owner { get; set; } = "";
    public DateTime? DueAt { get; set; }
    public string Priority { get; set; } = "this-shift"; // now | this-shift | before-rounds
    public bool Completed { get; set; }
}
