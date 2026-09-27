# Handoff API

ASP.NET Core 8 Web API + MySQL backend for the Clinical Handoff Management
System. Mirrors the contract already documented in
`handoff-frontend/src/api/handoffs.ts`.

## One-time setup

1. Create the database and app user (see `db/setup.sql` — edit the password
   placeholder first):
   ```
   sudo mysql < db/setup.sql
   ```
2. Put the real connection string and JWT signing key in
   `HandoffApi/appsettings.Development.json` (gitignored — not committed):
   ```json
   {
     "ConnectionStrings": {
       "Default": "Server=localhost;Port=3306;Database=handoff_db;User=handoff_app;Password=<your password>;"
     },
     "Jwt": {
       "Key": "<32+ character local signing secret>"
     }
   }
   ```
3. Apply migrations and run:
   ```
   cd HandoffApi
   dotnet ef database update
   dotnet run --urls http://localhost:5017
   ```
   Startup seeds five demo clinicians and eight demo patients/handoffs the
   first time the database is empty.

## Demo sign-in

No self-service signup — hospital staff accounts are provisioned by IT in
real life, so this app assumes accounts already exist. Seeded demo accounts
(local/demo only, **not for production use**):

| Employee ID    | Name             | Role      |
|----------------|------------------|-----------|
| aokonkwo       | A. Okonkwo       | RN        |
| dhalvorsen     | D. Halvorsen     | RN        |
| rmehta         | R. Mehta         | Charge RN |
| sbaptiste      | S. Baptiste      | Resident  |
| jfairweather   | J. Fairweather   | NP        |

Password for all demo accounts: `Handoff123!`

## Notes

- Passwords are hashed with ASP.NET Core's `PasswordHasher<T>` (PBKDF2) —
  never stored in plaintext.
- Every endpoint except `POST /api/auth/login` requires a
  `Authorization: Bearer <token>` header. Tokens are valid for 12 hours.
- `POST /api/handoffs/{id}/submit` and `.../acknowledge` re-run the same
  safety rules as `handoff-frontend/src/lib/validation.ts` server-side and
  return `422` with the failing rules if a blocking rule isn't met.
- AWS/EC2/Route 53 deployment is intentionally out of scope for this pass.
