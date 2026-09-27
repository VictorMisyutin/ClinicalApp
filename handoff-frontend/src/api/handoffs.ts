import type { Clinician, Handoff, HandoffRecord, Shift } from '@/types/domain';
import type { SafetyIssue } from '@/lib/validation';
import { buildWard, clinicians, demoEmployeeIds, shift } from './sampleWard';

/**
 * Data access for the handoff screens.
 *
 * With VITE_API_BASE_URL unset the module serves an in-memory ward so the UI
 * can be developed and demoed on its own. Once the ASP.NET Core API is up, set
 * the variable and every call goes over HTTP instead. The exported function
 * signatures do not change, so no screen has to know which mode it is in.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
export const usingSampleWard = API_BASE === '';

/** Thrown when the server rejects a write. Carries the server's own rule failures. */
export class ApiError extends Error {
  readonly status: number;
  readonly issues: SafetyIssue[];

  constructor(message: string, status: number, issues: SafetyIssue[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.issues = issues;
  }
}

// ── Auth token ──────────────────────────────────────────────────────────────
// The token lives here, not in React state, so every call through request()
// can reach it without threading it through every screen. SessionContext is
// the only thing that calls setAuthToken / onUnauthorized.
let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function onUnauthorized(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

export interface LoginResult {
  clinician: Clinician;
  token: string;
}

/** Employee ID + password sign-in. Issues the bearer token every other call needs. */
export async function login(employeeId: string, password: string): Promise<LoginResult> {
  if (usingSampleWard) {
    const id = employeeId.trim().toLowerCase();
    const clinicianId = demoEmployeeIds[id];
    const clinician = clinicianId ? clinicians.find((c) => c.id === clinicianId) : undefined;
    if (!clinician || password.trim().length === 0) {
      return delay(null, 250).then(() => {
        throw new ApiError('Invalid employee ID or password.', 401);
      });
    }
    return delay({ clinician, token: 'sample-token' }, 250);
  }
  return request<LoginResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ employeeId, password }),
  });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const response = await fetch(`${API_BASE}/api${path}`, {
    headers,
    ...init,
  });

  if (!response.ok) {
    let issues: SafetyIssue[] = [];
    let message = `Request failed with status ${response.status}.`;
    try {
      const body = await response.json();
      if (typeof body.title === 'string') message = body.title;
      if (Array.isArray(body.issues)) issues = body.issues;
    } catch {
      // A non-JSON error body is still an error; the status carries the meaning.
    }
    if (response.status === 401) {
      authToken = null;
      unauthorizedHandler?.();
    }
    throw new ApiError(message, response.status, issues);
  }

  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

// ── In-memory store ───────────────────────────────────────────────────────
let ward: HandoffRecord[] | null = null;

function store(): HandoffRecord[] {
  if (!ward) ward = buildWard();
  return ward;
}

function delay<T>(value: T, ms = 180): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// ── Public API ────────────────────────────────────────────────────────────

export async function fetchShift(): Promise<Shift> {
  if (usingSampleWard) return delay(shift, 80);
  return request<Shift>('/shift/current');
}

export async function fetchClinicians(): Promise<Clinician[]> {
  if (usingSampleWard) return delay(clinicians, 80);
  return request<Clinician[]>('/clinicians');
}

export async function fetchWard(): Promise<HandoffRecord[]> {
  if (usingSampleWard) return delay(clone(store()));
  return request<HandoffRecord[]>('/handoffs');
}

export async function fetchRecord(patientId: string): Promise<HandoffRecord> {
  if (usingSampleWard) {
    const found = store().find((record) => record.patient.id === patientId);
    if (!found) throw new ApiError('That patient is not on this ward.', 404);
    return delay(clone(found));
  }
  return request<HandoffRecord>(`/handoffs/${encodeURIComponent(patientId)}`);
}

export async function saveDraft(handoff: Handoff): Promise<Handoff> {
  const next: Handoff = { ...handoff, updatedAt: new Date().toISOString() };
  if (usingSampleWard) {
    writeLocal(next);
    return delay(clone(next));
  }
  return request<Handoff>(`/handoffs/${encodeURIComponent(handoff.id)}`, {
    method: 'PUT',
    body: JSON.stringify(next),
  });
}

export async function submitHandoff(handoff: Handoff): Promise<Handoff> {
  const next: Handoff = {
    ...handoff,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (usingSampleWard) {
    writeLocal(next);
    return delay(clone(next));
  }
  return request<Handoff>(`/handoffs/${encodeURIComponent(handoff.id)}/submit`, {
    method: 'POST',
    body: JSON.stringify(next),
  });
}

export async function acknowledgeHandoff(handoff: Handoff): Promise<Handoff> {
  const next: Handoff = {
    ...handoff,
    status: 'acknowledged',
    acknowledgedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (usingSampleWard) {
    writeLocal(next);
    return delay(clone(next));
  }
  return request<Handoff>(`/handoffs/${encodeURIComponent(handoff.id)}/acknowledge`, {
    method: 'POST',
    body: JSON.stringify(next),
  });
}

export async function toggleAction(
  handoffId: string,
  actionId: string,
  completed: boolean,
): Promise<Handoff> {
  if (usingSampleWard) {
    const record = store().find((entry) => entry.handoff.id === handoffId);
    if (!record) throw new ApiError('That handoff no longer exists.', 404);
    const action = record.handoff.actions.find((entry) => entry.id === actionId);
    if (action) action.completed = completed;
    record.handoff.updatedAt = new Date().toISOString();
    return delay(clone(record.handoff), 90);
  }
  return request<Handoff>(
    `/handoffs/${encodeURIComponent(handoffId)}/actions/${encodeURIComponent(actionId)}`,
    { method: 'PATCH', body: JSON.stringify({ completed }) },
  );
}

function writeLocal(handoff: Handoff): void {
  const record = store().find((entry) => entry.handoff.id === handoff.id);
  if (record) record.handoff = clone(handoff);
}