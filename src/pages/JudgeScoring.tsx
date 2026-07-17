import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Star, CheckCircle, Warning, ArrowRight, LinkSimple, GithubLogo, Trophy, YoutubeLogo,
  PencilSimple, ChatCircleText, Clock, ArrowLeft, SealCheck, CaretRight
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
      let teamName = sub.teamName;
      let categoryName = sub.categoryName;
      if (!teamName && sub.teamId) {
        const team = await api.teams.getById(sub.teamId).catch(() => null);
        if (team) {
          teamName = team.name;
          categoryName = team.categoryName || sub.categoryName;
        }
      }
      allSubs.push({ ...sub, eventTitle: ev?.title || 'Sự kiện', roundName: round?.name || 'Vòng thi', roundId, criteria: ev?.criteria || [], teamName, categoryName });
    }
  }
  return allSubs;
};


const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f59e0b', Python: '#3572A5',
  Java: '#b07219', 'C#': '#178600', Go: '#00ADD8', Rust: '#cd7f32',
};

const getScoreColor = (pct: number) => {
  if (pct >= 0.8) return '#0891b2'; // cyan
  if (pct >= 0.6) return '#6366f1'; // indigo
  if (pct >= 0.4) return '#f59e0b'; // amber
  return '#ef4444'; // red
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
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) {
      loadJudgeData(user.id).then(data => {
        setSubmissions(data);
        setLoading(false);
      }).catch(() => { setSubmissions([]); setLoading(false); });
    } else {
      setSubmissions([]);
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
      } else { setScores({}); setComments({}); }
    } catch { setExisting(null); setScores({}); setComments({}); }
    setTimeout(() => panelRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true); setSuccessMsg(null); setErrorMsg(null);
    try {
      const scorePayload = selected.criteria.map((c: any) => ({
        eventCriteriaId: c.id, score: scores[c.id] ?? 0, comment: comments[c.id] || ''
      }));
      await api.scoring.submitScores(selected.id, { scores: scorePayload });
      setSuccessMsg('Điểm đã được lưu thành công!');
      setExisting({ scores: scorePayload, scoredAt: new Date().toISOString() });
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi lưu điểm.');
    } finally { setSubmitting(false); }
  };

  const totalWeighted = selected
    ? selected.criteria.reduce((acc: number, c: any) => acc + ((scores[c.id] ?? 0) * (c.weight || 1)), 0)
    : 0;

  const scoredCount = selected ? selected.criteria.filter((c: any) => scores[c.id] !== undefined).length : 0;
  const isJudge = user?.role === 'judge_internal' || user?.role === 'judge_guest';

  if (!isJudge && user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-10 text-center max-w-sm">
          <Warning size={48} className="mx-auto mb-3 text-amber-400" weight="fill" />
          <h1 className="text-base font-bold text-slate-800 font-mono uppercase mb-1">Không có quyền truy cập</h1>
          <p className="text-sm text-slate-500">Trang này chỉ dành cho Giám khảo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 border border-amber-200">
          <Star size={22} weight="fill" className="text-amber-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 font-mono uppercase tracking-wide">
            Bảng Chấm Điểm — Giám Khảo
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {user?.fullName || 'Demo Judge'} · {submissions.length} bài nộp cần chấm
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Submission list */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">
                Danh sách bài nộp
              </span>
              <span className="text-[10px] font-mono text-slate-400">{submissions.length} bài</span>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-tech-cyan border-t-transparent" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="p-10 text-center">
                <Trophy size={36} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-mono text-slate-400">Chưa có bài nộp nào.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[calc(100vh-220px)] overflow-y-auto">
                {submissions.map((sub, idx) => {
                  const isSelected = selected?.id === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => handleSelect(sub)}
                      className={`w-full text-left px-4 py-3.5 transition-all group border-l-2 ${
                        isSelected
                          ? 'bg-cyan-50 border-l-tech-cyan'
                          : 'border-l-transparent hover:bg-slate-50 hover:border-l-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-[10px] font-mono font-bold text-slate-500">
                            {idx + 1}
                          </span>
                          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                            {sub.roundName}
                          </span>
                        </div>
                        {isSelected && <CaretRight size={12} className="text-tech-cyan" />}
                      </div>
                      <p className={`text-sm font-semibold truncate ${isSelected ? 'text-tech-cyan' : 'text-slate-700'}`}>
                        {sub.eventTitle}
                      </p>
                      {sub.repoUrl && (
                        <p className="text-[10px] font-mono text-slate-400 truncate flex items-center gap-1 mt-0.5">
                          <GithubLogo size={10} />
                          {sub.repoUrl.replace('https://github.com/', '')}
                        </p>
                      )}
                      {sub.repoPrimaryLanguage && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full shrink-0"
                            style={{ background: LANG_COLORS[sub.repoPrimaryLanguage] || '#94a3b8' }} />
                          <span className="text-[10px] font-mono text-slate-400">{sub.repoPrimaryLanguage}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Scoring panel */}
        <div className="lg:col-span-8 xl:col-span-9">
          {!selected ? (
            <div className="flex h-full min-h-[400px] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white">
              <div className="text-center px-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200">
                  <Star size={28} className="text-slate-300" weight="fill" />
                </div>
                <p className="text-sm font-mono font-semibold text-slate-400 uppercase tracking-wide">
                  Chọn bài nộp để bắt đầu chấm điểm
                </p>
                <p className="text-xs text-slate-400 mt-1">{submissions.length} bài nộp đang chờ đánh giá</p>
              </div>
            </div>
          ) : (
            <div ref={panelRef} className="space-y-4 max-h-[calc(100vh-180px)] overflow-y-auto pr-0.5">
              {/* Submission info card */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/70 mb-0.5">
                    {selected.roundName}
                  </p>
                  <h2 className="text-base font-bold text-white">{selected.eventTitle}</h2>
                  {selected.repoLastCommitMessage && (
                    <p className="text-[11px] text-white/70 mt-1 italic">"{selected.repoLastCommitMessage}"</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selected.repoUrl && (
                      <a href={selected.repoUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 border border-white/20 px-3 py-1.5 text-[11px] font-mono text-white hover:bg-white/25 transition-all">
                        <GithubLogo size={12} /> Repository
                      </a>
                    )}
                    {selected.demoUrl && (
                      <a href={selected.demoUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 border border-white/20 px-3 py-1.5 text-[11px] font-mono text-white hover:bg-white/25 transition-all">
                        <LinkSimple size={12} /> Demo
                      </a>
                    )}
                    {selected.videoUrl && (
                      <a href={selected.videoUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/80 border border-rose-400/50 px-3 py-1.5 text-[11px] font-mono text-white hover:bg-rose-500 transition-all">
                        <YoutubeLogo size={12} weight="fill" /> Video
                      </a>
                    )}
                  </div>
                  {selected.description && (
                    <div className="mt-3 p-2 bg-white/10 rounded border border-white/10">
                      <p className="text-[11px] text-white/90 whitespace-pre-wrap"><span className="font-bold opacity-70 uppercase tracking-widest text-[9px] block mb-0.5">Ghi chú:</span> {selected.description}</p>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
                  <span className="text-[10px] font-mono text-slate-500">Tiêu chí đã chấm:</span>
                  <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${selected.criteria.length > 0 ? (scoredCount / selected.criteria.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-amber-600 font-bold">{scoredCount}/{selected.criteria.length}</span>
                  <span className="text-[10px] font-mono text-slate-400">·</span>
                  <span className="text-[10px] font-mono font-bold text-slate-700">
                    Tổng: <span className="text-tech-cyan">{totalWeighted.toFixed(2)}</span> điểm
                  </span>
                </div>
              </div>

              {/* Alerts */}
              {successMsg && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <CheckCircle size={16} weight="fill" className="text-emerald-500 shrink-0" /> {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                  <Warning size={16} className="shrink-0" /> {errorMsg}
                </div>
              )}
              {existing && !successMsg && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 font-mono">
                  <Clock size={13} className="shrink-0" />
                  Đã chấm lúc {new Date(existing.scoredAt).toLocaleString('vi-VN')} · Bạn có thể cập nhật điểm bên dưới.
                </div>
              )}

              {/* Criteria form */}
              {selected.criteria.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white py-12 text-center">
                  <p className="text-sm text-slate-400 font-mono">Sự kiện này chưa định nghĩa tiêu chí chấm điểm.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  {selected.criteria.map((c: any, idx: number) => {
                    const val = scores[c.id] ?? 0;
                    const pct = val / (c.maxScore || 10);
                    const scoreColor = getScoreColor(pct);
                    const isCommentOpen = activeCommentId === c.id;
                    const hasComment = !!comments[c.id];

                    return (
                      <div key={c.id}
                        className={`rounded-xl border bg-white transition-all ${isCommentOpen ? 'border-tech-cyan shadow-sm' : 'border-slate-200'}`}>
                        <div className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            {/* Index */}
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-mono font-bold text-slate-500">
                              {String(idx + 1).padStart(2, '0')}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-0.5">
                                <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                                <span className="shrink-0 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-mono font-bold text-slate-500">
                                  {Math.round((c.weight || 0) * 100)}%
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mb-4">{c.description}</p>

                              {/* Slider row */}
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <input
                                    type="range"
                                    min={0}
                                    max={c.maxScore || 10}
                                    step={0.5}
                                    value={val}
                                    onChange={e => setScores(prev => ({ ...prev, [c.id]: parseFloat(e.target.value) }))}
                                    className="w-full h-2 rounded-full cursor-pointer appearance-none bg-slate-200"
                                    style={{ accentColor: scoreColor }}
                                  />
                                  {/* Score bar below slider */}
                                  <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-300"
                                      style={{ width: `${pct * 100}%`, background: scoreColor }}
                                    />
                                  </div>
                                  <div className="flex justify-between mt-0.5">
                                    <span className="text-[9px] font-mono text-slate-300">0</span>
                                    <span className="text-[9px] font-mono text-slate-300">{c.maxScore || 10}</span>
                                  </div>
                                </div>

                                {/* Score badge */}
                                <div className="flex flex-col items-center justify-center w-14 h-12 rounded-xl border-2 bg-white shrink-0"
                                  style={{ borderColor: `${scoreColor}40` }}>
                                  <span className="text-lg font-black font-mono leading-none" style={{ color: scoreColor }}>{val}</span>
                                  <span className="text-[9px] font-mono text-slate-400">/{c.maxScore || 10}</span>
                                </div>
                              </div>

                              {/* Comment toggle */}
                              <div className="mt-3">
                                <button
                                  type="button"
                                  onClick={() => setActiveCommentId(isCommentOpen ? null : c.id)}
                                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-mono transition-all ${
                                    isCommentOpen || hasComment
                                      ? 'bg-cyan-50 border border-tech-cyan/30 text-tech-cyan'
                                      : 'bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700'
                                  }`}
                                >
                                  <ChatCircleText size={12} weight={hasComment ? 'fill' : 'regular'} />
                                  {hasComment ? 'Có nhận xét' : 'Thêm nhận xét'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Comment textarea */}
                        {isCommentOpen && (
                          <div className="px-5 pb-4 border-t border-slate-100 bg-slate-50/60">
                            <div className="pt-3">
                              <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-2 block flex items-center gap-1.5">
                                <PencilSimple size={10} /> Nhận xét của giám khảo
                              </label>
                              <textarea
                                value={comments[c.id] || ''}
                                onChange={e => setComments(prev => ({ ...prev, [c.id]: e.target.value }))}
                                placeholder="Nhận xét về tiêu chí này..."
                                rows={3}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 placeholder-slate-300 focus:border-tech-cyan focus:outline-none focus:ring-1 focus:ring-tech-cyan/20 transition-all resize-none font-mono"
                              />
                              <div className="mt-1 flex justify-end">
                                <button type="button" onClick={() => setActiveCommentId(null)}
                                  className="text-[10px] font-mono text-slate-400 hover:text-tech-cyan transition-colors">
                                  Xong ✓
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Summary + Submit */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">Tổng điểm có trọng số</p>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-black text-slate-900 font-mono">{totalWeighted.toFixed(2)}</span>
                          <span className="text-base text-slate-400 font-mono">/10.00</span>
                        </div>
                        <div className="mt-2 h-2 w-48 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min((totalWeighted / 10) * 100, 100)}%`,
                              background: getScoreColor(totalWeighted / 10)
                            }}
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-7 py-3 text-sm font-bold text-white shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                      >
                        {submitting ? (
                          <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Đang lưu...</>
                        ) : existing ? (
                          <><SealCheck size={17} weight="fill" /> CẬP NHẬT ĐIỂM</>
                        ) : (
                          <><Star size={17} weight="fill" /> GỬI ĐIỂM CHẤM</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Prev / Next navigation */}
                  <div className="flex justify-between pb-4">
                    {submissions.findIndex(s => s.id === selected?.id) > 0 && (
                      <button type="button"
                        onClick={() => handleSelect(submissions[submissions.findIndex(s => s.id === selected?.id) - 1])}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-mono text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-all">
                        <ArrowLeft size={13} /> Bài trước
                      </button>
                    )}
                    {submissions.findIndex(s => s.id === selected?.id) < submissions.length - 1 && (
                      <button type="button"
                        onClick={() => handleSelect(submissions[submissions.findIndex(s => s.id === selected?.id) + 1])}
                        className="ml-auto flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-mono text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-all">
                        Bài tiếp theo <ArrowRight size={13} />
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
  );
};
