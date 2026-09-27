const TERMS: { term: string; body: string }[] = [
  {
    term: 'Handoff',
    body: 'The record that travels with a patient from one shift to the next: what is wrong with them, what has been done, what still needs doing, and who is watching for trouble. One patient has exactly one active handoff at a time — this app does not keep a history of past shifts, only the current state.',
  },
  {
    term: 'I-PASS',
    body: 'The five-part structure the editor and the patient page are built around — Illness severity, Patient summary, Action list, Situation awareness (contingency planning), and Synthesis by the receiver. It is a real framework hospitals train staff to, not something invented for this app.',
  },
  {
    term: 'Ward / unit',
    body: 'The physical group of beds a shift is responsible for. This app models a single fictional unit, "6 West — Medical/Surgical," rather than a whole hospital.',
  },
  {
    term: 'Changeover',
    body: 'The moment one shift ends and the next begins. The masthead clock counts down to it because a handoff written five minutes before changeover is a very different situation than one written five hours before it.',
  },
  {
    term: 'Severity: stable / watcher / unstable',
    body: '"Stable" means no changes are anticipated this shift. "Watcher" means the patient looks fine right now but has a real chance of turning — the app nudges (not forces) an if/then plan for these. "Unstable" means active deterioration and requires at least one contingency plan before it can be submitted.',
  },
  {
    term: 'Code status',
    body: 'What resuscitation measures apply if the patient arrests: full code, DNR, DNR/DNI, comfort measures only, or unconfirmed. "Unconfirmed" is treated as a missing field, not a valid answer — a handoff cannot go out without this settled.',
  },
  {
    term: 'Contingency ("if/then" plan)',
    body: 'A pre-written trigger and response pair — "if the pressure stays below 90 after a bolus, then call the medical emergency team" — so the oncoming clinician does not have to improvise a response to a crisis at 3 a.m. that the outgoing clinician already saw coming.',
  },
  {
    term: 'Pending study',
    body: 'A test or result that is still outstanding and needs a named person to chase it. The rule is simple: a result nobody owns is a result nobody sees.',
  },
  {
    term: 'Synthesis (the read-back)',
    body: "The receiving clinician's own words repeating the plan back, plus explicit confirmation they have read the action list. It exists to catch a misunderstanding before it becomes a missed task, not to duplicate the summary.",
  },
];

const ASSUMPTIONS = [
  'Everything here is fictional. No real patient data, employee data, or hospital affiliation is represented anywhere in the app or its seed data.',
  'One ward, one shift pattern (day/night), one active handoff per patient — this is a focused demonstration of the handoff moment, not a full electronic health record.',
  'Staff accounts are assumed to be provisioned ahead of time by hospital IT, the way real clinical systems work. There is deliberately no self-service sign-up screen.',
  'The five demo clinicians and eight demo patients are seeded data, refreshed to look "current" every time the database is created from scratch.',
  'When no backend is configured, the app falls back to an in-memory sample ward so the interface can be reviewed on its own, with the same code paths as the real API.',
];

export function About() {
  return (
    <article className="article">
      <div className="page-head">
        <div>
          <h1 className="page-head__title">How this works</h1>
          <p className="page-head__sub">
            Terminology, assumptions, and the reasoning behind this handoff tool — for
            anyone reading the code, not just using it.
          </p>
        </div>
      </div>

      <section className="article__section">
        <p className="prose">
          This is a practice project built to look and behave like a real hospital
          shift-handoff tool, modeled on <strong>I-PASS</strong>, the structure most
          U.S. hospitals train staff to use when transferring a patient's care. It is
          not used in any clinical setting and contains no real patient information —
          every name, room number, and diagnosis in the seed data is invented.
        </p>
      </section>

      <section className="article__section">
        <p className="eyebrow">Terminology</p>
        <dl className="term-list">
          {TERMS.map(({ term, body }) => (
            <div className="term-list__row" key={term}>
              <dt className="term-list__term">{term}</dt>
              <dd className="term-list__body">{body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="article__section">
        <p className="eyebrow">Assumptions</p>
        <ul className="article__list">
          {ASSUMPTIONS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="article__section">
        <p className="eyebrow">How it works</p>
        <p className="prose">
          The interface is React and TypeScript, talking to a C#/ASP.NET Core REST API
          backed by MySQL. Sign-in exchanges an employee ID and password for a signed
          token; every other request has to carry it, and the server rejects anything
          that doesn't. Passwords are hashed, never stored or logged in the clear.
        </p>
        <p className="prose" style={{ marginTop: 'var(--s-4)' }}>
          Safety rules — a summary long enough to be useful, an owner and a due time on
          every task, a contingency plan for an unstable patient — are checked in two
          places: once in the browser, so a clinician gets an answer instantly, and
          again on the server, which is the copy that actually decides whether a row
          gets written. If the two ever disagree, the server wins and the interface
          shows whatever it sent back.
        </p>
      </section>

      <section className="article__section">
        <p className="eyebrow">Why these decisions</p>
        <ul className="article__list article__list--why">
          <li>
            <strong>The read-back is mandatory, not optional.</strong> The Joint
            Commission's 2006 National Patient Safety Goals specifically recommended
            standardized handoffs with "read-back" and "repeat-back" practices during
            transitions of care — the synthesis step exists because that recommendation
            is grounded in real handoff failures, not because it makes the form longer.
          </li>
          <li>
            <strong>Blocking versus advisory issues are treated differently.</strong>{' '}
            A missing owner on a task is a defect and blocks submission. A watcher with
            no contingency plan is a judgment call the clinician might have a good
            reason for, so it is surfaced but does not lock the button.
          </li>
          <li>
            <strong>Validation is duplicated on purpose.</strong> The instant, in-browser
            copy is for speed. The server copy is the one with authority. Neither one
            trusts the other.
          </li>
          <li>
            <strong>The report queue sorts sickest-first.</strong> An oncoming clinician
            taking several handoffs in a row should see the unstable patient before the
            stable one, regardless of which was submitted first.
          </li>
          <li>
            <strong>IDs are short strings, not GUIDs.</strong> The client already
            generates its own IDs for new rows (new actions, new contingency plans), so
            there was nothing to gain from switching to a format that is harder to read
            in a demo dataset.
          </li>
          <li>
            <strong>There is no self-service sign-up.</strong> Real clinical systems
            provision staff accounts through IT, not a public registration form — this
            app assumes the same, even in its seeded demo data.
          </li>
        </ul>
      </section>

      <section className="article__section">
        <p className="eyebrow">What's next</p>
        <ul className="article__list">
          <li>A status field for PRN / as-needed patients.</li>
          <li>Medications, pulled from a real lookup table rather than free text.</li>
          <li>
            Vital-sign readings with a trend graph, updated as a handoff is written or
            reviewed.
          </li>
          <li>An AI-assisted check on whether a read-back actually matches the plan.</li>
          <li>An explicit "things to watch for" prompt on any patient who isn't stable.</li>
          <li>More data visualization generally — this page included.</li>
          <li>A real deployment: Linux on AWS EC2, DNS through Route 53.</li>
        </ul>
      </section>
    </article>
  );
}
