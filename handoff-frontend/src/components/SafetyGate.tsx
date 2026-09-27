import type { ReactNode } from 'react';
import type { SafetyIssue } from '@/lib/validation';
import { advisoryIssues, blockingIssues } from '@/lib/validation';
import { pluralise } from '@/lib/format';

interface SafetyGateProps {
  issues: SafetyIssue[];
  /** Rendered under the checklist — usually the submit and save buttons. */
  children: ReactNode;
  clearedTitle: string;
  clearedNote: string;
}

/**
 * The safety check panel.
 *
 * It stays on screen the whole time the clinician is writing rather than
 * appearing on submit, so the remaining work is always visible and each item
 * jumps to the section that needs attention.
 */
export function SafetyGate({
  issues,
  children,
  clearedTitle,
  clearedNote,
}: SafetyGateProps) {
  const blocking = blockingIssues(issues);
  const advisory = advisoryIssues(issues);
  const clear = blocking.length === 0;

  const jumpTo = (anchor: string) => {
    const target = document.getElementById(anchor);
    if (!target) return;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const focusable = target.querySelector<HTMLElement>(
      'input, textarea, select, button',
    );
    focusable?.focus({ preventScroll: true });
  };

  return (
    <aside className="gate" aria-label="Safety check">
      <div className="gate__head">
        <div className="gate__status">
          <p className={`gate__ring${clear ? ' gate__ring--clear' : ''}`} aria-hidden="true">
            {clear ? '✓' : blocking.length}
          </p>
          <div>
            <p className="gate__headline">{clear ? clearedTitle : 'Not ready yet'}</p>
            <p className="gate__sub">
              {clear
                ? advisory.length > 0
                  ? `${advisory.length} ${pluralise(advisory.length, 'thing')} worth a look`
                  : 'Everything checks out'
                : `${blocking.length} ${pluralise(blocking.length, 'item')} to resolve`}
            </p>
          </div>
        </div>
      </div>

      {issues.length > 0 ? (
        <ul className="gate__list">
          {[...blocking, ...advisory].map((issue) => (
            <li key={issue.code}>
              <button
                type="button"
                className={`gate__item${issue.level === 'advisory' ? ' gate__item--advisory' : ''}`}
                onClick={() => jumpTo(issue.anchor)}
              >
                {issue.message}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="gate__cleared">{clearedNote}</p>
      )}

      <div className="gate__foot">{children}</div>
    </aside>
  );
}
