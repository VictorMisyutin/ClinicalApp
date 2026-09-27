namespace HandoffApi.Models;

public class Contingency
{
    public string Id { get; set; } = "";
    public string HandoffId { get; set; } = "";
    public Handoff? Handoff { get; set; }

    public string IfCondition { get; set; } = "";
    public string ThenAction { get; set; } = "";
}
