import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import { Shell } from '@/components/Shell';
import { SignIn } from '@/pages/SignIn';
import { Board } from '@/pages/Board';
import { PatientHandoff } from '@/pages/PatientHandoff';
import { HandoffEditor } from '@/pages/HandoffEditor';
import { ReceiveReport } from '@/pages/ReceiveReport';
import { About } from '@/pages/About';
import { useSession } from '@/state/SessionContext';

/** Sends anyone without a session back to sign-in. */
function RequireSession({ children }: { children: ReactElement }) {
  const { clinician } = useSession();
  return clinician ? children : <Navigate to="/sign-in" replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignIn />} />
      <Route element={<Shell />}>
        <Route path="/about" element={<About />} />
        <Route
          path="/board"
          element={
            <RequireSession>
              <Board />
            </RequireSession>
          }
        />
        <Route
          path="/patients/:patientId"
          element={
            <RequireSession>
              <PatientHandoff />
            </RequireSession>
          }
        />
        <Route
          path="/patients/:patientId/edit"
          element={
            <RequireSession>
              <HandoffEditor />
            </RequireSession>
          }
        />
        <Route
          path="/receive"
          element={
            <RequireSession>
              <ReceiveReport />
            </RequireSession>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/board" replace />} />
    </Routes>
  );
}
