import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Trophy, Medal, ArrowLeft, ChartBar, Crown, Lightning, Spinner,
  ArrowUp, ArrowDown, Minus, Users, Star, Clock, Confetti, TrendUp, Fire,
  GithubLogo, Eye
} from '@phosphor-icons/react';

// Demo data
const DEMO_EVENT = {
  id: 'e1111111-1111-1111-1111-111111111111',
  title: 'FPT Edu Hackathon 2026',
  status: 'active',
  rounds: [
    { id: 'r1', name: 'Vòng Đăng Ký & Ý Tưởng', roundOrder: 1, status: 'completed', submissionDeadline: new Date(Date.now() - 86400000 * 5).toISOString() },
    { id: 'r2', name: 'Vòng Sơ Loại Sản Phẩm', roundOrder: 2, status: 'active', submissionDeadline: new Date(Date.now() + 86400000 * 7).toISOString() },
    { id: 'r3', name: 'Chung Kết Tổng', roundOrder: 3, status: 'upcoming', submissionDeadline: new Date(Date.now() + 86400000 * 15).toISOString() },
  ]
};

const DEMO_RANKINGS: Record<string, any> = {
  'r2': {
    roundId: 'r2', roundName: 'Vòng Sơ Loại Sản Phẩm',
    calculatedAt: new Date(Date.now() - 3600000).toISOString(),
    results: [
      { submissionId: 's1', teamName: 'Team Alpha', categoryName: 'Trí Tuệ Nhân Tạo (AI)', totalScore: 92.5, rank: 1, isAdvanced: true, repoUrl: 'https://github.com/alpha/ai' },
      { submissionId: 's2', teamName: 'Team Sigma', categoryName: 'Trí Tuệ Nhân Tạo (AI)', totalScore: 88.0, rank: 2, isAdvanced: true, repoUrl: null },
      { submissionId: 's3', teamName: 'Team Nexus', categoryName: 'Thiết Bị Thông Minh (IoT)', totalScore: 85.5, rank: 3, isAdvanced: true, repoUrl: 'https://github.com/nexus/iot' },
      { submissionId: 's4', teamName: 'Team Nova', categoryName: 'Thiết Bị Thông Minh (IoT)', totalScore: 79.0, rank: 4, isAdvanced: false, repoUrl: null },
      { submissionId: 's5', teamName: 'Team Apex', categoryName: 'Trí Tuệ Nhân Tạo (AI)', totalScore: 74.5, rank: 5, isAdvanced: false, repoUrl: 'https://github.com/apex/ml' },
      { submissionId: 's6', teamName: 'Team Pixel', categoryName: 'Thiết Bị Thông Minh (IoT)', totalScore: 68.0, rank: 6, isAdvanced: false, repoUrl: null },
    ]
  },
  'event': {
    eventId: 'e1', finalRoundName: 'Vòng Sơ Loại Sản Phẩm',
    calculatedAt: new Date(Date.now() - 3600000).toISOString(),
    results: [
      { submissionId: 's1', teamName: 'Team Alpha', categoryName: 'AI', totalScore: 92.5, rank: 1, isAdvanced: true },
      { submissionId: 's2', teamName: 'Team Sigma', categoryName: 'AI', totalScore: 88.0, rank: 2, isAdvanced: true },
      { submissionId: 's3', teamName: 'Team Nexus', categoryName: 'IoT', totalScore: 85.5, rank: 3, isAdvanced: true },
      { submissionId: 's4', teamName: 'Team Nova', categoryName: 'IoT', totalScore: 79.0, rank: 4, isAdvanced: false },
      { submissionId: 's5', teamName: 'Team Apex', categoryName: 'AI', totalScore: 74.5, rank: 5, isAdvanced: false },
      { submissionId: 's6', teamName: 'Team Pixel', categoryName: 'IoT', totalScore: 68.0, rank: 6, isAdvanced: false },
    ]
  }
};

const SCORE_COLOR = (score: number) => {
  if (score >= 90) return '#22c55e';
  if (score >= 80) return '#f59e0b';
  if (score >= 70) return '#f97316';
  return '#ef4444';
};

