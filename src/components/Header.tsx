import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SignOut, TerminalWindow, User, Shield, Users, Calendar, Star, ChartBar } from '@phosphor-icons/react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isJudge = user?.role === 'judge_internal' || user?.role === 'judge_guest';
  const isStudent = user?.role === 'student_fpt' || user?.role === 'student_external';
  const isOrganizer = user?.role === 'organizer';

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-mono text-sm tracking-widest text-slate-900 hover:opacity-80 transition-opacity">
          <TerminalWindow size={20} className="text-indigo-500" />
          <span>HACKATHON<span className="text-indigo-500">//</span>SYSTEM</span>
        </Link>

        {/* Navigation Items */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {user && (
            <>
              <Link to="/" className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors">
                <Calendar size={16} /> Sự Kiện
              </Link>
              {isOrganizer && (
                <>
                  <Link to="/organizer" className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors">
                    <Shield size={16} /> Quản Trị BTC
                  </Link>
                  <Link to="/score-overview" className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors">
                    <ChartBar size={16} /> Tổng Quan Điểm
                  </Link>
                </>
              )}
              {isStudent && (
                <Link to="/team" className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors">
                  <Users size={16} /> Đội Thi Của Tôi
                </Link>
              )}
              {isJudge && (
                <Link to="/judge/scoring" className="flex items-center gap-1.5 text-amber-600 hover:text-amber-700 font-semibold transition-colors">
                  <Star size={16} weight="fill" /> Chấm Điểm
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
                <span className="text-[10px] font-mono text-indigo-500 uppercase tracking-wider">
                  {user.role.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="h-8 w-8 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-600">
                <User size={16} />
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-rose-500 transition-all active:scale-95"
                title="Đăng xuất"
              >
                <SignOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link to="/login" className="text-xs font-medium text-slate-600 hover:text-slate-900 self-center transition-colors">
                Đăng nhập
              </Link>
              <Link to="/register" className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 active:scale-95 transition-all">
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
