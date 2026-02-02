import { useEffect, useState } from 'react';
import api from '../utils/api';
import { Check, X, MessageSquare, FileText } from 'lucide-react';
import './OpportunitiesPage.css';

function OpportunitiesPage() {
  const [opps, setOpps] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [o, c] = await Promise.all([
        api.get('/marketplace/opportunities'),
        api.get('/marketplace/contracts')
      ]);
      setOpps(o.data || []);
      setContracts(c.data || []);
    } catch (err) {
      console.error('Opportunities load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/marketplace/opportunities/${id}/status`, { status });
      await loadAll();
    } catch (err) {
      console.error('Update opportunity status error:', err);
    }
  };

  if (loading) return <div className="opps loading">Chargement...</div>;

  return (
    <div className="opps">
      <div className="opps-header">
        <div>
          <h1>Opportunités</h1>
          <p>Invitations, campagnes ouvertes et contrats associés.</p>
        </div>
      </div>

      <div className="opps-panel">
        <div className="panel-title">Invitations reçues</div>
        {opps.length === 0 && <div className="empty">Aucune invitation.</div>}
        <div className="opps-list">
          {opps.map((o) => (
            <div key={o._id} className="opp-card">
              <div className="opp-main">
                <div className="opp-title">{o.campaign?.title || 'Campagne'}</div>
                <div className="opp-meta">{o.campaign?.objective} · {(o.offerAmount / 100).toFixed(0)} {o.currency}</div>
                <div className="opp-meta">Deadline: {o.deadline ? new Date(o.deadline).toLocaleDateString() : '—'}</div>
              </div>
              <div className="opp-actions">
                <button className="accept" onClick={() => updateStatus(o._id, 'accepted')}><Check size={16} /> Accepter</button>
                <button className="decline" onClick={() => updateStatus(o._id, 'declined')}><X size={16} /> Refuser</button>
                <button className="neutral" onClick={() => updateStatus(o._id, 'negotiating')}><MessageSquare size={16} /> Négocier</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="opps-panel">
        <div className="panel-title">Contrats</div>
        {contracts.length === 0 && <div className="empty">Aucun contrat.</div>}
        <div className="contracts-list">
          {contracts.map((c) => (
            <div key={c._id} className="contract-card">
              <div className="contract-title">{c.campaign?.title || 'Campagne'} · {(c.amount / 100).toFixed(0)} {c.currency}</div>
              <div className="contract-meta">Statut: {c.status}</div>
              <div className="contract-actions">
                <button className="neutral"><FileText size={16} /> Voir</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OpportunitiesPage;
