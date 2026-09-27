namespace HandoffApi.Dtos;

public class SafetyIssueDto
{
    public string Code { get; set; } = "";
    public string Level { get; set; } = ""; // blocking | advisory
    public string Anchor { get; set; } = "";
    public string Message { get; set; } = "";
}
