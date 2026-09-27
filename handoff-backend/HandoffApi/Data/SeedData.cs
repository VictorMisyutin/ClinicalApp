using HandoffApi.Models;
using HandoffApi.Services;

namespace HandoffApi.Data;

/// <summary>
/// Ports handoff-frontend/src/api/sampleWard.ts into real seed rows so the
/// demo behaves identically whether it's backed by the in-memory sample ward
/// or this MySQL database. Demo credentials only — see backend README.
/// </summary>
public static class SeedData
{
    public const string Unit = "6 West — Medical/Surgical";
    public const string DemoPassword = "Handoff123!";
    private const string ShiftLabel = "Night → Day";

    public static void Seed(HandoffDbContext context, PasswordService passwordService)
    {
        if (context.Clinicians.Any()) return;

        static DateTime At(double hourOffset) => DateTime.UtcNow.AddHours(hourOffset);
        static DateTime DaysAgo(int days) => DateTime.UtcNow.AddDays(-days);

        var clinicians = new List<(string Id, string EmployeeId, string Name, string Role)>
        {
            ("c-1", "aokonkwo", "A. Okonkwo", "RN"),
            ("c-2", "dhalvorsen", "D. Halvorsen", "RN"),
            ("c-3", "rmehta", "R. Mehta", "Charge RN"),
            ("c-4", "sbaptiste", "S. Baptiste", "Resident"),
            ("c-5", "jfairweather", "J. Fairweather", "NP"),
        };

        foreach (var (id, employeeId, name, role) in clinicians)
        {
            var clinician = new Clinician { Id = id, EmployeeId = employeeId, Name = name, Role = role, Unit = Unit };
            clinician.PasswordHash = passwordService.Hash(clinician, DemoPassword);
            context.Clinicians.Add(clinician);
        }

        var patients = new List<Patient>
        {
            new()
            {
                Id = "p-1", Mrn = "4471902", FamilyName = "Whitfield", GivenName = "Marcus",
                AgeYears = 68, Sex = "M", Room = "612A", Unit = Unit, AdmittedOn = DaysAgo(3),
                Handoff = new Handoff
                {
                    Id = "h-1", PatientId = "p-1", Status = "submitted", Severity = "unstable",
                    Summary = "Day 2 after right hemicolectomy. Febrile to 38.9 at 03:10 with a rising lactate of 3.1 and a heart rate in the 120s. Blood cultures drawn, broad-spectrum antibiotics started at 03:40, and 1.5 L crystalloid given with a modest pressure response. Surgery aware and reviewing this morning.",
                    CodeStatus = "full", Allergies = "Penicillin — anaphylaxis. Contrast dye — rash.", NoKnownDrugAllergies = false,
                    OutgoingClinician = "D. Halvorsen", ShiftLabel = ShiftLabel, UpdatedAt = At(-0.5), SubmittedAt = At(-0.3),
                    Actions =
                    {
                        new ActionItem { Id = "a-1", Task = "Repeat lactate and full blood count", Owner = "A. Okonkwo", DueAt = At(-0.6), Priority = "now", Completed = false },
                        new ActionItem { Id = "a-2", Task = "Hourly urine output, escalate if under 30 mL/h for two hours", Owner = "A. Okonkwo", DueAt = At(0.5), Priority = "now", Completed = false },
                        new ActionItem { Id = "a-3", Task = "Chase surgical review before the ward round", Owner = "S. Baptiste", DueAt = At(2), Priority = "before-rounds", Completed = false },
                    },
                    PendingStudies =
                    {
                        new PendingStudy { Id = "s-1", Study = "Blood cultures ×2, drawn 03:15", FollowUpOwner = "S. Baptiste" },
                        new PendingStudy { Id = "s-2", Study = "CT abdomen with contrast — alternative agent ordered", FollowUpOwner = "S. Baptiste" },
                    },
                    Contingencies =
                    {
                        new Contingency { Id = "g-1", IfCondition = "Systolic pressure stays below 90 after a 500 mL bolus", ThenAction = "Call the medical emergency team and alert the intensivist on call" },
                        new Contingency { Id = "g-2", IfCondition = "Lactate climbs above 4", ThenAction = "Escalate to the surgical registrar directly, do not wait for rounds" },
                    },
                },
            },
            new()
            {
                Id = "p-2", Mrn = "4468120", FamilyName = "Adeyemi", GivenName = "Grace",
                AgeYears = 74, Sex = "F", Room = "614B", Unit = Unit, AdmittedOn = DaysAgo(6),
                Handoff = new Handoff
                {
                    Id = "h-2", PatientId = "p-2", Status = "submitted", Severity = "watcher",
                    Summary = "Community acquired pneumonia, now on day 4 of antibiotics. Oxygen requirement came down from 4 L to 2 L overnight but she desaturates to 88 percent on exertion. Eating poorly and slightly confused at night, which is new since Tuesday.",
                    CodeStatus = "dnr", Allergies = "", NoKnownDrugAllergies = true,
                    OutgoingClinician = "D. Halvorsen", ShiftLabel = ShiftLabel, UpdatedAt = At(-0.5), SubmittedAt = At(-0.25),
                    Actions =
                    {
                        new ActionItem { Id = "a-4", Task = "Wean oxygen as tolerated, target saturation 92 to 96 percent", Owner = "A. Okonkwo", DueAt = At(3), Priority = "this-shift", Completed = false },
                        new ActionItem { Id = "a-5", Task = "Delirium screen and a note on overnight orientation", Owner = "A. Okonkwo", DueAt = At(1.2), Priority = "before-rounds", Completed = false },
                    },
                    PendingStudies =
                    {
                        new PendingStudy { Id = "s-3", Study = "Repeat chest film ordered for this morning", FollowUpOwner = "J. Fairweather" },
                    },
                    Contingencies =
                    {
                        new Contingency { Id = "g-3", IfCondition = "Oxygen need goes back above 4 L", ThenAction = "Call the resident and reassess for effusion, family already know she is not for intubation" },
                    },
                },
            },
            new()
            {
                Id = "p-3", Mrn = "4472551", FamilyName = "Nkemelu", GivenName = "Chidi",
                AgeYears = 41, Sex = "M", Room = "616A", Unit = Unit, AdmittedOn = DaysAgo(1),
                Handoff = new Handoff
                {
                    Id = "h-3", PatientId = "p-3", Status = "draft", Severity = "watcher",
                    Summary = "Admitted yesterday evening with severe pancreatitis, likely gallstone in origin. Pain is settling on a patient controlled pump. Tolerating sips only.",
                    CodeStatus = "full", Allergies = "Codeine — vomiting.", NoKnownDrugAllergies = false,
                    OutgoingClinician = "D. Halvorsen", ShiftLabel = ShiftLabel, UpdatedAt = At(-0.5),
                    Actions =
                    {
                        new ActionItem { Id = "a-6", Task = "Four hourly pain scores, review pump use at 08:00", Owner = "", DueAt = At(2.5), Priority = "this-shift", Completed = false },
                    },
                    PendingStudies =
                    {
                        new PendingStudy { Id = "s-4", Study = "Ultrasound of the biliary tree", FollowUpOwner = "" },
                    },
                },
            },
            new()
            {
                Id = "p-4", Mrn = "4470033", FamilyName = "Sørensen", GivenName = "Britt",
                AgeYears = 59, Sex = "F", Room = "618A", Unit = Unit, AdmittedOn = DaysAgo(2),
                Handoff = new Handoff
                {
                    Id = "h-4", PatientId = "p-4", Status = "submitted", Severity = "stable",
                    Summary = "Cellulitis of the left lower leg, improving on intravenous antibiotics. The marked border has receded by roughly two centimetres since yesterday and she is walking to the bathroom without help. Likely discharge tomorrow if the oral switch holds.",
                    CodeStatus = "full", Allergies = "", NoKnownDrugAllergies = true,
                    OutgoingClinician = "D. Halvorsen", ShiftLabel = ShiftLabel, UpdatedAt = At(-0.5), SubmittedAt = At(-0.4),
                    Actions =
                    {
                        new ActionItem { Id = "a-7", Task = "Re-mark the erythema border and photograph for the chart", Owner = "A. Okonkwo", DueAt = At(4), Priority = "this-shift", Completed = false },
                    },
                },
            },
            new()
            {
                Id = "p-5", Mrn = "4469887", FamilyName = "Castellanos", GivenName = "Rafael",
                AgeYears = 83, Sex = "M", Room = "620B", Unit = Unit, AdmittedOn = DaysAgo(9),
                Handoff = new Handoff
                {
                    Id = "h-5", PatientId = "p-5", Status = "submitted", Severity = "watcher",
                    Summary = "Fractured neck of femur repaired on day 2, now day 9 with a slow recovery. Delirium in the evenings and two unwitnessed falls this admission. Physiotherapy going well in the mornings only. Family meeting about placement is booked for this afternoon.",
                    CodeStatus = "dnr-dni", Allergies = "Sulfa drugs — rash.", NoKnownDrugAllergies = false,
                    OutgoingClinician = "D. Halvorsen", ShiftLabel = ShiftLabel, UpdatedAt = At(-0.5), SubmittedAt = At(-0.2),
                    Actions =
                    {
                        new ActionItem { Id = "a-8", Task = "Falls precautions checked at the start of the shift, bed low and alarm on", Owner = "A. Okonkwo", DueAt = At(0.4), Priority = "now", Completed = false },
                        new ActionItem { Id = "a-9", Task = "Have the family meeting summary ready for the 14:00 conversation", Owner = "R. Mehta", DueAt = At(6), Priority = "this-shift", Completed = false },
                        new ActionItem { Id = "a-10", Task = "Morning physiotherapy session confirmed", Owner = "A. Okonkwo", DueAt = At(-2), Priority = "this-shift", Completed = true },
                    },
                    Contingencies =
                    {
                        new Contingency { Id = "g-4", IfCondition = "He becomes agitated and tries to climb out of bed", ThenAction = "Non-drug settling first, family photo board at the bedside, call the resident before any sedation" },
                    },
                },
            },
            new()
            {
                Id = "p-6", Mrn = "4473104", FamilyName = "Lindqvist", GivenName = "Tove",
                AgeYears = 29, Sex = "F", Room = "622A", Unit = Unit, AdmittedOn = DaysAgo(1),
                Handoff = new Handoff
                {
                    Id = "h-6", PatientId = "p-6", Status = "draft", Severity = null,
                    Summary = "", CodeStatus = "unconfirmed", Allergies = "", NoKnownDrugAllergies = false,
                    OutgoingClinician = "D. Halvorsen", ShiftLabel = ShiftLabel, UpdatedAt = At(-0.5),
                },
            },
            new()
            {
                Id = "p-7", Mrn = "4465210", FamilyName = "Oyelaran", GivenName = "Femi",
                AgeYears = 55, Sex = "M", Room = "624B", Unit = Unit, AdmittedOn = DaysAgo(4),
                Handoff = new Handoff
                {
                    Id = "h-7", PatientId = "p-7", Status = "acknowledged", Severity = "stable",
                    Summary = "Diabetic ketoacidosis resolved on day one and he has been on a subcutaneous regimen since. Sugars have sat between 7 and 11 for a full day. The diabetes nurse educator has seen him twice and he is comfortable with the pen technique.",
                    CodeStatus = "full", Allergies = "", NoKnownDrugAllergies = true,
                    OutgoingClinician = "D. Halvorsen", IncomingClinician = "A. Okonkwo",
                    Synthesis = "Stable diabetic, off the insulin infusion, pre-meal checks only and no sliding scale. Discharge teaching is done. I will chase the pharmacy script this morning.",
                    ActionListReviewed = true,
                    ShiftLabel = ShiftLabel, UpdatedAt = At(-0.5), SubmittedAt = At(-0.8), AcknowledgedAt = At(-0.7),
                    Actions =
                    {
                        new ActionItem { Id = "a-11", Task = "Pre-meal glucose checks, no sliding scale needed", Owner = "A. Okonkwo", DueAt = At(3.5), Priority = "this-shift", Completed = false },
                    },
                },
            },
            new()
            {
                Id = "p-8", Mrn = "4471445", FamilyName = "Brennan", GivenName = "Aoife",
                AgeYears = 36, Sex = "F", Room = "626A", Unit = Unit, AdmittedOn = DaysAgo(2),
                Handoff = new Handoff
                {
                    Id = "h-8", PatientId = "p-8", Status = "submitted", Severity = "stable",
                    Summary = "Admitted for intravenous rehydration after two days of vomiting from a viral gastroenteritis. She has kept fluids down since midnight and the electrolytes corrected overnight. Home today once she manages a light breakfast.",
                    CodeStatus = "full", Allergies = "Latex — contact dermatitis.", NoKnownDrugAllergies = false,
                    OutgoingClinician = "D. Halvorsen", ShiftLabel = ShiftLabel, UpdatedAt = At(-0.5), SubmittedAt = At(-0.35),
                    Actions =
                    {
                        new ActionItem { Id = "a-12", Task = "Trial of a light breakfast, then discharge paperwork if she tolerates it", Owner = "A. Okonkwo", DueAt = At(2.2), Priority = "before-rounds", Completed = false },
                    },
                },
            },
        };

        context.Patients.AddRange(patients);
        context.SaveChanges();
    }
}
