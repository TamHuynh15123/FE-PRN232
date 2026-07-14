import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Events } from './pages/Events';
import { EventDetail } from './pages/EventDetail';
import { TeamDetail } from './pages/TeamDetail';
import { OrganizerAdmin } from './pages/OrganizerAdmin';
import { JudgeScoring } from './pages/JudgeScoring';
import { Ranking } from './pages/Ranking';
import { ScoreOverview } from './pages/ScoreOverview';

// ── Route guards ────────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const OrganizerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user && user.role === 'organizer' ? <>{children}</> : <Navigate to="/" replace />;
};

const JudgeRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  const isJudge = user?.role === 'judge_internal' || user?.role === 'judge_guest';
  return user && isJudge ? <>{children}</> : <Navigate to="/" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return !user ? <>{children}</> : <Navigate to="/" replace />;
};

// ── Layout ──────────────────────────────────────────────────────────────────

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Header />
      <main className="flex-grow">
        <Routes>
          {/* Protected — all authenticated users */}
          <Route path="/" element={<ProtectedRoute><Events /></ProtectedRoute>} />
          <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
          <Route path="/team" element={<ProtectedRoute><TeamDetail /></ProtectedRoute>} />
          <Route path="/ranking/:eventId" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />

          {/* Organizer only */}
          <Route path="/organizer" element={<OrganizerRoute><OrganizerAdmin /></OrganizerRoute>} />
          <Route path="/score-overview/:eventId" element={<OrganizerRoute><ScoreOverview /></OrganizerRoute>} />
          <Route path="/score-overview" element={<OrganizerRoute><ScoreOverview /></OrganizerRoute>} />

          {/* Judge only */}
          <Route path="/judge/scoring" element={<JudgeRoute><JudgeScoring /></JudgeRoute>} />

          {/* Public */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-200 py-6 bg-white text-center text-[11px] text-slate-400 font-mono">
        HACKATHON MANAGEMENT PORTAL &copy; 2026. ALL RIGHTS RESERVED.
      </footer>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout />
      </Router>
    </AuthProvider>
  );
}

export default App;
