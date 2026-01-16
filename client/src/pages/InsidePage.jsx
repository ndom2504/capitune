import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Users, Search, X, PhoneCall, Paperclip, Video } from 'lucide-react';
import api from '../utils/api';
import './InsidePage.css';

const API_HOST = import.meta.env.VITE_API_HOST || 'http://localhost:3000';
const resolveUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_HOST}${url}`;
  return `${API_HOST}/uploads/${url}`;
};

const displayName = (entity) => {
  if (!entity) return 'Utilisateur';
  const source = entity.user || entity.profile || entity;
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

const InsidePage = () => {
  const [activeTab, setActiveTab] = useState('inbox'); // inbox, requests, contacts
  const [conversations, setConversations] = useState([]);
  const [contactRequests, setContactRequests] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);
  // Flux de nouvelle demande déplacé vers la sidebar Contacts

  // Charger les conversations
  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inside/conversations?limit=50');
      setConversations(response.data.conversations || []);
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // (Nouveau) flux de demande désactivé ici; les demandes partent désormais via la sidebar Contacts.

  // Charger les demandes de contact
  const loadContactRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inside/requests?status=pending');
      setContactRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger les messages d'une conversation
  const loadMessages = async (threadId) => {
    try {
      const response = await api.get(`/inside/conversations/${threadId}/messages?limit=50`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Erreur chargement messages:', error);
    }
  };

  // Ouvrir une conversation
  const openThread = (thread) => {
    setSelectedThread(thread);
    loadMessages(thread._id);
  };

  // Envoyer un message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return;

    try {
      await api.post(`/inside/conversations/${selectedThread._id}/messages`, {
        content: newMessage
      });
      setNewMessage('');
      loadMessages(selectedThread._id);
      loadConversations();
    } catch (error) {
      console.error('Erreur envoi message:', error);
    }
  };

  const sendQuickMessage = async (content) => {
    if (!selectedThread || !content) return;
    try {
      await api.post(`/inside/conversations/${selectedThread._id}/messages`, { content });
      loadMessages(selectedThread._id);
      loadConversations();
    } catch (error) {
      console.error('Erreur envoi message:', error);
    }
  };

  // Accepter une demande
  const acceptRequest = async (requestId) => {
    try {
      const response = await api.post(`/inside/requests/${requestId}/accept`);
      loadContactRequests();
      openThread(response.data.thread);
    } catch (error) {
      console.error('Erreur acceptation:', error);
    }
  };

  // Refuser une demande
  const declineRequest = async (requestId) => {
    try {
      await api.post(`/inside/requests/${requestId}/decline`);
      loadContactRequests();
    } catch (error) {
      console.error('Erreur refus:', error);
    }
  };

  // Charger initialement
  useEffect(() => {
    if (activeTab === 'inbox') {
      loadConversations();
    } else if (activeTab === 'requests') {
      loadContactRequests();
    }
  }, [activeTab]);

  // Rafraîchir périodiquement les demandes pour voir les nouvelles sans recharger
  useEffect(() => {
    const interval = setInterval(() => {
      loadContactRequests();
    }, 15000); // toutes les 15s
    return () => clearInterval(interval);
  }, []);

  const filteredConversations = conversations.filter(c => {
    const participant = c.participants?.find(p => p.username || p.fullName);
    const name = displayName(participant).toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  const filteredRequests = contactRequests.filter(r => {
    const name = displayName(r.senderProfile).toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  return (
    <>
      <div className="inside-page">
        <div className="inside-container">
          {/* En-tête */}
              <div className="inside-header">
            <div className="inside-header-main">
              <div className="inside-title">
                <MessageCircle size={28} strokeWidth={1.5} />
                <h1>Inside</h1>
              </div>
              <p className="inside-subtitle">Conversation modes for real connections</p>

              <div className="inside-modes">
                <div className="mode-card">
                  <div className="mode-icon">💬</div>
                  <div className="mode-body">
                    <h4>Casual</h4>
                    <p>Icebreakers and light topics to warm up.</p>
                  </div>
                </div>
                <div className="mode-card">
                  <div className="mode-icon">🔤</div>
                  <div className="mode-body">
                    <h4>Language Exchange</h4>
                    <p>Practice English together, swap corrections when wanted.</p>
                  </div>
                </div>
                <div className="mode-card">
                  <div className="mode-icon">🌍</div>
                  <div className="mode-body">
                    <h4>Culture Talk</h4>
                    <p>Share stories about your city, food, music, traditions.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Onglets */}
        <div className="inside-tabs">
          <button
            className={`tab-button ${activeTab === 'inbox' ? 'active' : ''}`}
            onClick={() => setActiveTab('inbox')}
          >
            <MessageCircle size={18} />
            Inbox ({conversations.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            <Users size={18} />
            Requests ({contactRequests.length})
          </button>
        </div>

        {/* Contenu principal */}
        <div className="inside-content">
          {/* Sidebar - Liste */}
          <div className="inside-sidebar">
            <div className="inside-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="inside-list">
              {activeTab === 'inbox' && (
                <>
                  {filteredConversations.length === 0 ? (
                    <div className="empty-state">
                      <MessageCircle size={40} strokeWidth={1} />
                      <p>No conversations yet</p>
                    </div>
                  ) : (
                    filteredConversations.map(conv => (
                      <div
                        key={conv._id}
                        className={`inside-item ${selectedThread?._id === conv._id ? 'active' : ''}`}
                        onClick={() => openThread(conv)}
                      >
                        <div className="inside-item-avatar">
                          {conv.participants?.[0]?.avatar ? (
                            <img
                              src={resolveUrl(conv.participants[0].avatar)}
                              alt={displayName(conv.participants[0])}
                            />
                          ) : (
                            <div className="avatar-placeholder">
                              <Users size={16} />
                            </div>
                          )}
                        </div>
                        <div className="inside-item-info">
                          <h4>{displayName(conv.participants?.[0])}</h4>
                          <p className="last-message">{conv.lastMessage || 'No messages yet'}</p>
                        </div>
                        {conv.unread && <div className="unread-badge"></div>}
                      </div>
                    ))
                  )}
                </>
              )}

              {activeTab === 'requests' && (
                <>
                  {filteredRequests.length === 0 ? (
                    <div className="empty-state">
                      <Users size={40} strokeWidth={1} />
                      <p>No requests yet</p>
                    </div>
                  ) : (
                    filteredRequests.map(req => (
                      <div key={req._id} className="inside-request">
                        <div className="request-header">
                          <div className="request-avatar">
                            {req.senderProfile?.avatar ? (
                              <img
                                src={resolveUrl(req.senderProfile.avatar)}
                                alt={displayName(req.senderProfile)}
                              />
                            ) : (
                              <div className="avatar-placeholder">
                                <Users size={16} />
                              </div>
                            )}
                          </div>
                          <div className="request-info">
                            <h4>{displayName(req.senderProfile)}</h4>
                            <p className="request-intention">{req.intention}</p>
                          </div>
                        </div>
                        <p className="request-message">{req.message}</p>
                        <div className="request-actions">
                          <button
                            className="btn-accept"
                            onClick={() => acceptRequest(req._id)}
                          >
                            Accept
                          </button>
                          <button
                            className="btn-decline"
                            onClick={() => declineRequest(req._id)}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </div>

          {/* Zone de chat */}
          {activeTab === 'inbox' && selectedThread ? (
            <div className="inside-chat">
              <div className="chat-header">
                <div className="chat-header-info">
                  <h3>{displayName(selectedThread.participants?.[0]) || 'Conversation'}</h3>
                  <p className="chat-type">{selectedThread.type === 'partnership' ? '🤝 Partnership' : '💬 Discussion'}</p>
                </div>
                <button
                  className="close-chat"
                  onClick={() => setSelectedThread(null)}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="messages-list">
                {messages.length === 0 ? (
                  <div className="empty-messages">
                    <MessageCircle size={40} strokeWidth={1} />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`message ${msg.isSystemMessage ? 'system' : 'user'}`}
                    >
                      {msg.isSystemMessage ? (
                        <p className="system-message">{msg.content}</p>
                      ) : (
                        <>
                          <p className="message-content">{msg.content}</p>
                          <span className="message-time">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </span>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="message-input">
                <input
                  type="text"
                  placeholder="Write a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <div className="message-actions">
                  <button
                    className="message-action-btn"
                    title="Audio call"
                    disabled={!selectedThread}
                    onClick={() => sendQuickMessage('🔊 Private audio call request')}
                  >
                    <PhoneCall size={16} />
                  </button>
                  <button
                    className="message-action-btn"
                    title="Video call"
                    disabled={!selectedThread}
                    onClick={() => sendQuickMessage('🎥 Private video call request')}
                  >
                    <Video size={16} />
                  </button>
                  <button
                    className="message-action-btn"
                    title="Send a file"
                    disabled={!selectedThread}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip size={16} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const sizeKb = Math.max(1, Math.round(file.size / 1024));
                      sendQuickMessage(`📎 ${file.name} (${sizeKb} KB)`);
                      e.target.value = '';
                    }}
                  />
                </div>
                <button
                  className="btn-send"
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          ) : activeTab === 'inbox' ? (
            <div className="no-selection">
              <MessageCircle size={60} strokeWidth={1} />
              <p>Sélectionne une conversation</p>
            </div>
          ) : null}
        </div>
        </div>
      </div>

      {/* Modal de nouvelle demande désactivé; les demandes se font via la sidebar Contacts */}
    </>
  );
};

export default InsidePage;
