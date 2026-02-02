import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './CreatorOnboarding.css';

const categories = [
  { value: 'Créateur de contenu', label: 'Créateur de contenu (monétiseur)' },
  { value: 'Créateur', label: 'Créateur' },
  { value: 'Professionnel', label: 'Professionnel' }
];

function CreatorOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState('');

  const [form, setForm] = useState({
    category: 'Créateur de contenu',
    bio: '',
    spiritualPath: '',
    themes: '',
    paymentMethod: '',
    paymentEmail: '',
    paymentIban: '',
    accepted: false,
  });

  const next = () => setStep((s) => Math.min(4, s + 1));
  const prev = () => setStep((s) => Math.max(1, s - 1));

  const saveProfile = async () => {
    setErrors('');
    setSaving(true);
    try {
      // Profile basics
      await api.put('/users/me', {
        category: form.category,
        bio: form.bio,
        spiritualPath: form.spiritualPath,
      });

      // Payment info optional
      if (form.paymentMethod) {
        await api.put('/monetization/payment-info', {
          method: form.paymentMethod,
          email: form.paymentEmail,
          iban: form.paymentIban,
        });
      }

      navigate('/creator-dashboard');
    } catch (err) {
      setErrors(err.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = form.category && form.accepted;

  return (
    <div className="onboard">
      <div className="onboard-header">
        <div>
          <p className="eyebrow">Parcours créateur</p>
          <h1>Lance ta monétisation sur Capitune</h1>
          <p className="lede">Profil clair, infos paiement, acceptation des règles — puis direction dashboard.</p>
        </div>
        <div className="step">Étape {step} / 4</div>
      </div>

      {errors && <div className="error-banner">{errors}</div>}

      {step === 1 && (
        <div className="card">
          <h2>Choisis ton type de compte</h2>
          <p className="hint">Pour accéder au dashboard créateur et aux retraits.</p>
          <div className="options">
            {categories.map((cat) => (
              <label key={cat.value} className={form.category === cat.value ? 'option active' : 'option'}>
                <input
                  type="radio"
                  name="category"
                  value={cat.value}
                  checked={form.category === cat.value}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                />
                <span>{cat.label}</span>
              </label>
            ))}
          </div>
          <div className="actions">
            <button onClick={next}>Continuer</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card">
          <h2>Profil rapide</h2>
          <div className="field">
            <label>Bio courte (160 caractères max)</label>
            <textarea
              maxLength={160}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Ex: Créateur vidéo éco & tech, je partage des formats courts pédagogiques."
            />
          </div>
          <div className="field">
            <label>Thèmes principaux</label>
            <input
              value={form.themes}
              onChange={(e) => setForm({ ...form, themes: e.target.value })}
              placeholder="Entrepreneuriat, écologie, productivité"
            />
          </div>
          <div className="field">
            <label>Chemin / style (optionnel)</label>
            <input
              value={form.spiritualPath}
              onChange={(e) => setForm({ ...form, spiritualPath: e.target.value })}
              placeholder="Ex: Créateur maker, minimalisme"
            />
          </div>
          <div className="actions">
            <button className="ghost" onClick={prev}>Retour</button>
            <button onClick={next}>Continuer</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card">
          <h2>Infos paiement (optionnel en V1)</h2>
          <div className="field">
            <label>Méthode</label>
            <select
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
            >
              <option value="">Sélectionner</option>
              <option value="bank_transfer">Virement bancaire</option>
              <option value="paypal">PayPal</option>
              <option value="crypto">Crypto (non recommandé) </option>
            </select>
          </div>
          {form.paymentMethod === 'bank_transfer' && (
            <div className="field">
              <label>IBAN</label>
              <input
                value={form.paymentIban}
                onChange={(e) => setForm({ ...form, paymentIban: e.target.value })}
                placeholder="FR76..."
              />
            </div>
          )}
          {form.paymentMethod === 'paypal' && (
            <div className="field">
              <label>Email PayPal</label>
              <input
                type="email"
                value={form.paymentEmail}
                onChange={(e) => setForm({ ...form, paymentEmail: e.target.value })}
                placeholder="email@paypal.com"
              />
            </div>
          )}
          <div className="hint">Tu pourras modifier plus tard dans Monétisation.</div>
          <div className="actions">
            <button className="ghost" onClick={prev}>Retour</button>
            <button onClick={next}>Continuer</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card">
          <h2>Conditions & lancement</h2>
          <ul className="bullets">
            <li>Respect des CGU et des règles de monétisation.</li>
            <li>Contenus originaux, pas de fraude ni spam.</li>
            <li>Retraits en USD, minimum $20, traitement sous 5 jours.</li>
          </ul>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={form.accepted}
              onChange={(e) => setForm({ ...form, accepted: e.target.checked })}
            />
            <span>J’accepte les conditions et je souhaite lancer mon dashboard créateur.</span>
          </label>
          <div className="actions">
            <button className="ghost" onClick={prev}>Retour</button>
            <button disabled={!canSubmit || saving} onClick={saveProfile}>
              {saving ? 'Enregistrement...' : 'Accéder au dashboard'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreatorOnboarding;
