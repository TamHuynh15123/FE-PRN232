import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ChartBar, Trophy, Users, Star, Clock, Lightning, ArrowLeft, Warning,
  GithubLogo, CheckCircle, Eye, Funnel, MagnifyingGlass, Download,
  ArrowUp, ArrowDown, CaretUpDown, Spinner, SealCheck, Minus
} from '@phosphor-icons/react';

// Demo data
const DEMO_SUBMISSIONS = [
  {
    id: 'sub1', teamId: 't1', teamName: 'Team Alpha', roundId: 'r2', roundName: 'Vòng Sơ Loại',
    categoryName: 'Trí Tuệ Nhân Tạo (AI)',
    repoUrl: 'https://github.com/alpha/ai',
    scores: [
      { judgeId: 'j1', judgeName: 'Giám Khảo Nội Bộ', totalScore: 94, criteriaScores: [{ name: 'Sáng Tạo', score: 9.5, weight: 0.3 }, { name: 'Thực Tiễn', score: 9.0, weight: 0.3 }, { name: 'Kỹ Thuật', score: 9.5, weight: 0.4 }] },
      { judgeId: 'j2', judgeName: 'Giám Khảo Khách Mời', totalScore: 91, criteriaScores: [{ name: 'Sáng Tạo', score: 9.0, weight: 0.3 }, { name: 'Thực Tiễn', score: 8.5, weight: 0.3 }, { name: 'Kỹ Thuật', score: 9.5, weight: 0.4 }] },
    ],
    avgScore: 92.5, rank: 1, isAdvanced: true, submittedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'sub2', teamId: 't2', teamName: 'Team Sigma', roundId: 'r2', roundName: 'Vòng Sơ Loại',
    categoryName: 'Trí Tuệ Nhân Tạo (AI)',
    repoUrl: null,
    scores: [
      { judgeId: 'j1', judgeName: 'Giám Khảo Nội Bộ', totalScore: 88, criteriaScores: [{ name: 'Sáng Tạo', score: 8.5, weight: 0.3 }, { name: 'Thực Tiễn', score: 9.0, weight: 0.3 }, { name: 'Kỹ Thuật', score: 8.5, weight: 0.4 }] },
      { judgeId: 'j2', judgeName: 'Giám Khảo Khách Mời', totalScore: 88, criteriaScores: [{ name: 'Sáng Tạo', score: 8.0, weight: 0.3 }, { name: 'Thực Tiễn', score: 9.5, weight: 0.3 }, { name: 'Kỹ Thuật', score: 8.5, weight: 0.4 }] },
    ],
    avgScore: 88.0, rank: 2, isAdvanced: true, submittedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'sub3', teamId: 't3', teamName: 'Team Nexus', roundId: 'r2', roundName: 'Vòng Sơ Loại',
    categoryName: 'Thiết Bị Thông Minh (IoT)',
    repoUrl: 'https://github.com/nexus/iot',
    scores: [
      { judgeId: 'j1', judgeName: 'Giám Khảo Nội Bộ', totalScore: 82, criteriaScores: [{ name: 'Sáng Tạo', score: 8.0, weight: 0.3 }, { name: 'Thực Tiễn', score: 8.5, weight: 0.3 }, { name: 'Kỹ Thuật', score: 8.5, weight: 0.4 }] },
      { judgeId: 'j2', judgeName: 'Giám Khảo Khách Mời', totalScore: 89, criteriaScores: [{ name: 'Sáng Tạo', score: 9.0, weight: 0.3 }, { name: 'Thực Tiễn', score: 8.5, weight: 0.3 }, { name: 'Kỹ Thuật', score: 9.0, weight: 0.4 }] },
    ],
    avgScore: 85.5, rank: 3, isAdvanced: true, submittedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'sub4', teamId: 't4', teamName: 'Team Nova', roundId: 'r2', roundName: 'Vòng Sơ Loại',
    categoryName: 'Thiết Bị Thông Minh (IoT)',
    repoUrl: 'https://github.com/nova/grid',
    scores: [
      { judgeId: 'j1', judgeName: 'Giám Khảo Nội Bộ', totalScore: 79, criteriaScores: [{ name: 'Sáng Tạo', score: 7.5, weight: 0.3 }, { name: 'Thực Tiễn', score: 8.0, weight: 0.3 }, { name: 'Kỹ Thuật', score: 8.0, weight: 0.4 }] },
    ],
    avgScore: 79.0, rank: 4, isAdvanced: false, submittedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'sub5', teamId: 't5', teamName: 'Team Apex', roundId: 'r2', roundName: 'Vòng Sơ Loại',
    categoryName: 'Trí Tuệ Nhân Tạo (AI)',
    repoUrl: null,
    scores: [],
    avgScore: 0, rank: 5, isAdvanced: false, submittedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

const DEMO_ROUNDS = [
  { id: 'r2', name: 'Vòng Sơ Loại Sản Phẩm', status: 'active' },
  { id: 'r1', name: 'Vòng Đăng Ký & Ý Tưởng', status: 'completed' },
];

const DEMO_JUDGES = [
  { id: 'j1', name: 'Giám Khảo Nội Bộ', role: 'judge_internal', scored: 4, total: 5 },
  { id: 'j2', name: 'Giám Khảo Khách Mời', role: 'judge_guest', scored: 3, total: 5 },
];

const scoreColor = (s: number) => {
  if (s >= 90) return '#22c55e';
  if (s >= 80) return '#f59e0b';
  if (s >= 70) return '#f97316';
  if (s > 0) return '#ef4444';
  return '#334155';
};

const MiniBar: React.FC<{ value: number; max?: number }> = ({ value, max = 100 }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const color = scoreColor(value);
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, transition: 'width 0.6s ease' }} />
      </div>
      <span className="text-xs font-mono font-bold w-8" style={{ color: value > 0 ? color : '#475569' }}>
        {value > 0 ? value.toFixed(1) : '—'}
      </span>
    </div>
  );
};

