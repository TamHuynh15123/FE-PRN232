import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { UserCheck, UserPlus, FileText, Check, X, Shield, Warning } from '@phosphor-icons/react';

export const OrganizerAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'approvals' | 'judge' | 'templates'>('approvals');
  
  // Tab 1: Approvals State
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(true);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  // Tab 2: Create Guest Judge State
  const [judgeEmail, setJudgeEmail] = useState('');
  const [judgeName, setJudgeName] = useState('');
  const [judgeLoading, setJudgeLoading] = useState(false);
  const [judgeMsg, setJudgeMsg] = useState<string | null>(null);
  const [judgeError, setJudgeError] = useState<string | null>(null);

  // Tab 3: Criteria Templates State
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  const fetchPendingUsers = async () => {
    setLoadingApprovals(true);
    try {
      const data = await api.auth.getPending();
      setPendingUsers(data);
    } catch (err: any) {
      setApprovalError(err.message || 'Lỗi khi tải danh sách tài khoản chờ duyệt.');
    } finally {
      setLoadingApprovals(false);
    }
  };

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const savedTemplates = localStorage.getItem('hack_templates') || '[]';
      setTemplates(JSON.parse(savedTemplates));
    } catch (err) {
      console.error('Error fetching templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'approvals') fetchPendingUsers();
    if (activeTab === 'templates') fetchTemplates();
  }, [activeTab]);

  const handleReview = async (userId: string, approve: boolean) => {
    try {
      await api.auth.reviewPending({ userId, approve });
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi phê duyệt tài khoản.');
    }
  };

  const handleCreateJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judgeEmail || !judgeName) return;

    setJudgeLoading(true);
    setJudgeError(null);
    setJudgeMsg(null);
    try {
      const res = await api.auth.createJudge({ email: judgeEmail, fullName: judgeName });
      setJudgeMsg(res.message || 'Tạo tài khoản giám khảo thành công.');
      setJudgeEmail('');
      setJudgeName('');
    } catch (err: any) {
      setJudgeError(err.message || 'Lỗi khi tạo tài khoản giám khảo.');
    } finally {
      setJudgeLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 border-b border-dark-border">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 font-mono tracking-wide mb-6 uppercase flex items-center gap-2">
          <Shield className="text-tech-cyan" /> HỆ THỐNG QUẢN TRỊ BAN TỔ CHỨC
        </h1>

        {/* Tab Headers */}
        <div className="flex gap-6 text-xs font-mono font-semibold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('approvals')}
            className={`pb-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'approvals' ? 'border-tech-cyan text-tech-cyan' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserCheck size={16} /> Duyệt Tài Khoản ({pendingUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('judge')}
            className={`pb-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'judge' ? 'border-tech-cyan text-tech-cyan' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserPlus size={16} /> Tạo Giám Khảo Khách
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-4 flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'templates' ? 'border-tech-cyan text-tech-cyan' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText size={16} /> Mẫu Tiêu Chí Đánh Giá
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="min-h-[50vh]">
        {activeTab === 'approvals' && (
          <div>
            {approvalError && (
              <div className="mb-6 flex gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-500">
                <Warning size={16} />
                <span>{approvalError}</span>
              </div>
            )}

            {loadingApprovals ? (
              <div className="flex justify-center items-center h-48">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-tech-cyan border-t-transparent" />
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="glass-card p-12 text-center rounded-xl">
                <UserCheck size={48} className="mx-auto mb-4 text-slate-400 animate-pulse" />
                <h3 className="text-xs font-semibold text-slate-900 font-mono uppercase mb-1">Không có yêu cầu chờ duyệt</h3>
                <p className="text-[11px] text-slate-500">Tất cả tài khoản sinh viên đăng ký đã được xử lý.</p>
              </div>
            ) : (
              <div className="border border-dark-border rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-dark-border bg-slate-50 font-mono font-semibold uppercase tracking-wider text-slate-500">
                      <th className="p-4">Họ và tên</th>
                      <th className="p-4">Email</th>
                      <th className="p-4">MSSV</th>
                      <th className="p-4">Đối tượng</th>
                      <th className="p-4">Trường Đại Học</th>
                      <th className="p-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border/40 text-slate-700">
                    {pendingUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-semibold text-slate-900">{u.fullName}</td>
                        <td className="p-4 font-mono">{u.email}</td>
                        <td className="p-4 font-mono">{u.studentCode}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono border ${
                            u.isFptStudent 
                              ? 'bg-tech-cyan/10 border-tech-cyan/30 text-tech-cyan font-bold' 
                              : 'bg-tech-cyan/10 border-tech-cyan/30 text-tech-cyan font-bold'
                          }`}>
                            {u.isFptStudent ? 'Sinh Viên FPT' : 'Ngoài Trường'}
                          </span>
                        </td>
                        <td className="p-4">{u.universityName || 'Đại học FPT'}</td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleReview(u.id, true)}
                              className="rounded bg-tech-cyan/10 hover:bg-tech-cyan/20 border border-tech-cyan/30 p-1.5 text-tech-cyan transition-all active:scale-95"
                              title="Phê duyệt"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => handleReview(u.id, false)}
                              className="rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 p-1.5 text-rose-500 transition-all active:scale-95"
                              title="Từ chối"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'judge' && (
          <div className="max-w-md mx-auto glass-card p-8 rounded-xl shadow-lg">
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
              <UserPlus className="text-tech-cyan" /> Tạo tài khoản giám khảo khách mời
            </h2>
            <p className="text-[11px] text-slate-500 mb-6 leading-relaxed">
              Tài khoản giám khảo khách mời được kích hoạt ngay lập tức mà không cần phê duyệt, cho phép chuyên gia bên ngoài truy cập hệ thống để chấm điểm bài thi của các đội.
            </p>

            {judgeMsg && (
              <div className="mb-4 rounded bg-tech-cyan/10 border border-tech-cyan/20 p-3 text-xs text-tech-cyan font-mono">
                {judgeMsg}
              </div>
            )}
            {judgeError && (
              <div className="mb-4 rounded bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-500">
                {judgeError}
              </div>
            )}

            <form onSubmit={handleCreateJudge} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Tên Giám Khảo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: TS. Nguyễn Văn A"
                  className="w-full rounded-lg border border-dark-border bg-slate-50 py-2.5 px-4 text-xs text-slate-900 placeholder-slate-400 focus:border-tech-cyan focus:bg-white focus:outline-none focus:ring-1 focus:ring-tech-cyan transition-all"
                  value={judgeName}
                  onChange={(e) => setJudgeName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Email Giám Khảo *
                </label>
                <input
                  type="email"
                  required
                  placeholder="judge.guest@example.com"
                  className="w-full rounded-lg border border-dark-border bg-slate-50 py-2.5 px-4 text-xs text-slate-900 placeholder-slate-400 focus:border-tech-cyan focus:bg-white focus:outline-none focus:ring-1 focus:ring-tech-cyan transition-all"
                  value={judgeEmail}
                  onChange={(e) => setJudgeEmail(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={judgeLoading}
                className="w-full rounded-lg bg-tech-cyan py-2.5 text-xs font-bold text-white hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
              >
                {judgeLoading ? 'Đang khởi tạo...' : 'KÍCH HOẠT TÀI KHOẢN GIÁM KHẢO'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'templates' && (
          <div>
            {loadingTemplates ? (
              <div className="flex justify-center items-center h-48">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-tech-cyan border-t-transparent" />
              </div>
            ) : templates.length === 0 ? (
              <div className="glass-card p-12 text-center rounded-xl max-w-xl mx-auto shadow-sm">
                <FileText size={48} className="mx-auto mb-4 text-slate-400 animate-pulse" />
                <h3 className="text-xs font-semibold text-slate-900 font-mono uppercase mb-1">Chưa có mẫu tiêu chí nào</h3>
                <p className="text-[11px] text-slate-500 mb-6">Mẫu tiêu chí định nghĩa các hạng mục chấm điểm (Score, Weight) được áp dụng khi tạo các vòng thi hackathon.</p>
                <button
                  onClick={() => {
                    const newTemp = {
                      id: crypto.randomUUID(),
                      name: 'Mẫu Đánh Giá Lập Trình Cơ Bản',
                      description: 'Mẫu mặc định gồm kỹ năng code, thiết kế database và demo.',
                      items: [
                        { name: 'Source Code & Clean Code', maxScore: 10, weight: 0.4 },
                        { name: 'Database Structure', maxScore: 10, weight: 0.3 },
                        { name: 'Demo & Presenting', maxScore: 10, weight: 0.3 }
                      ]
                    };
                    const updated = [newTemp];
                    setTemplates(updated);
                    localStorage.setItem('hack_templates', JSON.stringify(updated));
                  }}
                  className="rounded-lg bg-tech-cyan px-5 py-2 text-xs font-semibold text-white hover:opacity-90 active:scale-95 transition-all shadow-sm"
                >
                  KHỞI TẠO MẪU MẶC ĐỊNH
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {templates.map(t => (
                  <div key={t.id} className="glass-card rounded-xl p-6">
                    <h3 className="text-xs font-bold text-slate-900 font-mono mb-2 uppercase">{t.name}</h3>
                    <p className="text-[11px] text-slate-600 mb-4">{t.description}</p>
                    <div className="space-y-2 border-t border-dark-border pt-4">
                      {t.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-slate-700">{item.name}</span>
                          <span className="text-tech-cyan font-semibold">Điểm tối đa: {item.maxScore} (Tỉ trọng: {item.weight * 100}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
