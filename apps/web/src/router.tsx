import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { ChannelPage } from './pages/ChannelPage';
import { VoicePage } from './pages/VoicePage';
import { AdminPage } from './pages/AdminPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* ── Admin — full-page, outside AppShell ─────────────── */}
      <Route
        path="/admin"
        element={
          <PrivateRoute>
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          </PrivateRoute>
        }
      />

      {/* ── Main app shell ────────────────────────────────────── */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppShell />
          </PrivateRoute>
        }
      >
        <Route index element={null} />
        <Route path="channel/:channelId" element={<ChannelPage />} />
        <Route path="voice/:channelId" element={<VoicePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
