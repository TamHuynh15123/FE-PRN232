// API service layer for Hackathon Management System
// Points to the local C# Backend: https://localhost:7117/api
// Uses LocalStorage fallback for seamless visual testing when the backend is offline

const BASE_URL = 'https://localhost:7117/api';

// Seed initial data for fallback matching ApplicationDbContext seeds
const DEFAULT_USERS = [
  { id: '11111111-1111-1111-1111-111111111111', email: 'organizer@hackathon.com', fullName: 'Ban Tổ Chức Hackathon', role: 'organizer', status: 'approved' },
  { id: '22222222-2222-2222-2222-222222222222', email: 'judge.internal@hackathon.com', fullName: 'Giám Khảo Nội Bộ', role: 'judge_internal', status: 'approved' },
  { id: '33333333-3333-3333-3333-333333333333', email: 'judge.guest@hackathon.com', fullName: 'Giám Khảo Khách Mời', role: 'judge_guest', status: 'approved' },
  { id: '44444444-4444-4444-4444-444444444444', email: 'mentor@hackathon.com', fullName: 'Cố Vấn Chuyên Môn', role: 'mentor', status: 'approved' },
  { id: '55555555-5555-5555-5555-555555555555', email: 'student.fpt@hackathon.com', fullName: 'Sinh Viên FPT', role: 'student_fpt', status: 'approved', studentCode: 'SE160001', isFptStudent: true },
  { id: '66666666-6666-6666-6666-666666666666', email: 'student.external@hackathon.com', fullName: 'Sinh Viên Ngoài Trường', role: 'student_external', status: 'approved', studentCode: 'EXT16002', isFptStudent: false, universityName: 'VNU University' }
];

const DEFAULT_EVENTS = [
  {
    id: 'e1111111-1111-1111-1111-111111111111',
    title: 'FPT Edu Hackathon 2026',
    description: 'Cuộc thi lập trình đỉnh cao dành cho học sinh, sinh viên FPT Edu toàn quốc với chủ đề "AI & Smart City". Tìm kiếm các giải pháp đột phá ứng dụng trí tuệ nhân tạo xây dựng đô thị thông minh.',
    bannerUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    status: 'active',
    createdBy: '11111111-1111-1111-1111-111111111111',
    createdAt: new Date().toISOString(),
    categories: [
      { id: 'c1111111-1111-1111-1111-111111111111', name: 'Trí tuệ nhân tạo (AI)', description: 'Ứng dụng AI/ML để tối ưu hóa, tự động hóa các dịch vụ đô thị.' },
      { id: 'c2222222-2222-2222-2222-222222222222', name: 'Thiết bị thông minh (IoT)', description: 'Thiết kế phần cứng và nhúng thông minh kết nối đô thị.' }
    ],
    criteria: [
      { id: 'cr1', name: 'Tính Đột Phá / Sáng Tạo', description: 'Ý tưởng có mới mẻ, độc đáo không?', weight: 0.3, maxScore: 10 },
      { id: 'cr2', name: 'Tính Thực Tiễn', description: 'Khả năng ứng dụng và triển khai thực tế.', weight: 0.3, maxScore: 10 },
      { id: 'cr3', name: 'Kỹ Thuật / Công Nghệ', description: 'Độ phức tạp và hoàn thiện của sản phẩm.', weight: 0.4, maxScore: 10 }
    ],
    rounds: [
      { id: 'r1', name: 'Vòng Đăng Ký & Ý Tưởng', description: 'Nộp đề án ý tưởng sơ bộ.', roundOrder: 1, status: 'completed', submissionDeadline: new Date(Date.now() - 86400000 * 5).toISOString() },
      { id: 'r2', name: 'Vòng Sơ Loại Sản Phẩm', description: 'Hoàn thiện demo cơ bản và nộp GitHub Repository.', roundOrder: 2, status: 'active', submissionDeadline: new Date(Date.now() + 86400000 * 7).toISOString() },
      { id: 'r3', name: 'Chung Kết Tổng', description: 'Thuyết trình sản phẩm trước Hội đồng giám khảo.', roundOrder: 3, status: 'upcoming', submissionDeadline: new Date(Date.now() + 86400000 * 15).toISOString() }
    ]
  }
];

