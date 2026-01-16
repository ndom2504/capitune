import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, DollarSign, Eye, Users, Award, AlertCircle, Settings, Download } from 'lucide-react';
import api from '../utils/api';
import './MonetizationPage.css';

function MonetizationPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdraw, setShowWithdraw] = useState(false);

  useEffect(() => {
    loadMonetizationData();
  }, []);

  const loadMonetizationData = async () => {
    try {
      setLoading(true);
      const [profileRes, statsRes, transactionsRes] = await Promise.all([
        api.get('/monetization/profile'),
        api.get('/monetization/stats'),
        api.get('/monetization/transactions?limit=10')
      ]);
      
      setProfile(profileRes.data);
      setStats(statsRes.data);
      setTransactions(transactionsRes.data.transactions);
    } catch (err) {
      console.error('Erreur chargement monétisation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount) * 100; // Convertir en centimes
    
    if (amount < 2000) {
      alert('Montant minimum : 20$');
      return;
    }
    
    try {
      await api.post('/monetization/withdraw', { amount });
      alert('Demande de retrait envoyée !');
      setShowWithdraw(false);
      setWithdrawAmount('');
      loadMonetizationData();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors du retrait');
    }
  };

  const formatAmount = (cents) => {
    return (cents / 100).toFixed(2) + ' $';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#27ae60';
    if (score >= 60) return '#f39c12';
    if (score >= 40) return '#e67e22';
    return '#e74c3c';
  };

  const getEligibilityLevel = () => {
    const followers = user?.followersCount || 0;
    if (followers >= 1000000) return 'Or (1M+)';
    if (followers >= 100000) return 'Argent (100k+)';
    if (followers >= 1000) return 'Bronze (1k+)';
    return 'Nouveau';
  };

  if (loading) {
    return (
      <div className="monetization-loading">
        <p>Chargement de votre espace monétisation...</p>
      </div>
    );
  }

  return (
    <div className="monetization-page">
      <div className="monetization-header">
        <h1>💰 Monétisation</h1>
        <p>Gagne de l'argent avec du contenu de qualité</p>
      </div>

      {/* Alerte éligibilité */}
      {!profile?.isEligible && (
        <div className="eligibility-alert">
          <AlertCircle size={20} />
          <div>
            <strong>Non éligible à la monétisation</strong>
            <p>Niveau actuel : {getEligibilityLevel()} • Requis : Argent (100k+ abonnés)</p>
          </div>
        </div>
      )}

      {/* Balance & Actions */}
      <div className="balance-card">
        <div className="balance-info">
          <div className="balance-label">Balance disponible</div>
          <div className="balance-amount">{formatAmount(profile?.balance || 0)}</div>
          <div className="balance-meta">
            Total gagné : {formatAmount(stats?.overview?.totalEarnings || 0)} • 
            Retiré : {formatAmount(stats?.overview?.withdrawn || 0)}
          </div>
        </div>
        {profile?.isEligible && (
          <button 
            className="withdraw-btn"
            onClick={() => setShowWithdraw(true)}
            disabled={profile?.balance < 2000}
          >
            <Download size={18} />
            Retirer
          </button>
        )}
      </div>

      {/* Modal retrait */}
      {showWithdraw && (
        <div className="modal-overlay" onClick={() => setShowWithdraw(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Demander un retrait</h3>
            <p>Montant disponible : {formatAmount(profile?.balance || 0)}</p>
            <input
              type="number"
              placeholder="Montant ($)"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              min="20"
              step="0.01"
            />
            <p className="modal-hint">Minimum : 20$ • Traitement sous 5 jours ouvrés</p>
            <div className="modal-actions">
              <button onClick={handleWithdraw} className="btn-confirm">Confirmer</button>
              <button onClick={() => setShowWithdraw(false)} className="btn-cancel">Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* Score de monétisation */}
      <div className="score-section">
        <div className="section-header">
          <h2><Award size={20} /> Score de Monétisation</h2>
          <span className="score-badge" style={{ background: getScoreColor(profile?.monetizationScore?.total || 0) }}>
            {Math.round(profile?.monetizationScore?.total || 0)}/100
          </span>
        </div>
        
        <div className="score-breakdown">
          <div className="score-item">
            <div className="score-label">🎯 Rétention (35%)</div>
            <div className="score-bar">
              <div className="score-fill" style={{ width: `${profile?.monetizationScore?.retention || 0}%` }} />
            </div>
            <div className="score-value">{Math.round(profile?.monetizationScore?.retention || 0)}</div>
          </div>
          
          <div className="score-item">
            <div className="score-label">💬 Engagement (30%)</div>
            <div className="score-bar">
              <div className="score-fill" style={{ width: `${profile?.monetizationScore?.engagement || 0}%` }} />
            </div>
            <div className="score-value">{Math.round(profile?.monetizationScore?.engagement || 0)}</div>
          </div>
          
          <div className="score-item">
            <div className="score-label">🛡️ Confiance (20%)</div>
            <div className="score-bar">
              <div className="score-fill" style={{ width: `${profile?.monetizationScore?.trust || 0}%` }} />
            </div>
            <div className="score-value">{Math.round(profile?.monetizationScore?.trust || 0)}</div>
          </div>
          
          <div className="score-item">
            <div className="score-label">📅 Stabilité (15%)</div>
            <div className="score-bar">
              <div className="score-fill" style={{ width: `${profile?.monetizationScore?.stability || 0}%` }} />
            </div>
            <div className="score-value">{Math.round(profile?.monetizationScore?.stability || 0)}</div>
          </div>
        </div>
      </div>

      {/* Revenus par source */}
      <div className="earnings-section">
        <h2><DollarSign size={20} /> Revenus par source</h2>
        <div className="earnings-grid">
          <div className="earning-card">
            <div className="earning-icon">📢</div>
            <div className="earning-label">Publicité</div>
            <div className="earning-amount">{formatAmount(profile?.earnings?.advertising || 0)}</div>
            <div className="earning-split">50% créateur / 50% Capitune</div>
          </div>
          
          <div className="earning-card">
            <div className="earning-icon">💳</div>
            <div className="earning-label">Abonnements</div>
            <div className="earning-amount">{formatAmount(profile?.earnings?.subscriptions || 0)}</div>
            <div className="earning-split">80% créateur / 20% Capitune</div>
          </div>
          
          <div className="earning-card">
            <div className="earning-icon">🎁</div>
            <div className="earning-label">Tips</div>
            <div className="earning-amount">{formatAmount(profile?.earnings?.tips || 0)}</div>
            <div className="earning-split">90% créateur / 10% Capitune</div>
          </div>
          
          <div className="earning-card">
            <div className="earning-icon">🎥</div>
            <div className="earning-label">Lives payants</div>
            <div className="earning-amount">{formatAmount(profile?.earnings?.liveTickets || 0)}</div>
            <div className="earning-split">70% créateur / 30% Capitune</div>
          </div>
          
          <div className="earning-card">
            <div className="earning-icon">🤝</div>
            <div className="earning-label">Partenariats</div>
            <div className="earning-amount">{formatAmount(profile?.earnings?.partnerships || 0)}</div>
            <div className="earning-split">80-90% créateur</div>
          </div>
        </div>
      </div>

      {/* Transactions récentes */}
      <div className="transactions-section">
        <h2><TrendingUp size={20} /> Transactions récentes</h2>
        {transactions.length === 0 ? (
          <div className="empty-transactions">
            <p>Aucune transaction pour le moment</p>
          </div>
        ) : (
          <div className="transactions-list">
            {transactions.map((t, idx) => (
              <div key={idx} className="transaction-item">
                <div className="transaction-info">
                  <div className="transaction-type">
                    {t.type === 'advertising' && '📢 Publicité'}
                    {t.type === 'subscription' && '💳 Abonnement'}
                    {t.type === 'tip' && '🎁 Tip'}
                    {t.type === 'live_ticket' && '🎥 Ticket Live'}
                    {t.type === 'partnership' && '🤝 Partenariat'}
                    {t.type === 'withdrawal' && '💸 Retrait'}
                    {t.type === 'bonus' && '🎉 Bonus'}
                  </div>
                  <div className="transaction-desc">{t.description}</div>
                  <div className="transaction-date">
                    {new Date(t.timestamp).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className={`transaction-amount ${t.amount > 0 ? 'positive' : 'negative'}`}>
                  {t.amount > 0 ? '+' : ''}{formatAmount(t.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Conseils */}
      <div className="tips-section">
        <h3>💡 Comment augmenter ton score</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <strong>Rétention</strong>
            <p>Crée du contenu captivant qui garde les spectateurs jusqu'à la fin</p>
          </div>
          <div className="tip-card">
            <strong>Engagement</strong>
            <p>Encourage les commentaires de qualité et les partages authentiques</p>
          </div>
          <div className="tip-card">
            <strong>Confiance</strong>
            <p>Évite les contenus problématiques et respecte la communauté</p>
          </div>
          <div className="tip-card">
            <strong>Stabilité</strong>
            <p>Publie régulièrement (idéalement 15-20 posts/mois)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MonetizationPage;
