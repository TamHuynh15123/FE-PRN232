import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SignOut, TerminalWindow, User, Shield, Users, Calendar } from '@phosphor-icons/react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-dark-border bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-mono text-sm tracking-widest text-slate-900 hover:opacity-80 transition-opacity">
          <TerminalWindow size={20} className="text-tech-cyan" />
          <span>HACKATHON<span className="text-tech-cyan">//</span>SYSTEM</span>
        </Link>

        {/* Navigation Items */}
        <nav className="hidden md:flex items-center gap-8 text-sm">
          {user && (
            <>
              <Link to="/" className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors">
                <Calendar size={16} />
                Sự Kiện
              </Link>
              {user.role === 'organizer' && (
                <Link to="/organizer" className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors">
                  <Shield size={16} />
                  Quản Trị BTC
                </Link>
              )}
              {(user.role === 'student_fpt' || user.role === 'student_external') && (
                <Link to="/team" className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors">
                  <Users size={16} />
                  Đội Thi Của Tôi
                </Link>
              )}
            </>
          )}
        </nav>

        {/* User profile & action */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-900">{user.fullName}</span>
                <span className="text-[10px] font-mono text-tech-cyan uppercase tracking-wider">{user.role.replace('_', ' ')}</span>
              </div>
              <div className="h-8 w-8 rounded-full border border-dark-border bg-slate-100 flex items-center justify-center text-slate-600">
                <User size={16} />
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-rose-500 transition-all active:scale-95"
                title="Đăng xuất"
              >
                <SignOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex gap-4">
              <Link
                to="/login"
                className="text-xs font-medium text-slate-600 hover:text-slate-900 self-center transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-tech-cyan px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 active:scale-95 transition-all"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
