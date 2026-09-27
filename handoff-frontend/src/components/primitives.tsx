import type { ReactNode } from 'react';
import type { HandoffStatus, IllnessSeverity } from '@/types/domain';
import { SEVERITY_LABEL } from '@/types/domain';

export function AcuityChip({ severity }: { severity: IllnessSeverity | null }) {
  if (!severity) return <span className="chip chip--none">Not set</span>;
  return (
    <span className={`chip chip--${severity}`}>{SEVERITY_LABEL[severity]}</span>
  );
}

const STATUS_LABEL: Record<HandoffStatus, string> = {
  draft: 'Draft',
  submitted: 'Ready to receive',
  acknowledged: 'Received',
};

export function StatusChip({ status }: { status: HandoffStatus }) {
  return <span className={`chip chip--${status}`}>{STATUS_LABEL[status]}</span>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <p className="empty__title">{title}</p>
      {children ? <p>{children}</p> : null}
    </div>
  );
}

export function Loading({ label = 'Loading the ward' }: { label?: string }) {
  return (
    <p className="loading" role="status">
      {label}…
    </p>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: ReactNode;
}

export function Field({ label, hint, htmlFor, children }: FieldProps) {
  return (
    <div className="field">
      <label className="field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {hint ? <p className="field__hint">{hint}</p> : null}
      {children}
    </div>
  );
}

interface SectionProps {
  letter: string;
  title: string;
  hint?: string;
  active?: boolean;
  anchor?: string;
  children: ReactNode;
}

/** One I-PASS section. The letter is the framework's own label, not decoration. */
export function Section({
  letter,
  title,
  hint,
  active = false,
  anchor,
  children,
}: SectionProps) {
  return (
    <section className="section" id={anchor}>
      <p
        className={`section__letter${active ? ' section__letter--active' : ''}`}
        aria-hidden="true"
      >
        {letter}
      </p>
      <div className="section__body">
        <h2 className="section__title">{title}</h2>
        {hint ? <p className="section__hint">{hint}</p> : null}
        {children}
      </div>
    </section>
  );
}
