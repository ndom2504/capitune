# 🤝 Directives de Contribution à Capitune

Merci de vouloir contribuer à Capitune! Ce document explique comment participer tout en restant aligné avec notre mission éthique.

---

## 🎯 Notre Mission

**Capitune rend les gens plus intelligents, pas plus addicts.**

Toute contribution doit servir cet objectif. Avant de proposer une feature, posez-vous:

> **"Cela rend-il mes utilisateurs plus intelligents ou plus addicts?"**

Si la réponse est "plus addicts" → ❌ Rejeté.

---

## ✅ Types de Contributions Bienvenues

### Features Éthiques ✨
- Indicateurs de qualité des posts
- Calculs de profil cognitif
- Explorations thématiques
- Badges d'expertise (community-voted)
- Thèmes accessibilité
- Améliorations performance
- Documentation

### Bug Fixes 🐛
- Erreurs d'authentification
- Problèmes d'upload
- Issues API
- Crashes frontend
- Failles de sécurité

### Optimisations 🚀
- Performance (lighthouse >90)
- Accessibilité (WCAG AA)
- SEO (meta tags, structured data)
- Sécurité (dépendances outdated)

### Documentation 📝
- Guides utilisateur
- Améliorations README
- JSDoc comments
- API documentation
- Troubleshooting guides

---

## ❌ Features Rejetées d'Avance

Ces types de PR seront fermées immédiatement:

- **Stories** (encouragent l'utilisation compulsive)
- **Notifications agressives** (notifications multiple/jour)
- **Followers counts** (compétition toxique)
- **Trending/Hot posts** (sensationnalisme)
- **Infinite scroll** (addiction)
- **Engagement gamification** (badges pour les likes)
- **Dark patterns** (dark UI tricks)
- **Tracking/Analytics** (sauf consentement explicite)
- **Publicités** (monétisation invasive)

---

## 📋 Processus de Contribution

### 1. Créez une Issue D'Abord

Avant de coder, ouvrez une issue:

```markdown
**Type:** Feature / Bug / Optimization

**Titre:** [Type] Brève description

**Description:**
- Problème ou besoin
- Alignement avec valeurs Capitune
- Solution proposée
- Cas d'usage

**Alignement éthique:**
- Rend les utilisateurs plus intelligents? ✓
- Crée de l'addiction? ✗
```

**Attendez le feedback** avant de coder.

### 2. Fork et Branch

```bash
git clone https://github.com/YOU/capitune.git
git checkout -b feature/amazing-thing
```

Branch naming:
- `feature/` — Nouvelles features
- `fix/` — Bug fixes
- `docs/` — Documentation
- `perf/` — Optimisations
- `chore/` — Maintenance

### 3. Codez avec Qualité

```bash
# Installez dependencies
npm install

# Démarrez dev
npm run dev

# Testez localement
# (voir section Tests ci-dessous)

# Format & lint
npm run format
npm run lint
```

### 4. Commit Descriptifs

```bash
git commit -m "feat(posts): add quality badge system

- Calculate clarity score (word count, structure)
- Calculate engagement quality (comments vs likes)
- Display badge on posts with color coding
- Add CSS animations for smooth reveals

Fixes #123
Aligns with ethical quality indicators
"
```

Commits messages:
- **feat:** Nouvelle feature
- **fix:** Bug fix
- **docs:** Documentation
- **perf:** Optimisations
- **test:** Tests
- **chore:** Maintenance

### 5. Tests (Obligatoire)

```bash
# Test vos changements
npm run test

# Coverage
npm run test:coverage

# E2E (pour features)
npm run test:e2e
```

### 6. Push et Create PR

```bash
git push origin feature/amazing-thing
```

### PR Template

```markdown
## Description
[Décrivez vos changements]

## Type de PR
- [ ] Feature
- [ ] Bug fix
- [ ] Optimization
- [ ] Documentation

## Alignement Éthique
- [ ] Rend les utilisateurs plus intelligents
- [ ] N'introduit pas de mécanisme addictif
- [ ] Améliore l'accessibilité ou la performance

## Checklist
- [ ] Code reviewed personally
- [ ] Tests ajoutés/modifiés
- [ ] Documentation updated
- [ ] No console.errors/warnings
- [ ] Mobile responsive
- [ ] A11y checked

## Liens
Fixes #123
Related to #456
```

---

## 🧪 Tests

### Structure

```
src/
├── components/
│   ├── MyComponent.jsx
│   ├── MyComponent.test.jsx
│   └── MyComponent.css
```

### Example Test

```javascript
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  test('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  test('ethical: no addiction patterns', () => {
    render(<MyComponent />);
    // Verify no infinite scroll, no aggressive notifications, etc.
    expect(screen.queryByTestId('infinite-scroll')).not.toBeInTheDocument();
  });
});
```

### Test Éthique

Pour chaque feature, ajoutez un test "éthique":

```javascript
describe('PostQualityBadge - Ethical', () => {
  test('does not show engagement counts', () => {
    render(<PostQualityBadge post={mockPost} />);
    // Vérifiez que les "likes" ne sont pas visibles
    expect(screen.queryByText(/^\d+ likes$/)).not.toBeInTheDocument();
  });

  test('prioritizes quality metrics over engagement', () => {
    render(<PostQualityBadge post={mockPost} />);
    // Badge affiche "Excellent" basé sur qualité
    expect(screen.getByText('Excellent')).toBeInTheDocument();
    // Pas de "trending" ou "viral"
    expect(screen.queryByText(/trending|viral/i)).not.toBeInTheDocument();
  });
});
```

---

## 📏 Code Style

### JavaScript

```javascript
// ✅ Bon
const calculateQualityScore = (post) => {
  const contentLength = post.content.length;
  const hasStructure = post.tags.length > 0;
  return (contentLength > 500 && hasStructure) ? 'excellent' : 'good';
};

// ❌ Mauvais
const x = p.content.length > 500 && p.tags.length > 0 ? 'e' : 'g';
```

### CSS

```css
/* ✅ Bon - BEM naming */
.post-quality-badge {
  /* root */
}

.post-quality-badge__icon {
  /* child */
}

.post-quality-badge--excellent {
  /* modifier */
}

/* ❌ Mauvais */
.badge { /* too generic */ }
.badge-icon { /* not semantic */ }
```

### React

```javascript
// ✅ Bon - Functional, clear names, proper hooks
function PostQualityBadge({ post }) {
  const [score, setScore] = useState(0);

  useEffect(() => {
    const newScore = calculateScore(post);
    setScore(newScore);
  }, [post]);

  return <div>{score}%</div>;
}

// ❌ Mauvais - Class, vague names, prop drilling
class PQB extends Component {
  state = { s: 0 };
  componentDidMount() { /* ... */ }
  render() { return <div>{this.state.s}</div>; }
}
```

### JSDoc Comments

```javascript
/**
 * Calcule le score de qualité d'un post
 * @param {Object} post - Le post à évaluer
 * @param {string} post.content - Contenu du post
 * @param {Array<string>} post.tags - Tags du post
 * @returns {number} Score 0-100
 * @example
 * const score = calculateQualityScore(post);
 * // Returns 85
 */
function calculateQualityScore(post) {
  // ...
}
```

---

## ♿ Accessibilité

Toute PR doit respecter WCAG 2.1 AA minimum:

```javascript
// ✅ Bon
<button 
  aria-label="Marquer comme pertinent"
  onClick={handleClick}
>
  <Heart size={18} />
</button>

// ❌ Mauvais
<div onClick={handleClick}>
  <Heart size={18} />
</div>
```

Checklist A11y:
- [ ] Sémantique HTML (button, nav, header, etc.)
- [ ] Labels pour inputs
- [ ] ARIA attributes où nécessaire
- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] Color contrast (WCAG AA minimum)
- [ ] Focus indicators visibles
- [ ] Responsive text sizes
- [ ] Alt text pour images

