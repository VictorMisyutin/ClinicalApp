import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWard } from '@/api/handoffs';
import { SEVERITY_ORDER } from '@/types/domain';
import type { HandoffRecord, IllnessSeverity } from '@/types/domain';
import { boardName, demographics, pluralise } from '@/lib/format';
import { blockingIssues, checkHandoff } from '@/lib/validation';
import { AcuityChip, Empty, Loading, StatusChip } from '@/components/primitives';

type Filter = 'all' | IllnessSeverity | 'unfinished';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Everyone' },
  { key: 'unstable', label: 'Unstable' },
  { key: 'watcher', label: 'Watchers' },
  { key: 'stable', label: 'Stable' },
  { key: 'unfinished', label: 'Not ready' },
];

interface RowStats {
  open: number;
  overdue: number;
  blocking: number;
}

function statsFor(record: HandoffRecord): RowStats {
  const open = record.handoff.actions.filter((a) => !a.completed);
  return {
    open: open.length,
    overdue: open.filter((a) => a.dueAt && new Date(a.dueAt).getTime() < Date.now())
      .length,
    blocking: blockingIssues(checkHandoff(record.handoff)).length,
  };
}

export function Board() {
  const navigate = useNavigate();
  const [ward, setWard] = useState<HandoffRecord[] | null>(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    fetchWard()
      .then(setWard)
      .catch(() => setError('Could not load the ward. Check the API is running.'));
  }, []);

  const decorated = useMemo(
    () =>
      (ward ?? [])
        .map((record) => ({ record, stats: statsFor(record) }))
        // Sickest first, then whoever has the most overdue work, then by room.
        .sort((a, b) => {
          const aRank = a.record.handoff.severity
            ? SEVERITY_ORDER[a.record.handoff.severity]
            : 3;
          const bRank = b.record.handoff.severity
            ? SEVERITY_ORDER[b.record.handoff.severity]
            : 3;
          if (aRank !== bRank) return aRank - bRank;
          if (a.stats.overdue !== b.stats.overdue) return b.stats.overdue - a.stats.overdue;
          return a.record.patient.room.localeCompare(b.record.patient.room);
        }),
    [ward],
  );

  const tally = (key: Filter) =>
    decorated.filter((entry) => matches(entry.record, entry.stats, key)).length;

  const visible = decorated.filter((entry) => matches(entry.record, entry.stats, filter));

  const notReady = decorated.filter((entry) => entry.stats.blocking > 0).length;

  if (error) return <p className="error-note">{error}</p>;
  if (!ward) return <Loading />;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-head__title">Handoff board</h1>
          <p className="page-head__sub">
            {decorated.length} {pluralise(decorated.length, 'patient')} on the unit,
            sickest first.{' '}
            {notReady > 0
              ? `${notReady} ${pluralise(notReady, 'handoff')} still ${pluralise(notReady, 'has', 'have')} something missing.`
              : 'Every handoff is complete.'}
          </p>
        </div>
      </div>

      <div className="filters" role="group" aria-label="Filter the board">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`filter${filter === key ? ' filter--on' : ''}`}
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {label}
            <span className="filter__tally">{tally(key)}</span>
          </button>
        ))}
      </div>

      <div className="board">
        <div className="board__legend" aria-hidden="true">
          <span className="board__legend-cell">Room</span>
          <span className="board__legend-cell">Patient</span>
          <span className="board__legend-cell">Tasks</span>
          <span className="board__legend-cell">Status</span>
        </div>

        {visible.length === 0 ? (
          <Empty title="Nobody matches that filter">
            Try “Everyone” to see the whole unit.
          </Empty>
        ) : (
          visible.map(({ record, stats }) => {
            const { patient, handoff } = record;
            return (
              <button
                key={patient.id}
                type="button"
                className="row"
                onClick={() => navigate(`/patients/${patient.id}`)}
              >
                <span
                  className={`row__spine${handoff.severity ? ` row__spine--${handoff.severity}` : ''}`}
                  aria-hidden="true"
                />

                <span className="row__room">
                  {patient.room}
                  <span className="row__mrn">{patient.mrn}</span>
                </span>

                <span className="row__identity">
                  <span className="row__name">
                    {boardName(patient)}
                    <span className="row__demo">{demographics(patient)}</span>
                  </span>
                  <span
                    className={`row__summary${handoff.summary ? '' : ' row__summary--empty'}`}
                  >
                    {handoff.summary || 'No summary written yet'}
                  </span>
                </span>

                <span className="row__tasks">
                  <span className="row__tally">
                    {stats.open === 0
                      ? 'No open tasks'
                      : `${stats.open} open ${pluralise(stats.open, 'task')}`}
                  </span>
                  {stats.overdue > 0 ? (
                    <span className="row__late">
                      <span className="row__late-dot" aria-hidden="true" />
                      {stats.overdue} past due
                    </span>
                  ) : null}
                </span>

                <span className="row__state">
                  {handoff.status === 'draft' ? (
                    <AcuityChip severity={handoff.severity} />
                  ) : (
                    <StatusChip status={handoff.status} />
                  )}
                </span>
              </button>
            );
          })
        )}
      </div>
    </>
  );
}

function matches(record: HandoffRecord, stats: RowStats, filter: Filter): boolean {
  if (filter === 'all') return true;
  if (filter === 'unfinished') return stats.blocking > 0;
  return record.handoff.severity === filter;
}
