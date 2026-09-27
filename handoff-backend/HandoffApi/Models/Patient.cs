namespace HandoffApi.Models;

public class Patient
{
    public string Id { get; set; } = "";
    public string Mrn { get; set; } = "";
    public string FamilyName { get; set; } = "";
    public string GivenName { get; set; } = "";
    public int AgeYears { get; set; }
    public string Sex { get; set; } = "";
    public string Room { get; set; } = "";
    public string Unit { get; set; } = "";
    public DateTime AdmittedOn { get; set; }

    public Handoff? Handoff { get; set; }
}
