using HandoffApi.Dtos;

namespace HandoffApi.Services;

/// <summary>
/// Server-side counterpart to handoff-frontend/src/lib/validation.ts. Every
/// blocking rule here has to match the client rule exactly — the client copy
/// gives the clinician an instant answer, but this copy is what actually
/// decides whether a row gets written.
/// </summary>
public class HandoffValidator
{
    private const int MinSummaryChars = 60;
    private const int MinSynthesisChars = 30;

    public List<SafetyIssueDto> CheckHandoff(HandoffDto handoff)
    {
        var issues = new List<SafetyIssueDto>();
        void Add(string code, string level, string anchor, string message) =>
            issues.Add(new SafetyIssueDto { Code = code, Level = level, Anchor = anchor, Message = message });

        // I — Illness severity
        if (string.IsNullOrEmpty(handoff.Severity))
        {
            Add("severity.required", "blocking", "severity", "Set an illness severity.");
        }

        // P — Patient summary
        var summary = handoff.Summary.Trim();
        if (summary.Length == 0)
        {
            Add("summary.required", "blocking", "summary", "Write a patient summary.");
        }
        else if (summary.Length < MinSummaryChars)
        {
            Add("summary.tooShort", "blocking", "summary",
                $"The summary needs at least {MinSummaryChars} characters. It has {summary.Length}.");
        }

        if (string.IsNullOrEmpty(handoff.CodeStatus) || handoff.CodeStatus == "unconfirmed")
        {
            Add("codeStatus.required", "blocking", "summary",
                "Confirm the code status. \"Not yet confirmed\" cannot be handed off.");
        }

        if (!handoff.NoKnownDrugAllergies && handoff.Allergies.Trim().Length == 0)
        {
            Add("allergies.required", "blocking", "summary",
                "List allergies, or tick \"No known drug allergies\".");
        }
        if (handoff.NoKnownDrugAllergies && handoff.Allergies.Trim().Length > 0)
        {
            Add("allergies.contradiction", "blocking", "summary",
                "Allergies are listed but \"No known drug allergies\" is ticked. Clear one.");
        }

        // A — Action list
        var openActions = handoff.Actions.Where(a => !a.Completed).ToList();

        if (!string.IsNullOrEmpty(handoff.Severity) && handoff.Severity != "stable" && openActions.Count == 0)
        {
            Add("actions.requiredForAcuity", "blocking", "actions",
                "A watcher or unstable patient needs at least one action for the next shift.");
        }

        for (var index = 0; index < handoff.Actions.Count; index++)
        {
            var action = handoff.Actions[index];
            var position = $"Action {index + 1}";
            if (action.Task.Trim().Length == 0)
            {
                Add($"actions.{action.Id}.task", "blocking", "actions", $"{position} has no description.");
            }
            if (action.Owner.Trim().Length == 0)
            {
                Add($"actions.{action.Id}.owner", "blocking", "actions",
                    $"{position} has no owner. Name the person who does it.");
            }
            if (string.IsNullOrEmpty(action.DueAt))
            {
                Add($"actions.{action.Id}.dueAt", "blocking", "actions", $"{position} has no due time.");
            }
        }

        for (var index = 0; index < handoff.PendingStudies.Count; index++)
        {
            var study = handoff.PendingStudies[index];
            if (study.Study.Trim().Length == 0)
            {
                Add($"studies.{study.Id}.name", "blocking", "actions",
                    $"Pending result {index + 1} has no description.");
            }
            if (study.FollowUpOwner.Trim().Length == 0)
            {
                var label = study.Study.Trim().Length > 0 ? study.Study.Trim() : $"Pending result {index + 1}";
                Add($"studies.{study.Id}.owner", "blocking", "actions",
                    $"\"{label}\" has nobody following it up.");
            }
        }

        // S — Situation awareness and contingency planning
        if (handoff.Severity == "unstable" && handoff.Contingencies.Count == 0)
        {
            Add("contingency.requiredForUnstable", "blocking", "contingencies",
                "An unstable patient needs at least one if/then plan.");
        }

        for (var index = 0; index < handoff.Contingencies.Count; index++)
        {
            var plan = handoff.Contingencies[index];
            var filledIf = plan.IfCondition.Trim().Length > 0;
            var filledThen = plan.ThenAction.Trim().Length > 0;
            if (filledIf != filledThen)
            {
                Add($"contingency.{plan.Id}.halfFilled", "blocking", "contingencies",
                    $"Plan {index + 1} is half written. Fill in both the trigger and the response.");
            }
        }

        // Advisory
        if (handoff.Severity == "watcher" && handoff.Contingencies.Count == 0)
        {
            Add("contingency.suggestedForWatcher", "advisory", "contingencies",
                "Watchers usually turn overnight. Consider adding an if/then plan.");
        }

        var overdue = openActions
            .Where(a => !string.IsNullOrEmpty(a.DueAt) && DateTime.Parse(a.DueAt).ToUniversalTime() < DateTime.UtcNow)
            .ToList();
        if (overdue.Count > 0)
        {
            var isSingle = overdue.Count == 1;
            Add("actions.overdue", "advisory", "actions",
                $"{overdue.Count} open action {(isSingle ? "is" : "are")} already past due. Close {(isSingle ? "it" : "them")} or move the due time.");
        }

        if (handoff.OutgoingClinician.Trim().Length == 0)
        {
            Add("outgoing.required", "blocking", "summary", "Name the outgoing clinician.");
        }

        return issues;
    }

    public List<SafetyIssueDto> CheckAcknowledgement(HandoffDto handoff)
    {
        var issues = new List<SafetyIssueDto>();
        void AddText(string message) =>
            issues.Add(new SafetyIssueDto { Code = "synthesis.text", Level = "blocking", Anchor = "synthesis", Message = message });

        var synthesis = handoff.Synthesis.Trim();
        if (synthesis.Length == 0)
        {
            AddText("Read the plan back in your own words.");
        }
        else if (synthesis.Length < MinSynthesisChars)
        {
            AddText($"The read-back needs at least {MinSynthesisChars} characters. It has {synthesis.Length}.");
        }

        if (!handoff.ActionListReviewed)
        {
            issues.Add(new SafetyIssueDto
            {
                Code = "synthesis.actionsReviewed",
                Level = "blocking",
                Anchor = "synthesis",
                Message = "Confirm you have read the action list.",
            });
        }

        if (handoff.IncomingClinician.Trim().Length == 0)
        {
            issues.Add(new SafetyIssueDto
            {
                Code = "synthesis.incoming",
                Level = "blocking",
                Anchor = "synthesis",
                Message = "Name the clinician taking over.",
            });
        }

        return issues;
    }

    public static bool HasBlocking(List<SafetyIssueDto> issues) => issues.Any(i => i.Level == "blocking");
}
