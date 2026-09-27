import { useEffect, useMemo, useState } from 'react';
import { acknowledgeHandoff, fetchWard } from '@/api/handoffs';
import { SEVERITY_ORDER, CODE_STATUS_LABEL, PRIORITY_LABEL } from '@/types/domain';
import type { Handoff, HandoffRecord } from '@/types/domain';
import { boardName, clockTime, pluralise, relativeDue } from '@/lib/format';
import { blockingIssues, checkAcknowledgement } from '@/lib/validation';
import { useSession } from '@/state/SessionContext';
import { AcuityChip, Empty, Loading, Section } from '@/components/primitives';
import { SafetyGate } from '@/components/SafetyGate';

const MIN_SYNTHESIS_CHARS = 30;

export function ReceiveReport() {
  const { clinician } = useSession();
  const [ward, setWard] = useState<HandoffRecord[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Handoff | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchWard()
      .then(setWard)
      .catch(() => setError('Could not load the ward. Check the API is running.'));
  }, []);

  const queue = useMemo(
    () =>
      (ward ?? [])
        .filter((record) => record.handoff.status === 'submitted')
        .sort((a, b) => {
          const aRank = a.handoff.severity ? SEVERITY_ORDER[a.handoff.severity] : 3;
          const bRank = b.handoff.severity ? SEVERITY_ORDER[b.handoff.severity] : 3;
          return aRank - bRank || a.patient.room.localeCompare(b.patient.room);
        }),
    [ward],
  );

  // Open the sickest waiting patient by default — that is the one to take first.
  useEffect(() => {
    if (!selectedId && queue.length > 0) {
      setSelectedId(queue[0].patient.id);
      setDraft({
        ...queue[0].handoff,
        incomingClinician: queue[0].handoff.incomingClinician || clinician?.name || '',
      });
    }
  }, [queue, selectedId, clinician]);

  const selected = queue.find((record) => record.patient.id === selectedId) ?? null;

  const open = (record: HandoffRecord) => {
    setSelectedId(record.patient.id);
    setDraft({
      ...record.handoff,
      incomingClinician: record.handoff.incomingClinician || clinician?.name || '',
    });
    setError('');
  };

  const issues = draft ? checkAcknowledgement(draft) : [];
  const blocked = blockingIssues(issues).length > 0;

  const accept = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      const saved = await acknowledgeHandoff(draft);
      setWard((current) =>
        (current ?? []).map((record) =>
          record.handoff.id === saved.id ? { ...record, handoff: saved } : record,
        ),
      );
      setSelectedId(null);
      setDraft(null);
    } catch {
      setError('Could not record the handoff. Try again.');
    } finally {
      setBusy(false);
    }
  };

  if (error && !ward) return <p className="error-note">{error}</p>;
  if (!ward) return <Loading label="Loading the report queue" />;

  const synthesisLength = draft?.synthesis.trim().length ?? 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Take report</h1>
          <p className="page-head__sub">
            {queue.length === 0
              ? 'Nothing waiting. Every submitted handoff has been received.'
              : `${queue.length} ${pluralise(queue.length, 'patient')} waiting to be handed to you, sickest first. Read each one back in your own words before you accept it.`}
          </p>
        </div>
      </div>

      {queue.length === 0 ? (
        <div className="card">
          <Empty title="The queue is empty">
            When the outgoing shift submits a handoff it will appear here.
          </Empty>
        </div>
      ) : (
        <>
          <div className="filters" role="group" aria-label="Choose a patient">
            {queue.map((record) => (
              <button
                key={record.patient.id}
                type="button"
                className={`filter${selectedId === record.patient.id ? ' filter--on' : ''}`}
                aria-pressed={selectedId === record.patient.id}
                onClick={() => open(record)}
              >
                {record.patient.room} · {record.patient.familyName}
              </button>
            ))}
          </div>

          {selected && draft ? (
            <div className="editor-layout">
              <div className="card">
                <div className="card__head">
                  <div>
                    <h2 className="section__title">
                      {selected.patient.room} · {boardName(selected.patient)}
                    </h2>
                    <p className="muted" style={{ fontSize: 'var(--step--1)' }}>
                      From {draft.outgoingClinician} ·{' '}
                      {draft.submittedAt ? `submitted ${clockTime(draft.submittedAt)}` : ''}
                    </p>
                  </div>
                  <AcuityChip severity={draft.severity} />
                </div>

                <div className="card__body">
                  <div className="vitals-strip">
                    <div className="vitals-strip__item">
                      <p className="vitals-strip__label">Code status</p>
                      <p className="vitals-strip__value">
                        {draft.codeStatus ? CODE_STATUS_LABEL[draft.codeStatus] : '—'}
                      </p>
                    </div>
                    <div className="vitals-strip__item">
                      <p className="vitals-strip__label">Allergies</p>
                      <p className="vitals-strip__value">
                        {draft.noKnownDrugAllergies
                          ? 'No known drug allergies'
                          : draft.allergies}
                      </p>
                    </div>
                  </div>

                  <Section letter="P" title="Patient summary" active>
                    <p className="prose">{draft.summary}</p>
                  </Section>

                  <Section
                    letter="A"
                    title="Action list"
                    active={draft.actions.length > 0}
                    anchor="actions-review"
                  >
                    {draft.actions.filter((a) => !a.completed).length === 0 ? (
                      <p className="prose prose--muted">Nothing outstanding.</p>
                    ) : (
                      <ul className="tasks">
                        {draft.actions
                          .filter((action) => !action.completed)
                          .map((action) => (
                            <li key={action.id} className="task" style={{ gridTemplateColumns: '1fr auto' }}>
                              <div>
                                <p className="task__text">{action.task}</p>
                                <p className="task__meta">
                                  <span className="task__owner">{action.owner}</span>
                                  <span>
                                    {clockTime(action.dueAt)} · {relativeDue(action.dueAt)}
                                  </span>
                                </p>
                              </div>
                              <span className="task__priority">
                                {PRIORITY_LABEL[action.priority]}
                              </span>
                            </li>
                          ))}
                      </ul>
                    )}
                  </Section>

                  {draft.contingencies.length > 0 ? (
                    <Section letter="S" title="If this happens" active>
                      {draft.contingencies.map((plan) => (
                        <div key={plan.id} className="plan">
                          <span className="plan__key">If</span>
                          <span className="plan__value">{plan.ifCondition}</span>
                          <span className="plan__key plan__key--then">Then</span>
                          <span className="plan__value plan__value--then">
                            {plan.thenAction}
                          </span>
                        </div>
                      ))}
                    </Section>
                  ) : null}

                  <Section
                    letter="S"
                    title="Your read-back"
                    anchor="synthesis"
                    active={synthesisLength >= MIN_SYNTHESIS_CHARS}
                    hint="Say the plan back in your own words. Copying the summary defeats the point — the read-back is how a misunderstanding gets caught."
                  >
                    <textarea
                      className={`textarea${synthesisLength > 0 && synthesisLength < MIN_SYNTHESIS_CHARS ? ' textarea--invalid' : ''}`}
                      value={draft.synthesis}
                      onChange={(event) =>
                        setDraft({ ...draft, synthesis: event.target.value })
                      }
                      placeholder="Septic post-op, on antibiotics since 03:40. I am repeating the lactate now and calling the team if the pressure drops again."
                      aria-label="Read the handoff back in your own words"
                    />
                    <p
                      className={`counter${synthesisLength < MIN_SYNTHESIS_CHARS ? ' counter--short' : ''}`}
                    >
                      {synthesisLength} / {MIN_SYNTHESIS_CHARS} characters
                    </p>

                    <label className="check" style={{ marginTop: 12 }}>
                      <input
                        type="checkbox"
                        className="check__box"
                        checked={draft.actionListReviewed}
                        onChange={(event) =>
                          setDraft({ ...draft, actionListReviewed: event.target.checked })
                        }
                      />
                      <span className="check__text">
                        I have read the action list
                        <span className="check__sub">
                          {draft.actions.filter((a) => !a.completed).length} open{' '}
                          {pluralise(
                            draft.actions.filter((a) => !a.completed).length,
                            'task',
                          )}{' '}
                          transfer to you.
                        </span>
                      </span>
                    </label>

                    <div style={{ marginTop: 12 }}>
                      <label className="field__label" htmlFor="incoming">
                        Taking over
                      </label>
                      <input
                        id="incoming"
                        className="input"
                        value={draft.incomingClinician}
                        onChange={(event) =>
                          setDraft({ ...draft, incomingClinician: event.target.value })
                        }
                        placeholder="Your name"
                      />
                    </div>
                  </Section>
                </div>
              </div>

              <SafetyGate
                issues={issues}
                clearedTitle="Ready to accept"
                clearedNote="You have read the plan back and confirmed the action list. Accepting moves these tasks to you."
              >
                <button type="button" className="btn" onClick={accept} disabled={blocked || busy}>
                  {busy ? 'Working…' : 'Accept the handoff'}
                </button>
                <p className="gate__note">
                  Once accepted, the open tasks on this patient become yours for the shift.
                </p>
                {error ? <p className="error-note">{error}</p> : null}
              </SafetyGate>
            </div>
          ) : null}
        </>
      )}
    </>
  );
}
