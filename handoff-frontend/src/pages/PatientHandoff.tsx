import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchRecord, toggleAction } from '@/api/handoffs';
import { CODE_STATUS_LABEL, PRIORITY_LABEL } from '@/types/domain';
import type { HandoffRecord } from '@/types/domain';
import {
  boardName,
  clockTime,
  demographics,
  dueState,
  relativeDue,
  shortDate,
} from '@/lib/format';
import { AcuityChip, Loading, Section, StatusChip } from '@/components/primitives';

export function PatientHandoff() {
  const { patientId = '' } = useParams();
  const navigate = useNavigate();
  const [record, setRecord] = useState<HandoffRecord | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setRecord(null);
    fetchRecord(patientId)
      .then(setRecord)
      .catch(() => setError('That patient is not on this ward.'));
  }, [patientId]);

  const tick = async (actionId: string, completed: boolean) => {
    if (!record) return;
    // Optimistic: a tick should feel instant at a workstation.
    setRecord({
      ...record,
      handoff: {
        ...record.handoff,
        actions: record.handoff.actions.map((action) =>
          action.id === actionId ? { ...action, completed } : action,
        ),
      },
    });
    try {
      const updated = await toggleAction(record.handoff.id, actionId, completed);
      setRecord((current) => (current ? { ...current, handoff: updated } : current));
    } catch {
      setError('That change did not save. Reload and try again.');
    }
  };

  if (error) return <p className="error-note">{error}</p>;
  if (!record) return <Loading label="Opening the handoff" />;

  const { patient, handoff } = record;
  const openActions = handoff.actions.filter((a) => !a.completed);
  const doneActions = handoff.actions.filter((a) => a.completed);

  return (
    <>
      <Link to="/board" className="back-link">
        ← Back to the board
      </Link>

      <div className="patient-head">
        <p className="patient-head__room">
          <span className="patient-head__room-label">Room</span>
          {patient.room}
        </p>

        <div>
          <h1 className="patient-head__name">{boardName(patient)}</h1>
          <p className="patient-head__meta">
            <span>{demographics(patient)}</span>
            <span>MRN {patient.mrn}</span>
            <span>Admitted {shortDate(patient.admittedOn)}</span>
          </p>
        </div>

        <div className="patient-head__actions">
          <AcuityChip severity={handoff.severity} />
          <StatusChip status={handoff.status} />
          <button
            type="button"
            className="btn btn--sm"
            onClick={() => navigate(`/patients/${patient.id}/edit`)}
          >
            Edit handoff
          </button>
        </div>
      </div>

      <div className="vitals-strip">
        <div className="vitals-strip__item">
          <p className="vitals-strip__label">Code status</p>
          <p
            className={`vitals-strip__value${handoff.codeStatus === 'unconfirmed' || !handoff.codeStatus ? ' vitals-strip__value--alert' : ''}`}
          >
            {handoff.codeStatus ? CODE_STATUS_LABEL[handoff.codeStatus] : 'Not recorded'}
          </p>
        </div>
        <div className="vitals-strip__item">
          <p className="vitals-strip__label">Allergies</p>
          <p
            className={`vitals-strip__value${
              !handoff.noKnownDrugAllergies && !handoff.allergies.trim()
                ? ' vitals-strip__value--alert'
                : ''
            }`}
          >
            {handoff.noKnownDrugAllergies
              ? 'No known drug allergies'
              : handoff.allergies.trim() || 'Not recorded'}
          </p>
        </div>
        <div className="vitals-strip__item">
          <p className="vitals-strip__label">Handed over by</p>
          <p className="vitals-strip__value">
            {handoff.outgoingClinician || 'Not named'}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card__body">
          <Section
            letter="I"
            title="Illness severity"
            active={Boolean(handoff.severity)}
          >
            <AcuityChip severity={handoff.severity} />
          </Section>

          <Section letter="P" title="Patient summary" active={Boolean(handoff.summary)}>
            <p className={`prose${handoff.summary ? '' : ' prose--muted'}`}>
              {handoff.summary || 'Nothing written yet.'}
            </p>
          </Section>

          <Section
            letter="A"
            title="Action list"
            active={handoff.actions.length > 0}
            hint={
              openActions.length > 0
                ? 'What the next shift has to do, and who does it.'
                : undefined
            }
          >
            {handoff.actions.length === 0 ? (
              <p className="prose prose--muted">No actions on this patient.</p>
            ) : (
              <ul className="tasks">
                {[...openActions, ...doneActions].map((action) => {
                  const state = dueState(action.dueAt);
                  return (
                    <li
                      key={action.id}
                      className={`task${state === 'overdue' && !action.completed ? ' task--overdue' : ''}${action.completed ? ' task--done' : ''}`}
                    >
                      <input
                        type="checkbox"
                        className="task__check"
                        checked={action.completed}
                        onChange={(event) => tick(action.id, event.target.checked)}
                        aria-label={`Mark "${action.task}" ${action.completed ? 'not done' : 'done'}`}
                      />
                      <div>
                        <p className="task__text">{action.task}</p>
                        <p className="task__meta">
                          <span className="task__owner">{action.owner || 'No owner'}</span>
                          <span
                            className={
                              action.completed
                                ? ''
                                : state === 'overdue'
                                  ? 'task__due--overdue'
                                  : state === 'soon'
                                    ? 'task__due--soon'
                                    : ''
                            }
                          >
                            {action.dueAt
                              ? `${clockTime(action.dueAt)} · ${relativeDue(action.dueAt)}`
                              : 'No due time'}
                          </span>
                        </p>
                      </div>
                      <span
                        className={`task__priority${action.priority === 'now' && !action.completed ? ' task__priority--now' : ''}`}
                      >
                        {PRIORITY_LABEL[action.priority]}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}

            {handoff.pendingStudies.length > 0 ? (
              <div style={{ marginTop: 20 }}>
                <p className="eyebrow" style={{ marginBottom: 8 }}>
                  Results still pending
                </p>
                <ul className="tasks">
                  {handoff.pendingStudies.map((study) => (
                    <li key={study.id} className="task" style={{ gridTemplateColumns: '1fr auto' }}>
                      <p className="task__text">{study.study}</p>
                      <span className="task__priority">
                        {study.followUpOwner || 'Unowned'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </Section>

          <Section
            letter="S"
            title="Situation awareness and contingency planning"
            active={handoff.contingencies.length > 0}
            hint="What might go wrong, and what to do when it does."
          >
            {handoff.contingencies.length === 0 ? (
              <p className="prose prose--muted">No if/then plans recorded.</p>
            ) : (
              handoff.contingencies.map((plan) => (
                <div key={plan.id} className="plan">
                  <span className="plan__key">If</span>
                  <span className="plan__value">{plan.ifCondition}</span>
                  <span className="plan__key plan__key--then">Then</span>
                  <span className="plan__value plan__value--then">{plan.thenAction}</span>
                </div>
              ))
            )}
          </Section>

          <Section
            letter="S"
            title="Synthesis by the receiver"
            active={Boolean(handoff.synthesis)}
            hint="The read-back from whoever takes the patient."
          >
            {handoff.synthesis ? (
              <>
                <p className="prose">{handoff.synthesis}</p>
                <p className="saved-flag" style={{ marginTop: 10 }}>
                  {handoff.incomingClinician} · received{' '}
                  {handoff.acknowledgedAt ? clockTime(handoff.acknowledgedAt) : ''}
                </p>
              </>
            ) : (
              <>
                <p className="prose prose--muted">
                  Not received yet.
                </p>
                {handoff.status === 'submitted' ? (
                  <Link
                    to="/receive"
                    className="btn btn--ghost btn--sm"
                    style={{ marginTop: 12 }}
                  >
                    Take report on this patient
                  </Link>
                ) : null}
              </>
            )}
          </Section>
        </div>
      </div>
    </>
  );
}
