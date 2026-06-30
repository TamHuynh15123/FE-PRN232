import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, Plus, Cpu, Trophy, ArrowRight } from '@phosphor-icons/react';

export const Events: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Event Form State (Organizer only)
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      const data = await api.events.getAll();
      setEvents(data);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setFormError(null);
    try {
      const newEv = await api.events.create({
        title,
        description,
        bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80'
      });
      setEvents([newEv, ...events]);
      setTitle('');
      setDescription('');
      setBannerUrl('');
      setShowAddForm(false);
    } catch (err: any) {
      setFormError(err.message || 'Lỗi khi tạo sự kiện.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Welcome Banner */}
      <div className="mb-10 rounded-xl border border-dark-border bg-white p-8 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-sm">
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-tech-cyan/5 blur-3xl" />
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 font-mono tracking-wide mb-2 uppercase">
            HỆ THỐNG QUẢN LÝ HACKATHON
          </h1>
          <p className="text-xs text-slate-600 max-w-[65ch] leading-relaxed">
            Chào mừng bạn đến với nền tảng thi đấu lập trình. Xem danh sách sự kiện đang hoạt động, thành lập đội thi của bạn, nộp bài dự thi và theo dõi kết quả các vòng thi trực tiếp.
          </p>
        </div>

        {user?.role === 'organizer' && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 rounded-lg bg-tech-cyan px-5 py-2.5 text-xs font-semibold text-white hover:opacity-90 active:scale-95 transition-all self-start md:self-center shrink-0"
          >
            <Plus size={16} />
            TẠO SỰ KIỆN MỚI
          </button>
        )}
      </div>

      {/* Organizer Create Event Dialog */}
      {showAddForm && (
        <div className="mb-10 rounded-xl border border-dark-border bg-white p-6 relative shadow-md">
          <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
            <Plus className="text-tech-cyan" /> Tạo cuộc thi hackathon mới
          </h2>
          {formError && <p className="text-xs text-rose-500 mb-4">{formError}</p>}
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Tên sự kiện *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: FPT Hackathon 2026"
                  className="w-full rounded-lg border border-dark-border bg-slate-50 py-2.5 px-4 text-xs text-slate-900 placeholder-slate-400 focus:border-tech-cyan focus:bg-white focus:outline-none focus:ring-1 focus:ring-tech-cyan transition-all"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Link ảnh Banner (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="https://example.com/banner.png"
                  className="w-full rounded-lg border border-dark-border bg-slate-50 py-2.5 px-4 text-xs text-slate-900 placeholder-slate-400 focus:border-tech-cyan focus:bg-white focus:outline-none focus:ring-1 focus:ring-tech-cyan transition-all"
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Mô tả cuộc thi *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Nêu thông điệp cuộc thi, đối tượng tham gia, chủ đề công nghệ..."
                className="w-full rounded-lg border border-dark-border bg-slate-50 py-2.5 px-4 text-xs text-slate-900 placeholder-slate-400 focus:border-tech-cyan focus:bg-white focus:outline-none focus:ring-1 focus:ring-tech-cyan transition-all"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-lg border border-dark-border px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-all"
              >
                HỦY
              </button>
              <button
                type="submit"
                className="rounded-lg bg-tech-cyan px-5 py-2 text-xs font-semibold text-white hover:opacity-90 active:scale-95 transition-all"
              >
                TẠO SỰ KIỆN
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Events Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-tech-cyan border-t-transparent" />
        </div>
      ) : events.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-xl">
          <Calendar size={48} className="mx-auto mb-4 text-slate-400 animate-pulse" />
          <h3 className="text-xs font-semibold text-slate-900 font-mono uppercase mb-1">Không tìm thấy sự kiện nào</h3>
          <p className="text-[11px] text-slate-500">Hiện tại chưa có giải đấu hackathon nào được tạo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {events.map((ev) => (
            <div
              key={ev.id}
              className="group glass-card rounded-xl overflow-hidden hover:border-tech-cyan/50 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Event Banner */}
              <div className="h-44 w-full overflow-hidden relative bg-slate-100">
                <img
                  src={ev.bannerUrl || 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80'}
                  alt={ev.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <span className="absolute top-4 right-4 rounded bg-tech-cyan/10 border border-tech-cyan/35 px-2.5 py-0.5 text-[9px] font-mono font-bold text-tech-cyan uppercase tracking-widest">
                  {ev.status}
                </span>
              </div>

              {/* Event Content */}
              <div className="p-6 flex-grow flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-tech-cyan transition-colors font-mono uppercase tracking-wide">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 mb-6 leading-relaxed">
                    {ev.description}
                  </p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-dark-border/60">
                  <div className="flex gap-4 text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1">
                      <Cpu size={14} className="text-tech-cyan" /> {ev.categories?.length || 0} HẠNG MỤC
                    </span>
                    <span className="flex items-center gap-1">
                      <Trophy size={14} className="text-tech-cyan" /> {ev.rounds?.length || 0} VÒNG THI
                    </span>
                  </div>
                  <Link
                    to={`/events/${ev.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-tech-cyan hover:text-slate-900 transition-colors"
                  >
                    CHI TIẾT <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
