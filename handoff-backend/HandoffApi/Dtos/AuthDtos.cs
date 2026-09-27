namespace HandoffApi.Dtos;

public class LoginRequest
{
    public string EmployeeId { get; set; } = "";
    public string Password { get; set; } = "";
}

public class LoginResponse
{
    public string Token { get; set; } = "";
    public ClinicianDto Clinician { get; set; } = new();
}
