import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Trophy, Calendar, Cpu, ListChecks, Plus, ArrowRight, IdentificationCard, UserList, X, Gavel } from '@phosphor-icons/react';


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
  const [promotionRuleType, setPromotionRuleType] = useState('-1');
  const [promotionRuleValue, setPromotionRuleValue] = useState('3');

  // Team creation/join states (Student)
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamAction, setTeamAction] = useState<'create' | 'join'>('create');
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [teamCat, setTeamCat] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [teamError, setTeamError] = useState<string | null>(null);

  // Criteria management (Organizer)
  const [showCriteriaForm, setShowCriteriaForm] = useState(false);
  const [criteriaList, setCriteriaList] = useState<any[]>([]);
  const [criteriaMsg, setCriteriaMsg] = useState<string | null>(null);
  const [criteriaError, setCriteriaError] = useState<string | null>(null);
  const [savingCriteria, setSavingCriteria] = useState(false);
  const [crName, setCrName] = useState('');
  const [crDesc, setCrDesc] = useState('');
  const [crMaxScore, setCrMaxScore] = useState('10');
  const [crWeight, setCrWeight] = useState('0.2');

  // Judge assignment (Organizer)
  const [allJudges, setAllJudges] = useState<any[]>([]);
  const [roundAssignments, setRoundAssignments] = useState<Record<string, any[]>>({});
  const [selectedJudgeForRound, setSelectedJudgeForRound] = useState<Record<string, string>>({});
  const [assignMsg, setAssignMsg] = useState<Record<string, string | null>>({});
  const [assignError, setAssignError] = useState<Record<string, string | null>>({});

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

  // Sync criteriaList khi event load xong
  useEffect(() => {
    if (event?.criteria) {
      setCriteriaList(event.criteria.map((cr: any) => ({ ...cr })));
    }
  }, [event]);

  // Fetch judges + current assignments khi event load (chỉ cho Organizer)
  useEffect(() => {
    if (!event || user?.role !== 'organizer') return;

    // Lấy danh sách giám khảo từ hack_users (offline) hoặc API
    const savedUsers: any[] = JSON.parse(localStorage.getItem('hack_users') || '[]');
    const judgeList = savedUsers.filter((u: any) =>
      u.role === 'judge_internal' || u.role === 'judge_guest'
    );
    setAllJudges(judgeList);

    // Load assignments cho từng vòng thi
    if (event.rounds?.length > 0) {
      Promise.all(
        event.rounds.map((r: any) =>
          api.judgeAssignments.getByRound(r.id)
            .then((asgns: any[]) => ({ roundId: r.id, assignments: asgns || [] }))
            .catch(() => ({ roundId: r.id, assignments: [] }))
        )
      ).then((results) => {
        const map: Record<string, any[]> = {};
        results.forEach(({ roundId, assignments }) => { map[roundId] = assignments; });
        setRoundAssignments(map);
      });
    }
  }, [event, user?.role]);

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
      let promotionRules = [];
      if (promotionRuleType !== '-1') {
        let mappedRuleType = '';
        if (promotionRuleType === '0') mappedRuleType = 'top_n_per_category';
        else if (promotionRuleType === '1') mappedRuleType = 'top_n_overall';
        else if (promotionRuleType === '2') mappedRuleType = 'score_threshold';

        const valNum = parseFloat(promotionRuleValue) || 0;
        promotionRules.push({
          ruleType: mappedRuleType,
          topN: (promotionRuleType === '0' || promotionRuleType === '1') ? valNum : undefined,
          scoreThreshold: promotionRuleType === '2' ? valNum : undefined
        });
      }

      await api.events.createRound(id, {
        name: roundName,
        description: roundDesc,
        roundOrder: (event?.rounds?.length || 0) + 1,
        submissionDeadline: new Date(roundDeadline).toISOString(),
        promotionRules
      });
      setRoundName('');
      setRoundDesc('');
      setRoundDeadline('');
      setPromotionRuleType('-1');
      setPromotionRuleValue('3');
      setShowRoundForm(false);
      fetchDetails();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Lỗi khi thêm vòng thi đấu.');
    }
  };

  const handleAddCriterion = () => {
    const maxScore = parseFloat(crMaxScore);
    const weight = parseFloat(crWeight);
    if (!crName || isNaN(maxScore) || isNaN(weight)) return;
    const newCr = {
      id: undefined,
      name: crName.trim(),
      description: crDesc.trim() || undefined,
      maxScore,
      weight,
      displayOrder: criteriaList.length + 1,
      isActive: true,
    };
    setCriteriaList([...criteriaList, newCr]);
    setCrName('');
    setCrDesc('');
    setCrMaxScore('10');
    setCrWeight('0.2');
    setShowCriteriaForm(false);
  };

  const handleRemoveCriterion = (idx: number) => {
    setCriteriaList(criteriaList.filter((_, i) => i !== idx));
  };

  const handleSaveCriteria = async () => {
    if (!id) return;
    setSavingCriteria(true);
    setCriteriaMsg(null);
    setCriteriaError(null);
    try {
      await api.events.updateCriteria(id, {
        criteria: criteriaList.map((cr, i) => ({
          id: cr.id || undefined,
          name: cr.name,
          description: cr.description,
          maxScore: cr.maxScore,
          weight: cr.weight,
          displayOrder: i + 1,
          isActive: cr.isActive !== false,
        }))
      });
      setCriteriaMsg('Lưu tiêu chí thành công!');
      fetchDetails();
      setTimeout(() => setCriteriaMsg(null), 3000);
    } catch (err: any) {
      setCriteriaError(err.message || 'Lỗi khi lưu tiêu chí.');
    } finally {
      setSavingCriteria(false);
    }
  };

  const handleAssignJudge = async (roundId: string) => {
    const judgeId = selectedJudgeForRound[roundId];
    if (!judgeId) return;
    setAssignError(prev => ({ ...prev, [roundId]: null }));
    setAssignMsg(prev => ({ ...prev, [roundId]: null }));
    try {
      await api.judgeAssignments.assign(roundId, judgeId);
      setAssignMsg(prev => ({ ...prev, [roundId]: 'Phân công thành công!' }));
      setTimeout(() => setAssignMsg(prev => ({ ...prev, [roundId]: null })), 3000);
      setSelectedJudgeForRound(prev => ({ ...prev, [roundId]: '' }));
      // Reload assignments
      const updated = await api.judgeAssignments.getByRound(roundId);
      setRoundAssignments(prev => ({ ...prev, [roundId]: updated || [] }));
    } catch (err: any) {
      setAssignError(prev => ({ ...prev, [roundId]: err.message || 'Lỗi phân công.' }));
    }
  };

  const handleRemoveJudgeAssignment = async (roundId: string, judgeId: string) => {
    try {
      await api.judgeAssignments.remove(roundId, judgeId);
      const updated = await api.judgeAssignments.getByRound(roundId);
      setRoundAssignments(prev => ({ ...prev, [roundId]: updated || [] }));
    } catch (err: any) {
      setAssignError(prev => ({ ...prev, [roundId]: err.message || 'Lỗi khi huỷ phân công.' }));
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
          categoryId: teamCat
        });
        setStudentTeam(newTeam);
      } else {
        if (!inviteCode) return;
        const joinedTeam = await api.teams.join({
          inviteCode
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
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Quy tắc đi tiếp (Thăng hạng)</label>
                  <div className="flex gap-2">
                    <select 
                      className="w-full sm:w-1/2 rounded bg-white border border-dark-border py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-tech-cyan"
                      value={promotionRuleType}
                      onChange={(e) => setPromotionRuleType(e.target.value)}
                    >
                      <option value="-1">Mặc định (Tất cả đi tiếp)</option>
                      <option value="0">Top N mỗi hạng mục</option>
                      <option value="1">Top N toàn sự kiện</option>
                      <option value="2">Theo Điểm chuẩn</option>
                    </select>
                    {promotionRuleType !== '-1' && (
                      <input
                        type="number"
                        min="0"
                        step={promotionRuleType === '2' ? '0.1' : '1'}
                        className="w-full sm:w-1/2 rounded bg-white border border-dark-border py-1.5 px-3 text-xs text-slate-900 focus:outline-none focus:border-tech-cyan"
                        placeholder={promotionRuleType === '2' ? "Nhập điểm chuẩn..." : "Nhập số lượng đội (N)..."}
                        value={promotionRuleValue}
                        onChange={(e) => setPromotionRuleValue(e.target.value)}
                      />
                    )}
                  </div>
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
                  <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5 mb-2">
                    <Calendar size={12} /> Hạn: {new Date(r.submissionDeadline).toLocaleDateString('vi-VN')}
                  </div>
                  {r.promotionRules && r.promotionRules.length > 0 && (
                    <div className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-2 py-1 inline-block font-mono">
                      Luật đi tiếp: {r.promotionRules.map((pr: any, i: number) => {
                        let text = "";
                        const rt = pr.ruleType?.toLowerCase() || '';
                        if (rt === 'top_n_per_category' || rt === 'topnpercategory') text = `Top ${pr.topN ?? 3} mỗi bảng`;
                        else if (rt === 'top_n_overall' || rt === 'topnoverall') text = `Top ${pr.topN ?? 10} toàn cuộc`;
                        else if (rt === 'score_threshold' || rt === 'scorethreshold') text = `Đạt >= ${pr.scoreThreshold ?? 0} điểm`;
                        return <span key={i}>{text}{i < r.promotionRules.length - 1 ? ' | ' : ''}</span>;
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Criteria Panel */}
        <div className="glass-card rounded-xl p-6 flex flex-col">
          <div>
            <div className="flex justify-between items-center mb-4 border-b border-dark-border pb-4">
              <h2 className="text-xs font-bold text-slate-900 font-mono uppercase tracking-wider flex items-center gap-2">
                <ListChecks className="text-tech-cyan" /> Tiêu chí đánh giá
              </h2>
              {user?.role === 'organizer' && (
                <button
                  onClick={() => setShowCriteriaForm(!showCriteriaForm)}
                  className="text-tech-cyan hover:text-slate-900 transition-colors"
                  title="Thêm tiêu chí"
                >
                  <Plus size={18} />
                </button>
              )}
            </div>

            {/* Organizer: form thêm tiêu chí */}
            {user?.role === 'organizer' && showCriteriaForm && (
              <div className="mb-4 p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3 shadow-inner">
                <input
                  type="text"
                  required
                  placeholder="Tên tiêu chí (ví dụ: Tính sáng tạo)"
                  className="w-full rounded-lg bg-white border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-400"
                  value={crName}
                  onChange={(e) => setCrName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Mô tả tiêu chí..."
                  className="w-full rounded-lg bg-white border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-400"
                  value={crDesc}
                  onChange={(e) => setCrDesc(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">§iểm tối đa</label>
                    <input
                      type="number"
                      min="1" max="100" step="0.5"
                      className="w-full rounded-lg bg-white border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-400 font-mono"
                      value={crMaxScore}
                      onChange={(e) => setCrMaxScore(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">Trọng số (0.01–1.0)</label>
                    <input
                      type="number"
                      min="0.01" max="1" step="0.01"
                      className="w-full rounded-lg bg-white border border-slate-200 py-2 px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-400 font-mono"
                      value={crWeight}
                      onChange={(e) => setCrWeight(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setShowCriteriaForm(false)} className="text-[10px] text-slate-500 hover:text-slate-900 px-2 py-1">Hủy</button>
                  <button
                    type="button"
                    onClick={handleAddCriterion}
                    disabled={!crName}
                    className="rounded-lg bg-indigo-600 text-[10px] text-white px-3 py-1.5 font-semibold hover:bg-indigo-700 disabled:opacity-40"
                  >
                    + Thêm vào danh sách
                  </button>
                </div>
              </div>
            )}

            {/* Feedback messages */}
            {criteriaMsg && (
              <div className="mb-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700 flex items-center gap-2">
                ✓ {criteriaMsg}
              </div>
            )}
            {criteriaError && (
              <div className="mb-3 rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-600">
                {criteriaError}
              </div>
            )}

            {/* Danh sách tiêu chí */}
            <div className="space-y-3">
              {criteriaList.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic text-center py-4">
                  Chưa có tiêu chí nào. {user?.role === 'organizer' ? 'Bấm + để thêm.' : ''}
                </p>
              ) : (
                criteriaList.map((cr: any, idx: number) => (
                  <div key={cr.id || idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 font-mono mb-0.5 truncate">{cr.name}</h4>
                      {cr.description && <p className="text-[10px] text-slate-500 truncate">{cr.description}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block text-xs font-bold text-indigo-600 font-mono">{cr.maxScore}đ</span>
                      <span className="block text-[9px] font-mono text-slate-400">x{(cr.weight * 100).toFixed(0)}%</span>
                    </div>
                    {user?.role === 'organizer' && (
                      <button
                        onClick={() => handleRemoveCriterion(idx)}
                        className="text-slate-300 hover:text-rose-500 transition-colors ml-1 shrink-0"
                        title="Xóa tiêu chí này"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Nút lưu */}
          {user?.role === 'organizer' && (
            <div className="mt-5 pt-4 border-t border-dark-border flex items-center justify-between gap-3">
              <span className="text-[10px] text-slate-400 font-mono">
                Tổng trọng số: {criteriaList.reduce((s, c) => s + (parseFloat(c.weight) || 0), 0).toFixed(2)}
              </span>
              <button
                onClick={handleSaveCriteria}
                disabled={savingCriteria || criteriaList.length === 0}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-[11px] font-bold text-white hover:bg-indigo-700 disabled:opacity-40 active:scale-95 transition-all"
              >
                {savingCriteria ? 'Đang lưu...' : 'Lưu tiêu chí'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Judge Assignment Section (Organizer only) ─────────────────── */}
      {user?.role === 'organizer' && event.rounds?.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-3 mb-6">
            <Gavel size={20} className="text-indigo-600" />
            <h2 className="text-sm font-extrabold text-slate-900 font-mono uppercase tracking-wide">
              Phân công Giám khảo theo Vòng thi
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {event.rounds.map((r: any, idx: number) => {
              const assigned = roundAssignments[r.id] || [];
              const available = allJudges.filter(j =>
                !assigned.some((a: any) => a.judgeId === j.id)
              );
              return (
                <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  {/* Round header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[9px] font-mono font-bold text-indigo-500 uppercase tracking-widest">
                        Vòng {idx + 1}
                      </span>
                      <h3 className="text-xs font-bold text-slate-900 font-mono">{r.name}</h3>
                    </div>
                    <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded uppercase ${
                      r.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                      r.status === 'completed' ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                      'bg-amber-50 text-amber-600 border border-amber-200'
                    }`}>{r.status}</span>
                  </div>

                  {/* Feedback */}
                  {assignMsg[r.id] && (
                    <div className="mb-3 text-[11px] text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-3 py-2">
                      ✓ {assignMsg[r.id]}
                    </div>
                  )}
                  {assignError[r.id] && (
                    <div className="mb-3 text-[11px] text-rose-600 bg-rose-50 border border-rose-100 rounded px-3 py-2">
                      {assignError[r.id]}
                    </div>
                  )}

                  {/* Currently assigned judges */}
                  <div className="mb-4">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <UserList size={12} /> Giám khảo đã phân công ({assigned.length})
                    </p>
                    {assigned.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">Chưa phân công giám khảo nào.</p>
                    ) : (
                      <div className="space-y-2">
                        {assigned.map((a: any) => (
                          <div key={a.judgeId || a.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                            <div>
                              <span className="text-xs font-semibold text-slate-800">{a.judgeName || a.fullName}</span>
                              <span className={`ml-2 text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                                (a.judgeRole || a.role) === 'judge_guest'
                                  ? 'bg-purple-50 text-purple-600' : 'bg-indigo-50 text-indigo-600'
                              }`}>
                                {(a.judgeRole || a.role) === 'judge_guest' ? 'Khách' : 'Nội bộ'}
                              </span>
                            </div>
                            <button
                              onClick={() => handleRemoveJudgeAssignment(r.id, a.judgeId || a.id)}
                              className="text-slate-300 hover:text-rose-500 transition-colors p-1 rounded"
                              title="Huỷ phân công"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assign new judge */}
                  {available.length > 0 ? (
                    <div className="flex gap-2 items-center">
                      <select
                        value={selectedJudgeForRound[r.id] || ''}
                        onChange={(e) => setSelectedJudgeForRound(prev => ({ ...prev, [r.id]: e.target.value }))}
                        className="flex-1 rounded-lg border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                      >
                        <option value="">-- Chọn giám khảo --</option>
                        {available.map((j: any) => (
                          <option key={j.id} value={j.id}>
                            {j.fullName} ({j.role === 'judge_guest' ? 'Khách' : 'Nội bộ'})
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssignJudge(r.id)}
                        disabled={!selectedJudgeForRound[r.id]}
                        className="shrink-0 rounded-lg bg-indigo-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-indigo-700 disabled:opacity-40 active:scale-95 transition-all"
                      >
                        Phân công
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      {allJudges.length === 0
                        ? 'Chưa có tài khoản giám khảo. Hãy tạo giám khảo khách tại mục Quản trị.'
                        : 'Tất cả giám khảo đã được phân công vào vòng này.'
                      }
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

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
