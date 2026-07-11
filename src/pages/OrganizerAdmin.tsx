import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  UserCheck, UserPlus, FileText, Check, X, Shield,
  Warning, Users, Trophy, ClockCountdown, MagnifyingGlass,
  Funnel, CheckCircle, XCircle
} from '@phosphor-icons/react';

export const OrganizerAdmin: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'approvals' | 'judge' | 'templates' | 'users' | 'awards' | 'auditlogs'>('approvals');

  // Tab 1: Approvals
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(true);
  const [approvalError, setApprovalError] = useState<string | null>(null);

  // Tab 2: Create Guest Judge
  const [judgeEmail, setJudgeEmail] = useState('');
  const [judgeName, setJudgeName] = useState('');
  const [judgeLoading, setJudgeLoading] = useState(false);
  const [judgeMsg, setJudgeMsg] = useState<string | null>(null);
  const [judgeError, setJudgeError] = useState<string | null>(null);

  // Tab 3: Criteria Templates
  const [templates, setTemplates] = useState<any[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Tab 4: Users Management
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');

  // Tab 5: Awards
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [grantedAwards, setGrantedAwards] = useState<any[]>([]);
  const [loadingAwards, setLoadingAwards] = useState(false);
  const [awardNote, setAwardNote] = useState<Record<string, string>>({});
  const [grantingId, setGrantingId] = useState<string | null>(null);

  // Tab 6: Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logActionFilter, setLogActionFilter] = useState('');
  const [logTargetFilter, setLogTargetFilter] = useState('');

  // ── Loaders ──────────────────────────────────────────────────────────────
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
      const saved = localStorage.getItem('hack_templates') || '[]';
      setTemplates(JSON.parse(saved));
    } catch { } finally { setLoadingTemplates(false); }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await api.users.getAll({ status: userStatusFilter || undefined, role: userRoleFilter || undefined });
      setAllUsers(res.items || []);
    } catch (err: any) {
      console.error(err);
    } finally { setLoadingUsers(false); }
  };

  const fetchAwards = async (evId: string) => {
    if (!evId) return;
    setLoadingAwards(true);
    try {
      const [sugg, granted] = await Promise.all([
        api.awards.getSuggestions(evId),
        api.awards.getByEvent(evId)
      ]);
      setSuggestions(sugg);
      setGrantedAwards(granted);
    } catch { } finally { setLoadingAwards(false); }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await api.auditLogs.getAll({ action: logActionFilter || undefined, targetType: logTargetFilter || undefined });
      setAuditLogs(res.items || []);
    } catch { } finally { setLoadingLogs(false); }
  };

  const fetchEvents = async () => {
    try { const evs = await api.events.getAll(); setEvents(evs); } catch { }
  };

  useEffect(() => {
    if (activeTab === 'approvals') fetchPendingUsers();
    if (activeTab === 'templates') fetchTemplates();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'awards') fetchEvents();
    if (activeTab === 'auditlogs') fetchLogs();
  }, [activeTab]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleReview = async (userId: string, approve: boolean) => {
    try {
      await api.auth.reviewPending({ userId, approve });
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
    } catch (err: any) { alert(err.message || 'Lỗi khi phê duyệt tài khoản.'); }
  };

  const handleCreateJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!judgeEmail || !judgeName) return;
    setJudgeLoading(true); setJudgeError(null); setJudgeMsg(null);
    try {
      const res = await api.auth.createJudge({ email: judgeEmail, fullName: judgeName });
      setJudgeMsg(res.message || 'Tạo tài khoản giám khảo thành công.');
      setJudgeEmail(''); setJudgeName('');
    } catch (err: any) { setJudgeError(err.message || 'Lỗi khi tạo tài khoản giám khảo.'); }
    finally { setJudgeLoading(false); }
  };

  const handleGrantAward = async (teamId: string, teamName: string, awardName: string) => {
    setGrantingId(teamId);
    try {
      await api.awards.grant({ eventId: selectedEventId, teamId, teamName, awardName, note: awardNote[teamId] || '' });
      await fetchAwards(selectedEventId);
    } catch (err: any) { alert(err.message || 'Lỗi khi trao giải.'); }
    finally { setGrantingId(null); }
  };

  const ROLE_LABELS: Record<string, string> = {
    organizer: 'Ban Tổ Chức', judge_internal: 'Giám khảo nội bộ',
    judge_guest: 'Giám khảo khách', mentor: 'Cố vấn',
    student_fpt: 'Sinh viên FPT', student_external: 'Sinh viên ngoài'
  };

  const LOG_ACTION_COLORS: Record<string, string> = {
    ScoreSubmitted: 'bg-blue-50 text-blue-700 border-blue-200',
    ScoreUpdated: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    RoundResultFinalized: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    TeamDisqualified: 'bg-rose-50 text-rose-700 border-rose-200',
    AwardGranted: 'bg-amber-50 text-amber-700 border-amber-200',
  };

  const tabs = [
    { key: 'approvals', label: `Duyệt TK (${pendingUsers.length})`, icon: <UserCheck size={15} /> },
    { key: 'judge', label: 'Tạo Giám Khảo', icon: <UserPlus size={15} /> },
    { key: 'users', label: 'Người Dùng', icon: <Users size={15} /> },
    { key: 'awards', label: 'Giải Thưởng', icon: <Trophy size={15} /> },
    { key: 'auditlogs', label: 'Nhật Ký', icon: <ClockCountdown size={15} /> },
    { key: 'templates', label: 'Mẫu Tiêu Chí', icon: <FileText size={15} /> },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 border-b border-slate-200">
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 font-mono tracking-wide mb-6 uppercase flex items-center gap-2">
          <Shield className="text-tech-cyan" /> HỆ THỐNG QUẢN TRỊ BAN TỔ CHỨC
        </h1>
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`shrink-0 pb-3 px-3 flex items-center gap-1.5 border-b-2 text-xs font-mono font-semibold uppercase tracking-wider transition-all ${
                activeTab === tab.key
                  ? 'border-tech-cyan text-tech-cyan'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[50vh]">

        {/* ── TAB: APPROVALS ────────────────────────────────────────────── */}
        {activeTab === 'approvals' && (
          <div>
            {approvalError && (
              <div className="mb-4 flex gap-2 rounded-lg border border-rose-300 bg-rose-50 p-3 text-xs text-rose-600">
                <Warning size={16} /><span>{approvalError}</span>
              </div>
            )}
            {loadingApprovals ? (
              <div className="flex justify-center items-center h-48">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-tech-cyan border-t-transparent" />
              </div>
            ) : pendingUsers.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <CheckCircle size={48} className="mx-auto mb-4 text-emerald-400" weight="fill" />
                <h3 className="text-xs font-semibold text-slate-700 font-mono uppercase mb-1">Không có yêu cầu chờ duyệt</h3>
                <p className="text-[11px] text-slate-500">Tất cả tài khoản đã được xử lý.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 font-mono font-semibold uppercase tracking-wider text-slate-500">
                      <th className="p-4">Họ và tên</th><th className="p-4">Email</th>
                      <th className="p-4">MSSV</th><th className="p-4">Đối tượng</th>
                      <th className="p-4">Trường</th><th className="p-4 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {pendingUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="p-4 font-semibold text-slate-900">{u.fullName}</td>
                        <td className="p-4 font-mono">{u.email}</td>
                        <td className="p-4 font-mono">{u.studentCode}</td>
                        <td className="p-4">
                          <span className="rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[9px] font-mono font-bold text-indigo-700">
                            {u.isFptStudent ? 'Sinh Viên FPT' : 'Ngoài Trường'}
                          </span>
                        </td>
                        <td className="p-4">{u.universityName || 'Đại học FPT'}</td>
                        <td className="p-4 text-right">
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => handleReview(u.id, true)}
                              className="rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 p-1.5 text-emerald-600 transition-all active:scale-95" title="Phê duyệt">
                              <Check size={15} />
                            </button>
                            <button onClick={() => handleReview(u.id, false)}
                              className="rounded bg-rose-50 hover:bg-rose-100 border border-rose-200 p-1.5 text-rose-500 transition-all active:scale-95" title="Từ chối">
                              <X size={15} />
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

        {/* ── TAB: CREATE JUDGE ─────────────────────────────────────────── */}
        {activeTab === 'judge' && (
          <div className="max-w-md mx-auto rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider font-mono mb-2 flex items-center gap-2">
              <UserPlus className="text-tech-cyan" /> Tạo tài khoản giám khảo khách mời
            </h2>
            <p className="text-[11px] text-slate-500 mb-6 leading-relaxed">
              Tài khoản giám khảo khách mời được kích hoạt ngay lập tức, cho phép chuyên gia bên ngoài chấm điểm bài thi.
            </p>
            {judgeMsg && <div className="mb-4 rounded bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 font-mono">{judgeMsg}</div>}
            {judgeError && <div className="mb-4 rounded bg-rose-50 border border-rose-200 p-3 text-xs text-rose-600">{judgeError}</div>}
            <form onSubmit={handleCreateJudge} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Tên Giám Khảo *</label>
                <input type="text" required placeholder="TS. Nguyễn Văn A"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-all"
                  value={judgeName} onChange={e => setJudgeName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Email *</label>
                <input type="email" required placeholder="judge.guest@example.com"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 px-4 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-all"
                  value={judgeEmail} onChange={e => setJudgeEmail(e.target.value)} />
              </div>
              <button type="submit" disabled={judgeLoading}
                className="w-full rounded-lg bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 mt-2">
                {judgeLoading ? 'Đang khởi tạo...' : 'KÍCH HOẠT TÀI KHOẢN GIÁM KHẢO'}
              </button>
            </form>
          </div>
        )}

        {/* ── TAB: USERS ───────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div>
            {/* Filters */}
            <div className="mb-4 flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-[10px] font-mono font-semibold uppercase text-slate-500 mb-1.5">Vai trò</label>
                <select value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none">
                  <option value="">Tất cả</option>
                  {Object.entries(ROLE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-semibold uppercase text-slate-500 mb-1.5">Trạng thái</label>
                <select value={userStatusFilter} onChange={e => setUserStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none">
                  <option value="">Tất cả</option>
                  <option value="approved">Đã duyệt</option>
                  <option value="pending_approval">Chờ duyệt</option>
                  <option value="rejected">Từ chối</option>
                </select>
              </div>
              <button onClick={fetchUsers}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 transition-all">
                <Funnel size={14} /> Lọc
              </button>
            </div>

            {loadingUsers ? (
              <div className="flex justify-center items-center h-40">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-slate-300 font-mono font-semibold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Họ và tên</th><th className="p-4">Email</th>
                      <th className="p-4">Vai trò</th><th className="p-4">Trạng thái</th>
                      <th className="p-4">Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allUsers.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-slate-400">Không có dữ liệu.</td></tr>
                    ) : allUsers.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="p-4 font-semibold text-slate-800">{u.fullName}</td>
                        <td className="p-4 font-mono text-slate-600">{u.email}</td>
                        <td className="p-4">
                          <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[9px] font-bold text-indigo-700">
                            {ROLE_LABELS[u.role] || u.role}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold border ${
                            u.status === 'approved' ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : u.status === 'pending_approval' ? 'bg-amber-50 border-amber-200 text-amber-700'
                              : 'bg-rose-50 border-rose-200 text-rose-600'
                          }`}>
                            {u.status === 'approved' ? 'Đã duyệt' : u.status === 'pending_approval' ? 'Chờ duyệt' : u.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 font-mono">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: AWARDS ──────────────────────────────────────────────── */}
        {activeTab === 'awards' && (
          <div>
            {/* Event selector */}
            <div className="mb-6 flex items-end gap-3">
              <div className="flex-1 max-w-sm">
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1.5">Chọn sự kiện</label>
                <select
                  value={selectedEventId}
                  onChange={e => { setSelectedEventId(e.target.value); fetchAwards(e.target.value); }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-amber-400 focus:outline-none"
                >
                  <option value="">-- Chọn sự kiện --</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                </select>
              </div>
            </div>

            {!selectedEventId ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
                <Trophy size={48} className="mx-auto mb-3 text-slate-200" weight="fill" />
                <p className="text-sm text-slate-400">Vui lòng chọn sự kiện để xem gợi ý giải thưởng.</p>
              </div>
            ) : loadingAwards ? (
              <div className="flex justify-center items-center h-40">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Suggestions */}
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase text-slate-700 mb-3 flex items-center gap-2">
                    <Trophy size={14} className="text-amber-400" weight="fill" /> Gợi ý trao giải (dựa trên xếp hạng)
                  </h3>
                  <div className="space-y-3">
                    {suggestions.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-8">Chưa có dữ liệu xếp hạng.</p>
                    ) : suggestions.map(s => (
                      <div key={s.teamId} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-bold text-slate-800">{s.teamName}</p>
                            <p className="text-[11px] text-slate-500">{s.categoryName} · <span className="font-mono text-amber-600 font-bold">{s.totalScore} điểm</span></p>
                          </div>
                          <span className="rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-bold text-white">{s.suggestedAward}</span>
                        </div>
                        <input
                          type="text"
                          placeholder="Ghi chú trao giải (tuỳ chọn)"
                          value={awardNote[s.teamId] || ''}
                          onChange={e => setAwardNote(prev => ({ ...prev, [s.teamId]: e.target.value }))}
                          className="w-full rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs text-slate-700 placeholder-slate-300 focus:outline-none focus:border-amber-400 mb-2"
                        />
                        <button
                          onClick={() => handleGrantAward(s.teamId, s.teamName, s.suggestedAward)}
                          disabled={grantingId === s.teamId}
                          className="w-full rounded-lg bg-amber-500 py-1.5 text-[11px] font-bold text-white hover:bg-amber-600 active:scale-95 transition-all disabled:opacity-50"
                        >
                          {grantingId === s.teamId ? 'Đang trao...' : `TRAO ${s.suggestedAward.toUpperCase()}`}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Granted Awards */}
                <div>
                  <h3 className="text-xs font-bold font-mono uppercase text-slate-700 mb-3 flex items-center gap-2">
                    <CheckCircle size={14} className="text-emerald-500" weight="fill" /> Giải đã trao ({grantedAwards.length})
                  </h3>
                  {grantedAwards.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-400">
                      Chưa có giải thưởng nào được trao.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {grantedAwards.map(a => (
                        <div key={a.id} className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-slate-800">{a.teamName}</p>
                            <p className="text-[11px] text-slate-500">{a.awardName}{a.note && ` · ${a.note}`}</p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {a.grantedAt ? new Date(a.grantedAt).toLocaleDateString('vi-VN') : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: AUDIT LOGS ──────────────────────────────────────────── */}
        {activeTab === 'auditlogs' && (
          <div>
            {/* Filters */}
            <div className="mb-4 flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1.5">Hành động</label>
                <select value={logActionFilter} onChange={e => setLogActionFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none">
                  <option value="">Tất cả</option>
                  <option value="ScoreSubmitted">ScoreSubmitted</option>
                  <option value="ScoreUpdated">ScoreUpdated</option>
                  <option value="RoundResultFinalized">RoundResultFinalized</option>
                  <option value="TeamDisqualified">TeamDisqualified</option>
                  <option value="AwardGranted">AwardGranted</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-500 mb-1.5">Loại đối tượng</label>
                <select value={logTargetFilter} onChange={e => setLogTargetFilter(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:border-indigo-400 focus:outline-none">
                  <option value="">Tất cả</option>
                  <option value="submission">Submission</option>
                  <option value="round">Round</option>
                  <option value="team">Team</option>
                </select>
              </div>
              <button onClick={fetchLogs}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 transition-all">
                <MagnifyingGlass size={14} /> Tìm kiếm
              </button>
            </div>

            {loadingLogs ? (
              <div className="flex justify-center items-center h-40">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
                <ClockCountdown size={48} className="mx-auto mb-3 text-slate-200" />
                <p className="text-sm text-slate-400">Không có nhật ký nào.</p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-slate-300 font-mono font-semibold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Hành động</th><th className="p-4">Thực hiện bởi</th>
                      <th className="p-4">Loại đối tượng</th><th className="p-4">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="p-4">
                          <span className={`rounded border px-2 py-0.5 text-[9px] font-mono font-bold ${LOG_ACTION_COLORS[log.action] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 text-slate-700 font-semibold">{log.performedByName || '—'}</td>
                        <td className="p-4 font-mono text-slate-500">{log.targetType || '—'}</td>
                        <td className="p-4 font-mono text-slate-400">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: TEMPLATES ───────────────────────────────────────────── */}
        {activeTab === 'templates' && (
          <div>
            {loadingTemplates ? (
              <div className="flex justify-center items-center h-48">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              </div>
            ) : templates.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center max-w-xl mx-auto">
                <FileText size={48} className="mx-auto mb-4 text-slate-300" />
                <h3 className="text-xs font-semibold text-slate-700 font-mono uppercase mb-1">Chưa có mẫu tiêu chí nào</h3>
                <p className="text-[11px] text-slate-500 mb-6">Mẫu tiêu chí định nghĩa các hạng mục chấm điểm.</p>
                <button
                  onClick={() => {
                    const t = [{ id: crypto.randomUUID(), name: 'Mẫu Đánh Giá Lập Trình Cơ Bản', description: 'Mẫu mặc định gồm kỹ năng code, database và demo.',
                      items: [{ name: 'Source Code & Clean Code', maxScore: 10, weight: 0.4 }, { name: 'Database Structure', maxScore: 10, weight: 0.3 }, { name: 'Demo & Presenting', maxScore: 10, weight: 0.3 }] }];
                    setTemplates(t); localStorage.setItem('hack_templates', JSON.stringify(t));
                  }}
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 transition-all">
                  KHỞI TẠO MẪU MẶC ĐỊNH
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {templates.map(t => (
                  <div key={t.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-xs font-bold text-slate-900 font-mono mb-2 uppercase">{t.name}</h3>
                    <p className="text-[11px] text-slate-600 mb-4">{t.description}</p>
                    <div className="space-y-2 border-t border-slate-100 pt-4">
                      {t.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-slate-700">{item.name}</span>
                          <span className="text-indigo-600 font-semibold">Max: {item.maxScore} · {item.weight * 100}%</span>
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