---

## 📚 Documentation

Toute PR doit inclure:

- **Code comments** — Pourquoi, pas le quoi
- **README updates** — Si feature user-facing
- **API docs** — Si nouvelle endpoint
- **JSDoc** — Pour functions/components

```markdown
### New Feature: Post Quality Badge

**What:** Chaque post affiche un badge discret de qualité

**Why:** Rendre transparent comment on évalue la qualité

**How to use:**
\`\`\`jsx
<PostQualityBadge post={post} />
\`\`\`

**Ethical consideration:** Badge minimaliste, pas agressif, favorise qualité sur engagement
```

---

## 🔒 Sécurité

Avant de submit une PR:

- [ ] Pas de secrets/API keys commitées
- [ ] Pas de SQL injection (utiliser parameterized queries)
- [ ] Pas de XSS (input sanitization)
- [ ] Pas de CSRF (token validation)
- [ ] Dépendances à jour (`npm audit`)
- [ ] Pas de console.log de données sensibles

---

## 👍 Code Review

### Pour les mainteneurs

```
Approcher avec:
- Bienveillance (c'est du code bénévole)
- Rigueur éthique (alignement mission)
- Constructivité (suggestions, pas critiques)

Demander:
- Tests passent?
- Code style ok?
- Alignement éthique clair?
- Documentation complète?
- Performance OK (lighthouse)?
```

### Pour les contributeurs

```
Réagir à retours:
- Questions → Explique le "pourquoi"
- Suggestions → Propose améliorations
- Rejets → Comprendre la raison, pas de frustration
```

---

## 🎉 Après Merge

Votre PR est merged! 🎊

- Bravo, c'est live!
- Vous êtes cité dans release notes
- Rejoignez Discord contributor channel
- Signalez tout problème ASAP

---

## 📞 Questions?

- **Discord:** Communauté Capitune
- **Issues:** Posez des questions en commentaire
- **Email:** contrib@capitune.io
- **Discussions:** GitHub Discussions

---

**Merci de rendre Capitune plus éthique!** ✨

💚 — L'équipe Capitune
