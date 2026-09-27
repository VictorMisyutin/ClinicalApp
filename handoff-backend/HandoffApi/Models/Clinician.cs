namespace HandoffApi.Models;

public class Clinician
{
    public string Id { get; set; } = "";
    public string EmployeeId { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string Name { get; set; } = "";
    public string Role { get; set; } = "";
    public string Unit { get; set; } = "";
}
