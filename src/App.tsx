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

// Route guards
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-dark-bg">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-tech-green border-t-transparent" />
    </div>
  );
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const OrganizerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-dark-bg">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-tech-green border-t-transparent" />
    </div>
  );
  return user && user.role === 'organizer' ? <>{children}</> : <Navigate to="/" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-dark-bg">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-tech-green border-t-transparent" />
    </div>
  );
  return !user ? <>{children}</> : <Navigate to="/" replace />;
};

const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-bg text-slate-300 flex flex-col">
      <Header />
      <main className="flex-grow">
        <Routes>
          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><Events /></ProtectedRoute>} />
          <Route path="/events/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
          <Route path="/team" element={<ProtectedRoute><TeamDetail /></ProtectedRoute>} />
          <Route path="/organizer" element={<OrganizerRoute><OrganizerAdmin /></OrganizerRoute>} />

          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-t border-dark-border py-8 bg-slate-50 text-center text-xs text-slate-500 font-mono">
        <div>HACKATHON MANAGEMENT PORTAL &copy; 2026. ALL RIGHTS RESERVED.</div>
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
