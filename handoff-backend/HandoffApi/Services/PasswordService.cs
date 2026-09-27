using HandoffApi.Models;
using Microsoft.AspNetCore.Identity;

namespace HandoffApi.Services;

/// <summary>
/// Hashes and verifies clinician passwords using ASP.NET Core's PasswordHasher
/// (PBKDF2 under the hood) — no plaintext password ever touches the database.
/// </summary>
public class PasswordService
{
    private readonly PasswordHasher<Clinician> _hasher = new();

    public string Hash(Clinician clinician, string password) =>
        _hasher.HashPassword(clinician, password);

    public bool Verify(Clinician clinician, string password)
    {
        var result = _hasher.VerifyHashedPassword(clinician, clinician.PasswordHash, password);
        return result is PasswordVerificationResult.Success or PasswordVerificationResult.SuccessRehashNeeded;
    }
}