const MEDAL_CONFIG = [
  { icon: Crown, color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', label: '1ST PLACE', glow: '0 0 20px rgba(251,191,36,0.2)' },
  { icon: Medal, color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.25)', label: '2ND PLACE', glow: '0 0 15px rgba(148,163,184,0.15)' },
  { icon: Medal, color: '#cd7f32', bg: 'rgba(205,127,50,0.08)', border: 'rgba(205,127,50,0.25)', label: '3RD PLACE', glow: '0 0 15px rgba(205,127,50,0.15)' },
];

const ScoreBar: React.FC<{ score: number; max?: number }> = ({ score, max = 100 }) => {
  const pct = Math.min((score / max) * 100, 100);
  const color = SCORE_COLOR(score);
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}40` }}
        />
      </div>
      <span className="text-sm font-black font-mono w-12 text-right" style={{ color }}>{score.toFixed(1)}</span>
    </div>
  );
};

const TopThreeCards: React.FC<{ results: any[] }> = ({ results }) => {
  const top3 = results.slice(0, 3);
  if (top3.length === 0) return null;

  const order = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3.length === 2 ? [top3[1], top3[0]] : [top3[0]];

  return (
    <div className="flex items-end justify-center gap-3 mb-8">
      {order.map((team, displayIdx) => {
        const actualIdx = top3.indexOf(team);
        const cfg = MEDAL_CONFIG[actualIdx];
        const IconComp = cfg.icon;
        const isFirst = actualIdx === 0;

        return (
          <div
            key={team.submissionId}
            className="flex flex-col items-center rounded-2xl border px-5 py-4 transition-all duration-300"
            style={{
              background: cfg.bg,
              borderColor: cfg.border,
              boxShadow: cfg.glow,
              minWidth: 140,
              transform: isFirst ? 'translateY(-12px) scale(1.05)' : 'none',
              zIndex: isFirst ? 1 : 0,
            }}
          >
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border"
              style={{ borderColor: cfg.border, background: 'rgba(15,15,30,0.5)' }}>
              <IconComp size={20} weight="fill" style={{ color: cfg.color }} />
            </div>
            <p className="text-[9px] font-mono font-bold uppercase tracking-widest mb-1" style={{ color: cfg.color }}>
              {cfg.label}
            </p>
            <p className="text-sm font-bold text-white text-center mb-1 truncate max-w-[120px]">{team.teamName}</p>
            <p className="text-[10px] font-mono text-slate-500 text-center mb-2 truncate max-w-[120px]">{team.categoryName}</p>
            <div className="text-2xl font-black font-mono" style={{ color: cfg.color }}>
              {team.totalScore.toFixed(1)}
            </div>
            <div className="text-[10px] font-mono text-slate-600">điểm</div>
          </div>
        );
      })}
    </div>
  );
};

const ResultTable: React.FC<{
  results: any[];
  showCalculate?: boolean;
  onCalculate?: () => void;
  calculating?: boolean;
}> = ({ results, showCalculate, onCalculate, calculating }) => {
  if (results.length === 0) {
    return (
      <div className="py-20 text-center rounded-2xl border border-dashed border-slate-800">
        <ChartBar size={52} className="mx-auto mb-4 text-slate-800" />
        <p className="text-sm font-mono text-slate-600 mb-1">Chưa có kết quả xếp hạng.</p>
        <p className="text-[11px] text-slate-700 font-mono">Cần tính toán xếp hạng để hiển thị kết quả.</p>
        {showCalculate && (
          <button
            onClick={onCalculate}
            disabled={calculating}
            className="mt-5 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white transition-all disabled:opacity-50 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' }}
          >
            {calculating ? <Spinner className="animate-spin" size={16} /> : <Lightning size={16} weight="fill" />}
            {calculating ? 'Đang tính toán...' : 'Tính Xếp Hạng Ngay'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {results.map((r, idx) => {
        const cfg = idx < 3 ? MEDAL_CONFIG[idx] : null;
        const IconComp = cfg?.icon;
        const isTop3 = idx < 3;

        return (
          <div
            key={r.submissionId || idx}
            className="flex items-center gap-4 rounded-xl border px-5 py-4 transition-all duration-200 hover:translate-x-1"
            style={{
              background: isTop3 ? cfg!.bg : 'rgba(15,15,30,0.6)',
              borderColor: isTop3 ? cfg!.border : 'rgba(30,41,59,0.8)',
              boxShadow: isTop3 ? cfg!.glow : 'none'
            }}
          >
            {/* Rank */}
            <div className="w-10 shrink-0 text-center">
              {IconComp ? (
                <IconComp size={22} weight="fill" style={{ color: cfg!.color }} />
              ) : (
                <span className="text-sm font-black font-mono text-slate-600">#{r.rank}</span>
              )}
            </div>

            {/* Team info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-bold text-white truncate">{r.teamName}</p>
                {r.isAdvanced && (
                  <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold font-mono text-emerald-400">
                    <ArrowUp size={9} weight="bold" /> PASS
                  </span>
                )}
              </div>
              <span className="inline-block rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-mono text-indigo-400">
                {r.categoryName}
              </span>
            </div>

            {/* Score bar */}
            <div className="hidden sm:flex flex-1 items-center max-w-[200px]">
              <ScoreBar score={r.totalScore} />
            </div>

            {/* Eliminated badge for non-advanced */}
            {!r.isAdvanced && (
              <span className="hidden sm:inline-flex items-center gap-1 shrink-0 rounded-full bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-mono text-slate-600">
                <Minus size={9} /> DỪNG
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

const StatsCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }> = ({ icon, label, value, sub, color }) => (
  <div className="rounded-2xl border border-slate-800 p-5" style={{ background: 'rgba(15,15,30,0.7)' }}>
    <div className="flex items-center gap-3 mb-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${color}15` }}>
        <div style={{ color }}>{icon}</div>
      </div>
      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-600">{label}</span>
    </div>
    <p className="text-2xl font-black font-mono text-white">{value}</p>
    {sub && <p className="text-[11px] font-mono text-slate-600 mt-0.5">{sub}</p>}
  </div>
);

