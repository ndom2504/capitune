import { useMemo, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import './NotificationBell.css';

const displayName = (actor) => {
  if (!actor) return 'Utilisateur';
  const source = actor.user || actor.profile || actor;
  const name = source.fullName
    || source.name
    || source.displayName
    || source.profile?.fullName
    || source.settings?.fullName
    || source.profile?.displayName
    || source.settings?.displayName
    || source.username
    || source.handle
    || source.userName
    || source.email;
  return (name || 'Utilisateur').toString().trim();
};

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  const unreadCount = useMemo(() => items.filter((n) => n.unread && n.priority !== 'digest').length, [items]);

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const markRead = (id) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
  };

  return (
    <div className="notif-wrapper">
      <button className="navbar-link navbar-notifications" title="Notifications" onClick={() => setOpen((o) => !o)}>
        <Bell size={20} strokeWidth={1.5} />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-header">
            <p className="notif-title">Notifications</p>
            <button className="notif-mark" onClick={markAllRead}>
              <Check size={16} strokeWidth={1.5} />
              <span>Tout marquer comme lu</span>
            </button>
          </div>

          <div className="notif-list">
            {items.map((n) => (
              <div
                key={n.id}
                className={`notif-item ${n.unread ? 'unread' : ''}`}
                onClick={() => markRead(n.id)}
              >
                <div className={`notif-icon type-${n.type}`}>{n.icon}</div>
                <div className="notif-content">
                  <div className="notif-line">
                    <span className="notif-title-line">{n.title}</span>
                    {n.priority === 'high' && <span className="notif-pill">Prioritaire</span>}
                    {n.priority === 'digest' && <span className="notif-pill subtle">Digest</span>}
                  </div>
                  <p className="notif-message">
                    {n.actor ? `${displayName(n.actor)} · ` : ''}
                    {n.message}
                  </p>
                  <span className="notif-meta">{n.meta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
