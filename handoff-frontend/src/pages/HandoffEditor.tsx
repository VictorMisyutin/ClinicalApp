import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, fetchRecord, saveDraft, submitHandoff } from '@/api/handoffs';
import {
  CODE_STATUS_LABEL,
  PRIORITY_LABEL,
  SEVERITY_HELP,
  SEVERITY_LABEL,
} from '@/types/domain';
import type {
  ActionItem,
  CodeStatus,
  Contingency,
  Handoff,
  HandoffRecord,
  IllnessSeverity,
  PendingStudy,
  TaskPriority,
} from '@/types/domain';
import { boardName, demographics, fromInputValue, toInputValue } from '@/lib/format';
import { blockingIssues, checkHandoff } from '@/lib/validation';
import type { SafetyIssue } from '@/lib/validation';
import { Field, Loading, Section } from '@/components/primitives';
import { SafetyGate } from '@/components/SafetyGate';

const SEVERITIES: IllnessSeverity[] = ['stable', 'watcher', 'unstable'];
const CODE_STATUSES: CodeStatus[] = ['unconfirmed', 'full', 'dnr', 'dnr-dni', 'comfort'];
const PRIORITIES: TaskPriority[] = ['now', 'this-shift', 'before-rounds'];

const MIN_SUMMARY_CHARS = 60;

let sequence = 0;
const newId = (prefix: string) => `${prefix}-new-${Date.now()}-${sequence++}`;