export const Ranking: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'event' | string>('event');
  const [eventRanking, setEventRanking] = useState<any | null>(null);
  const [roundRankings, setRoundRankings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [showTopThree, setShowTopThree] = useState(true);

  const isOrganizer = user?.role === 'organizer';

  useEffect(() => {
    if (!eventId) return;
    const load = async () => {
      try {
        const ev = await api.events.getById(eventId);
        setEvent(ev || DEMO_EVENT);
        const evRanking = await api.ranking.getEvent(eventId);
        setEventRanking(evRanking || DEMO_RANKINGS['event']);
        const rr: Record<string, any> = {};
        const rounds = (ev || DEMO_EVENT).rounds || [];
        for (const round of rounds) {
          const rk = await api.ranking.getRound(round.id);
          rr[round.id] = rk?.results?.length > 0 ? rk : (DEMO_RANKINGS[round.id] || { results: [] });
        }
        setRoundRankings(rr);
      } catch {
        setEvent(DEMO_EVENT);
        setEventRanking(DEMO_RANKINGS['event']);
        const rr: Record<string, any> = {};
        for (const r of DEMO_EVENT.rounds) {
          rr[r.id] = DEMO_RANKINGS[r.id] || { results: [] };
        }
        setRoundRankings(rr);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [eventId]);

  const handleCalculate = async (roundId: string) => {
    setCalculating(true);
    try {
      const result = await api.ranking.calculate(roundId);
      const finalResult = result?.results?.length > 0 ? result : DEMO_RANKINGS[roundId];
      setRoundRankings(prev => ({ ...prev, [roundId]: finalResult }));
      const evRanking = await api.ranking.getEvent(eventId!);
      setEventRanking(evRanking?.results?.length > 0 ? evRanking : DEMO_RANKINGS['event']);
    } catch {
      setRoundRankings(prev => ({ ...prev, [roundId]: DEMO_RANKINGS[roundId] || { results: [] } }));
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#0a0a14' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          <p className="text-xs font-mono text-slate-600 uppercase tracking-widest">Đang tải kết quả...</p>
        </div>
      </div>
    );
  }

  const currentEvent = event || DEMO_EVENT;
  const activeRound = currentEvent.rounds?.find((r: any) => r.id === activeTab);
  const activeRoundRanking = activeTab !== 'event' ? roundRankings[activeTab] : null;
  const displayResults = activeTab === 'event' ? (eventRanking?.results || DEMO_RANKINGS['event'].results) : (activeRoundRanking?.results || []);
  const advancedCount = displayResults.filter((r: any) => r.isAdvanced).length;

  return (
    <div style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #0f0f1a 50%, #0a0a14 100%)', minHeight: '100vh' }}
      className="text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">

        {/* Back link */}
        <Link to={`/events/${eventId || currentEvent.id}`}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-2 text-xs font-mono text-slate-500 hover:border-slate-700 hover:text-slate-300 transition-all mb-8">
          <ArrowLeft size={13} /> Quay lại sự kiện
        </Link>

        {/* Hero Header */}
        <div className="mb-10 relative">
          <div className="absolute inset-0 -z-10 rounded-3xl opacity-30"
            style={{ background: 'radial-gradient(circle at 50% 0%, rgba(245,158,11,0.3) 0%, transparent 60%)' }} />
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1.5 text-[11px] font-mono font-bold uppercase tracking-widest text-amber-400 mb-4">
              <Confetti size={12} weight="fill" /> Kết quả thi đấu
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">{currentEvent.title}</h1>
            <div className="flex items-center justify-center gap-3 mt-3">
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase font-mono border ${currentEvent.status === 'active' || currentEvent.status === 'ongoing'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}>
                {currentEvent.status?.toUpperCase()}
              </span>
              <span className="text-slate-700 text-xs font-mono">{currentEvent.rounds?.length || 0} vòng thi</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            icon={<Users size={18} />}
            label="Đội tham gia"
            value={displayResults.length}
            sub="trong vòng này"
            color="#6366f1"
          />
          <StatsCard
            icon={<ArrowUp size={18} />}
            label="Đội vượt qua"
            value={advancedCount}
            sub={`/ ${displayResults.length} đội`}
            color="#22c55e"
          />
          <StatsCard
            icon={<Fire size={18} />}
            label="Điểm cao nhất"
            value={displayResults[0]?.totalScore?.toFixed(1) || '—'}
            sub={displayResults[0]?.teamName || 'Chưa có'}
            color="#f59e0b"
          />
          <StatsCard
            icon={<TrendUp size={18} />}
            label="Điểm trung bình"
            value={displayResults.length > 0
              ? (displayResults.reduce((a: number, r: any) => a + r.totalScore, 0) / displayResults.length).toFixed(1)
              : '—'}
            sub="toàn vòng"
            color="#f97316"
          />
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-2xl border border-slate-800 p-1"
          style={{ background: 'rgba(15,15,30,0.8)' }}>
          <button
            onClick={() => setActiveTab('event')}
            className={`shrink-0 rounded-xl px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all ${activeTab === 'event'
              ? 'text-white shadow-lg'
              : 'text-slate-600 hover:text-slate-400'
              }`}
            style={activeTab === 'event' ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : {}}
          >
            <Trophy size={12} className="inline mr-1.5" weight="fill" />
            Tổng thể
          </button>
          {(currentEvent.rounds || []).map((r: any) => (
            <button
              key={r.id}
              onClick={() => setActiveTab(r.id)}
              className={`shrink-0 rounded-xl px-5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all ${activeTab === r.id
                ? 'text-white shadow-lg'
                : 'text-slate-600 hover:text-slate-400'
                }`}
              style={activeTab === r.id ? { background: 'linear-gradient(135deg, #f59e0b, #ea580c)' } : {}}
            >
              <Star size={12} className="inline mr-1.5" weight={r.status === 'active' ? 'fill' : 'regular'} />
              {r.name}
              {r.status === 'active' && (
                <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="rounded-2xl border border-slate-800 overflow-hidden"
          style={{ background: 'rgba(10,10,20,0.8)' }}>

          {/* Section header */}
          <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wide">
                {activeTab === 'event'
                  ? `Xếp hạng chung cuộc (${eventRanking?.finalRoundName || 'Vòng cuối'})`
                  : activeRound?.name
                }
              </h2>
              {activeTab !== 'event' && activeRound && (
                <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                  Hạn nộp: {new Date(activeRound.submissionDeadline).toLocaleString('vi-VN')}
                  &nbsp;·&nbsp;
                  <span className={`font-bold ${activeRound.status === 'active' ? 'text-emerald-400' : activeRound.status === 'completed' ? 'text-slate-500' : 'text-amber-400'}`}>
                    {activeRound.status === 'active' ? 'ĐANG DIỄN RA' : activeRound.status === 'completed' ? 'ĐÃ KẾT THÚC' : 'SẮP DIỄN RA'}
                  </span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {(activeTab === 'event' ? eventRanking?.calculatedAt : activeRoundRanking?.calculatedAt) && (
                <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-600 font-mono">
                  <Clock size={11} />
                  {new Date(activeTab === 'event' ? eventRanking?.calculatedAt : activeRoundRanking?.calculatedAt).toLocaleString('vi-VN')}
                </span>
              )}
              {displayResults.length > 3 && (
                <button
                  onClick={() => setShowTopThree(v => !v)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-[11px] font-mono text-slate-500 hover:text-slate-300 transition-all"
                >
                  {showTopThree ? 'Ẩn' : 'Hiện'} Podium
                </button>
              )}
              {activeTab !== 'event' && isOrganizer && (
                <button
                  onClick={() => activeRound && handleCalculate(activeRound.id)}
                  disabled={calculating}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all disabled:opacity-50 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                >
                  {calculating ? <Spinner className="animate-spin" size={14} /> : <Lightning size={14} weight="fill" />}
                  {calculating ? 'Đang tính...' : 'Tính Xếp Hạng'}
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* Podium - top 3 only */}
            {showTopThree && displayResults.length >= 3 && (
              <TopThreeCards results={displayResults} />
            )}

            {/* Full table */}
            <div>
              {displayResults.length > 3 && (
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-800" />
                  <span className="text-[10px] font-mono text-slate-700 uppercase tracking-widest">Bảng xếp hạng đầy đủ</span>
                  <div className="h-px flex-1 bg-slate-800" />
                </div>
              )}
              <ResultTable
                results={displayResults}
                showCalculate={activeTab !== 'event' && isOrganizer}
                onCalculate={() => activeRound && handleCalculate(activeRound.id)}
                calculating={calculating}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
