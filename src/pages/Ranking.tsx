import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Trophy, Medal, ArrowUp, ArrowLeft, ChartBar, Spinner, Crown, Lightning } from '@phosphor-icons/react';

const MEDAL_COLORS = ['text-yellow-500', 'text-slate-400', 'text-amber-700'];
const MEDAL_ICONS = [
  <Crown size={18} weight="fill" className="text-yellow-500" />,
  <Medal size={18} weight="fill" className="text-slate-400" />,
  <Medal size={18} weight="fill" className="text-amber-700" />,
];

const RankBadge: React.FC<{ rank: number; isAdvanced: boolean }> = ({ rank, isAdvanced }) => {
  if (rank <= 3) {
    return (
      <div className={`flex items-center gap-1.5 ${MEDAL_COLORS[rank - 1]} font-mono font-black text-base`}>
        {MEDAL_ICONS[rank - 1]} #{rank}
      </div>
    );
  }
  return (
    <span className="font-mono font-bold text-slate-500 text-sm">#{rank}</span>
  );
};

const ResultTable: React.FC<{ results: any[]; showCalculate?: boolean; onCalculate?: () => void; calculating?: boolean }> = ({
  results, showCalculate, onCalculate, calculating
}) => {
  if (results.length === 0) {
    return (
      <div className="py-16 text-center">
        <ChartBar size={48} className="mx-auto mb-3 text-slate-200" />
        <p className="text-sm font-mono text-slate-400">Chưa có kết quả xếp hạng.</p>
        {showCalculate && (
          <button
            onClick={onCalculate}
            disabled={calculating}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
          >
            {calculating ? <Spinner className="animate-spin" size={16} /> : <Lightning size={16} weight="fill" />}
            {calculating ? 'Đang tính toán...' : 'Tính Xếp Hạng Ngay'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-900 text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
            <th className="px-6 py-4 w-20">Hạng</th>
            <th className="px-6 py-4">Đội thi</th>
            <th className="px-6 py-4">Hạng mục</th>
            <th className="px-6 py-4 text-right">Điểm tổng</th>
            <th className="px-6 py-4 text-center">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {results.map((r, idx) => (
            <tr
              key={r.submissionId || idx}
              className={`transition-colors ${
                r.rank <= 3 ? 'bg-amber-50/60 hover:bg-amber-50' : 'bg-white hover:bg-slate-50'
              }`}
            >
              <td className="px-6 py-4">
                <RankBadge rank={r.rank} isAdvanced={r.isAdvanced} />
              </td>
              <td className="px-6 py-4">
                <span className="font-semibold text-slate-800">{r.teamName}</span>
              </td>
              <td className="px-6 py-4">
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-700">{r.categoryName}</span>
              </td>
              <td className="px-6 py-4 text-right">
                <span className={`text-lg font-black font-mono ${r.rank <= 3 ? 'text-amber-600' : 'text-slate-700'}`}>
                  {r.totalScore?.toFixed(2)}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                {r.isAdvanced ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    <ArrowUp size={10} weight="bold" /> Đi tiếp
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">
                    Dừng lại
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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
        setEvent(ev);
        // Load event-level ranking
        const evRanking = await api.ranking.getEvent(eventId);
        setEventRanking(evRanking);
        // Load per-round rankings
        const rr: Record<string, any> = {};
        for (const round of ev.rounds || []) {
          const rk = await api.ranking.getRound(round.id);
          rr[round.id] = rk;
        }
        setRoundRankings(rr);
      } catch (e) {
        console.error(e);
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
      setRoundRankings(prev => ({ ...prev, [roundId]: result }));
      // Refresh event ranking
      const evRanking = await api.ranking.getEvent(eventId!);
      setEventRanking(evRanking);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tính xếp hạng.');
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <p className="text-slate-500 text-sm">Không tìm thấy sự kiện.</p>
        <Link to="/" className="mt-4 inline-block text-indigo-600 underline text-sm">← Về trang chính</Link>
      </div>
    );
  }

  const activeRound = event.rounds?.find((r: any) => r.id === activeTab);
  const activeRoundRanking = activeTab !== 'event' ? roundRankings[activeTab] : null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Back link */}
      <Link to={`/events/${eventId}`} className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 mb-6 transition-colors font-mono uppercase tracking-wide">
        <ArrowLeft size={14} /> Quay lại sự kiện
      </Link>

      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-400 mb-1">Bảng xếp hạng</p>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Trophy size={28} weight="fill" className="text-amber-400" />
            {event.title}
          </h1>
        </div>
        <div className="text-right">
          <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase font-mono border ${
            event.status === 'active' || event.status === 'ongoing'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}>
            {event.status?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
        <button
          onClick={() => setActiveTab('event')}
          className={`shrink-0 rounded-lg px-4 py-2 text-xs font-mono font-semibold uppercase transition-all ${
            activeTab === 'event' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Tổng thể
        </button>
        {(event.rounds || []).map((r: any) => (
          <button
            key={r.id}
            onClick={() => setActiveTab(r.id)}
            className={`shrink-0 rounded-lg px-4 py-2 text-xs font-mono font-semibold uppercase transition-all ${
              activeTab === r.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {r.name}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'event' ? (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700 font-mono uppercase">Xếp hạng chung cuộc ({eventRanking?.finalRoundName || 'Vòng cuối'})</h2>
            {eventRanking?.calculatedAt && (
              <span className="text-[10px] text-slate-400 font-mono">Cập nhật: {new Date(eventRanking.calculatedAt).toLocaleString('vi-VN')}</span>
            )}
          </div>
          <ResultTable results={eventRanking?.results || []} />
        </div>
      ) : (
        activeRound && (
          <div>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-700 font-mono uppercase">{activeRound.name}</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Hạn nộp: {new Date(activeRound.submissionDeadline).toLocaleString('vi-VN')}
                </p>
              </div>
              {isOrganizer && (
                <button
                  onClick={() => handleCalculate(activeRound.id)}
                  disabled={calculating}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 shrink-0"
                >
                  {calculating ? <Spinner className="animate-spin" size={14} /> : <Lightning size={14} weight="fill" />}
                  {calculating ? 'Đang tính...' : 'Tính Xếp Hạng'}
                </button>
              )}
            </div>
            <ResultTable
              results={activeRoundRanking?.results || []}
              showCalculate={isOrganizer}
              onCalculate={() => handleCalculate(activeRound.id)}
              calculating={calculating}
            />
            {activeRoundRanking?.calculatedAt && (
              <p className="mt-3 text-right text-[10px] text-slate-400 font-mono">
                Tính lúc: {new Date(activeRoundRanking.calculatedAt).toLocaleString('vi-VN')}
              </p>
            )}
          </div>
        )
      )}
    </div>
  );
};
