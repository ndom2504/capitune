import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { BarChart3, Briefcase, Users, Clock, CheckCircle2, AlertTriangle, LineChart, DollarSign, Target, Sparkles, PieChart, FileText, CreditCard } from 'lucide-react';
import './AdvertiserDashboard.css';

function StatCard({ icon: Icon, label, value, meta }) {
  return (
    <div className="ad-kpi-card">
      <Icon size={20} />
      <div>
        <div className="ad-kpi-value">{value}</div>
        <div className="ad-kpi-label">{label}</div>
        {meta && <div className="ad-kpi-meta">{meta}</div>}
      </div>
    </div>
  );
}

function AdvertiserDashboard() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [metrics, setMetrics] = useState(null);
  const [filters, setFilters] = useState({ level: 'argent', q: '' });

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadCreators();
  }, [filters]);

  useEffect(() => {
    loadMetrics();
  }, [period]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [ov, camp] = await Promise.all([
        api.get('/marketplace/overview'),
        api.get('/marketplace/campaigns')
      ]);
      setOverview(ov.data);
      setCampaigns(camp.data);
      await loadCreators();
    } catch (err) {
      console.error('Advertiser dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCreators = async () => {
    try {
      const res = await api.get('/marketplace/creators', { params: filters });
      setCreators(res.data || []);
    } catch (err) {
      console.error('Creators load error:', err);
    }
  };

  const loadMetrics = async () => {
    try {
      const res = await api.get('/marketplace/metrics', { params: { period } });
      setMetrics(res.data);
    } catch (err) {
      console.error('Metrics load error:', err);
    }
  };

  const fmtMoney = (cents) => `${(cents / 100).toFixed(0)} $`;

  if (loading) return <div className="advertiser-dashboard loading">Chargement dashboard annonceur...</div>;

  return (
    <div className="advertiser-dashboard">
      {/* Header */}
      <div className="ad-header">
        <div>
          <h1>Dashboard Annonceur — Capitune</h1>
          <p>Allez vite, comprenez clairement, obtenez du ROI sans complexité.</p>
        </div>
        <div className="ad-period">
          <button className={period==='7d'? 'active':''} onClick={()=>setPeriod('7d')}>7 jours</button>
          <button className={period==='30d'? 'active':''} onClick={()=>setPeriod('30d')}>30 jours</button>
        </div>
        {overview && (
          <div className="ad-budget">
            <div className="ad-budget-item">
              <span className="ad-budget-label">Budget total engagé</span>
              <span className="ad-budget-value">{fmtMoney(overview.budgetRemaining)}</span>
            </div>
            <div className="ad-budget-item">
              <span className="ad-budget-label">Restant</span>
              <span className="ad-budget-value">{fmtMoney(overview.budgetRemaining)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Vue rapide */}
      <div className="ad-kpis">
        <StatCard icon={BarChart3} label="Campagnes actives" value={overview?.activeCampaigns ?? 0} />
        <StatCard icon={Briefcase} label="Propositions envoyées" value={overview?.proposalsSent ?? 0} />
        <StatCard icon={CheckCircle2} label="Collaborations en cours" value={overview?.collaborations ?? 0} />
        <StatCard icon={DollarSign} label="Budget restant" value={fmtMoney(overview?.budgetRemaining || 0)} />
        {metrics && (
          <>
            <StatCard icon={Eye} label="Impressions" value={metrics.impressions} />
            <StatCard icon={Heart} label="Engagement" value={metrics.engagement} />
            <StatCard icon={Target} label="Clics" value={metrics.clicks} />
            <StatCard icon={DollarSign} label="Coût par résultat" value={`${(metrics.costPerResultCents/100).toFixed(2)} $`} />
            <StatCard icon={BarChart3} label="ROI (index)" value={`${metrics.roiIndex}%`} />
            <StatCard icon={Sparkles} label="Score qualité campagne" value={`${metrics.sqa}/100`} />
          </>
        )}
      </div>

      {/* Campagnes */}
      <div className="ad-section">
        <div className="ad-section-title">Campagnes</div>
        <div className="ad-campaign-list">
          {campaigns.length === 0 && <div className="ad-empty">Aucune campagne pour l'instant.</div>}
          {campaigns.map((c) => (
            <div key={c._id} className="ad-campaign-card">
              <div className="ad-campaign-main">
                <div className="ad-campaign-title">{c.title}</div>
                <div className="ad-campaign-meta">{c.objective} · {fmtMoney(c.budget)} · {c.status}</div>
              </div>
              <div className="ad-campaign-actions">
                <button onClick={() => navigate('/marketplace')}>Ajouter des créateurs</button>
                <button onClick={() => navigate('/marketplace')}>Modifier budget</button>
                <button onClick={() => navigate('/marketplace')}>Mettre en pause</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Créateurs & collaborations */}
      <div className="ad-section">
        <div className="ad-section-title">
          <div className="panel-left"><Users size={18} /> Créateurs & collaborations</div>
          <div className="panel-actions">
            <div className="filters">
              <select value={filters.level} onChange={(e) => setFilters({ ...filters, level: e.target.value })}>
                <option value="argent">Argent+</option>
                <option value="or">Or+</option>
                <option value="platinium">Platinium</option>
                <option value="bronze">Bronze+</option>
              </select>
              <input
                placeholder="Rechercher un créateur"
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              />
            </div>
          </div>
        </div>
        <div className="ad-creator-grid">
          {creators.length === 0 && <div className="ad-empty">Aucun créateur trouvé.</div>}
          {creators.map((cr) => (
            <div key={cr._id} className="ad-creator-card">
              <div className="creator-name">{cr.username}</div>
              <div className="creator-bio">{cr.bio || 'Pas de bio'}</div>
              <div className="creator-followers">{cr.followersCount} abonnés</div>
              <div className="creator-actions">
                <button onClick={() => navigate('/marketplace')}>Inviter</button>
                <button onClick={() => navigate('/creator-dashboard')}>Voir performance</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performances & ROI */}
      <div className="ad-section">
        <div className="ad-section-title"><LineChart size={18} /> Performances & ROI</div>
        <div className="ad-performance-grid">
          <div className="ad-chart-card">
            <Target size={18} />
            <div className="chart-title">Évolution portée / engagement</div>
            <div className="chart-placeholder">Graphiques à venir</div>
          </div>
          <div className="ad-chart-card">
            <PieChart size={18} />
            <div className="chart-title">Comparaison formats</div>
            <div className="chart-placeholder">Vidéo vs image vs live</div>
          </div>
          <div className="ad-chart-card">
            <DollarSign size={18} />
            <div className="chart-title">Coût par résultat & ROI estimé</div>
            <div className="chart-placeholder">Lecture claire même sans tracking e‑commerce</div>
          </div>
        </div>
      </div>

      {/* Recommandations */}
      <div className="ad-section">
        <div className="ad-section-title"><Sparkles size={18} /> Recommandations Capitune</div>
        <ul className="ad-recos">
          <li>Augmenter le budget sur ce créateur</li>
          <li>Tester un live sponsorisé</li>
          <li>Réduire la fréquence sur ce format</li>
          <li>Créateur à fort potentiel encore non activé</li>
        </ul>
      </div>

      {/* Paiements & facturation */}
      <div className="ad-section">
        <div className="ad-section-title"><CreditCard size={18} /> Paiements & facturation</div>
        <div className="ad-payments">
          <div className="ad-payment-item">
            <FileText size={16} /> Factures téléchargeables — bientôt disponible
          </div>
          <div className="ad-payment-item">
            <DollarSign size={16} /> Historique commissions Capitune — bientôt disponible
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="ad-section">
        <div className="ad-section-title"><AlertTriangle size={18} /> Notifications annonceur</div>
        <ul className="ad-notifs">
          <li>Lancement / fin de campagne</li>
          <li>Livraison de contenu</li>
          <li>Pic ou chute de performance</li>
          <li>Action requise (validation, paiement)</li>
        </ul>
      </div>
    </div>
  );
}

export default AdvertiserDashboard;
