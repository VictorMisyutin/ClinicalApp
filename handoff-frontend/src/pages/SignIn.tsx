import { useState } from 'react';
import type { SubmitEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, login, usingSampleWard } from '@/api/handoffs';
import { useSession } from '@/state/SessionContext';
import { Field } from '@/components/primitives';

export function SignIn() {
  const { signIn } = useSession();
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await login(employeeId, password);
      signIn(result);
      navigate('/board');
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
      } else {
        setError('Could not sign in. Check the API is running.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="signin">
      <aside className="signin__aside">
        <p className="signin__mark">Clinical Handoff</p>
        <h1 className="signin__claim">
          Nothing gets{' '}
          <span className="signin__claim-em">handed over</span> half finished.
        </h1>
        <p className="signin__foot">
          Every handoff is checked before it leaves your hands: severity set, allergies
          answered, code status confirmed, and an owner against every task. If something
          is missing, the submit button stays shut until it is not.
        </p>
        <p className="signin__foot">
          <Link to="/about">How this works, and why →</Link>
        </p>
      </aside>

      <div className="signin__panel">
        <form className="signin__form" onSubmit={submit}>
          <h2 className="signin__title">Take the board</h2>
          <p className="signin__lede">
            Sign in with your employee ID to open the handoff board for 6 West.
          </p>

          <Field label="Employee ID" htmlFor="employeeId">
            <input
              id="employeeId"
              className="input"
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
              placeholder="aokonkwo"
              autoComplete="username"
              autoFocus
            />
          </Field>

          <Field label="Password" htmlFor="password">
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </Field>

          {usingSampleWard ? (
            <p className="gate__note">
              Sample ward: sign in as any of aokonkwo, dhalvorsen, rmehta, sbaptiste, or
              jfairweather — any password works.
            </p>
          ) : null}

          {error ? <p className="error-note">{error}</p> : null}

          <button
            type="submit"
            className="btn"
            style={{ width: '100%', marginTop: 8 }}
            disabled={busy || employeeId.trim().length === 0 || password.length === 0}
          >
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
