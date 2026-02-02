# Project Guidelines

## 📖 Documentation

Avant de coder, consulter :

1. **[docs/SPECIFICATION.md](docs/SPECIFICATION.md)** — Spec complète des 6 pages
2. **[docs/ROLES_PERMISSIONS.md](docs/ROLES_PERMISSIONS.md)** — Rôles et permissions
3. **[docs/PARCOURS_UTILISATEUR.md](docs/PARCOURS_UTILISATEUR.md)** — User journeys
4. **[docs/ROADMAP.md](docs/ROADMAP.md)** — Phases MVP → V2 → V3
5. **[design/DESIGN_SYSTEM.md](design/DESIGN_SYSTEM.md)** — Design & couleurs
6. **[architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md)** — Tech stack
7. **[database/DATABASE_SCHEMA.md](database/DATABASE_SCHEMA.md)** — Tables & relations

## 🚀 Getting Started

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Voir [frontend/GETTING_STARTED.md](frontend/GETTING_STARTED.md)

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run migrate
npm run seed
npm run dev
```

Voir [backend/GETTING_STARTED.md](backend/GETTING_STARTED.md)

## 🏗️ Workflow

### 1. Créer une branche feature
```bash
git checkout -b feature/auth-login
```

### 2. Développer
- Suivre la structure du projet
- Respecter linting (ESLint + Prettier)
- Ajouter tests
- Mettre à jour types TypeScript

### 3. Commit sémantique
```bash
git commit -m "feat(auth): add login page"
git commit -m "fix(dossier): fix upload bug"
git commit -m "docs: update README"
```

Formats : `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### 4. PR & Review
```bash
git push origin feature/auth-login
# Créer PR sur GitHub
# Attendre review + CI pass
```

### 5. Merge
```bash
# CI pass + review approuvé
git merge develop
```

## 🧪 Testing

### Frontend
```bash
npm run test -- --watch
npm run test -- --coverage
```

Écrire tests pour :
- Pages principales
- Composants critiques
- Hooks custom
- Utils

### Backend
```bash
npm run test -- --watch
npm run test -- --coverage
```

Écrire tests pour :
- Routes API
- Auth & middleware
- Services business logic
- Database interactions

## 📋 Code Style

### TypeScript
```typescript
// ✅ GOOD
interface User {
  id: string;
  email: string;
  role: 'candidate' | 'professional' | 'admin';
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ BAD
function getUser(id) {
  // ...
}
```

### React/Next.js
```typescript
// ✅ GOOD - Functional component
export default function Dashboard() {
  const [dossiers, setDossiers] = useState([]);
  
  useEffect(() => {
    fetchDossiers();
  }, []);

  return (
    <div>
      {dossiers.map(d => <DossierCard key={d.id} {...d} />)}
    </div>
  );
}

// ❌ BAD
export default class Dashboard extends React.Component {
  // ...
}
```

### API Routes
```typescript
// ✅ GOOD
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    
    // Business logic
    const user = await registerUser(email, password);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ❌ BAD
app.post('/api/auth/register', (req, res) => {
  const user = registerUser(req.body.email, req.body.password);
  res.json(user);
});
```

## 🎨 Design System

Utiliser les couleurs officielles :
- Bleu marine : `#001F3F`
- Cyan : `#00BCD4`
- Gris : `#F5F5F5`

Voir [design/DESIGN_SYSTEM.md](design/DESIGN_SYSTEM.md)

## 🔐 Security

### Authentication
- JWT tokens (1h expiry)
- bcrypt password hashing
- Refresh tokens (V2)

### Input validation
- Zod (frontend)
- Middleware validation (backend)
- Sanitize uploads

### CORS
```typescript
// Backend
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
```

## 📊 Database

### Adding new table
1. Modifier `prisma/schema.prisma`
2. Créer migration : `npm run prisma:migrate`
3. Générer client : `npm run prisma:generate`
4. Tester migration

### Query patterns
```typescript
// ✅ GOOD - Prisma
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' },
});

// ❌ BAD - Raw SQL (SQL injection risk)
const user = db.query(`SELECT * FROM users WHERE email = '${email}'`);
```

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints : mobile < 640px | tablet 640-1024px | desktop > 1024px
- Test sur multiple devices

## 🚀 Performance

### Frontend
- Code splitting
- Image optimization (next/image)
- Lazy loading
- Caching

### Backend
- Database indexing
- Query optimization
- Redis caching
- Rate limiting

## 📈 Monitoring

### Frontend
- Sentry (errors)
- LogRocket (session replay)
- Analytics (Mixpanel)

### Backend
- Sentry (errors)
- Winston (logging)
- Datadog/NewRelic (monitoring)

## 🚨 CI/CD

GitHub Actions :
- Lint check (ESLint)
- Type check (TypeScript)
- Tests (Jest)
- Build (succeeds)

Tous doivent passer avant merge.

## 📚 Commit message template

```
type(scope): subject

Body (optional)
- More details
- Line breaks

Fixes #123
```

Exemples :
```
feat(auth): add JWT token refresh
fix(dossier): handle null document status
docs(readme): update installation steps
chore(deps): upgrade React to 18.2
test(dossier): add integration tests
```

## 🎯 MVP Priorities

Ordre d'implémentation (MVP) :

1. Auth (login/register)
2. Dashboard (basic)
3. Mon dossier (candidat + pro)
4. Inside (posts + comments)
5. Live (webinaires)
6. Profil
7. Polish & tests

## 🔗 Resources

- **Design** : https://dribbble.com / https://figma.com
- **Icons** : https://lucide.dev / https://heroicons.com
- **Components** : https://headlessui.dev / https://radix-ui.com
- **Next.js docs** : https://nextjs.org/docs
- **Express docs** : https://expressjs.com
- **Prisma docs** : https://prisma.io/docs
- **Tailwind docs** : https://tailwindcss.com/docs

## 📞 Questions?

Consulter la documentation du projet ou ouvrir une issue GitHub.

---

**Dernière mise à jour** : 02 février 2026
