import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Plus, CheckCircle, Warning, GithubLogo, YoutubeLogo, Globe, FileText, ArrowClockwise, Copy, Check, SignOut } from '@phosphor-icons/react';

export const TeamDetail: React.FC = () => {
  const { user } = useAuth();

  const [teamList, setTeamList] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  
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

  const fetchMyTeams = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const myTeams = await api.teams.getMyTeams();
      const list = Array.isArray(myTeams) ? myTeams : [];
      setTeamList(list);
      
      if (list.length > 0) {
        if (!selectedTeamId || !list.find(t => t.id === selectedTeamId)) {
          setSelectedTeamId(list[0].id);
        }
      } else {
        setSelectedTeamId(null);
        setTeam(null);
      }
    } catch (err) {
      console.error('Error fetching my teams:', err);
      setTeamList([]);
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTeams();
  }, [user]);

  // Fetch details when selected team changes
  useEffect(() => {
    const loadTeamDetail = async () => {
      if (!selectedTeamId) {
        setTeam(null);
        return;
      }
      
      const selected = teamList.find(t => t.id === selectedTeamId);
      if (!selected) return;
      
      setTeam(selected);
      setShowSubForm(false);
      setFormMsg(null);
      setFormError(null);

      // Load rounds của event để user chọn khi nộp bài
      if (selected.eventId) {
        try {
          const ev = await api.events.getById(selected.eventId);
          setEventRounds(ev?.rounds || []);
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
        const subs = await api.submissions.getByTeam(selected.id);
        setSubmissions(Array.isArray(subs) ? subs : []);
      } catch {
        setSubmissions([]);
      }
    };

    loadTeamDetail();
  }, [selectedTeamId, teamList]);

  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    if (team?.inviteCode) {
      navigator.clipboard.writeText(team.inviteCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
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
      const msg = err.message || 'Lỗi khi nộp bài thi.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!team) return;
    const isLeader = team.leaderId === user?.id;
    const msg = isLeader && team.members.length === 1 
      ? "Bạn là trưởng nhóm và là thành viên duy nhất. Rời đội sẽ GIẢI TÁN đội thi này. Bạn có chắc chắn?"
      : "Bạn có chắc chắn muốn rời khỏi đội thi này không?";
      
    if (!window.confirm(msg)) return;
    
    try {
      await api.teams.leave(team.id);
      alert('Đã rời đội thành công.');
      fetchMyTeams(); // Reload all teams
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra khi rời đội.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-tech-cyan border-t-transparent" />
      </div>
    );
  }

  if (teamList.length === 0) {
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
            to="/events"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-md"
          >
            Xem danh sách sự kiện →
          </Link>
          <button
            onClick={fetchMyTeams}
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
      <div className="flex flex-col lg:flex-row gap-8">
        {/* SIDEBAR: Danh sách các đội thi */}
        <div className="w-full lg:w-1/3 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 font-mono uppercase">Đội thi của bạn ({teamList.length})</h2>
            <button
              onClick={fetchMyTeams}
              className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 transition-colors"
              title="Làm mới danh sách"
            >
              <ArrowClockwise size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {teamList.map((t) => (
              <div 
                key={t.id} 
                onClick={() => setSelectedTeamId(t.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedTeamId === t.id 
                    ? 'bg-indigo-50 border-indigo-400 shadow-sm' 
                    : 'bg-white border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className="text-[10px] font-mono text-indigo-600 mb-1 uppercase tracking-wider truncate">
                  {t.eventTitle || 'Sự kiện'}
                </div>
                <h3 className="font-bold text-slate-900 uppercase truncate">{t.name}</h3>
                <div className="text-xs text-slate-500 mt-2 flex justify-between items-center">
                  <span>Hạng mục: <span className="font-semibold text-slate-700">{t.categoryName || 'N/A'}</span></span>
                  <span className="flex items-center gap-1"><Users size={12}/> {t.members?.length || 0}</span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <Link
              to="/events"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
            >
              <Plus size={16} /> Tham gia sự kiện khác
            </Link>
          </div>
        </div>

        {/* MAIN CONTENT: Chi tiết đội thi đang chọn */}
        <div className="w-full lg:w-2/3">
          {team ? (
            <>
              {/* Team Info Card */}
              <div className="mb-8 rounded-xl border border-dark-border bg-white p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start gap-6 shadow-sm">
                <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-tech-cyan/5 blur-3xl pointer-events-none" />
                <div className="flex-1 relative z-10">
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
                  <h1 className="text-xl font-extrabold text-slate-900 tracking-tight font-mono mb-2 uppercase">{team.name}</h1>
                  <p className="text-xs text-slate-600 max-w-prose">{team.description || 'Chưa có mô tả chi tiết của đội.'}</p>
                  {team.leaderName && (
                    <p className="text-[11px] text-slate-400 mt-2 font-mono">
                      Trưởng nhóm: <span className="text-slate-600 font-semibold">{team.leaderName}</span>
                    </p>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <button
                      onClick={handleLeaveTeam}
                      className="inline-flex items-center gap-1.5 rounded bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors"
                    >
                      <SignOut size={14} /> 
                      {team.leaderId === user?.id && team.members.length === 1 ? 'Giải tán đội thi' : 'Rời đội thi'}
                    </button>
                  </div>
                </div>

                {/* Invite Code Wrapper */}
                <div className="flex flex-col items-end gap-3 shrink-0 w-full md:w-auto relative z-10">
                  {team.inviteCode && (
                    <div className="rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50 px-5 py-4 font-mono text-center w-full">
                      <span className="block text-[9px] text-indigo-400 uppercase tracking-widest mb-2">MÃ MỜI THÀNH VIÊN</span>
                      <div className="flex flex-col gap-2">
                        <span className="text-xl font-black text-indigo-600 tracking-[0.25em]">{team.inviteCode}</span>
                        <button
                          onClick={handleCopyCode}
                          className={`flex items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all active:scale-95 ${copied ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                            }`}
                          title="Sao chép mã mời"
                        >
                          {copied ? <><Check size={12} /> Đã chép!</> : <><Copy size={12} /> Sao chép</>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-8">
                {/* Members List */}
                <div className="glass-card rounded-xl p-6">
                  <h2 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider border-b border-dark-border pb-4 mb-4 flex items-center gap-2">
                    <Users className="text-tech-cyan" /> Danh sách thành viên ({team.members?.length || 0})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {team.members?.map((m: any, idx: number) => (
                      <div key={m.userId || idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                        <div className="truncate pr-2">
                          <h4 className="text-xs font-semibold text-slate-900 truncate">{m.fullName || 'Thành viên'}</h4>
                          <p className="text-[10px] text-slate-500 font-mono truncate">{m.email || ''}</p>
                        </div>
                        {(m.userId === team.leaderId || m.roleInTeam === 'Leader') && (
                          <span className="shrink-0 rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[9px] font-mono font-bold text-indigo-700 uppercase">
                            Leader
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submissions Section */}
                <div className="glass-card rounded-xl p-6">
                  <div className="flex justify-between items-center border-b border-dark-border pb-4 mb-6">
                    <h2 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider flex items-center gap-2">
                      <GithubLogo className="text-tech-cyan" /> Bài Nộp
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
                    <form onSubmit={handleSubmission} className="space-y-4 mb-8 p-5 rounded-lg bg-slate-50 border border-slate-200 shadow-inner">
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
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition-all"
                          >
                            <option value="">-- Chọn vòng thi --</option>
                            {eventRounds.map((r: any) => (
                              <option key={r.id} value={r.id}>
                                {r.name} {r.submissionDeadline ? `(Hạn: ${new Date(r.submissionDeadline).toLocaleDateString('vi-VN')})` : ''}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">Không tìm thấy vòng thi nào. Vui lòng liên hệ ban tổ chức.</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">GitHub / GitLab URL *</label>
                          <input
                            type="url"
                            required
                            placeholder="https://github.com/..."
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-400 font-mono transition-all"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Demo URL (Tùy chọn)</label>
                          <input
                            type="url"
                            placeholder="https://..."
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-400 font-mono transition-all"
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
                            placeholder="https://youtube.com/..."
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-400 font-mono transition-all"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Ghi chú dự án</label>
                          <input
                            type="text"
                            placeholder="Công nghệ sử dụng..."
                            className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-400 transition-all"
                            value={subDesc}
                            onChange={(e) => setSubDesc(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => { setShowSubForm(false); setFormError(null); }}
                          className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-all"
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
                  <div className="space-y-5">
                    {submissions.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 font-mono border border-dashed border-slate-200 rounded-lg">
                        Chưa có bài nộp nào cho đội thi này.
                      </div>
                    ) : (
                      submissions.map((sub, idx) => (
                        <div key={sub.id} className="p-4 rounded-lg bg-white border border-slate-200 shadow-sm relative overflow-hidden">
                          <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                            <span className="text-[11px] font-bold text-slate-800 font-mono uppercase">
                              LẦN NỘP THỨ #{submissions.length - idx} {sub.roundName && <span className="text-indigo-500 ml-1">({sub.roundName})</span>}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">{new Date(sub.submittedAt).toLocaleString('vi-VN')}</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] mb-3">
                            <a href={sub.repoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-indigo-600 hover:underline font-mono">
                              <GithubLogo size={14} /> Repository
                            </a>
                            {sub.demoUrl && (
                              <a href={sub.demoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-indigo-600 hover:underline font-mono">
                                <Globe size={14} /> Live Demo
                              </a>
                            )}
                            {sub.videoUrl && (
                              <a href={sub.videoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-indigo-600 hover:underline font-mono">
                                <YoutubeLogo size={14} /> Video
                              </a>
                            )}
                          </div>

                          {sub.description && (
                            <div className="text-[11px] text-slate-600 bg-slate-50 rounded p-2.5 mb-3 flex items-start gap-2">
                              <FileText size={14} className="text-slate-400 shrink-0 mt-0.5" />
                              <p>{sub.description}</p>
                            </div>
                          )}

                          {/* Git Metadata Block */}
                          {sub.repoDescription && (
                            <div className="border-t border-slate-100 pt-3 mt-1">
                              <span className="block text-[9px] font-mono uppercase tracking-widest text-slate-400 mb-1.5">GitHub API metadata</span>
                              <div className="rounded bg-slate-50 p-3 text-[10px] font-mono space-y-1.5">
                                <div className="flex justify-between text-slate-600">
                                  <span>Language:</span>
                                  <span className="text-slate-800 font-semibold">{sub.repoPrimaryLanguage} · ★ {sub.repoStars}</span>
                                </div>
                                <div className="text-slate-500 truncate" title={sub.repoDescription}>
                                  {sub.repoDescription}
                                </div>
                                <div className="border-t border-slate-200/60 pt-1.5 flex justify-between text-slate-500">
                                  <span>Last commit:</span>
                                  <span className="text-indigo-600 font-semibold truncate max-w-[60%] text-right" title={sub.repoLastCommitMessage}>
                                    "{sub.repoLastCommitMessage}"
                                  </span>
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
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Users size={32} className="text-slate-300 mb-3" />
              <p className="text-sm text-slate-500 font-medium">Chọn một đội thi ở danh sách bên trái để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
