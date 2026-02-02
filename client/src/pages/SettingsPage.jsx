import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './SettingsPage.css';

const emptyQuietHours = { start: '', end: '' };

const defaultContentTypes = { video: true, image: true, text: true };
const defaultMood = { fun: true, pro: true };
const defaultInApp = { likes: true, comments: true, follows: true, mentions: true, lives: true };
const defaultPush = { likes: false, comments: false, follows: false, mentions: false, lives: false };

function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({ profile: false, prefs: false, monetization: false, partnerships: false });
  const [status, setStatus] = useState('');

  const [profileData, setProfileData] = useState({
    fullName: '',
    phoneNumber: '',
    birthDate: '',
    bio: '',
    spiritualPath: '',
    category: 'Régulier',
    visibility: 'public',
    links: [''],
    interests: ''
  });

  const [feedPrefs, setFeedPrefs] = useState({ contentTypes: defaultContentTypes, mood: defaultMood, blockedKeywords: '' });
  const [notifications, setNotifications] = useState({ inApp: defaultInApp, push: defaultPush, quietHours: emptyQuietHours });
  const [appPrefs, setAppPrefs] = useState({ theme: 'system', language: 'fr', dataSaver: false, autoDownloadVideos: false });

  const [monetization, setMonetization] = useState({
    method: 'none',
    paypalEmail: '',
    iban: '',
    threshold: 20,
    frequency: 'monthly',
    adsEnabled: false,
    paidSubs: false,
    tipsEnabled: true
  });

  const [partnerships, setPartnerships] = useState({
    acceptPartnerships: false,
    allowedCategories: '',
    rateCardHint: '',
    monthlyBudgetMax: 0,
    targetCategories: '',
    adFrequency: ''
  });

  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        phoneNumber: user.phoneNumber || '',
        birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
        bio: user.bio || '',
        spiritualPath: user.spiritualPath || '',
        category: user.category || 'Régulier',
        visibility: user.visibility?.profile || 'public',
        links: (user.links && user.links.length ? user.links : ['']).slice(0, 5),
        interests: (user.interests || []).join(', ')
      });

      setFeedPrefs({
        contentTypes: { ...defaultContentTypes, ...(user.feedPrefs?.contentTypes || {}) },
        mood: { ...defaultMood, ...(user.feedPrefs?.mood || {}) },
        blockedKeywords: (user.feedPrefs?.blockedKeywords || []).join(', ')
      });

      setNotifications({
        inApp: { ...defaultInApp, ...(user.notifications?.inApp || {}) },
        push: { ...defaultPush, ...(user.notifications?.push || {}) },
        quietHours: { ...emptyQuietHours, ...(user.notifications?.quietHours || {}) }
      });

      setAppPrefs({
        theme: user.appPrefs?.theme || 'system',
        language: user.appPrefs?.language || 'fr',
        dataSaver: user.appPrefs?.dataSaver ?? false,
        autoDownloadVideos: user.appPrefs?.autoDownloadVideos ?? false
      });

      setMonetization({
        method: user.monetization?.payout?.method || 'none',
        paypalEmail: user.monetization?.payout?.paypalEmail || '',
        iban: user.monetization?.payout?.iban || '',
        threshold: user.monetization?.payout?.threshold ?? 20,
        frequency: user.monetization?.payout?.frequency || 'monthly',
        adsEnabled: user.monetization?.toggles?.adsEnabled ?? false,
        paidSubs: user.monetization?.toggles?.paidSubs ?? false,
        tipsEnabled: user.monetization?.toggles?.tipsEnabled ?? true
      });

      setPartnerships({
        acceptPartnerships: user.partnerships?.creator?.acceptPartnerships ?? false,
        allowedCategories: (user.partnerships?.creator?.allowedCategories || []).join(', '),
        rateCardHint: user.partnerships?.creator?.rateCardHint || '',
        monthlyBudgetMax: user.partnerships?.advertiser?.monthlyBudgetMax ?? 0,
        targetCategories: (user.partnerships?.advertiser?.targetCategories || []).join(', '),
        adFrequency: user.partnerships?.advertiser?.adFrequency || ''
      });

      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const loadPosts = async () => {
      if (!user) return;
      setLoadingPosts(true);
      try {
        const resp = await api.get('/posts/me/list');
        setUserPosts(resp.data?.posts || []);
      } catch (err) {
        console.error('Erreur chargement publications:', err);
      } finally {
        setLoadingPosts(false);
      }
    };

    loadPosts();
  }, [user]);

  const handleDeleteUserPost = async (postId) => {
    try {
      await api.delete(`/posts/${postId}`);
      setUserPosts(prev => prev.filter(p => p._id !== postId));
    } catch (err) {
      console.error('Erreur suppression publication:', err);
    }
  };

  const handleHideUserPost = async (postId, hidden = true) => {
    try {
      await api.post(`/posts/${postId}/hide`, { hidden });
      setUserPosts(prev => prev.map(p => p._id === postId ? { ...p, isHidden: hidden } : p));
    } catch (err) {
      console.error('Erreur masquage publication:', err);
    }
  };

  const handleProfileSave = async () => {
    setSaving((s) => ({ ...s, profile: true }));
    setStatus('');
    try {
      const resp = await api.put('/users/me', {
        fullName: profileData.fullName,
        phoneNumber: profileData.phoneNumber,
        birthDate: profileData.birthDate,
        bio: profileData.bio,
        spiritualPath: profileData.spiritualPath,
        category: profileData.category,
        visibility: { profile: profileData.visibility },
        links: profileData.links.filter(Boolean),
        interests: profileData.interests
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      });
      console.log('Réponse serveur après sauvegarde:', resp.data.user);
      updateUser(resp.data.user);
      setStatus('Profil mis à jour');
    } catch (err) {
      setStatus(err.response?.data?.message || 'Erreur de sauvegarde');
    } finally {
      setSaving((s) => ({ ...s, profile: false }));
    }
  };

  const handlePrefsSave = async () => {
    setSaving((s) => ({ ...s, prefs: true }));
    setStatus('');
    try {
      const resp = await api.put('/users/me/preferences', {
        feedPrefs: {
          contentTypes: feedPrefs.contentTypes,
          mood: feedPrefs.mood,
          blockedKeywords: feedPrefs.blockedKeywords
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        },
        notifications,
        appPrefs
      });
      updateUser(resp.data.user);
      setStatus('Préférences mises à jour');
    } catch (err) {
      setStatus(err.response?.data?.message || 'Erreur de sauvegarde');
    } finally {
      setSaving((s) => ({ ...s, prefs: false }));
    }
  };

  const handleMonetizationSave = async () => {
    setSaving((s) => ({ ...s, monetization: true }));
    setStatus('');
    try {
      const resp = await api.put('/users/me/monetization', {
        payout: {
          method: monetization.method,
          paypalEmail: monetization.paypalEmail,
          iban: monetization.iban,
          threshold: Number(monetization.threshold) || 0,
          frequency: monetization.frequency
        },
        toggles: {
          adsEnabled: monetization.adsEnabled,
          paidSubs: monetization.paidSubs,
          tipsEnabled: monetization.tipsEnabled
        }
      });
      updateUser(resp.data.user);
      setStatus('Monétisation mise à jour');
    } catch (err) {
      setStatus(err.response?.data?.message || 'Erreur de sauvegarde');
    } finally {
      setSaving((s) => ({ ...s, monetization: false }));
    }
  };

  const handlePartnershipsSave = async () => {
    setSaving((s) => ({ ...s, partnerships: true }));
    setStatus('');
    try {
      const resp = await api.put('/users/me/partnerships', {
        creator: {
          acceptPartnerships: partnerships.acceptPartnerships,
          allowedCategories: partnerships.allowedCategories
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          rateCardHint: partnerships.rateCardHint
        },
        advertiser: {
          monthlyBudgetMax: Number(partnerships.monthlyBudgetMax) || 0,
          targetCategories: partnerships.targetCategories
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          adFrequency: partnerships.adFrequency
        }
      });
      updateUser(resp.data.user);
      setStatus('Partenariats mis à jour');
    } catch (err) {
      setStatus(err.response?.data?.message || 'Erreur de sauvegarde');
    } finally {
      setSaving((s) => ({ ...s, partnerships: false }));
    }
  };

  if (loading) {
    return (
      <div className="settings-page">
        <p className="muted">Chargement des paramètres...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <p className="eyebrow">Paramètres</p>
          <h1>Votre espace de contrôle</h1>
          <p className="muted">Compte, visibilité, notifications, monétisation et partenariats.</p>
        </div>
        {status && <div className="status-chip">{status}</div>}
      </div>

      <div className="settings-grid">
        <section className="card">
          <div className="card-head">
            <div>
              <p className="eyebrow">Compte & profil</p>
              <h2>Identité et visibilité</h2>
            </div>
            <button className="ghost" disabled={saving.profile} onClick={handleProfileSave}>
              {saving.profile ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>

          <div className="field">
            <label>Nom complet</label>
            <input value={profileData.fullName} onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })} />
          </div>
          <div className="field">
            <label>Téléphone</label>
            <input value={profileData.phoneNumber} onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })} />
          </div>
          <div className="field">
            <label>Date de naissance</label>
            <input type="date" value={profileData.birthDate} onChange={(e) => setProfileData({ ...profileData, birthDate: e.target.value })} />
          </div>
          <div className="field">
            <label>Catégorie</label>
            <select value={profileData.category} onChange={(e) => setProfileData({ ...profileData, category: e.target.value })}>
              <option>Régulier</option>
              <option>Créateur</option>
              <option>Créateur de contenu</option>
              <option>Professionnel</option>
              <option>Partenaire</option>
            </select>
          </div>
          <div className="field">
            <label>Visibilité du profil</label>
            <select value={profileData.visibility} onChange={(e) => setProfileData({ ...profileData, visibility: e.target.value })}>
              <option value="public">Public</option>
              <option value="private">Privé (abonnés)</option>
              <option value="limited">Découverte limitée</option>
            </select>
          </div>
          <div className="field">
            <label>Bio</label>
            <textarea value={profileData.bio} maxLength={300} onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })} />
          </div>
          <div className="field">
            <label>Chemin / style</label>
            <input value={profileData.spiritualPath} onChange={(e) => setProfileData({ ...profileData, spiritualPath: e.target.value })} />
          </div>
          <div className="field">
            <label>Liens externes (5 max)</label>
            {profileData.links.map((link, idx) => (
              <input
                key={idx}
                value={link}
                onChange={(e) => {
                  const next = [...profileData.links];
                  next[idx] = e.target.value;
                  setProfileData({ ...profileData, links: next });
                }}
                placeholder="https://..."
              />
            ))}
            {profileData.links.length < 5 && (
              <button className="tiny" onClick={() => setProfileData({ ...profileData, links: [...profileData.links, ''] })}>
                Ajouter un lien
              </button>
            )}
          </div>
          <div className="field">
            <label>Centres d'intérêt (séparés par des virgules)</label>
            <input value={profileData.interests} onChange={(e) => setProfileData({ ...profileData, interests: e.target.value })} />
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <p className="eyebrow">Feed & notifications</p>
              <h2>Recommandations et alertes</h2>
            </div>
            <button className="ghost" disabled={saving.prefs} onClick={handlePrefsSave}>
              {saving.prefs ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>

          <div className="field inline">
            <label>Types de contenus</label>
            {['video', 'image', 'text'].map((k) => (
              <label key={k} className="chip">
                <input
                  type="checkbox"
                  checked={feedPrefs.contentTypes[k]}
                  onChange={(e) => setFeedPrefs({
                    ...feedPrefs,
                    contentTypes: { ...feedPrefs.contentTypes, [k]: e.target.checked }
                  })}
                />
                <span>{k}</span>
              </label>
            ))}
          </div>

          <div className="field inline">
            <label>Ambiance du feed</label>
            {['fun', 'pro'].map((k) => (
              <label key={k} className="chip">
                <input
                  type="checkbox"
                  checked={feedPrefs.mood[k]}
                  onChange={(e) => setFeedPrefs({ ...feedPrefs, mood: { ...feedPrefs.mood, [k]: e.target.checked } })}
                />
                <span>{k}</span>
              </label>
            ))}
          </div>

          <div className="field">
            <label>Mots-clés à masquer</label>
            <input
              value={feedPrefs.blockedKeywords}
              onChange={(e) => setFeedPrefs({ ...feedPrefs, blockedKeywords: e.target.value })}
              placeholder="séparés par des virgules"
            />
          </div>

          <div className="field">
            <label>Notifications in-app</label>
            {Object.keys(notifications.inApp).map((key) => (
              <label key={key} className="chip">
                <input
                  type="checkbox"
                  checked={notifications.inApp[key]}
                  onChange={(e) => setNotifications({
                    ...notifications,
                    inApp: { ...notifications.inApp, [key]: e.target.checked }
                  })}
                />
                <span>{key}</span>
              </label>
            ))}
          </div>

          <div className="field">
            <label>Notifications push</label>
            {Object.keys(notifications.push).map((key) => (
              <label key={key} className="chip">
                <input
                  type="checkbox"
                  checked={notifications.push[key]}
                  onChange={(e) => setNotifications({
                    ...notifications,
                    push: { ...notifications.push, [key]: e.target.checked }
                  })}
                />
                <span>{key}</span>
              </label>
            ))}
          </div>

          <div className="field inline">
            <label>Plage silencieuse</label>
            <input
              type="time"
              value={notifications.quietHours.start}
              onChange={(e) => setNotifications({ ...notifications, quietHours: { ...notifications.quietHours, start: e.target.value } })}
            />
            <input
              type="time"
              value={notifications.quietHours.end}
              onChange={(e) => setNotifications({ ...notifications, quietHours: { ...notifications.quietHours, end: e.target.value } })}
            />
          </div>

          <div className="field inline">
            <label>App</label>
            <select value={appPrefs.theme} onChange={(e) => setAppPrefs({ ...appPrefs, theme: e.target.value })}>
              <option value="light">Clair</option>
              <option value="dark">Sombre</option>
              <option value="system">Système</option>
            </select>
            <select value={appPrefs.language} onChange={(e) => setAppPrefs({ ...appPrefs, language: e.target.value })}>
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
            <label className="chip">
              <input
                type="checkbox"
                checked={appPrefs.dataSaver}
                onChange={(e) => setAppPrefs({ ...appPrefs, dataSaver: e.target.checked })}
              />
              <span>Économie données</span>
            </label>
            <label className="chip">
              <input
                type="checkbox"
                checked={appPrefs.autoDownloadVideos}
                onChange={(e) => setAppPrefs({ ...appPrefs, autoDownloadVideos: e.target.checked })}
              />
              <span>Téléchargement auto</span>
            </label>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <p className="eyebrow">Monétisation</p>
              <h2>Revenus et paiements</h2>
            </div>
            <button className="ghost" disabled={saving.monetization} onClick={handleMonetizationSave}>
              {saving.monetization ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>

          <div className="field">
            <label>Méthode de paiement</label>
            <select value={monetization.method} onChange={(e) => setMonetization({ ...monetization, method: e.target.value })}>
              <option value="none">Aucune</option>
              <option value="paypal">PayPal</option>
              <option value="iban">IBAN</option>
            </select>
          </div>
          {monetization.method === 'paypal' && (
            <div className="field">
              <label>Email PayPal</label>
              <input value={monetization.paypalEmail} onChange={(e) => setMonetization({ ...monetization, paypalEmail: e.target.value })} />
            </div>
          )}
          {monetization.method === 'iban' && (
            <div className="field">
              <label>IBAN</label>
              <input value={monetization.iban} onChange={(e) => setMonetization({ ...monetization, iban: e.target.value })} />
            </div>
          )}
          <div className="field inline">
            <label>Seuil & fréquence</label>
            <input
              type="number"
              min="0"
              value={monetization.threshold}
              onChange={(e) => setMonetization({ ...monetization, threshold: e.target.value })}
            />
            <select value={monetization.frequency} onChange={(e) => setMonetization({ ...monetization, frequency: e.target.value })}>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuel</option>
              <option value="manual">Manuel</option>
            </select>
          </div>

          <div className="field inline">
            <label>Options créateur</label>
            {['adsEnabled', 'paidSubs', 'tipsEnabled'].map((k) => (
              <label key={k} className="chip">
                <input
                  type="checkbox"
                  checked={monetization[k]}
                  onChange={(e) => setMonetization({ ...monetization, [k]: e.target.checked })}
                />
                <span>{k}</span>
              </label>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <p className="eyebrow">Partenariats & publicité</p>
              <h2>Créateurs et annonceurs</h2>
            </div>
            <button className="ghost" disabled={saving.partnerships} onClick={handlePartnershipsSave}>
              {saving.partnerships ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>

          <div className="field inline">
            <label>Accepter les partenariats</label>
            <label className="chip">
              <input
                type="checkbox"
                checked={partnerships.acceptPartnerships}
                onChange={(e) => setPartnerships({ ...partnerships, acceptPartnerships: e.target.checked })}
              />
              <span>Ouvert</span>
            </label>
          </div>

          <div className="field">
            <label>Catégories autorisées (créateur)</label>
            <input
              value={partnerships.allowedCategories}
              onChange={(e) => setPartnerships({ ...partnerships, allowedCategories: e.target.value })}
              placeholder="séparées par des virgules"
            />
          </div>

          <div className="field">
            <label>Prix indicatif / notes</label>
            <input value={partnerships.rateCardHint} onChange={(e) => setPartnerships({ ...partnerships, rateCardHint: e.target.value })} />
          </div>

          <div className="divider" />

          <div className="field">
            <label>Budget mensuel max (annonceur)</label>
            <input
              type="number"
              min="0"
              value={partnerships.monthlyBudgetMax}
              onChange={(e) => setPartnerships({ ...partnerships, monthlyBudgetMax: e.target.value })}
            />
          </div>

          <div className="field">
            <label>Catégories ciblées</label>
            <input
              value={partnerships.targetCategories}
              onChange={(e) => setPartnerships({ ...partnerships, targetCategories: e.target.value })}
              placeholder="séparées par des virgules"
            />
          </div>

          <div className="field">
            <label>Fréquence publicitaire</label>
            <input
              value={partnerships.adFrequency}
              onChange={(e) => setPartnerships({ ...partnerships, adFrequency: e.target.value })}
              placeholder="Ex: 1 campagne / mois"
            />
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <div>
              <p className="eyebrow">Base de données</p>
              <h2>Vos publications</h2>
            </div>
          </div>

          {loadingPosts ? (
            <p className="muted">Chargement des publications...</p>
          ) : userPosts.length === 0 ? (
            <p className="muted">Aucune publication pour le moment.</p>
          ) : (
            <div className="posts-table">
              <div className="posts-row posts-row-head">
                <span>Contenu</span>
                <span>Statut</span>
                <span>Actions</span>
              </div>
              {userPosts.map((p) => (
                <div className="posts-row" key={p._id}>
                  <div className="posts-cell primary">
                    <p className="post-title">{p.content?.slice(0, 120) || 'Sans contenu'}</p>
                    <p className="post-meta">{p.type || p.format || 'text'} · {new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="posts-cell">{p.isHidden ? 'Masqué' : 'Visible'}</div>
                  <div className="posts-cell actions">
                    <button className="tiny" onClick={() => handleHideUserPost(p._id, !p.isHidden)}>
                      {p.isHidden ? 'Réafficher' : 'Masquer'}
                    </button>
                    <button className="tiny" onClick={() => handleDeleteUserPost(p._id)}>
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default SettingsPage;
