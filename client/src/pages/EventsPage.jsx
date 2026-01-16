import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Radio, TrendingUp, Users, DollarSign } from 'lucide-react';
import api from '../utils/api';
import './EventsPage.css';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('upcoming');

  const filters = [
    { id: 'upcoming', label: 'À venir' },
    { id: 'live', label: 'En direct', icon: Radio },
    { id: 'all', label: 'Tous' }
  ];

  useEffect(() => {
    loadEvents();
  }, [activeFilter]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      let url = '/events?limit=50';
      
      if (activeFilter === 'upcoming') {
        url += '&upcoming=true';
      } else if (activeFilter === 'live') {
        url = '/events/live';
      }
      
      const response = await api.get(url);
      setEvents(response.data.events || []);
      setFilteredEvents(response.data.events || []);
    } catch (error) {
      console.error('Erreur chargement événements:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const options = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return d.toLocaleDateString('fr-FR', options);
  };

  const getStatusLabel = (status) => {
    const labels = {
      scheduled: 'Programmé',
      live: 'En direct',
      ended: 'Terminé',
      cancelled: 'Annulé'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: '#3b82f6',
      live: '#ef4444',
      ended: '#6b7280',
      cancelled: '#9ca3af'
    };
    return colors[status] || '#6b7280';
  };

  const getLiveTypeLabel = (liveType) => {
    const labels = {
      free: 'Gratuit',
      premium: 'Premium',
      sponsored: 'Sponsorisé',
      community: 'Communauté'
    };
    return labels[liveType] || liveType;
  };

  return (
    <div className="events-page">
      <div className="events-header">
        <div className="header-content">
          <h1>
            <Calendar size={32} strokeWidth={1.5} />
            Événements & Lives
          </h1>
        </div>
        <Link to="/events/create" className="btn-create-event">
          Créer un événement
        </Link>
      </div>

      {/* Filtres */}
      <div className="events-filters">
        {filters.map(filter => {
          const Icon = filter.icon;
          return (
            <button
              key={filter.id}
              className={`filter-btn ${activeFilter === filter.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(filter.id)}
            >
              {Icon && <Icon size={18} />}
              {filter.label}
              {filter.id === 'live' && activeFilter === 'live' && (
                <span className="live-pulse"></span>
              )}
            </button>
          );
        })}
      </div>

      {/* Liste des événements */}
      <div className="events-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Chargement des événements...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="empty-state">
            <Calendar size={60} strokeWidth={1} />
            <h3>Aucun événement {activeFilter === 'live' ? 'en direct' : 'trouvé'}</h3>
            <p>Reviens plus tard ou crée ton propre événement</p>
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map(event => (
              <Link
                key={event._id}
                to={`/events/${event._id}`}
                className="event-card"
              >
                {event.thumbnail && (
                  <div className="event-thumbnail">
                    <img src={event.thumbnail} alt={event.title} />
                    {event.status === 'live' && (
                      <div className="live-badge">
                        <Radio size={14} />
                        EN DIRECT
                      </div>
                    )}
                    {event.sponsor?.isSponsored && (
                      <div className="sponsored-badge">
                        Sponsorisé
                      </div>
                    )}
                  </div>
                )}

                <div className="event-body">
                  <div className="event-status" style={{ color: getStatusColor(event.status) }}>
                    {getStatusLabel(event.status)}
                  </div>

                  <h3 className="event-title">{event.title}</h3>
                  <p className="event-description">{event.description}</p>

                  <div className="event-meta">
                    <span className="event-date">
                      <Calendar size={14} />
                      {formatDate(event.scheduledAt)}
                    </span>
                    <span className="event-duration">
                      ⏱️ {event.duration} min
                    </span>
                  </div>

                  {event.creator && (
                    <div className="event-creator">
                      {event.creator.avatar && (
                        <img src={event.creator.avatar} alt={event.creator.username} />
                      )}
                      <span>{event.creator.username}</span>
                    </div>
                  )}

                  <div className="event-footer">
                    {event.liveType && (
                      <span className="live-type-badge">
                        {event.liveType === 'premium' && <DollarSign size={12} />}
                        {getLiveTypeLabel(event.liveType)}
                      </span>
                    )}
                    {event.stats?.registrationCount > 0 && (
                      <span className="registrations">
                        <Users size={14} />
                        {event.stats.registrationCount} inscrits
                      </span>
                    )}
                  </div>

                  {event.access?.price > 0 && (
                    <div className="event-price">
                      {event.access.price}€
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
