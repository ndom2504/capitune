import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { BarChart3, Briefcase, Users, Filter, Plus, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import './MarketplacePage.css';

function MarketplacePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [filters, setFilters] = useState({ level: 'argent', q: '' });
  const [form, setForm] = useState({
    title: 'Campagne sponsorisée',
    objective: 'branding',
    budget: 50000,
    currency: 'USD',
    formats: ['post'],
    brief: '',
    deadline: ''
  });

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    loadCreators();
  }, [filters]);

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
      console.error('Marketplace load error:', err);
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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      const payload = {
        ...form,
        budget: Math.round(Number(form.budget) || 0)
      };
      await api.post('/marketplace/campaigns', payload);
      await loadAll();
      setForm((prev) => ({ ...prev, title: 'Campagne sponsorisée', brief: '' }));
    } catch (err) {
      console.error('Create campaign error:', err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="marketplace loading">Chargement marketplace...</div>;
  }

  return (
    <div className="marketplace">
      <div className="mp-header">
        <div>
          <h1>Marketplace Annonceurs</h1>
          <p>Connecte ta marque aux créateurs adaptés, en quelques clics.</p>
        </div>
        <button className="primary" onClick={() => document.getElementById('mp-form')?.scrollIntoView({ behavior: 'smooth' })}>
          <Plus size={16} /> Nouvelle campagne
        </button>
      </div>

      {overview && (
        <div className="mp-kpis">
          <div className="kpi-card">
            <BarChart3 size={20} />
            <div>
              <div className="kpi-value">{overview.activeCampaigns}</div>
              <div className="kpi-label">Campagnes actives</div>
            </div>
          </div>
          <div className="kpi-card">
            <Briefcase size={20} />
            <div>
              <div className="kpi-value">{overview.proposalsSent}</div>
              <div className="kpi-label">Propositions envoyées</div>
            </div>
          </div>
          <div className="kpi-card">
            <CheckCircle2 size={20} />
            <div>
              <div className="kpi-value">{overview.collaborations}</div>
              <div className="kpi-label">Collaborations en cours</div>
            </div>
          </div>
          <div className="kpi-card">
            <Clock size={20} />
            <div>
              <div className="kpi-value">{(overview.budgetRemaining / 100).toFixed(0)} $</div>
              <div className="kpi-label">Budget restant</div>
            </div>
          </div>
        </div>
      )}

      <div className="mp-grid">
        <div className="mp-panel" id="mp-form">
          <div className="panel-title">Créer une campagne</div>
          <form onSubmit={handleCreate} className="mp-form">
            <label>
              Titre
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label>
              Objectif
              <select value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value })}>
                <option value="branding">Branding</option>
                <option value="visibilité">Visibilité</option>
                <option value="conversions">Conversions</option>
                <option value="lancement">Lancement produit</option>
              </select>
            </label>
            <label>
              Budget (USD)
              <input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </label>
            <label>
              Formats
              <select value={form.formats[0]} onChange={(e) => setForm({ ...form, formats: [e.target.value] })}>
                <option value="post">Post sponsorisé</option>
                <option value="video">Vidéo</option>
                <option value="live">Live sponsorisé</option>
                <option value="serie">Série</option>
                <option value="story">Story</option>
              </select>
            </label>
            <label>
              Deadline
              <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </label>
            <label>
              Brief
              <textarea rows={3} value={form.brief} onChange={(e) => setForm({ ...form, brief: e.target.value })} />
            </label>
            <button type="submit" className="primary" disabled={creating}>
              {creating ? 'Création...' : 'Créer et activer'}
            </button>
          </form>
        </div>

        <div className="mp-panel">
          <div className="panel-title">Campagnes</div>
          <div className="campaign-list">
            {campaigns.length === 0 && <div className="empty">Aucune campagne pour l'instant.</div>}
            {campaigns.map((c) => (
              <div key={c._id} className="campaign-card">
                <div className="campaign-main">
                  <div className="campaign-title">{c.title}</div>
                  <div className="campaign-meta">{c.objective} · {(c.budget / 100).toFixed(0)} $ · {c.status}</div>
                </div>
                <div className="campaign-actions">
                  <button onClick={() => navigate(`/creator-dashboard`)}>Ouvrir opportunités</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mp-panel">
        <div className="panel-title">
          <div className="panel-left">
            <Users size={18} /> Créateurs recommandés
          </div>
          <div className="panel-actions">
            <div className="filters">
              <Filter size={16} />
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
        <div className="creator-grid">
          {creators.length === 0 && <div className="empty">Aucun créateur trouvé.</div>}
          {creators.map((cr) => (
            <div key={cr._id} className="creator-card">
              <div className="creator-name">{cr.username}</div>
              <div className="creator-bio">{cr.bio || 'Pas de bio'}</div>
              <div className="creator-followers">{cr.followersCount} abonnés</div>
              <div className="creator-actions">
                <button onClick={() => navigate('/creator-dashboard')}>Voir profil créateur</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MarketplacePage;
