import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { timeAgo } from '../utils/helpers';

const NotificationBell = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!currentUser) return;

    const fetchNotifications = async () => {
      try {
        const res = await api.get("/notifications");
        setNotifications(res.data.notifications);
      } catch (err) {
        console.error(err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => setOpen(o => !o);

  const handleMarkRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSelectMode = () => {
    setSelectMode(m => !m);
    setSelectedIds([]);
  };

  const toggleSelect = (e, id) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await api.delete('/notifications', { data: { ids: selectedIds } });
      setNotifications(prev => prev.filter(n => !selectedIds.includes(n._id)));
      setSelectedIds([]);
      setSelectMode(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (!currentUser) return null;

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        style={{
          position: 'relative', background: 'none', border: 'none',
          fontSize: '20px', cursor: 'pointer', padding: '6px',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: 'red', color: '#fff', borderRadius: '50%',
            fontSize: '11px', padding: '1px 5px', minWidth: '16px',
            textAlign: 'center', lineHeight: '14px',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '38px',
          width: '320px', maxHeight: '400px', overflowY: 'auto',
          background: '#fff', borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 999,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px', borderBottom: '1px solid #eee',
          }}>
            <strong>Notifications</strong>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {selectMode && selectedIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '13px' }}
                >
                  Delete ({selectedIds.length})
                </button>
              )}
              {unreadCount > 0 && !selectMode && (
                <button
                  onClick={handleMarkAllRead}
                  style={{ background: 'none', border: 'none', color: '#4A90E2', cursor: 'pointer', fontSize: '13px' }}
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={toggleSelectMode}
                  style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '13px' }}
                >
                  {selectMode ? 'Cancel' : 'Select'}
                </button>
              )}
            </div>
          </div>

          {notifications.length === 0 ? (
            <p style={{ padding: '16px', color: '#888', fontSize: '14px' }}>No notifications yet.</p>
          ) : (
            notifications.map(n => (
              <div
                key={n._id}
                onClick={() => selectMode ? toggleSelect({ stopPropagation: () => {} }, n._id) : handleMarkRead(n._id)}
                style={{
                  padding: '10px 14px', borderBottom: '1px solid #f2f2f2',
                  cursor: 'pointer', background: n.read ? '#fff' : '#f0f7ff',
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                }}
              >
                {selectMode && (
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(n._id)}
                    onChange={(e) => toggleSelect(e, n._id)}
                    onClick={(e) => e.stopPropagation()}
                    style={{ marginTop: '3px', cursor: 'pointer' }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <p style={{ margin: 0, fontSize: '13.5px', flex: 1 }}>{n.message}</p>
                    {n.count > 1 && (
                      <span style={{
                        background: '#4A90E2', color: '#fff', fontSize: '10.5px',
                        fontWeight: 600, borderRadius: '10px', padding: '2px 7px',
                        whiteSpace: 'nowrap',
                      }}>
                        x{n.count}
                      </span>
                    )}
                    {!selectMode && (
                      <button
                        onClick={(e) => handleDelete(e, n._id)}
                        title="Delete notification"
                        style={{
                          background: 'none', border: 'none', color: '#bbb',
                          cursor: 'pointer', fontSize: '13px', padding: '0 2px',
                          lineHeight: 1,
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: '11.5px', color: '#999' }}>{timeAgo(n.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;