import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Star, CheckCircle, Warning, ArrowRight, LinkSimple, GithubLogo, Trophy,
  PencilSimple, ChatCircleText, Eye, Clock, ArrowLeft, Sparkle, SealCheck,
  CaretRight, X
} from '@phosphor-icons/react';

const loadJudgeData = async (judgeId: string) => {
  if (!judgeId) return [];
  const events = await api.events.getAll();
  const assignments = await api.judgeAssignments.getByJudge(judgeId).catch(() => []);
  const roundIds = Array.from(new Set(assignments.map((a: any) => a.roundId)));
  const allSubs: any[] = [];
  for (const roundId of roundIds) {
    const subs = await api.submissions.getByRound(roundId as string).catch(() => []);
    const ev = events.find((e: any) => e.rounds?.some((r: any) => r.id === roundId));
    const round = ev?.rounds?.find((r: any) => r.id === roundId);
    for (const sub of subs) {
      allSubs.push({ ...sub, eventTitle: ev?.title || 'Sự kiện', roundName: round?.name || 'Vòng thi', roundId, criteria: ev?.criteria || [] });
    }
  }
  return allSubs;
};

// Demo fallback submissions for visual testing
const DEMO_SUBMISSIONS = [
  {
    id: 'sub-demo-1', teamId: 't1', roundId: 'r2',
    eventTitle: 'FPT Edu Hackathon 2026', roundName: 'Vòng Sơ Loại Sản Phẩm',
    repoUrl: 'https://github.com/team-alpha/smart-city-ai', demoUrl: 'https://demo.smartcityai.com',
    repoLastCommitMessage: 'feat: Add AI-powered traffic prediction module',
    repoPrimaryLanguage: 'TypeScript', repoStars: 24,
    criteria: [
      { id: 'cr1', name: 'Tính Đột Phá / Sáng Tạo', description: 'Ý tưởng có mới mẻ, độc đáo không?', weight: 0.3, maxScore: 10 },
      { id: 'cr2', name: 'Tính Thực Tiễn', description: 'Khả năng ứng dụng và triển khai thực tế.', weight: 0.3, maxScore: 10 },
      { id: 'cr3', name: 'Kỹ Thuật / Công Nghệ', description: 'Độ phức tạp và hoàn thiện của sản phẩm.', weight: 0.4, maxScore: 10 },
    ]
  },
  {
    id: 'sub-demo-2', teamId: 't2', roundId: 'r2',
    eventTitle: 'FPT Edu Hackathon 2026', roundName: 'Vòng Sơ Loại Sản Phẩm',
    repoUrl: 'https://github.com/team-beta/iot-smart-grid', demoUrl: null,
    repoLastCommitMessage: 'fix: Optimize sensor data collection pipeline',
    repoPrimaryLanguage: 'Python', repoStars: 8,
    criteria: [
      { id: 'cr1', name: 'Tính Đột Phá / Sáng Tạo', description: 'Ý tưởng có mới mẻ, độc đáo không?', weight: 0.3, maxScore: 10 },
      { id: 'cr2', name: 'Tính Thực Tiễn', description: 'Khả năng ứng dụng và triển khai thực tế.', weight: 0.3, maxScore: 10 },
      { id: 'cr3', name: 'Kỹ Thuật / Công Nghệ', description: 'Độ phức tạp và hoàn thiện của sản phẩm.', weight: 0.4, maxScore: 10 },
    ]
  },
  {
    id: 'sub-demo-3', teamId: 't3', roundId: 'r2',
    eventTitle: 'FPT Edu Hackathon 2026', roundName: 'Vòng Sơ Loại Sản Phẩm',
    repoUrl: 'https://github.com/team-gamma/urban-health', demoUrl: 'https://urban-health.vercel.app',
    repoLastCommitMessage: 'docs: Update README with deployment guide',
    repoPrimaryLanguage: 'JavaScript', repoStars: 15,
    criteria: [
      { id: 'cr1', name: 'Tính Đột Phá / Sáng Tạo', description: 'Ý tưởng có mới mẻ, độc đáo không?', weight: 0.3, maxScore: 10 },
      { id: 'cr2', name: 'Tính Thực Tiễn', description: 'Khả năng ứng dụng và triển khai thực tế.', weight: 0.3, maxScore: 10 },
      { id: 'cr3', name: 'Kỹ Thuật / Công Nghệ', description: 'Độ phức tạp và hoàn thiện của sản phẩm.', weight: 0.4, maxScore: 10 },
    ]
  },
];

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3572A5',
  Java: '#b07219', 'C#': '#178600', Go: '#00ADD8', Rust: '#dea584',
};

