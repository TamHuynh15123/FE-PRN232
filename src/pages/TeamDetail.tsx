import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, Clipboard, Plus, CheckCircle, Warning, GithubLogo, YoutubeLogo, Globe, FileText } from '@phosphor-icons/react';

export const TeamDetail: React.FC = () => {
  const { user } = useAuth();
  
  const [team, setTeam] = useState<any | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Submission Form State
  const [showSubForm, setShowSubForm] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [subDesc, setSubDesc] = useState('');
  
  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchTeamAndSubmissions = async () => {
    if (!user) return;
    try {
      const savedTeams = JSON.parse(localStorage.getItem('hack_teams') || '[]');
      const userTeam = savedTeams.find((t: any) => t.members.some((m: any) => m.userId === user.id));
      
      if (userTeam) {
        // Populate members
        const savedUsers = JSON.parse(localStorage.getItem('hack_users') || '[]');
        const populatedMembers = userTeam.members.map((m: any) => {
          const u = savedUsers.find((usr: any) => usr.id === m.userId);
          return { ...m, fullName: u?.fullName || 'Thành viên', email: u?.email || '' };
        });
        
        const populatedTeam = { ...userTeam, members: populatedMembers };
        setTeam(populatedTeam);

        // Fetch submissions
        const data = await api.submissions.getByTeam(userTeam.id);
        setSubmissions(data);
      }
    } catch (err) {
      console.error('Error fetching team:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamAndSubmissions();
  }, [user]);

  const handleCopyCode = () => {
    if (team?.inviteCode) {
      navigator.clipboard.writeText(team.inviteCode);
      alert('Đã sao chép mã mời vào bộ nhớ tạm!');
    }
  };

  const handleSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team || !repoUrl) return;

    setSubmitting(true);
    setFormMsg(null);
    setFormError(null);

    try {
      // Hardcode active round for mock testing (Round 2: Sơ loại sản phẩm)
      await api.submissions.submit({
        teamId: team.id,
        roundId: 'r2',
        repoUrl,
        demoUrl,
        videoUrl,
        description: subDesc
      });
      setFormMsg('Nộp bài thi thành công! Hệ thống đã ghi nhận liên kết và siêu dữ liệu git.');
      setRepoUrl('');
      setDemoUrl('');
      setVideoUrl('');
      setSubDesc('');
      setShowSubForm(false);
      
      // Reload submissions
      const data = await api.submissions.getByTeam(team.id);
      setSubmissions(data);
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi nộp bài thi.');
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
      <div className="mx-auto max-w-7xl px-6 py-12 text-center text-slate-500">
        <Users size={48} className="mx-auto mb-4 text-slate-400 animate-pulse" />
        <h3 className="text-xs font-bold text-slate-900 font-mono uppercase mb-2">BẠN CHƯA THAM GIA ĐỘI THI NÀO</h3>
        <p className="text-xs text-slate-500 max-w-[50ch] mx-auto mb-6">
          Vui lòng bấm vào chi tiết một cuộc thi đang diễn ra để đăng ký lập đội hoặc nhập mã mời từ nhóm của bạn.
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
          <span className="inline-block rounded bg-tech-cyan/10 border border-tech-cyan/35 px-2.5 py-0.5 text-[9px] font-mono font-bold text-tech-cyan uppercase tracking-widest mb-3">
            Hạng mục: {team.categoryId ? 'Phát triển sản phẩm' : 'Chung'}
          </span>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight font-mono mb-2 uppercase">{team.name}</h1>
          <p className="text-xs text-slate-600 max-w-[70ch]">{team.description || 'Chưa có mô tả chi tiết của đội.'}</p>
        </div>

        {/* Invite Code Wrapper */}
        <div className="rounded-lg border border-dark-border bg-slate-50 p-4 shrink-0 font-mono text-center w-full md:w-auto">
          <span className="block text-[9px] text-slate-500 uppercase tracking-wider mb-1">MÃ MỜI THÀNH VIÊN</span>
          <div className="flex items-center justify-center gap-3">
            <span className="text-sm font-bold text-tech-cyan tracking-widest">{team.inviteCode}</span>
            <button
              onClick={handleCopyCode}
              className="text-slate-400 hover:text-slate-900 p-1 hover:bg-slate-100 rounded transition-all"
              title="Sao chép mã"
            >
              <Clipboard size={16} />
            </button>
          </div>
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
                <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-dark-border/60 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">{m.fullName}</h4>
                    <p className="text-[10px] text-slate-500 font-mono">{m.email}</p>
                  </div>
                  {m.userId === team.leaderId && (
                    <span className="rounded bg-tech-cyan/10 border border-tech-cyan/35 px-2 py-0.5 text-[9px] font-mono font-bold text-tech-cyan uppercase">
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
              <form onSubmit={handleSubmission} className="space-y-4 mb-6 p-6 rounded-lg bg-slate-50 border border-dark-border shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">GitHub / GitLab URL *</label>
                    <input
                      type="url"
                      required
                      placeholder="https://github.com/username/project"
                      className="w-full rounded bg-white border border-dark-border py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-tech-cyan font-mono"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Demo URL (Tùy chọn)</label>
                    <input
                      type="url"
                      placeholder="https://my-demo-app.vercel.app"
                      className="w-full rounded bg-white border border-dark-border py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-tech-cyan font-mono"
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
                      className="w-full rounded bg-white border border-dark-border py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-tech-cyan font-mono"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Ghi chú dự án</label>
                    <input
                      type="text"
                      placeholder="Công nghệ sử dụng, kiến trúc..."
                      className="w-full rounded bg-white border border-dark-border py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-tech-cyan"
                      value={subDesc}
                      onChange={(e) => setSubDesc(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSubForm(false)}
                    className="rounded border border-dark-border px-3 py-1.5 text-xs text-slate-500 hover:text-slate-900"
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
