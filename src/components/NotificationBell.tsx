import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X } from '@phosphor-icons/react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.notifications.getMy();
      // Sắp xếp mới nhất lên đầu
      setNotifications(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Refresh mỗi 30s để có thông báo mới (optional)
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside để đóng
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.notifications.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`relative p-2 rounded-full transition-colors ${showDropdown ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400 hover:bg-slate-100 hover:text-indigo-600'}`}
      >
        <Bell size={20} weight={unreadCount > 0 ? "fill" : "regular"} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col z-[100]">
          <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
            <h3 className="text-xs font-bold font-mono text-slate-800 uppercase">Thông báo</h3>
            <span className="text-[10px] text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-full">
              {unreadCount} chưa đọc
            </span>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-[11px] text-slate-400 italic">
                Chưa có thông báo nào.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-4 transition-colors cursor-pointer group ${!n.isRead ? 'bg-indigo-50/30' : 'bg-white hover:bg-slate-50'}`}
                    onClick={(e) => !n.isRead && handleMarkAsRead(n.id, e)}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h4 className={`text-xs ${!n.isRead ? 'font-bold text-indigo-900' : 'font-medium text-slate-700'}`}>
                        {n.title}
                      </h4>
                      {!n.isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(n.id, e)}
                          className="opacity-0 group-hover:opacity-100 text-indigo-400 hover:text-indigo-600 transition-opacity p-0.5"
                          title="Đánh dấu đã đọc"
                        >
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                    {n.body && (
                      <p className={`text-[11px] line-clamp-3 leading-relaxed ${!n.isRead ? 'text-indigo-800/80' : 'text-slate-500'}`}>
                        {n.body}
                      </p>
                    )}
                    <div className="mt-2 text-[9px] font-mono text-slate-400">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
