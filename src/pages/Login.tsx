import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Envelope, Key, TerminalWindow, Warning } from '@phosphor-icons/react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123');
  };

  return (
    <div className="flex min-h-[90vh] items-center justify-center px-6 py-12">
      <div className="w-full max-w-md glass-card p-8 rounded-lg shadow-xl relative overflow-hidden">
        {/* Glow overlay */}
        <div className="absolute -top-32 -left-32 h-64 w-64 rounded-full bg-tech-cyan/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-tech-cyan/5 blur-3xl" />

        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8 relative">
          <div className="mb-3 rounded-lg border border-dark-border bg-slate-100 p-2.5 text-tech-cyan">
            <TerminalWindow size={28} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-wide font-mono">HACKATHON LOGIN</h2>
          <p className="text-xs text-slate-500 mt-1 font-mono">truy cập hệ thống quản trị & thi đấu</p>
        </div>

        {error && (
          <div className="mb-6 flex gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-500">
            <Warning size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2" htmlFor="email">
              Email hệ thống
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Envelope size={18} />
              </span>
              <input
                id="email"
                type="email"
                required
                className="w-full rounded-lg border border-dark-border bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-tech-cyan focus:bg-white focus:outline-none focus:ring-1 focus:ring-tech-cyan transition-all"
                placeholder="developer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2" htmlFor="password">
              Mật khẩu
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Key size={18} />
              </span>
              <input
                id="password"
                type="password"
                required
                className="w-full rounded-lg border border-dark-border bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-tech-cyan focus:bg-white focus:outline-none focus:ring-1 focus:ring-tech-cyan transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-tech-cyan py-2.5 text-xs font-bold text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-tech-cyan hover:underline font-semibold">
            Đăng ký ngay
          </Link>
        </div>

        {/* Quick Demo Login helper */}
        <div className="mt-8 border-t border-dark-border/60 pt-6">
          <span className="block text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-3 text-center">
            Tài khoản dùng thử nhanh
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <button
              onClick={() => fillDemoAccount('organizer@hackathon.com')}
              className="rounded border border-dark-border bg-slate-50 py-1.5 px-2 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-100 transition-all text-left"
            >
              Organiser BTC
            </button>
            <button
              onClick={() => fillDemoAccount('student.fpt@hackathon.com')}
              className="rounded border border-dark-border bg-slate-50 py-1.5 px-2 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-100 transition-all text-left"
            >
              Sinh Viên FPT
            </button>
            <button
              onClick={() => fillDemoAccount('judge.internal@hackathon.com')}
              className="rounded border border-dark-border bg-slate-50 py-1.5 px-2 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-100 transition-all text-left"
            >
              Giám Khảo NB
            </button>
            <button
              onClick={() => fillDemoAccount('mentor@hackathon.com')}
              className="rounded border border-dark-border bg-slate-50 py-1.5 px-2 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-100 transition-all text-left"
            >
              Cố Vấn Mentor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
