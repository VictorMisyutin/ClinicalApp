/**
 * Domain model for the Clinical Handoff Management System.
 *
 * These shapes are the contract with the ASP.NET Core API. Property names are
 * camelCase here and are expected to be serialised camelCase by the server
 * (JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase).
 *
 * The handoff itself follows I-PASS, the structure most hospitals train to:
 *   I  Illness severity
 *   P  Patient summary
 *   A  Action list
 *   S  Situation awareness and contingency planning
 *   S  Synthesis by receiver
 */

export type IllnessSeverity = 'stable' | 'watcher' | 'unstable';

export const SEVERITY_ORDER: Record<IllnessSeverity, number> = {
  unstable: 0,
  watcher: 1,
  stable: 2,
};

export const SEVERITY_LABEL: Record<IllnessSeverity, string> = {
  unstable: 'Unstable',
  watcher: 'Watcher',
  stable: 'Stable',
};

export const SEVERITY_HELP: Record<IllnessSeverity, string> = {
  unstable: 'Actively deteriorating. Expect to be called.',
  watcher: 'Not sick right now, but could turn. Keep an eye on them.',
  stable: 'No anticipated changes this shift.',
};

export type CodeStatus =
  | 'full'
  | 'dnr'
  | 'dnr-dni'
  | 'comfort'
  | 'unconfirmed';

export const CODE_STATUS_LABEL: Record<CodeStatus, string> = {
  full: 'Full code',
  dnr: 'DNR',
  'dnr-dni': 'DNR / DNI',
  comfort: 'Comfort measures only',
  unconfirmed: 'Not yet confirmed',
};

export type TaskPriority = 'now' | 'this-shift' | 'before-rounds';

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  now: 'Do now',
  'this-shift': 'This shift',
  'before-rounds': 'Before rounds',
};

export interface Patient {
  id: string;
  mrn: string;
  familyName: string;
  givenName: string;
  ageYears: number;
  sex: 'F' | 'M' | 'X';
  room: string;
  unit: string;
  admittedOn: string; // ISO date
}

export interface ActionItem {
  id: string;
  task: string;
  owner: string;
  dueAt: string; // ISO datetime, '' while being drafted
  priority: TaskPriority;
  completed: boolean;
}

export interface Contingency {
  id: string;
  /** The trigger the receiving clinician should watch for. */
  ifCondition: string;
  /** What to do when it happens. */
  thenAction: string;
}

export interface PendingStudy {
  id: string;
  study: string;
  /** Who chases the result. A result nobody owns is a result nobody sees. */
  followUpOwner: string;
}

export type HandoffStatus = 'draft' | 'submitted' | 'acknowledged';

export interface Handoff {
  id: string;
  patientId: string;
  status: HandoffStatus;

  // I — Illness severity
  severity: IllnessSeverity | null;

  // P — Patient summary
  summary: string;
  codeStatus: CodeStatus | null;
  allergies: string;
  noKnownDrugAllergies: boolean;

  // A — Action list
  actions: ActionItem[];
  pendingStudies: PendingStudy[];

  // S — Situation awareness and contingency planning
  contingencies: Contingency[];

  // S — Synthesis by the receiving clinician
  synthesis: string;
  actionListReviewed: boolean;

  outgoingClinician: string;
  incomingClinician: string;
  shiftLabel: string;
  updatedAt: string; // ISO datetime
  submittedAt: string | null;
  acknowledgedAt: string | null;
}

/** A patient joined to their current handoff, which is what every screen renders. */
export interface HandoffRecord {
  patient: Patient;
  handoff: Handoff;
}

export interface Shift {
  unit: string;
  label: string;
  /** ISO datetime when the outgoing shift ends and report is due. */
  changeoverAt: string;
}

export interface Clinician {
  id: string;
  name: string;
  role: 'RN' | 'Resident' | 'Charge RN' | 'NP';
  unit: string;
}
