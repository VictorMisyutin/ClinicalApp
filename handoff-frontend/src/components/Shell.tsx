import { useEffect, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useSession } from '@/state/SessionContext';
import { fetchShift, usingSampleWard } from '@/api/handoffs';
import { clockTime, countdown } from '@/lib/format';
import type { Shift } from '@/types/domain';

/** Ticks once a minute so the changeover countdown stays honest. */
function useMinuteTick(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function Shell() {
  const { clinician, signOut } = useSession();
  const [shift, setShift] = useState<Shift | null>(null);
  const now = useMinuteTick();

  useEffect(() => {
    let live = true;
    fetchShift()
      .then((value) => {
        if (live) setShift(value);
      })
      .catch(() => {
        // The board still works without the shift header; it is context, not content.
      });
    return () => {
      live = false;
    };
  }, []);

  const remaining = shift ? countdown(shift.changeoverAt, now) : null;
  const imminent =
    shift !== null &&
    new Date(shift.changeoverAt).getTime() - now < 30 * 60 * 1000;

  return (
    <div className="shell">
      <header className="masthead">
        <div className="masthead__inner">
          <div className="masthead__unit">
            <span className="masthead__unit-name">
              {shift?.unit ?? 'Handoff'}
            </span>
            <span className="masthead__unit-sub">
              {shift ? `${shift.label} · report at ${clockTime(shift.changeoverAt)}` : '—'}
            </span>
          </div>

          <nav className="masthead__nav" aria-label="Main">
            <NavLink
              to="/board"
              className={({ isActive }) =>
                `masthead__link${isActive ? ' masthead__link--active' : ''}`
              }
            >
              Board
            </NavLink>
            <NavLink
              to="/receive"
              className={({ isActive }) =>
                `masthead__link${isActive ? ' masthead__link--active' : ''}`
              }
            >
              Take report
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `masthead__link${isActive ? ' masthead__link--active' : ''}`
              }
            >
              How this works
            </NavLink>
          </nav>

          {shift ? (
            <div className="changeover">
              <span className="changeover__label">Changeover</span>
              <span
                className={`changeover__value${imminent ? ' changeover__value--imminent' : ''}`}
              >
                {remaining}
              </span>
            </div>
          ) : null}

          {clinician ? (
            <div className="masthead__user">
              <div>
                <div className="masthead__user-name">{clinician.name}</div>
                <div className="masthead__user-role">{clinician.role}</div>
              </div>
              <button type="button" className="btn btn--quiet" onClick={signOut}>
                Sign out
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {usingSampleWard ? (
        <p className="banner">
          Sample ward. No API is configured, so changes stay in this browser tab and
          disappear on refresh. Set VITE_API_BASE_URL to use the real backend.
        </p>
      ) : null}

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