// Helper to initialize local storage
const initializeStorage = () => {
  if (!localStorage.getItem('hack_users')) {
    localStorage.setItem('hack_users', JSON.stringify(DEFAULT_USERS));
  }
  if (!localStorage.getItem('hack_pending_users')) {
    localStorage.setItem('hack_pending_users', JSON.stringify([]));
  }
  if (!localStorage.getItem('hack_events')) {
    localStorage.setItem('hack_events', JSON.stringify(DEFAULT_EVENTS));
  }
  if (!localStorage.getItem('hack_teams')) {
    localStorage.setItem('hack_teams', JSON.stringify([]));
  }
  if (!localStorage.getItem('hack_submissions')) {
    localStorage.setItem('hack_submissions', JSON.stringify([]));
  }
  if (!localStorage.getItem('hack_scores')) {
    localStorage.setItem('hack_scores', JSON.stringify([]));
  }
  if (!localStorage.getItem('hack_rankings')) {
    localStorage.setItem('hack_rankings', JSON.stringify({}));
  }
  if (!localStorage.getItem('hack_awards')) {
    localStorage.setItem('hack_awards', JSON.stringify([]));
  }
};
initializeStorage();

// Type definitions
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  studentCode?: string;
  isFptStudent?: boolean;
  universityName?: string;
  phone?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

