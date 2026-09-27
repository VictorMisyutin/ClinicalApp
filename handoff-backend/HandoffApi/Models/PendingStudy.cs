namespace HandoffApi.Models;

public class PendingStudy
{
    public string Id { get; set; } = "";
    public string HandoffId { get; set; } = "";
    public Handoff? Handoff { get; set; }

    public string Study { get; set; } = "";
    public string FollowUpOwner { get; set; } = "";
}
