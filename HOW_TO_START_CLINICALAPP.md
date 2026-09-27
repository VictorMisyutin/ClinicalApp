# How to Start ClinicalApp

The app has two parts that both need to be running: the **backend** (ASP.NET Core API + MySQL) and the **frontend** (React/Vite).

## 1. Backend (`ClinicalApp/handoff-backend`)

One-time setup (skip if already done):
```
cd ClinicalApp/handoff-backend
sudo mysql < db/setup.sql
```
Then create `HandoffApi/appsettings.Development.json` (gitignored) with your DB connection string and a JWT signing key — see `handoff-backend/README.md` for the exact format.

Start it:
```
cd ClinicalApp/handoff-backend/HandoffApi
dotnet ef database update
dotnet run --urls http://localhost:5017
```
The API will be available at `http://localhost:5017`.

## 2. Frontend (`ClinicalApp/handoff-frontend`)

```
cd ClinicalApp/handoff-frontend
npm install   # only needed the first time or after dependency changes
npm run dev
```
Vite will print the local URL (typically `http://localhost:5173`).

The frontend expects the API at `http://localhost:5017` by default (see `.env.local` / `VITE_API_BASE_URL`).

## Demo login

| Employee ID  | Role      |
|--------------|-----------|
| aokonkwo     | RN        |
| dhalvorsen   | RN        |
| rmehta       | Charge RN |
| sbaptiste    | Resident  |
| jfairweather | NP        |

Password for all demo accounts: `Handoff123!`

## Order of operations

Start the backend first, then the frontend — the frontend calls the API on load.