// Request Wrapper with backend detection
const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `API Error ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    // If connection is refused, fallback to local storage
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      console.warn(`Backend offline. Falling back to local storage for path: ${path}`);
      return handleFallback<T>(path, options);
    }
    throw err;
  }
};

// Fallback handling logic in local storage
const handleFallback = <T>(path: string, options: RequestInit): T => {
  const cleanPath = path.replace(/^\//, '').split('?')[0];
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body as string) : null;

  const users: User[] = JSON.parse(localStorage.getItem('hack_users') || '[]');
  const pendingUsers: any[] = JSON.parse(localStorage.getItem('hack_pending_users') || '[]');
  const events: any[] = JSON.parse(localStorage.getItem('hack_events') || '[]');
  const teams: any[] = JSON.parse(localStorage.getItem('hack_teams') || '[]');
  const submissions: any[] = JSON.parse(localStorage.getItem('hack_submissions') || '[]');

  // ── AUTH routes ───────────────────────────────────────────────────────────
  if (cleanPath === 'auth/login' && method === 'POST') {
    const matched = users.find(u => u.email === body.email);
    if (!matched) throw new Error('Email hoặc mật khẩu không chính xác.');
    const response: AuthResponse = {
      accessToken: 'mock-jwt-token-' + matched.id,
      refreshToken: 'mock-refresh-token-' + matched.id,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      user: matched
    };
    return response as unknown as T;
  }

  if (cleanPath === 'auth/register' && method === 'POST') {
    const newPending = {
      id: crypto.randomUUID(),
      email: body.email,
      fullName: body.fullName,
      studentCode: body.studentCode,
      isFptStudent: body.isFptStudent,
      universityName: body.universityName,
      phone: body.phone,
      role: body.isFptStudent ? 'student_fpt' : 'student_external',
      status: 'pending_approval'
    };
    pendingUsers.push(newPending);
    localStorage.setItem('hack_pending_users', JSON.stringify(pendingUsers));
    return { message: 'Đăng ký thành công. Tài khoản đang chờ duyệt.' } as unknown as T;
  }

  // ── ACCOUNT routes ────────────────────────────────────────────────────────
  if (cleanPath === 'accounts/pending' && method === 'GET') {
    return pendingUsers as unknown as T;
  }

  if (cleanPath === 'accounts/review' && method === 'POST') {
    const { userId, approve } = body;
    const index = pendingUsers.findIndex(u => u.id === userId);
    if (index !== -1) {
      const userToReview = pendingUsers[index];
      pendingUsers.splice(index, 1);
      localStorage.setItem('hack_pending_users', JSON.stringify(pendingUsers));
      if (approve) {
        userToReview.status = 'approved';
        users.push(userToReview);
        localStorage.setItem('hack_users', JSON.stringify(users));
      }
    }
    return { message: approve ? 'Phê duyệt thành công' : 'Đã từ chối tài khoản' } as unknown as T;
  }

  if (cleanPath === 'accounts/guest-judge' && method === 'POST') {
    const newJudge = {
      id: crypto.randomUUID(),
      email: body.email,
      fullName: body.fullName,
      role: 'judge_guest',
      status: 'approved'
    };
    users.push(newJudge);
    localStorage.setItem('hack_users', JSON.stringify(users));
    return { message: `Đã tạo tài khoản giám khảo cho ${body.email}.` } as unknown as T;
  }

  // ── EVENTS routes ─────────────────────────────────────────────────────────
  if (cleanPath === 'events' && method === 'GET') {
    return events as unknown as T;
  }

  if (cleanPath === 'events' && method === 'POST') {
    const newEvent = {
      id: crypto.randomUUID(),
      title: body.title, description: body.description,
      bannerUrl: body.bannerUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
      status: 'draft', categories: [], criteria: [], rounds: []
    };
    events.push(newEvent);
    localStorage.setItem('hack_events', JSON.stringify(events));
    return newEvent as unknown as T;
  }

  // PUT /events/{id}
  if (cleanPath.match(/^events\/[^/]+$/) && method === 'PUT') {
    const id = cleanPath.split('/')[1];
    const ev = events.find(e => e.id === id);
    if (ev) { Object.assign(ev, body); localStorage.setItem('hack_events', JSON.stringify(events)); }
    return { message: 'Cập nhật sự kiện thành công.' } as unknown as T;
  }

  // PUT /events/{id}/status
  if (cleanPath.match(/^events\/[^/]+\/status$/) && method === 'PUT') {
    const id = cleanPath.split('/')[1];
    const ev = events.find(e => e.id === id);
    if (ev) { ev.status = body.status; localStorage.setItem('hack_events', JSON.stringify(events)); }
    return { message: 'Cập nhật trạng thái thành công.' } as unknown as T;
  }

  // GET /events/{id}
  if (cleanPath.match(/^events\/[^/]+$/) && method === 'GET') {
    const id = cleanPath.split('/')[1];
    const ev = events.find(e => e.id === id);
    if (!ev) throw new Error('Không tìm thấy sự kiện.');
    return ev as unknown as T;
  }

  // PUT /events/{id}/criteria
  if (cleanPath.endsWith('/criteria') && method === 'PUT') {
    const id = cleanPath.split('/')[1];
    const ev = events.find(e => e.id === id);
    if (ev) {
      ev.criteria = body.criteria.map((c: any) => ({ ...c, id: c.id || crypto.randomUUID() }));
      localStorage.setItem('hack_events', JSON.stringify(events));
    }
    return { message: 'Cập nhật tiêu chí thành công.' } as unknown as T;
  }

  // POST /events/{id}/categories
  if (cleanPath.endsWith('/categories') && method === 'POST') {
    const id = cleanPath.split('/')[1];
    const ev = events.find(e => e.id === id);
    let newCat = null;
    if (ev) {
      newCat = { id: crypto.randomUUID(), name: body.name, description: body.description };
      ev.categories.push(newCat);
      localStorage.setItem('hack_events', JSON.stringify(events));
    }
    return newCat as unknown as T;
  }

  // PUT /events/{id}/categories/{catId}
  if (cleanPath.match(/^events\/[^/]+\/categories\/[^/]+$/) && method === 'PUT') {
    const parts = cleanPath.split('/');
    const catId = parts[3];
    for (const ev of events) {
      const cat = ev.categories?.find((c: any) => c.id === catId);
      if (cat) { Object.assign(cat, body); localStorage.setItem('hack_events', JSON.stringify(events)); break; }
    }
    return { message: 'Cập nhật hạng mục thành công.' } as unknown as T;
  }

  // DELETE /events/{id}/categories/{catId}
  if (cleanPath.match(/^events\/[^/]+\/categories\/[^/]+$/) && method === 'DELETE') {
    const parts = cleanPath.split('/');
    const catId = parts[3];
    for (const ev of events) {
      const idx = ev.categories?.findIndex((c: any) => c.id === catId);
      if (idx !== undefined && idx >= 0) { ev.categories.splice(idx, 1); localStorage.setItem('hack_events', JSON.stringify(events)); break; }
    }
    return { message: 'Xóa hạng mục thành công.' } as unknown as T;
  }

  // POST /events/{id}/rounds
  if (cleanPath.endsWith('/rounds') && method === 'POST') {
    const id = cleanPath.split('/')[1];
    const ev = events.find(e => e.id === id);
    let newRound = null;
    if (ev) {
      newRound = {
        id: crypto.randomUUID(), name: body.name, description: body.description,
        roundOrder: body.roundOrder || (ev.rounds.length + 1),
        status: 'upcoming', submissionDeadline: body.submissionDeadline
      };
      ev.rounds.push(newRound);
      localStorage.setItem('hack_events', JSON.stringify(events));
    }
    return newRound as unknown as T;
  }

  // ── TEAMS routes ──────────────────────────────────────────────────────────
  if (cleanPath === 'teams' && method === 'POST') {
    const inviteCode = 'INV-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const newTeam = {
      id: crypto.randomUUID(), name: body.name, description: body.description,
      categoryId: body.categoryId, eventId: body.eventId, inviteCode,
      leaderId: body.leaderId || 'current-user-id',
      members: [{ userId: body.leaderId || 'current-user-id', joinedAt: new Date().toISOString() }]
    };
    teams.push(newTeam);
    localStorage.setItem('hack_teams', JSON.stringify(teams));
    return newTeam as unknown as T;
  }

  if (cleanPath === 'teams/join' && method === 'POST') {
    const team = teams.find(t => t.inviteCode === body.inviteCode);
    if (!team) throw new Error('Mã mời không tồn tại.');
    const alreadyMember = team.members.some((m: any) => m.userId === body.userId);
    if (!alreadyMember) {
      team.members.push({ userId: body.userId, joinedAt: new Date().toISOString() });
      localStorage.setItem('hack_teams', JSON.stringify(teams));
    }
    return team as unknown as T;
  }

  if (cleanPath.startsWith('teams/student/event/') && method === 'GET') {
    const eventId = cleanPath.split('/').pop();
    const userJson = localStorage.getItem('user');
    const currUser = userJson ? JSON.parse(userJson) : null;
    const userId = currUser?.id || '';
    const team = teams.find(t => t.eventId === eventId && t.members.some((m: any) => m.userId === userId));
    if (!team) return null as unknown as T;
    const populatedMembers = team.members.map((m: any) => {
      const u = users.find(usr => usr.id === m.userId);
      return { ...m, fullName: u?.fullName || 'Thành viên', email: u?.email || '' };
    });
    return { ...team, members: populatedMembers } as unknown as T;
  }

  // GET /teams/my
  if (cleanPath === 'teams/my' && method === 'GET') {
    const userJson = localStorage.getItem('user');
    const currUser = userJson ? JSON.parse(userJson) : null;
    const userId = currUser?.id || '';
    const myTeams = teams.filter(t => t.members?.some((m: any) => m.userId === userId));
    return myTeams.map(team => {
      const populatedMembers = (team.members || []).map((m: any) => {
        const u = users.find(usr => usr.id === m.userId);
        return { ...m, fullName: u?.fullName || currUser?.fullName || 'Thành viên', email: u?.email || currUser?.email || '' };
      });
      // Find event title
      const ev = events.find((e: any) => e.id === team.eventId);
      const cat = ev?.categories?.find((c: any) => c.id === team.categoryId);
      return {
        ...team,
        members: populatedMembers,
        categoryName: cat?.name || 'Hạng mục',
        eventTitle: ev?.title || 'Sự kiện',
        leaderId: team.leaderId,
        leaderName: users.find(u => u.id === team.leaderId)?.fullName || currUser?.fullName || 'Trưởng nhóm',
      };
    }) as unknown as T;
  }

  // ── SUBMISSIONS routes ────────────────────────────────────────────────────
  if (cleanPath === 'submissions' && method === 'POST') {
    const newSub = {
      id: crypto.randomUUID(), teamId: body.teamId, roundId: body.roundId,
      repoUrl: body.repoUrl, demoUrl: body.demoUrl, videoUrl: body.videoUrl,
      description: body.description, submittedAt: new Date().toISOString(),
      repoDescription: 'GitHub Repository details fetched via API',
      repoStars: 12, repoPrimaryLanguage: 'TypeScript',
      repoLastCommitMessage: 'feat: Add frontend layout and responsive navigation'
    };
    submissions.push(newSub);
    localStorage.setItem('hack_submissions', JSON.stringify(submissions));
    return newSub as unknown as T;
  }

  if (cleanPath.startsWith('submissions/team/') && method === 'GET') {
    const teamId = cleanPath.split('/').pop();
    return submissions.filter(s => s.teamId === teamId) as unknown as T;
  }

  // ── SCORING routes ────────────────────────────────────────────────────────
  if (cleanPath.startsWith('scoring/submissions/') && cleanPath.endsWith('/my-scores') && method === 'GET') {
    const submissionId = cleanPath.split('/')[2];
    const allScores: any[] = JSON.parse(localStorage.getItem('hack_scores') || '[]');
    const userJson = localStorage.getItem('user');
    const currUser = userJson ? JSON.parse(userJson) : null;
    const mine = allScores.find(s => s.submissionId === submissionId && s.judgeId === currUser?.id);
    return (mine || null) as unknown as T;
  }

  if (cleanPath.startsWith('scoring/submissions/') && method === 'GET') {
    const submissionId = cleanPath.split('/')[2];
    const allScores: any[] = JSON.parse(localStorage.getItem('hack_scores') || '[]');
    return allScores.filter(s => s.submissionId === submissionId) as unknown as T;
  }

  if (cleanPath.startsWith('scoring/submissions/') && method === 'POST') {
    const submissionId = cleanPath.split('/')[2];
    const allScores: any[] = JSON.parse(localStorage.getItem('hack_scores') || '[]');
    const userJson = localStorage.getItem('user');
    const currUser = userJson ? JSON.parse(userJson) : null;
    const judgeId = currUser?.id || 'unknown-judge';
    const filtered = allScores.filter(s => !(s.submissionId === submissionId && s.judgeId === judgeId));
    const scoreEntry = {
      submissionId, judgeId, judgeName: currUser?.fullName || 'Giám Khảo',
      scores: body.scores,
      totalScore: body.scores.reduce((acc: number, s: any) => acc + s.score, 0),
      scoredAt: new Date().toISOString(),
    };
    filtered.push(scoreEntry);
    localStorage.setItem('hack_scores', JSON.stringify(filtered));
    return { message: 'Đã lưu điểm thành công.' } as unknown as T;
  }

  // ── RANKING routes ────────────────────────────────────────────────────────
  if (cleanPath.startsWith('ranking/rounds/') && cleanPath.endsWith('/calculate') && method === 'POST') {
    const roundId = cleanPath.split('/')[2];
    const allScores: any[] = JSON.parse(localStorage.getItem('hack_scores') || '[]');
    const roundSubs = submissions.filter(s => s.roundId === roundId);
    const results = roundSubs.map((sub, idx) => {
      const subScores = allScores.filter(s => s.submissionId === sub.id);
      const total = subScores.length > 0 ? subScores.reduce((acc: number, s: any) => acc + s.totalScore, 0) / subScores.length : Math.random() * 80 + 20;
      return { submissionId: sub.id, teamId: sub.teamId, teamName: `Đội ${idx + 1}`, categoryName: 'Hạng mục', totalScore: parseFloat(total.toFixed(2)), rank: 0, isAdvanced: false };
    }).sort((a, b) => b.totalScore - a.totalScore).map((r, i) => ({ ...r, rank: i + 1, isAdvanced: i < 3 }));
    const ranking = { roundId, roundName: 'Vòng thi', results, calculatedAt: new Date().toISOString() };
    const allRankings = JSON.parse(localStorage.getItem('hack_rankings') || '{}');
    allRankings[roundId] = ranking;
    localStorage.setItem('hack_rankings', JSON.stringify(allRankings));
    return ranking as unknown as T;
  }

  if (cleanPath.startsWith('ranking/rounds/') && cleanPath.endsWith('/score-summary') && method === 'GET') {
    const roundId = cleanPath.split('/')[2];
    return { roundId, roundName: 'Vòng thi', totalSubmissions: 5, totalJudges: 2, criteriaSummaries: [] } as unknown as T;
  }

  if (cleanPath.match(/^ranking\/rounds\/[^/]+\/categories\/[^/]+$/) && method === 'GET') {
    const parts = cleanPath.split('/');
    const roundId = parts[2]; const categoryId = parts[4];
    const allRankings = JSON.parse(localStorage.getItem('hack_rankings') || '{}');
    const roundRanking = allRankings[roundId] || { results: [] };
    return { ...roundRanking, categoryId, categoryName: 'Hạng mục', results: roundRanking.results.slice(0, 3) } as unknown as T;
  }

  if (cleanPath.match(/^ranking\/rounds\/[^/]+$/) && method === 'GET') {
    const roundId = cleanPath.split('/')[2];
    const allRankings = JSON.parse(localStorage.getItem('hack_rankings') || '{}');
    return (allRankings[roundId] || { roundId, roundName: 'Chưa tính toán', results: [], calculatedAt: null }) as unknown as T;
  }

  if (cleanPath.match(/^ranking\/events\/[^/]+$/) && method === 'GET') {
    const eventId = cleanPath.split('/')[2];
    const ev = events.find(e => e.id === eventId);
    return { eventId, eventTitle: ev?.title || 'Sự kiện', finalRoundName: 'Vòng chung kết', results: [], calculatedAt: null } as unknown as T;
  }

  // ── AWARDS routes ─────────────────────────────────────────────────────────
  if (cleanPath.match(/^awards\/events\/[^/]+\/suggestions$/) && method === 'GET') {
    return [
      { teamId: 'team-1', teamName: 'Team Alpha', categoryName: 'AI', totalScore: 92.5, suggestedAward: 'Giải Nhất' },
      { teamId: 'team-2', teamName: 'Team Beta', categoryName: 'IoT', totalScore: 87.0, suggestedAward: 'Giải Nhì' },
      { teamId: 'team-3', teamName: 'Team Gamma', categoryName: 'AI', totalScore: 81.5, suggestedAward: 'Giải Ba' },
    ] as unknown as T;
  }

  if (cleanPath.match(/^awards\/events\/[^/]+$/) && method === 'GET') {
    const allAwards: any[] = JSON.parse(localStorage.getItem('hack_awards') || '[]');
    const eventId = cleanPath.split('/')[2];
    return allAwards.filter(a => a.eventId === eventId) as unknown as T;
  }

  if (cleanPath === 'awards/grant' && method === 'POST') {
    const allAwards: any[] = JSON.parse(localStorage.getItem('hack_awards') || '[]');
    allAwards.push({ id: crypto.randomUUID(), ...body, grantedAt: new Date().toISOString() });
    localStorage.setItem('hack_awards', JSON.stringify(allAwards));
    return { message: 'Trao giải thành công.' } as unknown as T;
  }

  // ── USERS routes ──────────────────────────────────────────────────────────
  if (cleanPath === 'users/me' && method === 'PUT') {
    const userJson = localStorage.getItem('user');
    const currUser = userJson ? JSON.parse(userJson) : {};
    const updated = { ...currUser, fullName: body.fullName, avatarUrl: body.avatarUrl };
    localStorage.setItem('user', JSON.stringify(updated));
    return updated as unknown as T;
  }

  if (cleanPath === 'users/me' && method === 'GET') {
    const userJson = localStorage.getItem('user');
    const currUser = userJson ? JSON.parse(userJson) : null;
    if (!currUser) throw new Error('Chưa đăng nhập.');
    return { ...currUser, createdAt: new Date().toISOString() } as unknown as T;
  }

  if (cleanPath.startsWith('users') && method === 'GET') {
    return { page: 1, pageSize: 20, totalCount: users.length, totalPages: 1, items: users.map(u => ({ ...u, createdAt: new Date().toISOString() })) } as unknown as T;
  }

  // ── AUDIT LOGS routes ─────────────────────────────────────────────────────
  if (cleanPath.startsWith('audit-logs') && method === 'GET') {
    const logs = [
      { id: '1', action: 'ScoreSubmitted', performedByName: 'Giám Khảo Nội Bộ', targetType: 'submission', createdAt: new Date(Date.now() - 7200000).toISOString() },
      { id: '2', action: 'ScoreUpdated', performedByName: 'Giám Khảo Nội Bộ', targetType: 'submission', createdAt: new Date(Date.now() - 18000000).toISOString() },
      { id: '3', action: 'RoundResultFinalized', performedByName: 'Ban Tổ Chức', targetType: 'round', createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: '4', action: 'TeamDisqualified', performedByName: 'Ban Tổ Chức', targetType: 'team', createdAt: new Date(Date.now() - 172800000).toISOString() },
      { id: '5', action: 'AwardGranted', performedByName: 'Ban Tổ Chức', targetType: 'team', createdAt: new Date(Date.now() - 259200000).toISOString() },
    ];
    return { page: 1, pageSize: 20, totalCount: logs.length, totalPages: 1, items: logs } as unknown as T;
  }

  throw new Error(`Unsupported fallback route: ${cleanPath}`);
};

export const api = {
  auth: {
    login: (body: any) => request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    getPending: () => request<any[]>('/accounts/pending'),
    reviewPending: (body: any) => request<any>('/accounts/review', { method: 'POST', body: JSON.stringify(body) }),
    createJudge: (body: any) => request<any>('/accounts/guest-judge', { method: 'POST', body: JSON.stringify(body) }),
  },
  events: {
    getAll: () => request<any[]>('/events'),
    getById: (id: string) => request<any>(`/events/${id}`),
    create: (body: any) => request<any>('/events', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    updateStatus: (id: string, body: any) => request<any>(`/events/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),
    updateCriteria: (id: string, body: any) => request<any>(`/events/${id}/criteria`, { method: 'PUT', body: JSON.stringify(body) }),
    createCategory: (id: string, body: any) => request<any>(`/events/${id}/categories`, { method: 'POST', body: JSON.stringify(body) }),
    updateCategory: (eventId: string, catId: string, body: any) => request<any>(`/events/${eventId}/categories/${catId}`, { method: 'PUT', body: JSON.stringify(body) }),
    deleteCategory: (eventId: string, catId: string) => request<any>(`/events/${eventId}/categories/${catId}`, { method: 'DELETE' }),
    createRound: (id: string, body: any) => request<any>(`/events/${id}/rounds`, { method: 'POST', body: JSON.stringify(body) }),
  },
  teams: {
    create: (body: any) => request<any>('/teams', { method: 'POST', body: JSON.stringify(body) }),
    join: (body: any) => request<any>('/teams/join', { method: 'POST', body: JSON.stringify(body) }),
    getMyTeams: () => request<any[]>('/teams/my'),
    getStudentTeam: (eventId: string) => request<any>(`/teams/student/event/${eventId}`),
  },
  submissions: {
    submit: (body: any) => request<any>('/submissions', { method: 'POST', body: JSON.stringify(body) }),
    getByTeam: (teamId: string) => request<any[]>(`/submissions/team/${teamId}`),
  },
  scoring: {
    submitScores: (submissionId: string, body: any) => request<any>(`/scoring/submissions/${submissionId}`, { method: 'POST', body: JSON.stringify(body) }),
    getScores: (submissionId: string) => request<any[]>(`/scoring/submissions/${submissionId}`),
    getMyScore: (submissionId: string) => request<any>(`/scoring/submissions/${submissionId}/my-scores`),
  },
  ranking: {
    calculate: (roundId: string) => request<any>(`/ranking/rounds/${roundId}/calculate`, { method: 'POST' }),
    getRound: (roundId: string) => request<any>(`/ranking/rounds/${roundId}`),
    getEvent: (eventId: string) => request<any>(`/ranking/events/${eventId}`),
    getCategory: (roundId: string, categoryId: string) => request<any>(`/ranking/rounds/${roundId}/categories/${categoryId}`),
    getSummary: (roundId: string) => request<any>(`/ranking/rounds/${roundId}/score-summary`),
  },
  awards: {
    getSuggestions: (eventId: string) => request<any[]>(`/awards/events/${eventId}/suggestions`),
    getByEvent: (eventId: string) => request<any[]>(`/awards/events/${eventId}`),
    grant: (body: any) => request<any>('/awards/grant', { method: 'POST', body: JSON.stringify(body) }),
  },
  users: {
    getMe: () => request<any>('/users/me'),
    updateMe: (body: any) => request<any>('/users/me', { method: 'PUT', body: JSON.stringify(body) }),
    getAll: (params?: { status?: string; role?: string; page?: number }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      if (params?.role) qs.set('role', params.role);
      if (params?.page) qs.set('page', String(params.page));
      return request<any>(`/users?${qs.toString()}`);
    },
  },
  auditLogs: {
    getAll: (params?: { action?: string; targetType?: string; page?: number }) => {
      const qs = new URLSearchParams();
      if (params?.action) qs.set('action', params.action);
      if (params?.targetType) qs.set('targetType', params.targetType);
      if (params?.page) qs.set('page', String(params.page));
      return request<any>(`/audit-logs?${qs.toString()}`);
    },
  },
};