export function HandoffEditor() {
  const { patientId = '' } = useParams();
  const navigate = useNavigate();

  const [record, setRecord] = useState<HandoffRecord | null>(null);
  const [draft, setDraft] = useState<Handoff | null>(null);
  const [serverIssues, setServerIssues] = useState<SafetyIssue[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    fetchRecord(patientId)
      .then((value) => {
        setRecord(value);
        setDraft(value.handoff);
      })
      .catch(() => setError('That patient is not on this ward.'));
  }, [patientId]);

  const issues = useMemo(
    () => (draft ? [...checkHandoff(draft), ...serverIssues] : []),
    [draft, serverIssues],
  );
  const blocked = blockingIssues(issues).length > 0;

  if (error) return <p className="error-note">{error}</p>;
  if (!record || !draft) return <Loading label="Opening the editor" />;

  const patch = (changes: Partial<Handoff>) => {
    setDraft((current) => (current ? { ...current, ...changes } : current));
    setServerIssues([]);
  };

  const save = async () => {
    setBusy(true);
    try {
      const saved = await saveDraft(draft);
      setDraft(saved);
      setSavedAt(new Date().toISOString());
    } catch {
      setError('Could not save the draft. Your text is still here — try again.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    setServerIssues([]);
    try {
      const saved = await submitHandoff(draft);
      setDraft(saved);
      navigate(`/patients/${patientId}`);
    } catch (caught) {
      if (caught instanceof ApiError && caught.issues.length > 0) {
        // The server found something the client missed. Show its rules, not ours.
        setServerIssues(caught.issues);
        setError('The server rejected this handoff. See the safety check.');
      } else {
        setError('Could not submit the handoff. Try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  // ── Repeating list helpers ──────────────────────────────────────────────
  const addAction = () =>
    patch({
      actions: [
        ...draft.actions,
        {
          id: newId('a'),
          task: '',
          owner: draft.outgoingClinician,
          dueAt: '',
          priority: 'this-shift',
          completed: false,
        },
      ],
    });

  const editAction = (id: string, changes: Partial<ActionItem>) =>
    patch({
      actions: draft.actions.map((action) =>
        action.id === id ? { ...action, ...changes } : action,
      ),
    });

  const removeAction = (id: string) =>
    patch({ actions: draft.actions.filter((action) => action.id !== id) });

  const addStudy = () =>
    patch({
      pendingStudies: [
        ...draft.pendingStudies,
        { id: newId('s'), study: '', followUpOwner: '' },
      ],
    });

  const editStudy = (id: string, changes: Partial<PendingStudy>) =>
    patch({
      pendingStudies: draft.pendingStudies.map((study) =>
        study.id === id ? { ...study, ...changes } : study,
      ),
    });

  const removeStudy = (id: string) =>
    patch({ pendingStudies: draft.pendingStudies.filter((s) => s.id !== id) });

  const addPlan = () =>
    patch({
      contingencies: [
        ...draft.contingencies,
        { id: newId('g'), ifCondition: '', thenAction: '' },
      ],
    });

  const editPlan = (id: string, changes: Partial<Contingency>) =>
    patch({
      contingencies: draft.contingencies.map((plan) =>
        plan.id === id ? { ...plan, ...changes } : plan,
      ),
    });

  const removePlan = (id: string) =>
    patch({ contingencies: draft.contingencies.filter((p) => p.id !== id) });

  const summaryLength = draft.summary.trim().length;
  const { patient } = record;

  return (
    <>
      <Link to={`/patients/${patient.id}`} className="back-link">
        ← Back to the handoff
      </Link>

      <div className="page-head">
        <div>
          <h1 className="page-head__title">
            {patient.room} · {boardName(patient)}
          </h1>
          <p className="page-head__sub">
            {demographics(patient)} · MRN {patient.mrn}. Write the handoff for the
            oncoming shift.
          </p>
        </div>
      </div>

      <div className="editor-layout">
        <div className="card">
          <div className="card__body">
            {/* I */}
            <Section
              letter="I"
              title="Illness severity"
              anchor="severity"
              active={Boolean(draft.severity)}
              hint="How worried should the next shift be?"
            >
              <div className="severity">
                {SEVERITIES.map((severity) => (
                  <label
                    key={severity}
                    className={`severity__option severity__option--${severity}${draft.severity === severity ? ' severity__option--on' : ''}`}
                  >
                    <input
                      type="radio"
                      name="severity"
                      className="severity__radio"
                      value={severity}
                      checked={draft.severity === severity}
                      onChange={() => patch({ severity })}
                    />
                    <span className="severity__label">{SEVERITY_LABEL[severity]}</span>
                    <span className="severity__help">{SEVERITY_HELP[severity]}</span>
                  </label>
                ))}
              </div>
            </Section>

            {/* P */}
            <Section
              letter="P"
              title="Patient summary"
              anchor="summary"
              active={summaryLength >= MIN_SUMMARY_CHARS}
              hint="Why they are here, what has happened, and where things stand right now."
            >
              <Field label="Summary" htmlFor="summary">
                <textarea
                  id="summary"
                  className={`textarea${summaryLength > 0 && summaryLength < MIN_SUMMARY_CHARS ? ' textarea--invalid' : ''}`}
                  value={draft.summary}
                  onChange={(event) => patch({ summary: event.target.value })}
                  placeholder="Day 2 after right hemicolectomy. Febrile to 38.9 overnight with a rising lactate…"
                />
                <p
                  className={`counter${summaryLength < MIN_SUMMARY_CHARS ? ' counter--short' : ''}`}
                >
                  {summaryLength} / {MIN_SUMMARY_CHARS} characters
                </p>
              </Field>

              <div className="grid-2">
                <Field label="Code status" htmlFor="codeStatus">
                  <select
                    id="codeStatus"
                    className="select"
                    value={draft.codeStatus ?? 'unconfirmed'}
                    onChange={(event) =>
                      patch({ codeStatus: event.target.value as CodeStatus })
                    }
                  >
                    {CODE_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {CODE_STATUS_LABEL[status]}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Handed over by" htmlFor="outgoing">
                  <input
                    id="outgoing"
                    className="input"
                    value={draft.outgoingClinician}
                    onChange={(event) =>
                      patch({ outgoingClinician: event.target.value })
                    }
                    placeholder="Your name"
                  />
                </Field>
              </div>

              <Field
                label="Allergies"
                htmlFor="allergies"
                hint="Answer this either way. A blank field could mean none, or it could mean nobody checked."
              >
                <input
                  id="allergies"
                  className="input"
                  value={draft.allergies}
                  onChange={(event) => patch({ allergies: event.target.value })}
                  disabled={draft.noKnownDrugAllergies}
                  placeholder="Penicillin — anaphylaxis"
                />
              </Field>

              <label className="check">
                <input
                  type="checkbox"
                  className="check__box"
                  checked={draft.noKnownDrugAllergies}
                  onChange={(event) =>
                    patch({ noKnownDrugAllergies: event.target.checked })
                  }
                />
                <span className="check__text">
                  No known drug allergies
                  <span className="check__sub">
                    Tick this only if the allergy history has actually been taken.
                  </span>
                </span>
              </label>
            </Section>

            {/* A */}
            <Section
              letter="A"
              title="Action list"
              anchor="actions"
              active={draft.actions.length > 0}
              hint="Every task needs a person and a time. A task owned by nobody gets done by nobody."
            >
              {draft.actions.length === 0 ? (
                <p className="empty-slot">No actions yet.</p>
              ) : (
                draft.actions.map((action, index) => (
                  <div key={action.id} className="repeat-row">
                    <div className="repeat-row__head">
                      <span className="repeat-row__index">Action {index + 1}</span>
                      <button
                        type="button"
                        className="btn btn--danger-ghost"
                        onClick={() => removeAction(action.id)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="repeat-row__grid">
                      <input
                        className={`input${action.task.trim() ? '' : ' input--invalid'}`}
                        value={action.task}
                        onChange={(event) =>
                          editAction(action.id, { task: event.target.value })
                        }
                        placeholder="What needs doing"
                        aria-label={`Action ${index + 1} description`}
                      />
                      <input
                        className={`input${action.owner.trim() ? '' : ' input--invalid'}`}
                        value={action.owner}
                        onChange={(event) =>
                          editAction(action.id, { owner: event.target.value })
                        }
                        placeholder="Owner"
                        aria-label={`Action ${index + 1} owner`}
                      />
                      <input
                        type="datetime-local"
                        className={`input input--data${action.dueAt ? '' : ' input--invalid'}`}
                        value={toInputValue(action.dueAt)}
                        onChange={(event) =>
                          editAction(action.id, {
                            dueAt: fromInputValue(event.target.value),
                          })
                        }
                        aria-label={`Action ${index + 1} due time`}
                      />
                      <select
                        className="select"
                        value={action.priority}
                        onChange={(event) =>
                          editAction(action.id, {
                            priority: event.target.value as TaskPriority,
                          })
                        }
                        aria-label={`Action ${index + 1} priority`}
                      >
                        {PRIORITIES.map((priority) => (
                          <option key={priority} value={priority}>
                            {PRIORITY_LABEL[priority]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))
              )}
              <button type="button" className="btn btn--ghost btn--sm" onClick={addAction}>
                Add an action
              </button>

              <p className="eyebrow" style={{ margin: '28px 0 8px' }}>
                Results still pending
              </p>
              {draft.pendingStudies.length === 0 ? (
                <p className="empty-slot">Nothing outstanding.</p>
              ) : (
                draft.pendingStudies.map((study, index) => (
                  <div key={study.id} className="repeat-row">
                    <div className="repeat-row__head">
                      <span className="repeat-row__index">Result {index + 1}</span>
                      <button
                        type="button"
                        className="btn btn--danger-ghost"
                        onClick={() => removeStudy(study.id)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="repeat-row__grid repeat-row__grid--study">
                      <input
                        className={`input${study.study.trim() ? '' : ' input--invalid'}`}
                        value={study.study}
                        onChange={(event) =>
                          editStudy(study.id, { study: event.target.value })
                        }
                        placeholder="Blood cultures ×2, drawn 03:15"
                        aria-label={`Pending result ${index + 1}`}
                      />
                      <input
                        className={`input${study.followUpOwner.trim() ? '' : ' input--invalid'}`}
                        value={study.followUpOwner}
                        onChange={(event) =>
                          editStudy(study.id, { followUpOwner: event.target.value })
                        }
                        placeholder="Who chases it"
                        aria-label={`Pending result ${index + 1} follow-up owner`}
                      />
                    </div>
                  </div>
                ))
              )}
              <button type="button" className="btn btn--ghost btn--sm" onClick={addStudy}>
                Add a pending result
              </button>
            </Section>

            {/* S */}
            <Section
              letter="S"
              title="Situation awareness and contingency planning"
              anchor="contingencies"
              active={draft.contingencies.length > 0}
              hint="Write the plan now, while you still have the context. The night team will not."
            >
              {draft.contingencies.length === 0 ? (
                <p className="empty-slot">No if/then plans yet.</p>
              ) : (
                draft.contingencies.map((plan, index) => (
                  <div key={plan.id} className="repeat-row">
                    <div className="repeat-row__head">
                      <span className="repeat-row__index">Plan {index + 1}</span>
                      <button
                        type="button"
                        className="btn btn--danger-ghost"
                        onClick={() => removePlan(plan.id)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="repeat-row__grid repeat-row__grid--plan">
                      <input
                        className="input"
                        value={plan.ifCondition}
                        onChange={(event) =>
                          editPlan(plan.id, { ifCondition: event.target.value })
                        }
                        placeholder="If — systolic stays below 90 after a bolus"
                        aria-label={`Plan ${index + 1} trigger`}
                      />
                      <input
                        className="input"
                        value={plan.thenAction}
                        onChange={(event) =>
                          editPlan(plan.id, { thenAction: event.target.value })
                        }
                        placeholder="Then — call the medical emergency team"
                        aria-label={`Plan ${index + 1} response`}
                      />
                    </div>
                  </div>
                ))
              )}
              <button type="button" className="btn btn--ghost btn--sm" onClick={addPlan}>
                Add an if/then plan
              </button>
            </Section>
          </div>
        </div>

        <SafetyGate
          issues={issues}
          clearedTitle="Ready to hand over"
          clearedNote="Severity set, allergies answered, code status confirmed, and every task has an owner and a time."
        >
          <button type="button" className="btn" onClick={submit} disabled={blocked || busy}>
            {busy ? 'Working…' : 'Submit handoff'}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={save}
            disabled={busy}
          >
            Save draft
          </button>
          {savedAt ? (
            <p className="gate__note">Draft saved. It is not handed over until you submit.</p>
          ) : (
            <p className="gate__note">
              Submitting puts this patient on the oncoming shift&rsquo;s list.
            </p>
          )}
          {error ? <p className="error-note">{error}</p> : null}
        </SafetyGate>
      </div>
    </>
  );
}