const ScoreGauge: React.FC<{ value: number; max: number; size?: number }> = ({ value, max, size = 64 }) => {
  const pct = Math.min(value / max, 1);
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ * (1 - pct);
  const color = pct >= 0.8 ? '#22c55e' : pct >= 0.6 ? '#f59e0b' : pct >= 0.4 ? '#f97316' : '#ef4444';
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={6} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={dashOffset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
      />
    </svg>
  );
};

export const JudgeScoring: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [existing, setExisting] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const scoringPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) {
      loadJudgeData(user.id).then(data => {
        const finalData = data.length > 0 ? data : DEMO_SUBMISSIONS;
        setSubmissions(finalData);
        setLoading(false);
      }).catch(() => {
        setSubmissions(DEMO_SUBMISSIONS);
        setLoading(false);
      });
    } else {
      setSubmissions(DEMO_SUBMISSIONS);
      setLoading(false);
    }
  }, [user?.id]);

  const handleSelect = async (sub: any) => {
    setSelected(sub);
    setSuccessMsg(null);
    setErrorMsg(null);
    setActiveCommentId(null);
    try {
      const myScore = await api.scoring.getMyScore(sub.id);
      setExisting(myScore);
      if (myScore?.scores) {
        const initScores: Record<string, number> = {};
        const initComments: Record<string, string> = {};
        for (const s of myScore.scores) {
          initScores[s.eventCriteriaId] = s.score;
          if (s.comment) initComments[s.eventCriteriaId] = s.comment;
        }
        setScores(initScores);
        setComments(initComments);
      } else {
        setScores({});
        setComments({});
      }
    } catch {
      setExisting(null);
      setScores({});
      setComments({});
    }
    setTimeout(() => scoringPanelRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const scorePayload = selected.criteria.map((c: any) => ({
        eventCriteriaId: c.id,
        score: scores[c.id] ?? 0,
        comment: comments[c.id] || ''
      }));
      await api.scoring.submitScores(selected.id, { scores: scorePayload });
      setSuccessMsg('Điểm đã được lưu thành công!');
      setExisting({ scores: scorePayload, scoredAt: new Date().toISOString() });
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi lưu điểm.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalWeighted = selected
    ? selected.criteria.reduce((acc: number, c: any) => acc + ((scores[c.id] ?? 0) * (c.weight || 1)), 0)
    : 0;

  const scoredCount = selected ? selected.criteria.filter((c: any) => scores[c.id] !== undefined).length : 0;
  const isComplete = selected ? scoredCount === selected.criteria.length : false;

  const isJudge = user?.role === 'judge_internal' || user?.role === 'judge_guest';

  if (!isJudge && user) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-6">
        <div className="rounded-2xl border border-amber-500/20 bg-amber-950/30 p-12 text-center max-w-md">
          <Warning size={56} className="mx-auto mb-4 text-amber-400" weight="fill" />
          <h1 className="text-xl font-bold text-white font-mono uppercase mb-2">Không có quyền truy cập</h1>
          <p className="text-sm text-slate-400">Trang này chỉ dành cho Giám khảo.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #0a0a14 50%, #0d0d1f 100%)', minHeight: '100vh' }}
      className="text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)' }}>
              <Star size={24} weight="fill" className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white font-mono uppercase tracking-tight">
                BẢNG CHẤM ĐIỂM
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                Giám khảo: <span className="text-amber-400">{user?.fullName || 'Demo Judge'}</span>
                &nbsp;·&nbsp;{submissions.length} bài nộp cần chấm
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-2 text-xs font-mono text-slate-400 hover:border-amber-500/50 hover:text-amber-400 transition-all md:hidden"
          >
            {sidebarOpen ? <X size={14} /> : <ArrowRight size={14} />}
            {sidebarOpen ? 'Ẩn danh sách' : 'Xem danh sách'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT SIDEBAR — Submission List */}
          <div className={`lg:col-span-4 xl:col-span-3 ${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
            <div className="rounded-2xl border border-slate-800 overflow-hidden"
              style={{ background: 'rgba(15,15,30,0.8)', backdropFilter: 'blur(12px)' }}>
              <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
                  Bài Nộp ({submissions.length})
                </span>
                <Sparkle size={14} className="text-amber-500" />
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="p-10 text-center">
                  <Trophy size={40} className="mx-auto mb-3 text-slate-700" />
                  <p className="text-xs font-mono text-slate-600">Chưa có bài nộp nào.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60 max-h-[calc(100vh-240px)] overflow-y-auto">
                  {submissions.map((sub, idx) => {
                    const isSelected = selected?.id === sub.id;
                    const hasExisting = existing && selected?.id === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleSelect(sub)}
                        className={`w-full text-left px-4 py-4 transition-all group relative ${isSelected
                          ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-l-2 border-amber-400'
                          : 'hover:bg-slate-800/40 border-l-2 border-transparent'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-mono font-bold text-slate-400">
                              {idx + 1}
                            </div>
                            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-500">
                              {sub.roundName}
                            </span>
                          </div>
                          {hasExisting && <SealCheck size={14} className="text-emerald-400 shrink-0" weight="fill" />}
                          {isSelected && !hasExisting && <CaretRight size={14} className="text-amber-400 shrink-0" />}
                        </div>
                        <p className="text-sm font-semibold text-white mb-1 truncate pr-2">{sub.eventTitle}</p>
                        {sub.repoUrl && (
                          <p className="text-[10px] font-mono text-slate-600 truncate flex items-center gap-1">
                            <GithubLogo size={10} />
                            {sub.repoUrl.replace('https://github.com/', '')}
                          </p>
                        )}
                        {sub.repoPrimaryLanguage && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ background: LANG_COLORS[sub.repoPrimaryLanguage] || '#94a3b8' }}
                            />
                            <span className="text-[10px] font-mono text-slate-500">{sub.repoPrimaryLanguage}</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL — Scoring Form */}
          <div className="lg:col-span-8 xl:col-span-9">
            {!selected ? (
              <div className="flex h-full min-h-[500px] items-center justify-center rounded-2xl border border-dashed border-slate-800"
                style={{ background: 'rgba(15,15,30,0.5)' }}>
                <div className="text-center px-8">
                  <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-slate-800 bg-slate-900">
                    <Star size={36} className="text-slate-700" weight="fill" />
                  </div>
                  <p className="text-base font-mono font-semibold text-slate-500 uppercase tracking-wider">
                    Chọn bài nộp để bắt đầu chấm điểm
                  </p>
                  <p className="text-xs text-slate-700 mt-2 font-mono">
                    {submissions.length} bài nộp đang chờ đánh giá
                  </p>
                </div>
              </div>
            ) : (
              <div ref={scoringPanelRef} className="space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">

                {/* Submission Info Card */}
                <div className="rounded-2xl overflow-hidden border border-slate-800"
                  style={{ background: 'rgba(15,15,30,0.8)' }}>
                  <div className="relative px-6 py-5"
                    style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(234,88,12,0.08) 100%)' }}>
                    <div className="absolute inset-0 opacity-5"
                      style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #f59e0b 0%, transparent 60%)' }} />
                    <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-500/70 mb-1">
                          {selected.roundName}
                        </p>
                        <h2 className="text-xl font-black text-white truncate">{selected.eventTitle}</h2>
                        {selected.repoLastCommitMessage && (
                          <p className="text-[11px] text-slate-500 mt-1 italic">
                            "{selected.repoLastCommitMessage}"
                          </p>
                        )}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selected.repoUrl && (
                            <a href={selected.repoUrl} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-[11px] font-mono text-slate-300 hover:border-amber-500/50 hover:text-amber-400 transition-all">
                              <GithubLogo size={13} /> Repository
                            </a>
                          )}
                          {selected.demoUrl && (
                            <a href={selected.demoUrl} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/70 px-3 py-1.5 text-[11px] font-mono text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400 transition-all">
                              <Eye size={13} /> Demo Live
                            </a>
                          )}
                          {selected.repoPrimaryLanguage && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-[11px] font-mono text-slate-400">
                              <span className="h-2 w-2 rounded-full" style={{ background: LANG_COLORS[selected.repoPrimaryLanguage] || '#94a3b8' }} />
                              {selected.repoPrimaryLanguage}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Total Score Preview */}
                      <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/5 px-6 py-4 shrink-0 min-w-[120px]">
                        <div className="relative flex items-center justify-center mb-1">
                          <ScoreGauge value={totalWeighted} max={10} size={72} />
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-xl font-black text-white font-mono">{totalWeighted.toFixed(1)}</span>
                            <span className="text-[10px] font-mono text-slate-500">/10</span>
                          </div>
                        </div>
                        <p className="text-[10px] font-mono text-amber-500 uppercase font-bold tracking-wider text-center">Tổng điểm</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="px-6 py-3 border-t border-slate-800 flex items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-600">Tiêu chí đã chấm:</span>
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${selected.criteria.length > 0 ? (scoredCount / selected.criteria.length) * 100 : 0}%`,
                          background: 'linear-gradient(90deg, #f59e0b, #ea580c)'
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">{scoredCount}/{selected.criteria.length}</span>
                  </div>
                </div>

                {/* Alerts */}
                {successMsg && (
                  <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                    <CheckCircle size={18} weight="fill" className="text-emerald-400 shrink-0" />
                    <span className="text-sm text-emerald-300">{successMsg}</span>
                  </div>
                )}
                {errorMsg && (
                  <div className="flex items-center gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3">
                    <Warning size={18} weight="fill" className="text-rose-400 shrink-0" />
                    <span className="text-sm text-rose-300">{errorMsg}</span>
                  </div>
                )}
                {existing && !successMsg && (
                  <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                    <Clock size={16} className="text-amber-500 shrink-0" />
                    <span className="text-[11px] font-mono text-amber-400">
                      Đã chấm lúc {new Date(existing.scoredAt).toLocaleString('vi-VN')} · Bạn có thể cập nhật điểm bên dưới.
                    </span>
                  </div>
                )}

                {/* Criteria Scoring */}
                {selected.criteria.length === 0 ? (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/50 py-16 text-center">
                    <p className="text-sm text-slate-500 font-mono">Sự kiện này chưa định nghĩa tiêu chí chấm điểm.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {selected.criteria.map((c: any, idx: number) => {
                      const val = scores[c.id] ?? 0;
                      const pct = val / (c.maxScore || 10);
                      const hasComment = !!comments[c.id];
                      const isCommentOpen = activeCommentId === c.id;

                      return (
                        <div key={c.id}
                          className="rounded-2xl border transition-all duration-200"
                          style={{
                            borderColor: isCommentOpen ? 'rgba(245,158,11,0.4)' : 'rgba(30,41,59,1)',
                            background: 'rgba(15,15,30,0.8)',
                            boxShadow: isCommentOpen ? '0 0 0 1px rgba(245,158,11,0.2)' : 'none'
                          }}>

                          <div className="px-5 py-4">
                            <div className="flex items-start gap-4">
                              {/* Index */}
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-xs font-mono font-bold text-slate-500">
                                {String(idx + 1).padStart(2, '0')}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                  <p className="text-sm font-bold text-white">{c.name}</p>
                                  <span className="shrink-0 rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-400">
                                    {Math.round((c.weight || 0) * 100)}% tỉ trọng
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mb-4">{c.description}</p>

                                {/* Score slider row */}
                                <div className="flex items-center gap-4">
                                  <div className="flex-1 relative">
                                    <input
                                      type="range"
                                      min={0}
                                      max={c.maxScore || 10}
                                      step={0.5}
                                      value={val}
                                      onChange={e => setScores(prev => ({ ...prev, [c.id]: parseFloat(e.target.value) }))}
                                      className="w-full h-2 rounded-full cursor-pointer appearance-none"
                                      style={{
                                        background: `linear-gradient(to right, ${pct >= 0.8 ? '#22c55e' : pct >= 0.6 ? '#f59e0b' : pct >= 0.4 ? '#f97316' : '#ef4444'} ${pct * 100}%, #1e293b ${pct * 100}%)`
                                      }}
                                    />
                                    <div className="flex justify-between mt-1">
                                      <span className="text-[10px] font-mono text-slate-700">0</span>
                                      <span className="text-[10px] font-mono text-slate-700">{c.maxScore || 10}</span>
                                    </div>
                                  </div>

                                  {/* Score display */}
                                  <div className="flex flex-col items-center justify-center w-16 h-14 rounded-xl border border-slate-700 bg-slate-900 shrink-0">
                                    <span className="text-xl font-black font-mono"
                                      style={{ color: pct >= 0.8 ? '#22c55e' : pct >= 0.6 ? '#f59e0b' : pct >= 0.4 ? '#f97316' : '#ef4444' }}>
                                      {val}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-600">/{c.maxScore || 10}</span>
                                  </div>
                                </div>

                                {/* Comment toggle */}
                                <div className="mt-3 flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setActiveCommentId(isCommentOpen ? null : c.id)}
                                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-mono transition-all ${isCommentOpen || hasComment
                                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400'
                                      : 'bg-slate-800 border border-slate-700 text-slate-500 hover:text-slate-300'
                                      }`}
                                  >
                                    <ChatCircleText size={12} weight={hasComment ? 'fill' : 'regular'} />
                                    {hasComment ? 'Có nhận xét' : 'Thêm nhận xét'}
                                  </button>
                                  {hasComment && !isCommentOpen && (
                                    <span className="text-[11px] text-slate-600 italic truncate max-w-[200px]">
                                      "{comments[c.id]}"
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Comment box */}
                          {isCommentOpen && (
                            <div className="px-5 pb-4 border-t border-slate-800/60">
                              <div className="pt-3">
                                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600 mb-2 block flex items-center gap-1.5">
                                  <PencilSimple size={11} /> Nhận xét của giám khảo
                                </label>
                                <textarea
                                  value={comments[c.id] || ''}
                                  onChange={e => setComments(prev => ({ ...prev, [c.id]: e.target.value }))}
                                  placeholder="Nhận xét về tiêu chí này... (ưu điểm, hạn chế, gợi ý cải thiện)"
                                  rows={3}
                                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-200 placeholder-slate-700 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/20 transition-all resize-none font-mono"
                                />
                                <div className="mt-1 flex justify-between">
                                  <span className="text-[10px] text-slate-700 font-mono">{(comments[c.id] || '').length} ký tự</span>
                                  <button type="button" onClick={() => setActiveCommentId(null)}
                                    className="text-[10px] font-mono text-slate-600 hover:text-amber-400 transition-colors">
                                    Xong ✓
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Summary & Submit */}
                    <div className="rounded-2xl border border-amber-500/20 overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(234,88,12,0.04) 100%)' }}>
                      <div className="px-6 py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-500/70 mb-1">Tổng điểm có trọng số</p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl font-black text-white font-mono">{totalWeighted.toFixed(2)}</span>
                              <span className="text-lg text-slate-600 font-mono">/10.00</span>
                            </div>
                            <div className="mt-2 flex gap-3">
                              {selected.criteria.map((c: any) => (
                                <div key={c.id} className="text-center">
                                  <div className="text-xs font-mono font-bold text-amber-400">{scores[c.id] ?? '—'}</div>
                                  <div className="text-[9px] font-mono text-slate-600 truncate max-w-[60px]">{c.name.split('/')[0].trim()}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            {!isComplete && (
                              <p className="text-[11px] text-slate-600 font-mono">
                                ⚠ Còn {selected.criteria.length - scoredCount} tiêu chí chưa điều chỉnh
                              </p>
                            )}
                            <button
                              type="submit"
                              disabled={submitting}
                              className="inline-flex items-center gap-2.5 rounded-xl px-8 py-3.5 text-sm font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50"
                              style={{
                                background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                                boxShadow: '0 4px 20px rgba(245,158,11,0.25)'
                              }}
                            >
                              {submitting ? (
                                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Đang lưu...</>
                              ) : existing ? (
                                <><SealCheck size={18} weight="fill" /> CẬP NHẬT ĐIỂM</>
                              ) : (
                                <><Star size={18} weight="fill" /> GỬI ĐIỂM CHẤM</>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between pt-2 pb-4">
                      {submissions.findIndex(s => s.id === selected?.id) > 0 && (
                        <button type="button"
                          onClick={() => handleSelect(submissions[submissions.findIndex(s => s.id === selected?.id) - 1])}
                          className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2 text-xs font-mono text-slate-500 hover:border-slate-700 hover:text-slate-300 transition-all">
                          <ArrowLeft size={14} /> Bài trước
                        </button>
                      )}
                      {submissions.findIndex(s => s.id === selected?.id) < submissions.length - 1 && (
                        <button type="button"
                          onClick={() => handleSelect(submissions[submissions.findIndex(s => s.id === selected?.id) + 1])}
                          className="ml-auto flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2 text-xs font-mono text-slate-500 hover:border-slate-700 hover:text-slate-300 transition-all">
                          Bài tiếp theo <ArrowRight size={14} />
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
