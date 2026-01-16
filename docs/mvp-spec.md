# Capitune — MVP Spécification Produit (Annonceur & Créateur)

## Objectifs
- Offrir un dashboard annonceur clair, orienté ROI.
- Définir un parcours créateur simple et fiable (onboarding).
- Encadrer les retraits/payouts en USD avec règles transparentes.
- Garantir une expérience mobile-first rapide et accessible.

## Portée MVP
- Dashboard Annonceur: header budget, KPIs rapides, campagnes, créateurs, performances, recommandations, paiements (liste), notifications clés.
- Onboarding Créateur: collecte minimale (profil, catégorie, paiement, acceptation CGU), activation monétisation.
- Paiements & retraits: seuils, commissions, délais, états et erreurs.
- Mobile-first: vue fluide <900px et <640px pour pages essentielles (Navbar, Dashboard Créateur/Annonceur, Marketplace, SearchBar).

---

## 1. Payout & Retraits (USD)
- **Devise par défaut**: USD.
- **Seuil minimum retrait**: $20 (2000 cents). Message d’erreur: "Montant minimum : 20$".
- **Traitement**: sous 5 jours ouvrés après demande (batch quotidien). 
- **Méthodes de paiement**: 
  - V1: Virement bancaire (IBAN/SWIFT) — champ `paymentInfo.method=bank` + `iban` obligatoire.
  - V2 (post-MVP): PayPal.
- **Commissions (déjà définies dans UI)**:
  - Ads: 50% créateur / 50% Capitune
  - Abonnements: 80% / 20%
  - Tips: 90% / 10%
  - Lives payants: 70% / 30%
  - Partenariats: 80–90% créateur (négociable)
- **Délais et états**:
  - `requested` → `processing` → `paid` → `failed`
  - En cas d’échec: conserver trace `transactions` avec motif.
- **Bloqueurs**:
  - KYC/Infos de paiement manquantes: refuser avec message "Configure tes infos de paiement".
  - Solde insuffisant.
- **Messages UI**:
  - Balance, Total gagné, Retiré, seuil, délais.
- **Endpoints** (MVP):
  - `GET /monetization/profile` → balance, earnings, paymentInfo.
  - `POST /monetization/withdraw { amount }` → validations + enregistrement traitement.

### Règles métier (pseudo)
- `withdraw(amount)`
  - if `amount > balance`: error "Solde insuffisant".
  - if `amount < 2000`: error "Montant minimum : 20$".
  - if `!paymentInfo.iban`: error "Configure tes infos de paiement".
  - otherwise: push transaction, decrement balance, set state `requested`.

---

## 2. Parcours Créateur (Onboarding)
- **Objectif**: permettre à un créateur de démarrer, publier, et préparer la monétisation.
- **Étapes**:
  1. **Bienvenue & choix de catégorie**: `Créateur de contenu` (monétiseur) ou autre.
  2. **Profil rapide**: avatar, bannière (optionnel), bio courte, thèmes principaux.
  3. **Infos paiement (optionnel pour MVP)**: IBAN, pays, nom légal.
  4. **Acceptation CGU & règles de monétisation**.
  5. **Check qualité**: conseils de contenu (rétention, engagement, stabilité).
  6. **Première publication guidée**: CTA vers `Créer`.
- **Validations**:
  - Username unique, bio ≤ 160 chars, IBAN format basique.
- **Succès**:
  - Profil complété → message de réussite + lien dashboard créateur.
- **Télémétrie**:
  - Temps onboarding, drop-off step, % complétion.
- **UI**:
  - Pages/modal guidées, barre de progression, messages clairs.

---

## 3. Dashboard Mobile‑First
- **Breakpoints**:
  - `<900px`: 2 colonnes → 1 colonne.
  - `<640px`: boutons compacts, cacher labels non essentiels, police ≥14px.
- **Composants clés**:
  - Navbar: icônes sans libellés au plus petit, avatar 32px.
  - SearchBar large: cache le bouton sur mobile, Entrée pour valider.
  - KPIs grids: passe en 2× puis 1×; cartes cliquables.
  - Cards campagnes/créateurs: pile verticale, actions sous le titre.
- **Accessibilité**:
  - Contrastes AA, focus visible, aria-label sur icônes.
- **Performance**:
  - Lazy-loading listes, images responsive, éviter gros bundles.

---

## 4. KPIs & ROI (Annonceur)
- **KPIs rapides**: campagnes actives, propositions envoyées, collaborations, budget restant.
- **Metrics** (endpoint ajouté): `GET /marketplace/metrics?period=7d|30d`
  - Impressions, Engagement, Clics, Conversions
  - Coût par résultat (cents → affichage `$`)
  - Index ROI simple
  - SQA (Score Qualité Campagne) 0–100
- **Comparaison période** (post-MVP): +/– %.
- **Graphiques**: placeholders prêts (Line, Pie, Bar).

---

## 5. Notifications (Annonceur)
- **Événements**: lancement/fin campagne, livraison contenu, pic/chute performance, action requise.
- **Filtrage bruit**: limiter aux événements utiles, pas de spam.

---

## 6. Règles d’accès (compte)
- Pro: KPIs
- Premium: Multi‑campagnes, recommandations avancées, accès Or+
- Enterprise: Tout + support dédié

---

## 7. Critères d’acceptation (MVP)
- **Payout**: refus < $20; retrait créé avec état `requested`; balance décrémentée.
- **Onboarding**: utilisateur peut compléter profil + accepter CGU et voir dashboard créateur.
- **Mobile-first**: layout lisible <640px sur Dashboard Annonceur & Créateur.
- **KPIs**: `/marketplace/metrics` retourne agrégats sans erreur, affichés dans le dashboard.
- **Nav**: lien "Annonceur" visible pour `Partenaire`/`Professionnel`.

---

## 8. Plan de livraison
- **Sprint 1**: Onboarding créateur (UI, validations), SearchBar, Navbar mobile.
- **Sprint 2**: Dashboard Annonceur (KPIs, liste campagnes, créateurs).
- **Sprint 3**: Payout (retraits UI + validations backend), metrics endpoint, recos statiques.
- **Sprint 4**: Mobile-first polissage, accessibilité, télémétrie basique.

## Risques & mitigations
- Données KPIs insuffisantes → placeholders + collecte progressive.
- Paiements réels → garder simulation côté MVP, basculer réel post‑MVP.

## Mesures de succès
- Taux de complétion onboarding > 60%.
- 80% des écrans conformes mobile-first.
- Demandes de retrait valides traitées (simulées) < 48h en staging.
- Utilisation dashboard annonceur (visites/semaine) en hausse.
