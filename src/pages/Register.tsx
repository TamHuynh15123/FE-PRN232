import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Envelope, Key, Phone, IdentificationCard, ShieldCheck, Warning } from '@phosphor-icons/react';

export const Register: React.FC = () => {
  const { register } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [isFptStudent, setIsFptStudent] = useState(true);
  const [universityName, setUniversityName] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName || !studentCode) return;
    if (!isFptStudent && !universityName) {
      setError('Sinh viên ngoài trường vui lòng điền tên trường Đại học.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const msg = await register({
        email,
        password,
        fullName,
        phone,
        studentCode,
        isFptStudent,
        universityName: isFptStudent ? 'FPT University' : universityName
      });
      setSuccessMsg(msg);
      // Reset form
      setEmail('');
      setPassword('');
      setFullName('');
      setPhone('');
      setStudentCode('');
      setUniversityName('');
    } catch (err: any) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[90vh] items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg glass-card p-8 rounded-lg shadow-xl relative overflow-hidden">
        {/* Glow overlay */}
        <div className="absolute -top-32 -left-32 h-64 w-64 rounded-full bg-tech-cyan/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-tech-cyan/5 blur-3xl" />

        {/* Logo Header */}
        <div className="flex flex-col items-center mb-8 relative">
          <div className="mb-3 rounded-lg border border-dark-border bg-slate-100 p-2.5 text-tech-cyan">
            <IdentificationCard size={28} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-wide font-mono">ĐĂNG KÝ THÍ SINH</h2>
          <p className="text-xs text-slate-500 mt-1 font-mono">tham gia tranh tài hackathon</p>
        </div>

        {error && (
          <div className="mb-6 flex gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-500">
            <Warning size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg ? (
          <div className="mb-6 rounded-lg border border-tech-cyan/20 bg-tech-cyan/5 p-6 text-center text-sm text-tech-cyan">
            <ShieldCheck size={48} className="mx-auto mb-3 text-tech-cyan" />
            <h3 className="font-bold text-slate-900 font-mono mb-2">ĐĂNG KÝ THÀNH CÔNG</h3>
            <p className="text-xs text-slate-500 mb-4">{successMsg}</p>
            <Link
              to="/login"
              className="inline-block rounded-lg bg-tech-cyan px-6 py-2 text-xs font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all"
            >
              Đi tới Đăng nhập
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 relative">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2" htmlFor="fullName">
                  Họ và tên *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <User size={18} />
                  </span>
                  <input
                    id="fullName"
                    type="text"
                    required
                    className="w-full rounded-lg border border-dark-border bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-tech-cyan focus:bg-white focus:outline-none focus:ring-1 focus:ring-tech-cyan transition-all"
                    placeholder="Nguyen Van A"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2" htmlFor="phone">
                  Số điện thoại
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Phone size={18} />
                  </span>
                  <input
                    id="phone"
                    type="text"
                    className="w-full rounded-lg border border-dark-border bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:border-tech-cyan focus:bg-white focus:outline-none focus:ring-1 focus:ring-tech-cyan transition-all"
                    placeholder="0987xxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2" htmlFor="email">
                Email đăng ký *
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
                  placeholder="anvse160000@fpt.edu.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2" htmlFor="password">
                Mật khẩu *
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
                  placeholder="•••••••• (Tối thiểu 6 ký tự)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="border-t border-dark-border/50 my-4 pt-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Đối tượng thí sinh
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setIsFptStudent(true)}
                  className={`rounded-lg border py-3 px-4 text-center text-xs font-semibold transition-all ${
                    isFptStudent
                      ? 'border-tech-cyan bg-tech-cyan/10 text-tech-cyan'
                      : 'border-dark-border bg-slate-50 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Sinh Viên FPT
                </button>
                <button
                  type="button"
                  onClick={() => setIsFptStudent(false)}
                  className={`rounded-lg border py-3 px-4 text-center text-xs font-semibold transition-all ${
                    !isFptStudent
                      ? 'border-tech-cyan bg-tech-cyan/10 text-tech-cyan'
                      : 'border-dark-border bg-slate-50 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Ngoài FPT
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2" htmlFor="studentCode">
                  Mã số sinh viên *
                </label>
                <div className="relative">
                  <input
                    id="studentCode"
                    type="text"
                    required
                    className="w-full rounded-lg border border-dark-border bg-slate-50 py-2.5 px-4 text-xs text-slate-900 placeholder-slate-400 focus:border-tech-cyan focus:bg-white focus:outline-none focus:ring-1 focus:ring-tech-cyan transition-all font-mono"
                    placeholder="SE160000"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
                    isFptStudent ? 'text-slate-300' : 'text-slate-500'
                  }`}
                  htmlFor="universityName"
                >
                  Trường Đại học *
                </label>
                <input
                  id="universityName"
                  type="text"
                  disabled={isFptStudent}
                  required={!isFptStudent}
                  className={`w-full rounded-lg border py-2.5 px-4 text-xs focus:outline-none transition-all ${
                    isFptStudent
                      ? 'border-dark-border/40 bg-slate-100 text-slate-400 placeholder-slate-300'
                      : 'border-dark-border bg-slate-50 text-slate-900 focus:border-tech-cyan focus:bg-white focus:ring-1 focus:ring-tech-cyan'
                  }`}
                  placeholder={isFptStudent ? 'Đại học FPT' : 'Tên trường đại học...'}
                  value={isFptStudent ? '' : universityName}
                  onChange={(e) => setUniversityName(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-tech-cyan py-2.5 text-xs font-bold text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 mt-6"
            >
              {loading ? 'Đang xử lý đăng ký...' : 'ĐĂNG KÝ THAM GIA'}
            </button>
          </form>
        )}

        {!successMsg && (
          <div className="mt-6 text-center text-xs text-slate-500">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-tech-cyan hover:underline font-semibold">
              Đăng nhập tại đây
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
