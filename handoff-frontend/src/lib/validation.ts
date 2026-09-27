import type { Handoff } from '@/types/domain';

/**
 * Client-side handoff validation.
 *
 * Every rule in here has a counterpart in the ASP.NET Core validator. The
 * client copy exists to give the clinician an answer immediately; the server
 * copy is the one that actually decides whether a row is written. If the two
 * ever disagree, the server wins and the UI shows what came back.
 *
 * `blocking` issues stop submission. `advisory` issues are surfaced but the
 * clinician can proceed — they are judgement calls, not defects.
 */

export type IssueLevel = 'blocking' | 'advisory';

export interface SafetyIssue {
  /** Stable key so the checklist can animate rather than re-order on every keystroke. */
  code: string;
  level: IssueLevel;
  /** Which section of the editor to scroll to. */
  anchor: string;
  message: string;
}

const MIN_SUMMARY_CHARS = 60;
const MIN_SYNTHESIS_CHARS = 30;

export function checkHandoff(handoff: Handoff): SafetyIssue[] {
  const issues: SafetyIssue[] = [];
  const add = (
    code: string,
    level: IssueLevel,
    anchor: string,
    message: string,
  ) => issues.push({ code, level, anchor, message });

  // ── I — Illness severity ────────────────────────────────────────────────
  if (!handoff.severity) {
    add('severity.required', 'blocking', 'severity', 'Set an illness severity.');
  }

  // ── P — Patient summary ─────────────────────────────────────────────────
  const summary = handoff.summary.trim();
  if (summary.length === 0) {
    add('summary.required', 'blocking', 'summary', 'Write a patient summary.');
  } else if (summary.length < MIN_SUMMARY_CHARS) {
    add(
      'summary.tooShort',
      'blocking',
      'summary',
      `The summary needs at least ${MIN_SUMMARY_CHARS} characters. It has ${summary.length}.`,
    );
  }

  if (!handoff.codeStatus || handoff.codeStatus === 'unconfirmed') {
    add(
      'codeStatus.required',
      'blocking',
      'summary',
      'Confirm the code status. "Not yet confirmed" cannot be handed off.',
    );
  }

  // Allergies must be answered explicitly. A blank field is ambiguous: it
  // could mean "none" or "nobody checked", and those are very different.
  if (!handoff.noKnownDrugAllergies && handoff.allergies.trim().length === 0) {
    add(
      'allergies.required',
      'blocking',
      'summary',
      'List allergies, or tick "No known drug allergies".',
    );
  }
  if (handoff.noKnownDrugAllergies && handoff.allergies.trim().length > 0) {
    add(
      'allergies.contradiction',
      'blocking',
      'summary',
      'Allergies are listed but "No known drug allergies" is ticked. Clear one.',
    );
  }

  // ── A — Action list ─────────────────────────────────────────────────────
  const openActions = handoff.actions.filter((a) => !a.completed);

  if (handoff.severity && handoff.severity !== 'stable' && openActions.length === 0) {
    add(
      'actions.requiredForAcuity',
      'blocking',
      'actions',
      'A watcher or unstable patient needs at least one action for the next shift.',
    );
  }

  handoff.actions.forEach((action, index) => {
    const position = `Action ${index + 1}`;
    if (action.task.trim().length === 0) {
      add(
        `actions.${action.id}.task`,
        'blocking',
        'actions',
        `${position} has no description.`,
      );
    }
    if (action.owner.trim().length === 0) {
      add(
        `actions.${action.id}.owner`,
        'blocking',
        'actions',
        `${position} has no owner. Name the person who does it.`,
      );
    }
    if (!action.dueAt) {
      add(
        `actions.${action.id}.dueAt`,
        'blocking',
        'actions',
        `${position} has no due time.`,
      );
    }
  });

  handoff.pendingStudies.forEach((study, index) => {
    if (study.study.trim().length === 0) {
      add(
        `studies.${study.id}.name`,
        'blocking',
        'actions',
        `Pending result ${index + 1} has no description.`,
      );
    }
    if (study.followUpOwner.trim().length === 0) {
      add(
        `studies.${study.id}.owner`,
        'blocking',
        'actions',
        `"${study.study.trim() || `Pending result ${index + 1}`}" has nobody following it up.`,
      );
    }
  });

  // ── S — Situation awareness and contingency planning ────────────────────
  if (handoff.severity === 'unstable' && handoff.contingencies.length === 0) {
    add(
      'contingency.requiredForUnstable',
      'blocking',
      'contingencies',
      'An unstable patient needs at least one if/then plan.',
    );
  }

  handoff.contingencies.forEach((plan, index) => {
    const filledIf = plan.ifCondition.trim().length > 0;
    const filledThen = plan.thenAction.trim().length > 0;
    if (filledIf !== filledThen) {
      add(
        `contingency.${plan.id}.halfFilled`,
        'blocking',
        'contingencies',
        `Plan ${index + 1} is half written. Fill in both the trigger and the response.`,
      );
    }
  });

  // ── Advisory ────────────────────────────────────────────────────────────
  if (handoff.severity === 'watcher' && handoff.contingencies.length === 0) {
    add(
      'contingency.suggestedForWatcher',
      'advisory',
      'contingencies',
      'Watchers usually turn overnight. Consider adding an if/then plan.',
    );
  }

  const overdue = openActions.filter(
    (a) => a.dueAt && new Date(a.dueAt).getTime() < Date.now(),
  );
  if (overdue.length > 0) {
    add(
      'actions.overdue',
      'advisory',
      'actions',
      `${overdue.length} open action ${overdue.length === 1 ? 'is' : 'are'} already past due. Close ${overdue.length === 1 ? 'it' : 'them'} or move the due time.`,
    );
  }

  if (handoff.outgoingClinician.trim().length === 0) {
    add('outgoing.required', 'blocking', 'summary', 'Name the outgoing clinician.');
  }

  return issues;
}

/** Rules the receiving clinician has to satisfy before a handoff closes. */
export function checkAcknowledgement(handoff: Handoff): SafetyIssue[] {
  const issues: SafetyIssue[] = [];
  const synthesis = handoff.synthesis.trim();

  if (synthesis.length === 0) {
    add('Read the plan back in your own words.');
  } else if (synthesis.length < MIN_SYNTHESIS_CHARS) {
    add(
      `The read-back needs at least ${MIN_SYNTHESIS_CHARS} characters. It has ${synthesis.length}.`,
    );
  }

  if (!handoff.actionListReviewed) {
    issues.push({
      code: 'synthesis.actionsReviewed',
      level: 'blocking',
      anchor: 'synthesis',
      message: 'Confirm you have read the action list.',
    });
  }

  if (handoff.incomingClinician.trim().length === 0) {
    issues.push({
      code: 'synthesis.incoming',
      level: 'blocking',
      anchor: 'synthesis',
      message: 'Name the clinician taking over.',
    });
  }

  return issues;

  function add(message: string) {
    issues.push({
      code: 'synthesis.text',
      level: 'blocking',
      anchor: 'synthesis',
      message,
    });
  }
}

export function blockingIssues(issues: SafetyIssue[]): SafetyIssue[] {
  return issues.filter((issue) => issue.level === 'blocking');
}

export function advisoryIssues(issues: SafetyIssue[]): SafetyIssue[] {
  return issues.filter((issue) => issue.level === 'advisory');
}
