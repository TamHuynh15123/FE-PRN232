import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ChartBar, Trophy, ArrowLeft, Spinner, MagnifyingGlass,
  CheckCircle, Clock, Warning, ArrowUp, CaretDown, CaretUp, FileXls
} from '@phosphor-icons/react';



const scoreColor = (s: number) => {
  if (s >= 8.5) return { text: 'text-emerald-600', bar: 'bg-emerald-400' };
  if (s >= 7) return { text: 'text-tech-cyan', bar: 'bg-tech-cyan' };
  if (s >= 5.5) return { text: 'text-amber-600', bar: 'bg-amber-400' };
  return { text: 'text-rose-500', bar: 'bg-rose-400' };
};

const Avatar: React.FC<{ name: string }> = ({ name }) => (
  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 border border-indigo-200 text-[10px] font-black font-mono text-indigo-600">
    {name.charAt(0).toUpperCase()}
  </div>
);

export const ScoreOverview: React.FC = () => {
  const { eventId } = useParams<{ eventId?: string }>();
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [judges, setJudges] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>(eventId || '');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'scored' | 'pending' | 'pass'>('all');

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const evs = await api.events.getAll();
        setEvents(evs || []);
        if (!selectedEvent && evs.length > 0) setSelectedEvent(evs[0].id);
      } catch { }
    };
    if (events.length === 0) loadEvents();
  }, []);

  useEffect(() => {
    if (!selectedEvent) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const ev = await api.events.getById(selectedEvent);
        const rounds = ev?.rounds || [];
        let allSubs: any[] = [];
        for (const r of rounds) {
          const subs = await api.submissions.getByRound(r.id).catch(() => []);
          const rk = await api.ranking.getRound(r.id).catch(() => null);
          const subsWithDetails = subs.map((s: any) => {
            const rankItem = rk?.results?.find((x: any) => x.teamId === s.teamId);
            return { ...s, roundName: r.name, isAdvanced: rankItem?.isAdvanced || false };
          });
          allSubs = [...allSubs, ...subsWithDetails];
        }

        const subsWithScores = await Promise.all(
          allSubs.map(async (s: any) => {
            const sc = await api.scoring.getScores(s.id).catch(() => []);
            let teamName = s.teamName;
            let categoryName = s.categoryName;
            if (!teamName && s.teamId) {
              const team = await api.teams.getById(s.teamId).catch(() => null);
              if (team) {
                teamName = team.name;
                categoryName = team.categoryName || s.categoryName;
              }
            }
            return { ...s, scores: sc, teamName, categoryName };
          })
        );
        setSubmissions(subsWithScores);

        const us = await api.users.getAll({ role: 'judge_internal' }).catch(() => ({ items: [] }));
        const ug = await api.users.getAll({ role: 'judge_guest' }).catch(() => ({ items: [] }));
        setJudges([...(us.items || []), ...(ug.items || [])]);
      } catch {
        setSubmissions([]);
        setJudges([]);
      } finally { setLoading(false); }
    };
    loadData();
  }, [selectedEvent]);


  const handleDownloadExcel = async () => {
    if (!selectedEvent) return;
    try {
      const res = await fetch(`/api/exports/events/${selectedEvent}/ranking/excel`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      if (!res.ok) throw new Error('Không thể tải Excel.');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ranking_${selectedEvent}.xlsx`;
      a.click();
    } catch (err: any) {
      alert(err.message || 'Lỗi xuất Excel.');
    }
  };

  const scored = submissions.filter(s => s.scores?.length > 0);
  const pending = submissions.filter(s => !s.scores || s.scores.length === 0);
  const passed = submissions.filter(s => s.isAdvanced);
  const avgScore = scored.length > 0
    ? scored.reduce((acc, s) => {
      const avg = s.scores.reduce((a: number, sc: any) => a + sc.totalScore, 0) / s.scores.length;
      return acc + avg;
    }, 0) / scored.length
    : 0;

  const filtered = submissions.filter(s => {
    const matchSearch = (s.teamName || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.categoryName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === 'all' ? true :
      filterStatus === 'scored' ? s.scores?.length > 0 :
      filterStatus === 'pending' ? (!s.scores || s.scores.length === 0) :
      filterStatus === 'pass' ? s.isAdvanced : true;
    return matchSearch && matchStatus;
  });

  if (user?.role !== 'organizer') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-10 text-center max-w-sm">
          <Warning size={40} className="mx-auto mb-3 text-amber-400" weight="fill" />
          <h1 className="text-base font-bold text-slate-800 font-mono uppercase mb-1">Không có quyền</h1>
          <p className="text-sm text-slate-500">Chỉ Ban tổ chức mới có thể truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Back */}
      <Link to="/events" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-tech-cyan mb-6 transition-colors font-mono uppercase tracking-wide">
        <ArrowLeft size={13} /> Quay lại sự kiện
      </Link>

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 border border-indigo-200 shrink-0">
            <ChartBar size={22} weight="fill" className="text-indigo-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 font-mono uppercase tracking-wide">Tổng Quan Điểm Số</h1>
            <p className="text-xs text-slate-500 mt-0.5">Quản lý và giám sát tiến độ chấm điểm · Ban Tổ Chức</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {events.length > 0 && (
            <select
              value={selectedEvent}
              onChange={e => setSelectedEvent(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-mono text-slate-700 focus:border-tech-cyan focus:outline-none focus:ring-1 focus:ring-tech-cyan/20 transition-all"
            >
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleDownloadExcel}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold font-mono text-emerald-700 hover:bg-emerald-100 transition-all shadow-sm"
            >
              <FileXls size={14} weight="bold" /> EXCEL
            </button>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Bài đã chấm', value: `${scored.length}/${submissions.length}`, icon: <CheckCircle size={16} weight="fill" />, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', barPct: submissions.length > 0 ? (scored.length / submissions.length) * 100 : 0, barColor: 'bg-emerald-400' },
          { label: 'Chờ chấm điểm', value: pending.length, icon: <Clock size={16} />, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', barPct: submissions.length > 0 ? (pending.length / submissions.length) * 100 : 0, barColor: 'bg-amber-400' },
          { label: 'Đội vượt qua', value: `${passed.length}/${submissions.length}`, icon: <ArrowUp size={16} weight="bold" />, color: 'text-tech-cyan', bg: 'bg-cyan-50', border: 'border-cyan-100', barPct: submissions.length > 0 ? (passed.length / submissions.length) * 100 : 0, barColor: 'bg-tech-cyan' },
          { label: 'Điểm TB', value: avgScore > 0 ? avgScore.toFixed(1) : '—', icon: <Trophy size={16} weight="fill" />, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100', barPct: (avgScore / 10) * 100, barColor: 'bg-indigo-400' },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className={`inline-flex items-center justify-center h-8 w-8 rounded-lg ${s.bg} border ${s.border} mb-2`}>
              <div className={s.color}>{s.icon}</div>
            </div>
            <p className="text-2xl font-black font-mono text-slate-900">{s.value}</p>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-0.5 mb-2">{s.label}</p>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className={`h-full rounded-full ${s.barColor} transition-all duration-700`} style={{ width: `${Math.min(s.barPct, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Judge progress */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
          <h2 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500">Tiến độ giám khảo</h2>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {judges.map((j: any) => {
            const jScoredCount = submissions.filter(s => s.scores?.some((sc: any) => sc.judgeId === j.id)).length;
            const pct = submissions.length > 0 ? (jScoredCount / submissions.length) * 100 : 0;
            const done = submissions.length > 0 && pct >= 100;
            return (
              <div key={j.id} className={`flex items-center gap-3 rounded-xl border p-3.5 ${done ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                <Avatar name={j.name || j.fullName || 'J'} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">{j.name || j.fullName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${done ? 'bg-emerald-400' : 'bg-indigo-400'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                    <span className={`text-[10px] font-mono font-bold shrink-0 ${done ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {jScoredCount}/{submissions.length}
                    </span>
                  </div>
                </div>
                {done && <CheckCircle size={16} weight="fill" className="text-emerald-500 shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter + Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlass size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm đội thi hoặc hạng mục..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-700 placeholder-slate-400 focus:border-tech-cyan focus:outline-none focus:ring-1 focus:ring-tech-cyan/20 transition-all"
            />
          </div>
          <div className="flex gap-1.5">
            {(['all', 'scored', 'pending', 'pass'] as const).map(f => (
              <button key={f} onClick={() => setFilterStatus(f)}
                className={`rounded-lg px-3 py-2 text-[11px] font-mono font-bold uppercase transition-all ${
                  filterStatus === f ? 'bg-tech-cyan text-white' : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800'
                }`}
              >
                {f === 'all' ? 'Tất cả' : f === 'scored' ? 'Đã chấm' : f === 'pending' ? 'Chờ' : 'Vượt qua'}
              </button>
            ))}
          </div>
        </div>

        {/* Table head */}
        <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-slate-900 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">
          <div className="col-span-3">Đội thi</div>
          <div className="col-span-2">Hạng mục</div>
          <div className="col-span-2">Vòng</div>
          <div className="col-span-2">Điểm TB</div>
          <div className="col-span-2">Giám khảo</div>
          <div className="col-span-1 text-center">Trạng Thái</div>
        </div>

        {/* Table rows */}
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Spinner className="animate-spin text-slate-300" size={28} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-mono text-slate-400">Không tìm thấy kết quả.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map(sub => {
              const isExpanded = expandedId === sub.id;
              const avgScore = sub.scores?.length > 0
                ? sub.scores.reduce((a: number, s: any) => a + s.totalScore, 0) / sub.scores.length
                : null;
              const c = avgScore !== null ? scoreColor(avgScore) : null;
              const scored = sub.scores?.length > 0;

              return (
                <div key={sub.id}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                    className={`w-full grid grid-cols-12 gap-3 px-5 py-3.5 items-center text-left transition-colors hover:bg-slate-50 ${isExpanded ? 'bg-cyan-50/60' : 'bg-white'}`}
                  >
                    {/* Team */}
                    <div className="col-span-3">
                      <div className="flex items-center gap-2">
                        {isExpanded ? <CaretUp size={12} className="text-tech-cyan shrink-0" /> : <CaretDown size={12} className="text-slate-300 shrink-0" />}
                        <p className="text-sm font-semibold text-slate-800 truncate">{sub.teamName}</p>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="col-span-2">
                      <span className="inline-block max-w-full truncate rounded-full bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-mono text-indigo-600">
                        {sub.categoryName}
                      </span>
                    </div>

                    {/* Round */}
                    <div className="col-span-2">
                      <span className="text-[10px] font-mono text-slate-500 truncate">{sub.roundName}</span>
                    </div>

                    {/* Score bar */}
                    <div className="col-span-2">
                      {avgScore !== null && c ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className={`h-full rounded-full ${c.bar} transition-all duration-500`} style={{ width: `${Math.min((avgScore / 10) * 100, 100)}%` }} />
                          </div>
                          <span className={`text-sm font-black font-mono w-8 shrink-0 ${c.text}`}>{avgScore.toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-300">Chưa có</span>
                      )}
                    </div>

                    {/* Judge avatars */}
                    <div className="col-span-2">
                      {scored ? (
                        <div className="flex items-center gap-1">
                          {sub.scores.slice(0, 3).map((sc: any) => (
                            <Avatar key={sc.judgeId} name={sc.judgeName || 'J'} />
                          ))}
                          {sub.scores.length > 3 && (
                            <span className="text-[10px] font-mono text-slate-400">+{sub.scores.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono text-amber-500 font-bold">CHƯA CHẤM</span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="col-span-1 flex justify-center">
                      {sub.isAdvanced ? (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[9px] font-bold font-mono text-emerald-700">
                          <ArrowUp size={8} weight="bold" /> PASS
                        </span>
                      ) : scored ? (
                        <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[9px] font-mono text-slate-500">
                          —
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[9px] font-mono text-amber-600 font-bold">
                          CHỜ
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Expanded: per-judge breakdown */}
                  {isExpanded && sub.scores?.length > 0 && (
                    <div className="px-5 pb-4 border-t border-cyan-100 bg-cyan-50/40">
                      <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 pt-3 mb-3">Chi tiết điểm từng giám khảo</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sub.scores.map((sc: any) => {
                          const jc = scoreColor(sc.totalScore);
                          return (
                            <div key={sc.judgeId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Avatar name={sc.judgeName || 'J'} />
                                  <p className="text-sm font-semibold text-slate-700">{sc.judgeName}</p>
                                </div>
                                <span className={`text-lg font-black font-mono ${jc.text}`}>{sc.totalScore.toFixed(1)}</span>
                              </div>
                              {sc.criteriaScores && (
                                <div className="space-y-1.5">
                                  {sc.criteriaScores.map((cr: any, i: number) => {
                                    const cc = scoreColor(cr.score);
                                    return (
                                      <div key={i} className="flex items-center gap-2">
                                        <span className="text-[11px] text-slate-500 w-24 shrink-0 truncate">{cr.name}</span>
                                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                          <div className={`h-full rounded-full ${cc.bar}`} style={{ width: `${(cr.score / 10) * 100}%` }} />
                                        </div>
                                        <span className={`text-[11px] font-mono font-bold w-6 text-right ${cc.text}`}>{cr.score}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              {sc.scoredAt && (
                                <p className="text-[9px] font-mono text-slate-400 mt-2 flex items-center gap-1">
                                  <Clock size={9} />{new Date(sc.scoredAt).toLocaleString('vi-VN')}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {isExpanded && (!sub.scores || sub.scores.length === 0) && (
                    <div className="px-5 pb-4 pt-3 border-t border-amber-100 bg-amber-50/40 text-center">
                      <p className="text-xs text-amber-600 font-mono">Bài này chưa được chấm điểm.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
