import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  TrendingUp, Eye, Clock, Heart, UserPlus, DollarSign, 
  BarChart3, Users, Globe, Calendar, Target, Zap, Bell,
  TrendingDown, Minus, ChevronRight, Award
} from 'lucide-react';
import './CreatorDashboard.css';

function CreatorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d'); // 7d ou 30d
  const [activeTab, setActiveTab] = useState('overview');
  const sectionRefs = {
    overview: useRef(null),
    performance: useRef(null),
    audience: useRef(null),
    monetization: useRef(null)
  };

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      console.log('📊 Chargement dashboard créateur...');
      const res = await api.get(`/creator/dashboard?period=${period}`);
      console.log('✅ Dashboard data:', res.data);
      setStats(res.data);
    } catch (err) {
      console.error('❌ Erreur chargement dashboard:', err);
      console.error('Détails erreur:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const getLevelInfo = () => {
    const followers = user?.followersCount || 0;
    if (followers < 1000) return { level: '🔰', name: 'Débutant', next: 'Bronze', remaining: 1000 - followers };
    if (followers < 100000) return { level: '🟤', name: 'Bronze', next: 'Argent', remaining: 100000 - followers };
    if (followers < 1000000) return { level: '⚪', name: 'Argent', next: 'Or', remaining: 1000000 - followers };
    if (followers < 10000000) return { level: '🟡', name: 'Or', next: 'Platinium', remaining: 10000000 - followers };
    return { level: '💎', name: 'Platinium', next: null, remaining: 0 };
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num;
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatMoney = (cents) => {
    return `${(cents / 100).toFixed(2)} $`;
  };

  const getTrendIcon = (change) => {
    if (change > 0) return <TrendingUp size={16} className="trend-up" />;
    if (change < 0) return <TrendingDown size={16} className="trend-down" />;
    return <Minus size={16} className="trend-neutral" />;
  };

  const getPerformanceColor = (value, avg) => {
    if (value > avg * 1.2) return 'green';
    if (value < avg * 0.8) return 'red';
    return 'orange';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#27ae60';
    if (score >= 60) return '#f39c12';
    return '#e74c3c';
  };

  const scrollToSection = (key) => {
    const ref = sectionRefs[key];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setActiveTab(key);
  };

  if (loading) {
    return (
      <div className="creator-dashboard loading">
        <h2>Chargement du dashboard...</h2>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="creator-dashboard error">
        <h2>Erreur de chargement</h2>
        <p>Impossible de charger les données du dashboard.</p>
        <button onClick={loadDashboard}>Réessayer</button>
      </div>
    );
  }

  console.log('🎨 Rendering dashboard with stats:', stats);

  const levelInfo = getLevelInfo();
  const progressPercent = levelInfo.next 
    ? ((user.followersCount / (user.followersCount + levelInfo.remaining)) * 100) 
    : 100;

  const isArgentPlus = user.followersCount >= 100000;

  return (
    <div className="creator-dashboard">
      <div className="dashboard-tabs">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => scrollToSection('overview')}>Vue rapide</button>
        <button className={activeTab === 'performance' ? 'active' : ''} onClick={() => scrollToSection('performance')}>Performances</button>
        <button className={activeTab === 'audience' ? 'active' : ''} onClick={() => scrollToSection('audience')}>Audience</button>
        <button className={activeTab === 'monetization' ? 'active' : ''} onClick={() => scrollToSection('monetization')}>Monétisation</button>
        <button onClick={() => navigate('/opportunities')}>Opportunités</button>
      </div>

      {/* Header - Niveau + Progression */}
      <div className="dashboard-header" ref={sectionRefs.overview}>
        <div className="level-status">
          <div className="level-badge">
            <span className="level-emoji">{levelInfo.level}</span>
            <span className="level-name">{levelInfo.name}</span>
          </div>
          <div className="followers-count">
            {formatNumber(user.followersCount)} abonnés
          </div>
        </div>
        
        {levelInfo.next && (
          <div className="level-progression">
            <div className="progression-label">
              Prochain niveau ({levelInfo.next}) : {formatNumber(levelInfo.remaining)} restants
            </div>
            <div className="progression-bar">
              <div className="progression-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Sélecteur période */}
      <div className="period-selector">
        <button 
          className={period === '7d' ? 'active' : ''} 
          onClick={() => setPeriod('7d')}
        >
          7 jours
        </button>
        <button 
          className={period === '30d' ? 'active' : ''} 
          onClick={() => setPeriod('30d')}
        >
          30 jours
        </button>
      </div>

      {/* Vue rapide - KPIs essentiels */}
      <div className="kpis-grid">
        <div className="kpi-card">
          <div className="kpi-icon"><Eye size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Vues totales</div>
            <div className="kpi-value">{formatNumber(stats.kpis.totalViews)}</div>
            <div className="kpi-change">
              {getTrendIcon(stats.kpis.viewsChange)}
              <span>{Math.abs(stats.kpis.viewsChange)}%</span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><Clock size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Temps de vision</div>
            <div className="kpi-value">{formatTime(stats.kpis.totalWatchTime)}</div>
            <div className="kpi-change">
              {getTrendIcon(stats.kpis.watchTimeChange)}
              <span>{Math.abs(stats.kpis.watchTimeChange)}%</span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><Heart size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Engagement moyen</div>
            <div className="kpi-value">{stats.kpis.avgEngagement.toFixed(1)}%</div>
            <div className="kpi-change">
              {getTrendIcon(stats.kpis.engagementChange)}
              <span>{Math.abs(stats.kpis.engagementChange)}%</span>
            </div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon"><UserPlus size={24} /></div>
          <div className="kpi-content">
            <div className="kpi-label">Nouveaux abonnés</div>
            <div className="kpi-value">{formatNumber(stats.kpis.newFollowers)}</div>
            <div className="kpi-change">
              {getTrendIcon(stats.kpis.followersChange)}
              <span>{Math.abs(stats.kpis.followersChange)}%</span>
            </div>
          </div>
        </div>

        {isArgentPlus && (
          <>
            <div className="kpi-card">
              <div className="kpi-icon"><DollarSign size={24} /></div>
              <div className="kpi-content">
                <div className="kpi-label">Revenus générés</div>
                <div className="kpi-value">{formatMoney(stats.kpis.revenue)}</div>
                <div className="kpi-change">
                  {getTrendIcon(stats.kpis.revenueChange)}
                  <span>{Math.abs(stats.kpis.revenueChange)}%</span>
                </div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon"><Award size={24} /></div>
              <div className="kpi-content">
                <div className="kpi-label">Score monétisation</div>
                <div className="kpi-value">{Math.round(stats.monetization.score.total)}/100</div>
                <div className="kpi-change">
                  {getTrendIcon(stats.monetization.scoreChange)}
                  <span>{Math.abs(stats.monetization.scoreChange)}%</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Performances contenu */}
      <div className="section-card" ref={sectionRefs.performance}>
        <h2 className="section-title">
          <BarChart3 size={20} />
          Performances contenu
        </h2>

        <div className="posts-table">
          <div className="table-header">
            <div>Type</div>
            <div>Portée</div>
            <div>Engagement</div>
            <div>Temps moyen</div>
            {isArgentPlus && <div>Revenus</div>}
            <div>Statut</div>
          </div>
          {stats.posts.map((post, idx) => (
            <div 
              key={idx} 
              className={`table-row ${getPerformanceColor(post.engagement, stats.avgEngagement)}`}
            >
              <div className="post-type">{post.type}</div>
              <div>{formatNumber(post.reach)}</div>
              <div>{post.engagement.toFixed(1)}%</div>
              <div>{formatTime(post.avgTime)}</div>
              {isArgentPlus && <div>{formatMoney(post.revenue)}</div>}
              <div className="post-status">{post.sponsored ? '💼 Sponsorisé' : '🌱 Organique'}</div>
            </div>
          ))}
        </div>

        {stats.insights && stats.insights.length > 0 && (
          <div className="insights-box">
            <h3>💡 Insights automatiques</h3>
            {stats.insights.map((insight, idx) => (
              <div key={idx} className="insight-item">
                <Zap size={14} />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audience */}
      <div className="section-card" ref={sectionRefs.audience}>
        <h2 className="section-title">
          <Users size={20} />
          Audience
        </h2>

        <div className="audience-stats">
          <div className="audience-item">
            <div className="audience-label">Nouveaux / Fidèles</div>
            <div className="audience-value">
              {stats.audience.newRatio}% / {100 - stats.audience.newRatio}%
            </div>
          </div>
          <div className="audience-item">
            <div className="audience-label">Abonnés actifs</div>
            <div className="audience-value">{stats.audience.activeRate}%</div>
          </div>
          <div className="audience-item">
            <div className="audience-label">Croissance journalière</div>
            <div className="audience-value">+{stats.audience.dailyGrowth}</div>
          </div>
        </div>

        <div className="audience-demographics">
          <div className="demo-group">
            <Globe size={16} />
            <span>Top pays : {stats.audience.topCountries.join(', ')}</span>
          </div>
          <div className="demo-group">
            <Calendar size={16} />
            <span>Heures de pointe : {stats.audience.peakHours.join('h, ')}h</span>
          </div>
        </div>
      </div>

      {/* Monétisation */}
      <div className="section-card monetization-section" ref={sectionRefs.monetization}>
        <h2 className="section-title">
          <DollarSign size={20} />
          Monétisation
        </h2>

        {isArgentPlus ? (
          <>
            <div className="revenue-sources">
              {stats.monetization.sources.map((source, idx) => (
                <div key={idx} className="revenue-source">
                  <div className="source-label">{source.name}</div>
                  <div className="source-amount">{formatMoney(source.amount)}</div>
                  <div className="source-bar">
                    <div 
                      className="source-fill" 
                      style={{ width: `${source.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="total-revenue">
              Total mensuel : <strong>{formatMoney(stats.monetization.totalMonthly)}</strong>
            </div>

            <div className="score-breakdown">
              <h3>Score de Monétisation (SM) : {Math.round(stats.monetization.score.total)}/100</h3>
              <div className="score-bars">
                <div className="score-item">
                  <div className="score-label">Rétention</div>
                  <div className="score-bar">
                    <div 
                      className="score-fill" 
                      style={{ 
                        width: `${stats.monetization.score.retention}%`,
                        background: getScoreColor(stats.monetization.score.retention)
                      }}
                    />
                  </div>
                  <div className="score-value">{stats.monetization.score.retention}</div>
                </div>
                <div className="score-item">
                  <div className="score-label">Engagement</div>
                  <div className="score-bar">
                    <div 
                      className="score-fill" 
                      style={{ 
                        width: `${stats.monetization.score.engagement}%`,
                        background: getScoreColor(stats.monetization.score.engagement)
                      }}
                    />
                  </div>
                  <div className="score-value">{stats.monetization.score.engagement}</div>
                </div>
                <div className="score-item">
                  <div className="score-label">Trust</div>
                  <div className="score-bar">
                    <div 
                      className="score-fill" 
                      style={{ 
                        width: `${stats.monetization.score.trust}%`,
                        background: getScoreColor(stats.monetization.score.trust)
                      }}
                    />
                  </div>
                  <div className="score-value">{stats.monetization.score.trust}</div>
                </div>
                <div className="score-item">
                  <div className="score-label">Stabilité</div>
                  <div className="score-bar">
                    <div 
                      className="score-fill" 
                      style={{ 
                        width: `${stats.monetization.score.stability}%`,
                        background: getScoreColor(stats.monetization.score.stability)
                      }}
                    />
                  </div>
                  <div className="score-value">{stats.monetization.score.stability}</div>
                </div>
              </div>

              {stats.monetization.recommendations && stats.monetization.recommendations.length > 0 && (
                <div className="score-recommendations">
                  {stats.monetization.recommendations.map((rec, idx) => (
                    <div key={idx} className="recommendation">
                      <Target size={14} />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="monetization-locked">
            <div className="locked-title">Monétisation disponible à partir d'Argent</div>
            <div className="locked-desc">Encore {formatNumber(levelInfo.remaining)} abonnés pour débloquer.</div>
            <div className="locked-actions">
              <button onClick={() => scrollToSection('performance')}>Voir ce qui marche</button>
              <button className="secondary" onClick={() => navigate('/monetization')}>En savoir plus</button>
            </div>
          </div>
        )}
      </div>

      {/* Opportunités (Argent+) */}
      {isArgentPlus && stats.opportunities && (
        <div className="section-card">
          <h2 className="section-title">
            <Zap size={20} />
            Opportunités & Business
          </h2>

          {stats.opportunities.partnerships && stats.opportunities.partnerships.length > 0 && (
            <div className="opportunities-list">
              <h3>🤝 Marketplace partenariats</h3>
              {stats.opportunities.partnerships.map((partner, idx) => (
                <div key={idx} className="opportunity-item">
                  <div className="opportunity-content">
                    <div className="opportunity-title">{partner.brand}</div>
                    <div className="opportunity-desc">{partner.description}</div>
                  </div>
                  <ChevronRight size={20} />
                </div>
              ))}
            </div>
          )}

          {stats.opportunities.recommendations && stats.opportunities.recommendations.length > 0 && (
            <div className="capitune-recommendations">
              <h3>⭐ Recommandations Capitune</h3>
              {stats.opportunities.recommendations.map((rec, idx) => (
                <div key={idx} className="recommendation-item">
                  <Zap size={14} />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Alertes */}
      {stats.alerts && stats.alerts.length > 0 && (
        <div className="alerts-section">
          <h2 className="section-title">
            <Bell size={20} />
            Alertes & Notifications
          </h2>
          {stats.alerts.map((alert, idx) => (
            <div key={idx} className={`alert-item ${alert.type}`}>
              <Bell size={16} />
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CreatorDashboard;
