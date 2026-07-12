import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Star, CheckCircle, Warning, ArrowRight, LinkSimple, GithubLogo, Trophy } from '@phosphor-icons/react';

const loadJudgeData = async (judgeId: string) => {
  if (!judgeId) return [];
  
  // Lấy sự kiện để lấy tiêu đề và tiêu chí
  const events = await api.events.getAll();
  
  // 1. Lấy danh sách phân công của giám khảo này
  const assignments = await api.judgeAssignments.getByJudge(judgeId).catch(() => []);
  const roundIds = Array.from(new Set(assignments.map((a: any) => a.roundId)));
  
  // 2. Lấy bài nộp cho từng vòng được phân công
  const allSubs: any[] = [];
  for (const roundId of roundIds) {
    const subs = await api.submissions.getByRound(roundId as string).catch(() => []);
    
    // Tìm thông tin sự kiện & vòng thi
    const ev = events.find((e: any) => e.rounds?.some((r: any) => r.id === roundId));
    const roundName = ev?.rounds?.find((r: any) => r.id === roundId)?.name || 'Vòng thi';
    
    for (const sub of subs) {
      allSubs.push({
        ...sub,
        eventTitle: ev?.title || 'Sự kiện',
        roundName,
        roundId,
        criteria: ev?.criteria || []
      });
    }
  }
  return allSubs;
};

export const JudgeScoring: React.FC = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [existing, setExisting] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadJudgeData(user.id).then(data => {
        setSubmissions(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const handleSelect = async (sub: any) => {
    setSelected(sub);
    setSuccessMsg(null);
    setErrorMsg(null);
    // Load existing scores
    try {
      const myScore = await api.scoring.getMyScore(sub.id);
      setExisting(myScore);
      if (myScore?.scores) {
        const initScores: Record<string, number> = {};
        for (const s of myScore.scores) {
          initScores[s.eventCriteriaId] = s.score;
        }
        setScores(initScores);
      } else {
        setScores({});
      }
    } catch {
      setExisting(null);
      setScores({});
    }
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
        comment: ''
      }));
      await api.scoring.submitScores(selected.id, { scores: scorePayload });
      setSuccessMsg('Đã lưu điểm thành công!');
      setExisting({ scores: scorePayload, scoredAt: new Date().toISOString() });
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi lưu điểm.');
    } finally {
      setSubmitting(false);
    }
  };

  const isJudge = user?.role === 'judge_internal' || user?.role === 'judge_guest';

  if (!isJudge) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <Warning size={56} className="mx-auto mb-4 text-amber-400" />
        <h1 className="text-lg font-bold text-slate-800 font-mono uppercase mb-2">Không có quyền truy cập</h1>
        <p className="text-sm text-slate-500">Trang này chỉ dành cho Giám khảo.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 font-mono uppercase flex items-center gap-3">
          <Star weight="fill" className="text-amber-400" />
          BẢNG CHẤM ĐIỂM — GIÁM KHẢO
        </h1>
        <p className="text-sm text-slate-500 mt-1">Chọn bài nộp bên trái để chấm điểm theo từng tiêu chí.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Submission list */}
        <div className="lg:col-span-1 space-y-3">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <Trophy size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="text-xs font-mono text-slate-500">Chưa có bài nộp nào cần chấm điểm.</p>
            </div>
          ) : (
            submissions.map(sub => (
              <button
                key={sub.id}
                onClick={() => handleSelect(sub)}
                className={`w-full text-left rounded-xl border p-4 transition-all ${
                  selected?.id === sub.id
                    ? 'border-amber-400 bg-amber-50 shadow-md'
                    : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-amber-50/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">{sub.roundName}</span>
                  <ArrowRight size={14} className="text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-800 truncate">{sub.eventTitle}</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">{sub.repoUrl || 'Chưa có link repo'}</p>
                {sub.repoLastCommitMessage && (
                  <p className="text-[10px] text-slate-400 mt-1 truncate italic">"{sub.repoLastCommitMessage}"</p>
                )}
              </button>
            ))
          )}
        </div>

        {/* Right: Scoring form */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
              <div className="text-center px-8">
                <Star size={48} className="mx-auto mb-3 text-slate-200" weight="fill" />
                <p className="text-sm font-mono font-semibold text-slate-400 uppercase">Chọn một bài nộp để bắt đầu chấm điểm</p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-5">
                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/70 mb-1">{selected.roundName} · {selected.eventTitle}</p>
                <h2 className="text-lg font-bold text-white">Chấm điểm bài nộp</h2>
                {selected.repoUrl && (
                  <a href={selected.repoUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-[11px] text-white/90 hover:text-white underline underline-offset-2">
                    <GithubLogo size={14} /> {selected.repoUrl}
                  </a>
                )}
                {selected.demoUrl && (
                  <a href={selected.demoUrl} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 ml-4 mt-2 text-[11px] text-white/90 hover:text-white underline underline-offset-2">
                    <LinkSimple size={14} /> Demo
                  </a>
                )}
              </div>

              {/* Body */}
              <div className="p-6">
                {successMsg && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
                    <CheckCircle size={18} weight="fill" /> {successMsg}
                  </div>
                )}
                {errorMsg && (
                  <div className="mb-4 flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600">
                    <Warning size={18} /> {errorMsg}
                  </div>
                )}

                {existing && (
                  <div className="mb-5 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs text-amber-700 font-mono">
                    ✓ Bạn đã chấm điểm bài này lúc {new Date(existing.scoredAt).toLocaleString('vi-VN')}. Bạn có thể cập nhật điểm bên dưới.
                  </div>
                )}

                {selected.criteria.length === 0 ? (
                  <div className="text-center py-10 text-sm text-slate-400">Sự kiện này chưa định nghĩa tiêu chí chấm điểm.</div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {selected.criteria.map((c: any) => (
                      <div key={c.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{c.description}</p>
                          </div>
                          <span className="ml-4 shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-mono font-bold text-amber-700">
                            Tỉ trọng {Math.round((c.weight || 0) * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min={0}
                            max={c.maxScore || 10}
                            step={0.5}
                            value={scores[c.id] ?? 0}
                            onChange={e => setScores(prev => ({ ...prev, [c.id]: parseFloat(e.target.value) }))}
                            className="flex-1 accent-amber-400 h-2 cursor-pointer"
                          />
                          <div className="w-16 text-center">
                            <span className="text-xl font-bold text-amber-500 font-mono">{scores[c.id] ?? 0}</span>
                            <span className="text-xs text-slate-400">/{c.maxScore || 10}</span>
                          </div>
                        </div>
                        {/* Visual score bar */}
                        <div className="mt-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all"
                            style={{ width: `${((scores[c.id] ?? 0) / (c.maxScore || 10)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}

                    {/* Total preview */}
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between">
                      <span className="text-sm font-semibold text-amber-800 font-mono uppercase">Tổng điểm dự kiến</span>
                      <span className="text-2xl font-black text-amber-600 font-mono">
                        {selected.criteria.reduce((acc: number, c: any) => acc + ((scores[c.id] ?? 0) * (c.weight || 1)), 0).toFixed(2)}
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 py-3 text-sm font-bold text-white shadow-md hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {submitting ? 'Đang lưu...' : existing ? 'CẬP NHẬT ĐIỂM' : 'GỬI ĐIỂM CHẤM'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
