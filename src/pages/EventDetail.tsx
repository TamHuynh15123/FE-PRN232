import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Trophy, Calendar, Cpu, ListChecks, Plus, ArrowRight, IdentificationCard } from '@phosphor-icons/react';


export const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  
  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentTeam, setStudentTeam] = useState<any | null>(null);

  // Forms states (Organizer)
  const [showCatForm, setShowCatForm] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  const [showRoundForm, setShowRoundForm] = useState(false);
  const [roundName, setRoundName] = useState('');
  const [roundDesc, setRoundDesc] = useState('');
  const [roundDeadline, setRoundDeadline] = useState('');

  // Team creation/join states (Student)
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamAction, setTeamAction] = useState<'create' | 'join'>('create');
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [teamCat, setTeamCat] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [teamError, setTeamError] = useState<string | null>(null);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      const data = await api.events.getById(id);
      setEvent(data);
      
      // If student, check if they already have a team in this event
      if (user && (user.role === 'student_fpt' || user.role === 'student_external')) {
        const team = await api.teams.getStudentTeam(id);
        setStudentTeam(team);
      }
    } catch (err) {
      console.error('Error loading details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id, user]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !catName) return;
    try {
      await api.events.createCategory(id, { name: catName, description: catDesc });
      setCatName('');
      setCatDesc('');
      setShowCatForm(false);
      fetchDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !roundName || !roundDeadline) return;
    try {
      await api.events.createRound(id, {
        name: roundName,
        description: roundDesc,
        submissionDeadline: new Date(roundDeadline).toISOString()
      });
      setRoundName('');
      setRoundDesc('');
      setRoundDeadline('');
      setShowRoundForm(false);
      fetchDetails();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTeamAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    setTeamError(null);

    try {
      if (teamAction === 'create') {
        if (!teamName || !teamCat) return;
        const newTeam = await api.teams.create({
          name: teamName,
          description: teamDesc,
          categoryId: teamCat,
          eventId: id,
          leaderId: user.id
        });
        setStudentTeam(newTeam);
      } else {
        if (!inviteCode) return;
        const joinedTeam = await api.teams.join({
          inviteCode,
          userId: user.id
        });
        setStudentTeam(joinedTeam);
      }
      setShowTeamModal(false);
      setTeamName('');
      setTeamDesc('');
      setInviteCode('');
    } catch (err: any) {
      setTeamError(err.message || 'Thao tác đội thi thất bại.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-tech-cyan border-t-transparent" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 text-center text-slate-500">
        Không tìm thấy thông tin sự kiện.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Event Header Banner */}
      <div className="mb-10 rounded-xl border border-dark-border bg-white overflow-hidden relative shadow-sm">
        <div className="h-64 bg-slate-100">
          <img
            src={event.bannerUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80'}
            alt={event.title}
            className="w-full h-full object-cover opacity-80"
          />
        </div>
        <div className="p-8 relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="inline-block rounded bg-indigo-50 border border-indigo-200 px-3 py-1 text-[9px] font-mono font-bold text-indigo-600 uppercase tracking-widest mb-4">
              {event.status}
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight font-mono mb-4 uppercase">{event.title}</h1>
            <p className="text-xs text-slate-600 leading-relaxed max-w-[85ch]">{event.description}</p>
          </div>
          <Link
            to={`/ranking/${id}`}
            className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-500 active:scale-95 transition-all shadow-md"
          >
            <Trophy size={16} weight="fill" /> XEM XẾP HẠNG
          </Link>
        </div>
      </div>


      {/* Student Team Banner */}
      {user && (user.role === 'student_fpt' || user.role === 'student_external') && (
        <div className="mb-10 rounded-xl border border-dark-border bg-slate-100/50 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider mb-1 flex items-center gap-2">
              <IdentificationCard className="text-tech-cyan" /> ĐỘI THI CỦA BẠN
            </h3>
            <p className="text-xs text-slate-600">
              {studentTeam 
                ? `Đội thi: ${studentTeam.name} | Hạng mục: ${event.categories.find((c: any) => c.id === studentTeam.categoryId)?.name || 'Chưa phân loại'}` 
                : 'Bạn chưa lập đội hoặc tham gia đội thi nào cho cuộc thi này.'}
            </p>
          </div>
          {studentTeam ? (
            <Link
              to="/team"
              className="flex items-center gap-1.5 rounded-lg bg-white border border-dark-border hover:border-tech-cyan hover:text-slate-950 px-4 py-2 text-xs font-semibold text-slate-700 transition-all active:scale-95 shadow-sm"
            >
              QUẢN LÝ ĐỘI THI <ArrowRight size={14} />
            </Link>
          ) : (
            <button
              onClick={() => {
                setTeamAction('create');
                setShowTeamModal(true);
              }}
              className="rounded-lg bg-tech-cyan px-5 py-2 text-xs font-semibold text-white hover:opacity-90 active:scale-95 transition-all shadow-sm"
            >
              THAM GIA NGAY
            </button>
          )}
        </div>
      )}

      {/* Main Grid: Categories, Rounds, Criteria */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Categories Panel */}
        <div className="glass-card rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-dark-border pb-4">
              <h2 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider flex items-center gap-2">
                <Cpu className="text-tech-cyan" /> Hạng mục thi đấu
              </h2>
              {user?.role === 'organizer' && (
                <button onClick={() => setShowCatForm(!showCatForm)} className="text-tech-cyan hover:text-slate-900">
                  <Plus size={18} />
                </button>
              )}
            </div>

            {showCatForm && (
              <form onSubmit={handleAddCategory} className="mb-6 p-4 rounded bg-slate-50 border border-dark-border space-y-3 shadow-inner">
                <input
                  type="text"
                  required
                  placeholder="Tên hạng mục (AI, IoT...)"
                  className="w-full rounded bg-white border border-dark-border py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-tech-cyan"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Mô tả ngắn..."
                  className="w-full rounded bg-white border border-dark-border py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-tech-cyan"
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                />
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowCatForm(false)} className="text-[10px] text-slate-500 hover:text-slate-900 px-2 py-1">Hủy</button>
                  <button type="submit" className="rounded bg-tech-cyan text-[10px] text-white px-3 py-1 font-semibold">Thêm</button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {event.categories?.map((c: any) => (
                <div key={c.id} className="p-4 rounded-lg bg-slate-50/50 border border-dark-border/60">
                  <h4 className="text-xs font-bold text-slate-900 font-mono mb-1">{c.name}</h4>
                  <p className="text-[11px] text-slate-600">{c.description || 'Chưa có mô tả chi tiết.'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rounds Panel */}
        <div className="glass-card rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-dark-border pb-4">
              <h2 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider flex items-center gap-2">
                <Trophy className="text-tech-cyan" /> Vòng thi đấu
              </h2>
              {user?.role === 'organizer' && (
                <button onClick={() => setShowRoundForm(!showRoundForm)} className="text-tech-cyan hover:text-slate-900">
                  <Plus size={18} />
                </button>
              )}
            </div>

            {showRoundForm && (
              <form onSubmit={handleAddRound} className="mb-6 p-4 rounded bg-slate-50 border border-dark-border space-y-3 shadow-inner">
                <input
                  type="text"
                  required
                  placeholder="Tên vòng (Sơ loại, Chung kết...)"
                  className="w-full rounded bg-white border border-dark-border py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-tech-cyan"
                  value={roundName}
                  onChange={(e) => setRoundName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Mô tả..."
                  className="w-full rounded bg-white border border-dark-border py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-tech-cyan"
                  value={roundDesc}
                  onChange={(e) => setRoundDesc(e.target.value)}
                />
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Hạn nộp bài</label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full rounded bg-white border border-dark-border py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-tech-cyan"
                    value={roundDeadline}
                    onChange={(e) => setRoundDeadline(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowRoundForm(false)} className="text-[10px] text-slate-500 hover:text-slate-900 px-2 py-1">Hủy</button>
                  <button type="submit" className="rounded bg-tech-cyan text-[10px] text-white px-3 py-1 font-semibold">Thêm</button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {event.rounds?.map((r: any, idx: number) => (
                <div key={r.id} className="p-4 rounded-lg bg-slate-50/50 border border-dark-border/60 relative overflow-hidden">
                  <div className="absolute top-0 right-0 rounded-bl bg-tech-cyan/10 border-l border-b border-tech-cyan/30 px-2 py-0.5 text-[9px] font-mono font-bold text-tech-cyan uppercase">
                    {r.status}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 font-mono mb-1">Vòng {idx + 1}: {r.name}</h4>
                  <p className="text-[11px] text-slate-600 mb-2">{r.description}</p>
                  <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5">
                    <Calendar size={12} /> Hạn: {new Date(r.submissionDeadline).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Criteria Panel */}
        <div className="glass-card rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6 border-b border-dark-border pb-4">
              <h2 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider flex items-center gap-2">
                <ListChecks className="text-tech-cyan" /> Tiêu chí đánh giá
              </h2>
            </div>

            <div className="space-y-4">
              {event.criteria?.map((cr: any) => (
                <div key={cr.id} className="p-4 rounded-lg bg-slate-50/50 border border-dark-border/60 flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 font-mono mb-1">{cr.name}</h4>
                    <p className="text-[10px] text-slate-500">{cr.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-tech-cyan font-mono">{cr.maxScore}đ</span>
                    <span className="block text-[9px] font-mono text-slate-500">Trọng số: {cr.weight * 100}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Team Modal (Student only) */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md border border-dark-border bg-white p-8 rounded-xl shadow-xl relative">
            <h2 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider mb-6 pb-2 border-b border-dark-border">
              {teamAction === 'create' ? 'ĐĂNG KÝ ĐỘI THI MỚI' : 'THAM GIA ĐỘI THI BẰNG MÃ MỜI'}
            </h2>
            {teamError && <p className="text-xs text-rose-500 mb-4">{teamError}</p>}

            <form onSubmit={handleTeamAction} className="space-y-4">
              <div className="flex gap-4 mb-4 border-b border-dark-border/45 pb-3 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setTeamAction('create')}
                  className={`pb-1 ${teamAction === 'create' ? 'text-tech-cyan border-b border-tech-cyan' : 'text-slate-500'}`}
                >
                  Tự tạo đội
                </button>
                <button
                  type="button"
                  onClick={() => setTeamAction('join')}
                  className={`pb-1 ${teamAction === 'join' ? 'text-tech-cyan border-b border-tech-cyan' : 'text-slate-500'}`}
                >
                  Nhập mã mời
                </button>
              </div>

              {teamAction === 'create' ? (
                <>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Tên Đội *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nhập tên đội..."
                      className="w-full rounded bg-slate-50 border border-dark-border py-2 px-3 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-tech-cyan"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Mô tả đề tài (Ý tưởng)</label>
                    <textarea
                      rows={2}
                      placeholder="Mô tả tóm tắt ý định..."
                      className="w-full rounded bg-slate-50 border border-dark-border py-2 px-3 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-tech-cyan"
                      value={teamDesc}
                      onChange={(e) => setTeamDesc(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Chọn Hạng mục thi *</label>
                    <select
                      required
                      className="w-full rounded bg-slate-50 border border-dark-border py-2 px-3 text-xs text-slate-600 focus:outline-none focus:bg-white focus:border-tech-cyan"
                      value={teamCat}
                      onChange={(e) => setTeamCat(e.target.value)}
                    >
                      <option value="">-- Chọn hạng mục --</option>
                      {event.categories?.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Mã mời đội thi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mã INV-XXXXXX"
                    className="w-full rounded bg-slate-50 border border-dark-border py-2 px-3 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-tech-cyan font-mono uppercase"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowTeamModal(false)}
                  className="rounded border border-dark-border px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-all"
                >
                  ĐÓNG
                </button>
                <button
                  type="submit"
                  className="rounded bg-tech-cyan px-5 py-2 text-xs font-semibold text-white hover:opacity-90 active:scale-95 transition-all"
                >
                  XÁC NHẬN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
