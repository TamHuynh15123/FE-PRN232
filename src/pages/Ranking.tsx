import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Trophy, Medal, ArrowLeft, ChartBar, Crown, Lightning, ArrowUp,
  Star, Clock, Spinner, TrendUp
} from '@phosphor-icons/react';

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
      { submissionId: 's1', teamName: 'Team Alpha', categoryName: 'Trí Tuệ Nhân Tạo (AI)', totalScore: 92.5, rank: 1, isAdvanced: true },
      { submissionId: 's2', teamName: 'Team Sigma', categoryName: 'Trí Tuệ Nhân Tạo (AI)', totalScore: 88.0, rank: 2, isAdvanced: true },
      { submissionId: 's3', teamName: 'Team Nexus', categoryName: 'Thiết Bị Thông Minh (IoT)', totalScore: 85.5, rank: 3, isAdvanced: true },
      { submissionId: 's4', teamName: 'Team Nova', categoryName: 'Thiết Bị Thông Minh (IoT)', totalScore: 79.0, rank: 4, isAdvanced: false },
      { submissionId: 's5', teamName: 'Team Apex', categoryName: 'Trí Tuệ Nhân Tạo (AI)', totalScore: 74.5, rank: 5, isAdvanced: false },
      { submissionId: 's6', teamName: 'Team Pixel', categoryName: 'Thiết Bị Thông Minh (IoT)', totalScore: 68.0, rank: 6, isAdvanced: false },
    ]
  },
  'event': {
    finalRoundName: 'Vòng Sơ Loại Sản Phẩm',
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

const scoreColor = (s: number) => {
  if (s >= 85) return { text: 'text-emerald-600', bg: 'bg-emerald-100', bar: 'bg-emerald-400', border: 'border-emerald-200' };
  if (s >= 70) return { text: 'text-tech-cyan', bg: 'bg-cyan-50', bar: 'bg-tech-cyan', border: 'border-cyan-200' };
  if (s >= 55) return { text: 'text-amber-600', bg: 'bg-amber-50', bar: 'bg-amber-400', border: 'border-amber-200' };
  return { text: 'text-rose-500', bg: 'bg-rose-50', bar: 'bg-rose-400', border: 'border-rose-200' };
};

// Top 3 podium config
const PODIUM = [
  { rankLabel: '1ST', icon: Crown, iconClass: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', textColor: 'text-amber-600', height: 'h-28' },
  { rankLabel: '2ND', icon: Medal, iconClass: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', textColor: 'text-slate-500', height: 'h-20' },
  { rankLabel: '3RD', icon: Medal, iconClass: 'text-orange-400', bg: 'bg-orange-50', border: 'border-orange-200', textColor: 'text-orange-500', height: 'h-16' },
];

const ScoreBar: React.FC<{ score: number }> = ({ score }) => {
  const pct = Math.min((score / 10) * 100, 100); // điểm tối đa là 10
  const c = scoreColor(score);
  return (
    <div className="flex items-center gap-2.5 w-full">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${c.bar}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-sm font-black font-mono w-10 text-right ${c.text}`}>{score.toFixed(1)}</span>
    </div>
  );
};

const TopThreeCards: React.FC<{ results: any[] }> = ({ results }) => {
  const top3 = results.slice(0, 3);
  if (top3.length < 1) return null;
  // Order: 2nd, 1st, 3rd for podium visual
  const order = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3.length === 2 ? [top3[1], top3[0]] : [top3[0]];

  return (
    <div className="flex items-end justify-center gap-3 mb-8 pt-4">
      {order.map((team) => {
        const actualIdx = top3.indexOf(team);
        const cfg = PODIUM[actualIdx];
        const IconComp = cfg.icon;
        const isFirst = actualIdx === 0;
        return (
          <div key={team.submissionId}
            className={`flex flex-col items-center rounded-xl border px-5 py-4 transition-all min-w-[130px] ${cfg.bg} ${cfg.border} ${isFirst ? 'shadow-md scale-105 relative' : 'shadow-sm'}`}>
            {isFirst && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-2.5 py-0.5 text-[9px] font-mono font-black text-white uppercase tracking-wider">
                🏆 TOP 1
              </div>
            )}
            <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-full border ${cfg.border} bg-white`}>
              <IconComp size={18} weight="fill" className={cfg.iconClass} />
            </div>
            <p className={`text-[9px] font-mono font-black uppercase tracking-widest mb-1 ${cfg.textColor}`}>
              {cfg.rankLabel}
            </p>
            <p className="text-sm font-bold text-slate-800 text-center truncate max-w-[110px]">{team.teamName}</p>
            <p className="text-[10px] font-mono text-slate-400 text-center truncate max-w-[110px] mb-2">{team.categoryName}</p>
            <span className={`text-xl font-black font-mono ${cfg.textColor}`}>{team.totalScore.toFixed(1)}</span>
            <span className="text-[10px] font-mono text-slate-400">điểm</span>
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
      <div className="py-16 text-center rounded-xl border border-dashed border-slate-200 bg-white">
        <ChartBar size={44} className="mx-auto mb-3 text-slate-200" />
        <p className="text-sm font-mono text-slate-400 mb-1">Chưa có kết quả xếp hạng.</p>
        <p className="text-[11px] text-slate-400 mb-4">Cần tính toán xếp hạng để hiển thị kết quả.</p>
        {showCalculate && (
          <button onClick={onCalculate} disabled={calculating}
            className="inline-flex items-center gap-2 rounded-lg bg-tech-cyan px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-50">
            {calculating ? <Spinner className="animate-spin" size={15} /> : <Lightning size={15} weight="fill" />}
            {calculating ? 'Đang tính toán...' : 'Tính Xếp Hạng Ngay'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      {/* Table header */}
      <div className="grid grid-cols-12 gap-3 px-5 py-3 bg-slate-900 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">
        <div className="col-span-1">Hạng</div>
        <div className="col-span-4">Đội thi</div>
        <div className="col-span-3">Hạng mục</div>
        <div className="col-span-3">Điểm</div>
        <div className="col-span-1 text-center">Trạng thái</div>
      </div>

      <div className="divide-y divide-slate-100">
        {results.map((r, idx) => {
          const isTop3 = idx < 3;
          const c = scoreColor(r.totalScore);
          const PodiumIcon = idx < 3 ? PODIUM[idx].icon : null;

          return (
            <div key={r.submissionId || idx}
              className={`grid grid-cols-12 gap-3 px-5 py-3.5 items-center transition-colors hover:bg-slate-50 ${isTop3 ? 'bg-amber-50/40' : 'bg-white'}`}>

              {/* Rank */}
              <div className="col-span-1">
                {PodiumIcon && idx < 3 ? (
                  <PodiumIcon size={20} weight="fill" className={PODIUM[idx].iconClass} />
                ) : (
                  <span className="text-sm font-bold font-mono text-slate-400">#{r.rank}</span>
                )}
              </div>

              {/* Team */}
              <div className="col-span-4">
                <p className="text-sm font-semibold text-slate-800 truncate">{r.teamName}</p>
              </div>

              {/* Category */}
              <div className="col-span-3">
                <span className="inline-block rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-[10px] font-mono text-indigo-600 truncate max-w-full">
                  {r.categoryName}
                </span>
              </div>

              {/* Score */}
              <div className="col-span-3">
                <ScoreBar score={r.totalScore} />
              </div>

              {/* Status */}
              <div className="col-span-1 flex justify-center">
                {r.isAdvanced ? (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold font-mono text-emerald-700">
                    <ArrowUp size={9} weight="bold" /> PASS
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-mono text-slate-500">
                    —
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Ranking: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'event' | string>('event');
  const [eventRanking, setEventRanking] = useState<any | null>(null);
  const [roundRankings, setRoundRankings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const isOrganizer = user?.role === 'organizer';

  useEffect(() => {
    if (!eventId) return;
    const load = async () => {
      try {
        const ev = await api.events.getById(eventId);
        setEvent(ev || DEMO_EVENT);
        const evRanking = await api.ranking.getEvent(eventId);
        setEventRanking(evRanking?.results?.length > 0 ? evRanking : DEMO_RANKINGS['event']);
        const rr: Record<string, any> = {};
        for (const round of (ev || DEMO_EVENT).rounds || []) {
          const rk = await api.ranking.getRound(round.id);
          rr[round.id] = rk?.results?.length > 0 ? rk : (DEMO_RANKINGS[round.id] || { results: [] });
        }
        setRoundRankings(rr);
      } catch {
        setEvent(DEMO_EVENT);
        setEventRanking(DEMO_RANKINGS['event']);
        const rr: Record<string, any> = {};
        for (const r of DEMO_EVENT.rounds) rr[r.id] = DEMO_RANKINGS[r.id] || { results: [] };
        setRoundRankings(rr);
      } finally { setLoading(false); }
    };
    load();
  }, [eventId]);

  const handleCalculate = async (roundId: string) => {
    setCalculating(true);
    try {
      const result = await api.ranking.calculate(roundId);
      setRoundRankings(prev => ({ ...prev, [roundId]: result?.results?.length > 0 ? result : DEMO_RANKINGS[roundId] }));
      const evRanking = await api.ranking.getEvent(eventId!);
      setEventRanking(evRanking?.results?.length > 0 ? evRanking : DEMO_RANKINGS['event']);
    } catch {
      setRoundRankings(prev => ({ ...prev, [roundId]: DEMO_RANKINGS[roundId] || { results: [] } }));
    } finally { setCalculating(false); }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-tech-cyan border-t-transparent" />
      </div>
    );
  }

  const currentEvent = event || DEMO_EVENT;
  const activeRound = currentEvent.rounds?.find((r: any) => r.id === activeTab);
  const activeRoundRanking = activeTab !== 'event' ? roundRankings[activeTab] : null;
  const displayResults = activeTab === 'event'
    ? (eventRanking?.results || DEMO_RANKINGS['event'].results)
    : (activeRoundRanking?.results || []);

  const advancedCount = displayResults.filter((r: any) => r.isAdvanced).length;
  const avgScore = displayResults.filter((r: any) => r.totalScore > 0).length > 0
    ? displayResults.filter((r: any) => r.totalScore > 0).reduce((a: number, r: any) => a + r.totalScore, 0) / displayResults.filter((r: any) => r.totalScore > 0).length
    : 0;
  const topScore = displayResults[0]?.totalScore || 0;

  const calcAt = activeTab === 'event' ? eventRanking?.calculatedAt : activeRoundRanking?.calculatedAt;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Back */}
      <Link to={`/events/${eventId || currentEvent.id}`}
        className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-tech-cyan mb-6 transition-colors font-mono uppercase tracking-wide">
        <ArrowLeft size={13} /> Quay lại sự kiện
      </Link>

      {/* Header */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 border border-amber-200 shrink-0">
            <Trophy size={24} weight="fill" className="text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 mb-0.5">Bảng xếp hạng</p>
            <h1 className="text-xl font-black text-slate-900">{currentEvent.title}</h1>
          </div>
        </div>
        <span className={`self-start md:self-center rounded-full px-3 py-1 text-[10px] font-bold uppercase font-mono border ${
          currentEvent.status === 'active' || currentEvent.status === 'ongoing'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-slate-100 border-slate-200 text-slate-500'
        }`}>
          {currentEvent.status?.toUpperCase()}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Đội tham gia', value: displayResults.length, icon: <Trophy size={16} />, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' },
          { label: 'Đội vượt qua', value: advancedCount, icon: <ArrowUp size={16} />, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
          { label: 'Điểm cao nhất', value: topScore > 0 ? topScore.toFixed(1) : '—', icon: <Star size={16} weight="fill" />, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
          { label: 'Điểm trung bình', value: avgScore > 0 ? avgScore.toFixed(1) : '—', icon: <TrendUp size={16} />, color: 'text-tech-cyan', bg: 'bg-cyan-50', border: 'border-cyan-100' },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl border bg-white p-4 shadow-sm`}>
            <div className={`inline-flex items-center justify-center h-8 w-8 rounded-lg ${s.bg} border ${s.border} mb-2`}>
              <div className={s.color}>{s.icon}</div>
            </div>
            <p className="text-2xl font-black font-mono text-slate-900">{s.value}</p>
            <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 border border-slate-200 p-1">
        <button
          onClick={() => setActiveTab('event')}
          className={`shrink-0 rounded-lg px-4 py-2 text-xs font-mono font-bold uppercase tracking-wide transition-all ${
            activeTab === 'event' ? 'bg-white text-tech-cyan shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trophy size={12} className="inline mr-1.5" weight="fill" />
          Tổng thể
        </button>
        {(currentEvent.rounds || []).map((r: any) => (
          <button key={r.id} onClick={() => setActiveTab(r.id)}
            className={`shrink-0 rounded-lg px-4 py-2 text-xs font-mono font-bold uppercase tracking-wide transition-all flex items-center gap-1.5 ${
              activeTab === r.id ? 'bg-white text-tech-cyan shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {r.name}
            {r.status === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-700 font-mono uppercase">
              {activeTab === 'event'
                ? `Xếp hạng chung cuộc (${eventRanking?.finalRoundName || 'Vòng cuối'})`
                : activeRound?.name}
            </h2>
            {activeTab !== 'event' && activeRound && (
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Hạn nộp: {new Date(activeRound.submissionDeadline).toLocaleString('vi-VN')}
                {' · '}
                <span className={`font-bold ${activeRound.status === 'active' ? 'text-emerald-500' : activeRound.status === 'completed' ? 'text-slate-400' : 'text-amber-500'}`}>
                  {activeRound.status === 'active' ? 'ĐANG DIỄN RA' : activeRound.status === 'completed' ? 'ĐÃ KẾT THÚC' : 'SẮP DIỄN RA'}
                </span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {calcAt && (
              <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                <Clock size={11} />
                {new Date(calcAt).toLocaleString('vi-VN')}
              </span>
            )}
            {activeTab !== 'event' && isOrganizer && (
              <button
                onClick={() => activeRound && handleCalculate(activeRound.id)}
                disabled={calculating}
                className="inline-flex items-center gap-1.5 rounded-lg bg-tech-cyan px-4 py-2 text-xs font-bold text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {calculating ? <Spinner className="animate-spin" size={13} /> : <Lightning size={13} weight="fill" />}
                {calculating ? 'Đang tính...' : 'Tính Xếp Hạng'}
              </button>
            )}
          </div>
        </div>

        <div className="p-5">
          {/* Podium — chỉ hiện khi có ít nhất 3 kết quả */}
          {displayResults.length >= 3 && <TopThreeCards results={displayResults} />}

          {displayResults.length >= 3 && (
            <div className="mb-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Bảng xếp hạng đầy đủ</span>
              <div className="h-px flex-1 bg-slate-100" />
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
  );
};
