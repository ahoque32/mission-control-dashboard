'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import Icon from './ui/Icon';
import Link from 'next/link';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Get unread count
  const unreadCount = useQuery(api.notifications.getUnreadCount, { recipientId: 'user' }) ?? 0;
  
  // Get recent notifications
  const notifications = useQuery(api.notifications.list, { 
    recipientId: 'user',
    limit: 10 
  }) ?? [];
  
  // Mutations
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Listen for custom event to open notifications
  useEffect(() => {
    const handleOpenNotifications = () => setIsOpen(true);
    window.addEventListener('openNotifications', handleOpenNotifications);
    return () => window.removeEventListener('openNotifications', handleOpenNotifications);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead({ id: id as any });
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead({ recipientId: 'user' });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task':
        return 'kanban';
      case 'agent':
        return 'cpu';
      case 'alert':
        return 'exclamation-triangle';
      case 'success':
        return 'check-circle';
      case 'message':
        return 'chat-dots';
      default:
        return 'bell';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'task':
        return 'text-blue-400 bg-blue-500/20';
      case 'agent':
        return 'text-emerald-400 bg-emerald-500/20';
      case 'alert':
        return 'text-red-400 bg-red-500/20';
      case 'success':
        return 'text-emerald-400 bg-emerald-500/20';
      case 'message':
        return 'text-purple-400 bg-purple-500/20';
      default:
        return 'text-amber-400 bg-amber-500/20';
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-white/5 transition-colors"
        aria-label="Notifications"
      >
        <Icon name="bell" size={20} className="text-foreground-secondary" />
        
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-card border border-border shadow-xl z-50 rounded-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Icon name="bell-fill" size={16} className="text-emerald-400" />
              <span className="font-semibold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium"
                >
                  {unreadCount} new
                </span>
              )}
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mb-3 flex justify-center">
                  <Icon name="bell-slash" size={40} className="text-foreground-muted" />
                </div>
                <p className="text-foreground-secondary text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification: any) => (
                  <div
                    key={notification._id}
                    className={`p-4 hover:bg-white/5 transition-colors ${
                      !notification.read ? 'bg-emerald-500/5' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        getNotificationColor(notification.type)
                      }`}>
                        <Icon name={getNotificationIcon(notification.type)} size={16} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-medium line-clamp-1 ${
                            !notification.read ? 'text-foreground' : 'text-foreground-secondary'
                          }`}>
                            {notification.title}
                          </h4>
                          
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification._id)}
                              className="text-emerald-400 hover:text-emerald-300 flex-shrink-0"
                              title="Mark as read"
                            >
                              <Icon name="check-circle" size={14} />
                            </button>
                          )}
                        </div>
                        
                        <p className="text-xs text-foreground-secondary line-clamp-2 mt-1">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-foreground-muted">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          
                          {notification.actionUrl && (
                            <Link
                              href={notification.actionUrl}
                              className="text-[10px] text-emerald-400 hover:text-emerald-300"
                              onClick={() => !notification.read && handleMarkAsRead(notification._id)}
                            >
                              View →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border bg-white/5">
            <Link
              href="/notifications"
              className="block text-center text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