type SortKey = 'rank' | 'avgScore' | 'team' | 'scored';
type SortDir = 'asc' | 'desc';

export const ScoreOverview: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [rounds, setRounds] = useState<any[]>([]);
  const [judges, setJudges] = useState<any[]>([]);
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'scored' | 'pending' | 'advanced'>('all');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);

  const isOrganizer = user?.role === 'organizer';

  useEffect(() => {
    const load = async () => {
      try {
        const ev = await api.events.getById(eventId || '');
        setRounds(ev?.rounds || DEMO_ROUNDS);
        const firstRound = (ev?.rounds || DEMO_ROUNDS)[0];
        setSelectedRound(firstRound?.id || 'r2');
      } catch {
        setRounds(DEMO_ROUNDS);
        setSelectedRound('r2');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

  // Load submissions + scores for selected round from real API
  useEffect(() => {
    if (!selectedRound) return;

    const loadRoundData = async () => {
      setLoading(true);
      try {
        // 1. Lấy danh sách bài nộp của vòng thi
        const rawSubs: any[] = await api.submissions.getByRound(selectedRound).catch(() => []);

        // 2. Lấy ranking để có rank + isAdvanced
        const ranking: any = await api.ranking.getRound(selectedRound).catch(() => ({ results: [] }));
        const rankMap: Record<string, any> = {};
        for (const r of (ranking?.results || [])) {
          rankMap[r.submissionId] = r;
        }

        // 3. Lấy scores cho từng submission
        const enriched = await Promise.all(rawSubs.map(async (sub: any) => {
          const scoreResponses: any[] = await api.scoring.getScores(sub.id).catch(() => []);

          const scores = scoreResponses.map((sr: any) => ({
            judgeId: sr.judgeId,
            judgeName: sr.judgeName,
            totalScore: sr.totalScore,
            criteriaScores: (sr.scores || []).map((c: any) => ({
              name: c.criteriaName,
              score: c.score,
              weight: c.weight,
            })),
          }));

          const rkInfo = rankMap[sub.id];
          const avgScore = scores.length > 0
            ? scores.reduce((acc: number, s: any) => acc + s.totalScore, 0) / scores.length
            : 0;

          return {
            id: sub.id,
            teamId: sub.teamId,
            teamName: sub.team?.name || rkInfo?.teamName || `Team #${sub.teamId?.slice(0, 6)}`,
            roundId: sub.roundId,
            roundName: sub.round?.name || '',
            categoryName: sub.team?.category?.name || rkInfo?.categoryName || 'Hạng mục',
            repoUrl: sub.repoUrl,
            scores,
            avgScore: rkInfo?.totalScore ?? avgScore,
            rank: rkInfo?.rank ?? 0,
            isAdvanced: rkInfo?.isAdvanced ?? false,
            submittedAt: sub.submittedAt,
          };
        }));

        // 4. Tổng hợp danh sách giám khảo từ dữ liệu điểm
        const judgeMap: Record<string, any> = {};
        for (const sub of enriched) {
          for (const s of sub.scores) {
            if (!judgeMap[s.judgeId]) {
              judgeMap[s.judgeId] = { id: s.judgeId, name: s.judgeName, role: 'judge', scored: 0, total: enriched.length };
            }
            judgeMap[s.judgeId].scored += 1;
          }
        }

        if (enriched.length > 0) {
          setSubmissions(enriched);
          setJudges(Object.values(judgeMap));
        } else {
          // Fallback demo khi không có dữ liệu
          setSubmissions(DEMO_SUBMISSIONS.filter(s => s.roundId === selectedRound || !DEMO_SUBMISSIONS.some(d => d.roundId === selectedRound)));
          setJudges(DEMO_JUDGES);
        }
      } catch {
        setSubmissions(DEMO_SUBMISSIONS);
        setJudges(DEMO_JUDGES);
      } finally {
        setLoading(false);
      }
    };

    loadRoundData();
  }, [selectedRound]);

  const categories = Array.from(new Set(submissions.map(s => s.categoryName)));

  const filtered = submissions
    .filter(s => {
      if (search && !s.teamName.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategory && s.categoryName !== filterCategory) return false;
      if (filterStatus === 'scored' && s.scores.length === 0) return false;
      if (filterStatus === 'pending' && s.scores.length > 0) return false;
      if (filterStatus === 'advanced' && !s.isAdvanced) return false;
      return true;
    })
    .sort((a, b) => {
      let va: any, vb: any;
      switch (sortKey) {
        case 'rank': va = a.rank; vb = b.rank; break;
        case 'avgScore': va = a.avgScore; vb = b.avgScore; break;
        case 'team': va = a.teamName; vb = b.teamName; break;
        case 'scored': va = a.scores.length; vb = b.scores.length; break;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const totalScored = submissions.filter(s => s.scores.length > 0).length;
  const totalPending = submissions.filter(s => s.scores.length === 0).length;
  const totalAdvanced = submissions.filter(s => s.isAdvanced).length;
  const avgAll = submissions.filter(s => s.avgScore > 0).length > 0
    ? submissions.filter(s => s.avgScore > 0).reduce((a, s) => a + s.avgScore, 0) / submissions.filter(s => s.avgScore > 0).length
    : 0;

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      await api.ranking.calculate(selectedRound);
      // Reload data sau khi tính xong
      const prev = selectedRound;
      setSelectedRound('');
      setTimeout(() => setSelectedRound(prev), 100);
    } catch {
      // ignore
    } finally {
      setCalculating(false);
    }
  };

  if (!isOrganizer && user) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#0a0a14' }}>
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-12 text-center max-w-md">
          <Warning size={52} className="mx-auto mb-4 text-rose-400" weight="fill" />
          <h1 className="text-xl font-black text-white font-mono uppercase mb-2">Không có quyền truy cập</h1>
          <p className="text-sm text-slate-500">Trang này chỉ dành cho Ban Tổ Chức.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#0a0a14' }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    );
  }

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <CaretUpDown size={12} className="text-slate-700" />;
    return sortDir === 'asc' ? <ArrowUp size={12} className="text-amber-400" /> : <ArrowDown size={12} className="text-amber-400" />;
  };

  return (
    <div style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #0f0f1a 50%, #0a0a14 100%)', minHeight: '100vh' }}
      className="text-white">
      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* Back link */}
        <Link to={eventId ? `/events/${eventId}` : '/organizer'}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2 text-xs font-mono text-slate-500 hover:border-slate-700 hover:text-slate-300 transition-all mb-8">
          <ArrowLeft size={13} /> Quay lại
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <ChartBar size={26} weight="fill" className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white font-mono uppercase tracking-tight">
                TỔNG QUAN ĐIỂM SỐ
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">Score Overview · Ban Tổ Chức</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCalculate}
              disabled={calculating}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all disabled:opacity-50 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,0.25)' }}
            >
              {calculating ? <Spinner size={16} className="animate-spin" /> : <Lightning size={16} weight="fill" />}
              {calculating ? 'Đang tính...' : 'Tính Xếp Hạng'}
            </button>
            <Link
              to={`/ranking/${eventId}`}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-5 py-2.5 text-sm font-bold text-slate-300 hover:border-amber-500/50 hover:text-amber-400 transition-all"
            >
              <Trophy size={16} /> Xem Bảng Xếp Hạng
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Bài đã chấm', value: totalScored, total: submissions.length, color: '#22c55e', icon: <SealCheck size={18} /> },
            { label: 'Chờ chấm điểm', value: totalPending, total: submissions.length, color: '#f59e0b', icon: <Clock size={18} /> },
            { label: 'Đội vượt qua', value: totalAdvanced, total: submissions.length, color: '#6366f1', icon: <ArrowUp size={18} /> },
            { label: 'Điểm TB vòng', value: avgAll > 0 ? avgAll.toFixed(1) : '—', total: null, color: '#f97316', icon: <Star size={18} weight="fill" /> },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-slate-800 p-5 relative overflow-hidden"
              style={{ background: 'rgba(15,15,30,0.8)' }}>
              <div className="absolute top-0 right-0 h-20 w-20 rounded-bl-full opacity-5"
                style={{ background: s.color }} />
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: `${s.color}15`, color: s.color }}>
                  {s.icon}
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-600">{s.label}</span>
              </div>
              <p className="text-2xl font-black font-mono text-white">{s.value}</p>
              {s.total != null && (
                <div className="mt-2">
                  <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${s.total > 0 ? ((s.value as number) / s.total) * 100 : 0}%`, background: s.color }} />
                  </div>
                  <p className="text-[10px] font-mono text-slate-700 mt-1">/ {s.total} tổng</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Judge Progress */}
        <div className="mb-6 rounded-2xl border border-slate-800 p-5"
          style={{ background: 'rgba(15,15,30,0.8)' }}>
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-600 mb-4">
            Tiến độ chấm điểm của Giám Khảo
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {judges.map(judge => (
              <div key={judge.id} className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                  <Users size={16} className="text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{judge.name}</p>
                  <p className="text-[10px] font-mono text-slate-600">{judge.role.replace(/_/g, ' ')}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black font-mono text-white">{judge.scored}<span className="text-slate-600">/{judge.total}</span></p>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-16 h-1 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-400"
                        style={{ width: `${judge.total > 0 ? (judge.scored / judge.total) * 100 : 0}%`, transition: 'width 0.6s ease' }} />
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">
                      {judge.total > 0 ? Math.round((judge.scored / judge.total) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Filters & Table */}
        <div className="rounded-2xl border border-slate-800 overflow-hidden"
          style={{ background: 'rgba(10,10,20,0.9)' }}>

          {/* Filter bar */}
          <div className="px-5 py-4 border-b border-slate-800 flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlass size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600" />
              <input
                type="text"
                placeholder="Tìm kiếm đội..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-700 focus:border-indigo-500/50 focus:outline-none font-mono"
              />
            </div>

            {/* Round selector */}
            <select
              value={selectedRound}
              onChange={e => setSelectedRound(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-slate-300 focus:border-indigo-500/50 focus:outline-none font-mono min-w-[160px]"
            >
              {rounds.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            {/* Category filter */}
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-sm text-slate-300 focus:border-indigo-500/50 focus:outline-none font-mono min-w-[140px]"
            >
              <option value="">Tất cả hạng mục</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Status filter */}
            <div className="flex gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1">
              {(['all', 'scored', 'pending', 'advanced'] as const).map(s => (
                <button key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-mono font-bold uppercase transition-all ${filterStatus === s ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-300'}`}>
                  {s === 'all' ? 'Tất cả' : s === 'scored' ? 'Đã chấm' : s === 'pending' ? 'Chờ chấm' : 'Vượt qua'}
                </button>
              ))}
            </div>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b border-slate-800/50 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600">
            <div className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-slate-400" onClick={() => toggleSort('rank')}>
              Hạng <SortIcon k="rank" />
            </div>
            <div className="col-span-3 flex items-center gap-1 cursor-pointer hover:text-slate-400" onClick={() => toggleSort('team')}>
              Đội thi <SortIcon k="team" />
            </div>
            <div className="col-span-2">Hạng mục</div>
            <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-slate-400" onClick={() => toggleSort('avgScore')}>
              Điểm TB <SortIcon k="avgScore" />
            </div>
            <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-slate-400" onClick={() => toggleSort('scored')}>
              Giám khảo chấm <SortIcon k="scored" />
            </div>
            <div className="col-span-1">Trạng thái</div>
            <div className="col-span-1 text-right">Chi tiết</div>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-slate-800/40">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <Funnel size={40} className="mx-auto mb-3 text-slate-800" />
                <p className="text-sm font-mono text-slate-600">Không có bài nộp nào phù hợp.</p>
              </div>
            ) : filtered.map(sub => {
              const isExpanded = expandedRow === sub.id;
              const hasScores = sub.scores.length > 0;

              return (
                <div key={sub.id}>
                  {/* Main row */}
                  <div
                    className={`grid grid-cols-12 gap-3 px-5 py-4 cursor-pointer transition-all duration-150 ${isExpanded ? 'bg-slate-800/30' : 'hover:bg-slate-800/20'}`}
                    onClick={() => setExpandedRow(isExpanded ? null : sub.id)}
                  >
                    {/* Rank */}
                    <div className="col-span-1 flex items-center">
                      <span className={`text-sm font-black font-mono ${sub.rank <= 3 ? 'text-amber-400' : 'text-slate-500'}`}>
                        #{sub.rank}
                      </span>
                    </div>

                    {/* Team */}
                    <div className="col-span-3 flex items-center gap-2 min-w-0">
                      <div>
                        <p className="text-sm font-bold text-white truncate">{sub.teamName}</p>
                        {sub.repoUrl && (
                          <a href={sub.repoUrl} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] font-mono text-slate-600 hover:text-indigo-400 transition-colors"
                            onClick={e => e.stopPropagation()}>
                            <GithubLogo size={10} />
                            {sub.repoUrl.replace('https://github.com/', '').substring(0, 20)}...
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Category */}
                    <div className="col-span-2 flex items-center">
                      <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-mono text-indigo-400 truncate">
                        {sub.categoryName.split('(')[0].trim()}
                      </span>
                    </div>

                    {/* Avg Score */}
                    <div className="col-span-2 flex items-center">
                      <MiniBar value={sub.avgScore} />
                    </div>

                    {/* Judge scoring progress */}
                    <div className="col-span-2 flex items-center">
                      <div className="flex items-center gap-2">
                        {sub.scores.length === 0 ? (
                          <span className="text-[11px] font-mono text-slate-700">Chưa có điểm</span>
                        ) : (
                          <>
                            <div className="flex gap-1">
                              {sub.scores.map((sc: any, i: number) => (
                                <div key={i} title={sc.judgeName}
                                  className="h-5 w-5 rounded-full border flex items-center justify-center"
                                  style={{ borderColor: 'rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.1)' }}>
                                  <span className="text-[9px] font-mono text-indigo-400 font-bold">{sc.judgeName[0]}</span>
                                </div>
                              ))}
                            </div>
                            <span className="text-[11px] font-mono text-slate-500">{sub.scores.length} giám khảo</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-1 flex items-center">
                      {sub.isAdvanced ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold font-mono text-emerald-400">
                          <ArrowUp size={9} weight="bold" /> PASS
                        </span>
                      ) : hasScores ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-mono text-slate-600">
                          <Minus size={9} /> DỪNG
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-mono text-amber-600">
                          <Clock size={9} /> CHỜ
                        </span>
                      )}
                    </div>

                    {/* Expand */}
                    <div className="col-span-1 flex items-center justify-end">
                      <button className={`flex h-7 w-7 items-center justify-center rounded-lg border transition-all ${isExpanded ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400' : 'border-slate-800 text-slate-600 hover:border-slate-700 hover:text-slate-400'}`}>
                        <Eye size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded: per-judge breakdown */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-slate-800/40"
                      style={{ background: 'rgba(10,10,20,0.5)' }}>
                      <div className="pt-4">
                        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-600 mb-3">
                          Chi tiết điểm theo từng giám khảo
                        </p>

                        {sub.scores.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-800 py-8 text-center">
                            <Clock size={28} className="mx-auto mb-2 text-slate-800" />
                            <p className="text-xs font-mono text-slate-700">Chưa có giám khảo nào chấm điểm bài này.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sub.scores.map((sc: any, i: number) => (
                              <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                      <span className="text-xs font-mono font-bold text-indigo-400">{sc.judgeName[0]}</span>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-white">{sc.judgeName}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-black font-mono" style={{ color: scoreColor(sc.totalScore) }}>
                                      {sc.totalScore.toFixed(1)}
                                    </p>
                                    <p className="text-[10px] font-mono text-slate-700">/ 100</p>
                                  </div>
                                </div>

                                {sc.criteriaScores && (
                                  <div className="space-y-2">
                                    {sc.criteriaScores.map((cs: any, ci: number) => (
                                      <div key={ci} className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono text-slate-600 w-24 shrink-0 truncate">{cs.name}</span>
                                        <div className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden">
                                          <div className="h-full rounded-full"
                                            style={{ width: `${(cs.score / 10) * 100}%`, background: scoreColor(cs.score * 10), transition: 'width 0.5s ease' }} />
                                        </div>
                                        <span className="text-[10px] font-mono font-bold text-slate-400 w-6 text-right">{cs.score}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 flex justify-end">
                          <p className="text-[10px] font-mono text-slate-700">
                            Nộp lúc: {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-700">
              Hiển thị {filtered.length} / {submissions.length} bài nộp
            </span>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-[11px] font-mono text-slate-500 hover:border-slate-700 hover:text-slate-300 transition-all">
              <Download size={12} /> Xuất CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
