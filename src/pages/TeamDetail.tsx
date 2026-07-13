import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Clipboard, Plus, CheckCircle, Warning, GithubLogo, YoutubeLogo, Globe, FileText, ArrowClockwise, Copy, Check } from '@phosphor-icons/react';

export const TeamDetail: React.FC = () => {
  const { user } = useAuth();

  const [team, setTeam] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventRounds, setEventRounds] = useState<any[]>([]);

  // Submission Form State
  const [showSubForm, setShowSubForm] = useState(false);
  const [selectedRoundId, setSelectedRoundId] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [subDesc, setSubDesc] = useState('');

  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchTeamAndSubmissions = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const myTeams = await api.teams.getMyTeams();
      const teamList = Array.isArray(myTeams) ? myTeams : [];

      if (teamList.length > 0) {
        const firstTeam = teamList[0];
        setTeam(firstTeam);

        // Load rounds của event để user chọn khi nộp bài
        if (firstTeam.eventId) {
          try {
            const ev = await api.events.getById(firstTeam.eventId);
            setEventRounds(ev?.rounds || []);
            // Tự chọn round đang active (status = 'active' hoặc round đầu tiên chưa hết deadline)
            const now = new Date();
            const activeRound = (ev?.rounds || []).find((r: any) =>
              r.status === 'active' || (r.submissionDeadline && new Date(r.submissionDeadline) > now)
            );
            if (activeRound) setSelectedRoundId(activeRound.id);
          } catch {
            setEventRounds([]);
          }
        }

        try {
          const subs = await api.submissions.getByTeam(firstTeam.id);
          setSubmissions(Array.isArray(subs) ? subs : []);
        } catch {
          setSubmissions([]);
        }
      } else {
        setTeam(null);
      }
    } catch (err) {
      console.error('Error fetching my teams:', err);
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamAndSubmissions();
  }, [user]);


  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (team?.inviteCode) {
      navigator.clipboard.writeText(team.inviteCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        // fallback nếu clipboard API bị block
        const el = document.createElement('textarea');
        el.value = team.inviteCode;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const handleSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !repoUrl) return;

    if (!selectedRoundId) {
      setFormError('Vui lòng chọn vòng thi để nộp bài.');
      return;
    }

    setSubmitting(true);
    setFormMsg(null);
    setFormError(null);

    try {
      await api.submissions.submit({
        roundId: selectedRoundId,
        repoUrl,
        demoUrl: demoUrl || undefined,
        videoUrl: videoUrl || undefined,
        description: subDesc || undefined
      });
      setFormMsg('Nộp bài thi thành công! Hệ thống đã ghi nhận liên kết và siêu dữ liệu git.');
      setRepoUrl('');
      setDemoUrl('');
      setVideoUrl('');
      setSubDesc('');
      setShowSubForm(false);
      // Reload submissions
      const data = await api.submissions.getByTeam(team.id);
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      // Hiển thị lỗi từ BE (tiếng Việt)
      const msg = err.message || 'Lỗi khi nộp bài thi.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-tech-cyan border-t-transparent" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 mb-6">
          <Users size={40} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 font-mono uppercase mb-3">BẠN CHƯA THAM GIA ĐỘI THI NÀO</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
          Vào chi tiết một cuộc thi đang diễn ra để lập đội hoặc nhập mã mời từ nhóm của bạn.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-md"
          >
            Xem danh sách sự kiện →
          </Link>
          <button
            onClick={fetchTeamAndSubmissions}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:border-indigo-400 hover:text-indigo-600 active:scale-95 transition-all"
          >
            <ArrowClockwise size={16} /> Làm mới
          </button>
        </div>
        {/* Debug hint */}
        <p className="mt-8 text-[10px] text-slate-300 font-mono">
          Nếu bạn vừa tạo đội, hãy nhấn "Làm mới" hoặc reload trang.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Team Info Card */}
      <div className="mb-10 rounded-xl border border-dark-border bg-white p-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-start gap-6 shadow-sm">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-tech-cyan/5 blur-3xl" />
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            {team.eventTitle && (
              <span className="inline-block rounded bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[9px] font-mono font-bold text-slate-600 uppercase tracking-widest">
                {team.eventTitle}
              </span>
            )}
            <span className="inline-block rounded bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-widest">
              {team.categoryName || 'Hạng mục'}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight font-mono mb-2 uppercase">{team.name}</h1>
          <p className="text-xs text-slate-600 max-w-[70ch]">{team.description || 'Chưa có mô tả chi tiết của đội.'}</p>
          {team.leaderName && (
            <p className="text-[11px] text-slate-400 mt-1 font-mono">
              Trưởng nhóm: <span className="text-slate-600 font-semibold">{team.leaderName}</span>
            </p>
          )}
        </div>

        {/* Invite Code + Refresh Wrapper */}
        <div className="flex flex-col items-end gap-3 shrink-0">
          {team.inviteCode && (
            <div className="rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50 px-6 py-4 font-mono text-center w-full md:w-auto">
              <span className="block text-[9px] text-indigo-400 uppercase tracking-widest mb-2">MÃ MỜI THÀNH VIÊN</span>
              <div className="flex items-center justify-center gap-3">
                <span className="text-xl font-black text-indigo-600 tracking-[0.25em]">{team.inviteCode}</span>
                <button
                  onClick={handleCopyCode}
                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-all active:scale-95 ${copied ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                    }`}
                  title="Sao chép mã mời"
                >
                  {copied ? <><Check size={12} /> Đã sao chép!</> : <><Copy size={12} /> Sao chép</>}
                </button>
              </div>
            </div>
          )}
          <button
            onClick={fetchTeamAndSubmissions}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] text-slate-500 hover:text-indigo-600 hover:border-indigo-300 transition-all active:scale-95"
          >
            <ArrowClockwise size={13} /> Làm mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Members List */}
        <div className="glass-card rounded-xl p-6 flex flex-col justify-between h-fit">
          <div>
            <h2 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider border-b border-dark-border pb-4 mb-4 flex items-center gap-2">
              <Users className="text-tech-cyan" /> Danh sách thành viên ({team.members.length})
            </h2>
            <div className="space-y-4">
              {team.members.map((m: any, idx: number) => (
                <div key={m.userId || idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">{m.fullName || 'Thành viên'}</h4>
                    <p className="text-[10px] text-slate-500 font-mono">{m.email || ''}</p>
                  </div>
                  {(m.userId === team.leaderId || m.roleInTeam === 'Leader') && (
                    <span className="rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[9px] font-mono font-bold text-indigo-700 uppercase">
                      Trưởng Nhóm
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submissions Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-card rounded-xl p-6">
            <div className="flex justify-between items-center border-b border-dark-border pb-4 mb-6">
              <h2 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider flex items-center gap-2">
                <GithubLogo className="text-tech-cyan" /> nộp bài vòng hiện tại
              </h2>
              {!showSubForm && (
                <button
                  onClick={() => setShowSubForm(true)}
                  className="flex items-center gap-1.5 rounded bg-tech-cyan px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 active:scale-95 transition-all"
                >
                  <Plus size={14} /> NỘP BÀI THI
                </button>
              )}
            </div>

            {formMsg && (
              <div className="mb-4 rounded-lg bg-tech-cyan/10 border border-tech-cyan/20 p-4 text-xs text-tech-cyan flex items-center gap-2">
                <CheckCircle size={18} className="shrink-0" />
                <span>{formMsg}</span>
              </div>
            )}
            {formError && (
              <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 p-4 text-xs text-rose-500 flex items-center gap-2">
                <Warning size={18} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {showSubForm && (
              <form onSubmit={handleSubmission} className="space-y-4 mb-6 p-6 rounded-lg bg-slate-50 border border-slate-200 shadow-inner">
                {/* Cảnh báo team chưa đủ thành viên */}
                {team.members?.length < 3 && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 flex items-start gap-2 text-xs text-amber-700">
                    <Warning size={16} className="shrink-0 mt-0.5" />
                    <span>
                      <strong>Lưu ý:</strong> Đội bạn hiện có <strong>{team.members?.length}</strong> thành viên.
                      Quy định cần tối thiểu <strong>3 thành viên</strong> để nộp bài.
                      Hãy mời thêm thành viên bằng invite code trước khi nộp.
                    </span>
                  </div>
                )}

                {/* Chọn vòng thi */}
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Vòng thi *
                  </label>
                  {eventRounds.length > 0 ? (
                    <select
                      required
                      value={selectedRoundId}
                      onChange={(e) => setSelectedRoundId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                    >
                      <option value="">-- Chọn vòng thi --</option>
                      {eventRounds.map((r: any) => (
                        <option key={r.id} value={r.id}>
                          {r.name} {r.submissionDeadline ? `(Hạn: ${new Date(r.submissionDeadline).toLocaleDateString('vi-VN')})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Không tìm thấy vòng thi nào. Vui lòng liên hệ ban tổ chức.</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">GitHub / GitLab URL *</label>
                    <input
                      type="url"
                      required
                      placeholder="https://github.com/username/project"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-400 font-mono transition-all"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Demo URL (Tùy chọn)</label>
                    <input
                      type="url"
                      placeholder="https://my-demo-app.vercel.app"
                      className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-400 font-mono transition-all"
                      value={demoUrl}
                      onChange={(e) => setDemoUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Demo Video Link (Tùy chọn)</label>
                    <input
                      type="url"
                      placeholder="https://youtube.com/watch?v=..."
                      className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-400 font-mono transition-all"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Ghi chú dự án</label>
                    <input
                      type="text"
                      placeholder="Công nghệ sử dụng, kiến trúc..."
                      className="w-full rounded-lg border border-slate-200 bg-white py-2.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-400 transition-all"
                      value={subDesc}
                      onChange={(e) => setSubDesc(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowSubForm(false); setFormError(null); }}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all"
                  >
                    HỦY
                  </button>
                  <button

                    type="submit"
                    disabled={submitting}
                    className="rounded bg-tech-cyan px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? 'Đang gửi...' : 'NỘP BÀI'}
                  </button>
                </div>
              </form>
            )}

            {/* Submissions List */}
            <div className="space-y-6">
              {submissions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 font-mono">
                  Chưa có bài nộp nào cho đội thi này.
                </div>
              ) : (
                submissions.map((sub, idx) => (
                  <div key={sub.id} className="p-5 rounded-lg bg-slate-50 border border-dark-border/60 relative overflow-hidden">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-slate-900 font-mono uppercase">LẦN NỘP THỨ #{submissions.length - idx}</span>
                      <span className="text-[10px] font-mono text-slate-500">{new Date(sub.submittedAt).toLocaleString('vi-VN')}</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-4">
                      <a
                        href={sub.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-tech-cyan hover:underline font-mono"
                      >
                        <GithubLogo size={14} /> Repository link
                      </a>
                      {sub.demoUrl && (
                        <a
                          href={sub.demoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-tech-cyan hover:underline font-mono"
                        >
                          <Globe size={14} /> Live website
                        </a>
                      )}
                      {sub.videoUrl && (
                        <a
                          href={sub.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-tech-cyan hover:underline font-mono"
                        >
                          <YoutubeLogo size={14} /> Demo video
                        </a>
                      )}
                    </div>

                    {sub.description && (
                      <div className="text-xs text-slate-600 bg-white border border-dark-border rounded p-3 mb-4 flex items-start gap-2 shadow-sm">
                        <FileText size={16} className="text-slate-400 shrink-0 mt-0.5" />
                        <p>{sub.description}</p>
                      </div>
                    )}

                    {/* Git Metadata Block */}
                    {sub.repoDescription && (
                      <div className="border-t border-dark-border/60 pt-4 mt-2">
                        <span className="block text-[9px] font-mono uppercase tracking-widest text-slate-500 mb-2">GitHub API metadata</span>
                        <div className="rounded bg-white border border-dark-border p-4 text-[10px] font-mono space-y-2 shadow-inner">
                          <div className="flex justify-between text-slate-700">
                            <span>Repository Info:</span>
                            <span className="text-slate-900 font-semibold">{sub.repoPrimaryLanguage} · ★ {sub.repoStars}</span>
                          </div>
                          <div className="text-slate-500">
                            {sub.repoDescription}
                          </div>
                          <div className="border-t border-dark-border/40 pt-2 flex justify-between text-slate-500">
                            <span>Last commit message:</span>
                            <span className="text-tech-cyan font-semibold">"{sub.repoLastCommitMessage}"</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
