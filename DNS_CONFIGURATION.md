# Configuration DNS pour capitune.com

## Guide de configuration DNS au registrar (GoDaddy, Namecheap, etc.)

### 1. ENREGISTREMENTS DNS À AJOUTER

Accédez à votre gestionnaire DNS et ajoutez ces enregistrements:

#### Frontend (Vercel)
```
Type   | Name | TTL  | Value
-------|------|------|----------------------------------------
CNAME  | www  | 3600 | cname.vercel-dns.com
ALIAS  | @    | 3600 | capitune.vercel-dns.com
TXT    | @    | 3600 | v=spf1 include:vercel.com ~all
TXT    | _dnsauth | 3600 | <verification-code-from-vercel>
```

**Avant d'ajouter:** Vercel vous fournira un code de vérification TXT

#### Backend (Railway)
```
Type   | Name  | TTL  | Value
-------|-------|------|----------------------------------------
CNAME  | api   | 3600 | <railway-domain-unique>
```

**Railway fournit un domaine unique lors de l'ajout du custom domain**

#### Mail (Optionnel - pour support@capitune.com)
```
Type   | Name | TTL  | Value
-------|------|------|----------------------------------------
MX     | @    | 3600 | 10 mail.capitune.com
A      | mail | 3600 | <votre-ip-mail-server>
TXT    | @    | 3600 | v=spf1 include:mailgun.org ~all
```

---

### 2. ÉTAPES PAR REGISTRAR

#### GoDaddy
1. Aller sur **Domains > Your domains**
2. Sélectionner **capitune.com**
3. Cliquer **DNS** dans le menu
4. Ajouter les enregistrements CNAME sous "Additional records"
5. Sauvegarder

#### Namecheap
1. Aller sur **Domain List**
2. Cliquer le **Manage button**
3. Onglet **Advanced DNS**
4. Ajouter enregistrements CNAME
5. Sauvegarder

#### OVH
1. Aller sur **Domaines > capitune.com**
2. Onglet **Zone DNS**
3. Modifier la zone DNS
4. Ajouter enregistrements
5. Valider

---

### 3. ORDRE DE CONFIGURATION

1. **Chez Vercel:**
   - Ajouter domaine `capitune.com`
   - Copier les enregistrements DNS fournis

2. **Chez Railway:**
   - Ajouter domaine `api.capitune.com`
   - Copier l'enregistrement CNAME

3. **Au registrar:**
   - Ajouter tous les enregistrements CNAME
   - Ajouter vérification TXT de Vercel
   - Sauvegarder

4. **Vérifier la propagation:**
   ```bash
   nslookup capitune.com
   nslookup api.capitune.com
   nslookup www.capitune.com
   ```

---

### 4. PROPAGATION DNS

- **Temps initial:** 5-30 minutes
- **Propagation complète:** 24-48 heures
- **TTL (Time To Live):** 3600 secondes (1 heure)

**Vérifier la propagation:**
```bash
# Windows
nslookup capitune.com
nslookup capitune.com 8.8.8.8  # Vérifier avec Google DNS

# Linux/Mac
dig capitune.com
dig api.capitune.com
```

---

### 5. VÉRIFIER SSL

```bash
# Frontend
curl -I https://capitune.com
curl -I https://www.capitune.com

# Backend
curl -I https://api.capitune.com

# Détails du certificat
openssl s_client -connect capitune.com:443
```

---

### 6. CERTIFICAT SSL

**Vercel et Railway fournissent automatiquement:**
- ✅ Certificat Let's Encrypt gratuit
- ✅ Renouvellement automatique
- ✅ Wildcard pour subdomaines

**Délai:** 5-10 minutes après ajout du domaine

---

### 7. REDIRECTIONS

#### HTTP → HTTPS
- Automatique avec Vercel/Railway
- Tous les accès HTTP redirigent vers HTTPS

#### www → non-www (optionnel)
- Vercel: Configure dans Settings > Domains
- Railway: Ajouter `www.api.capitune.com` si besoin

---

### 8. TROUBLESHOOTING

#### Domain ne se propage pas
```bash
# Vérifier les enregistrements
nslookup -type=CNAME www.capitune.com

# Vérifier avec d'autres DNS
nslookup capitune.com 1.1.1.1  # Cloudflare
nslookup capitune.com 8.8.8.8  # Google

# Attendre 24h et réessayer
```

#### Certificat SSL n'apparaît pas
- Attendre 5-10 minutes
- Vérifier enregistrements CNAME corrects
- Vérifier Vercel/Railway dashboard

#### Accès refusé (ERR_NAME_NOT_RESOLVED)
- DNS ne s'est pas propagé
- Vérifier enregistrements au registrar
- Attendre quelques heures

---

### 9. CHECKLIST DNS

- [ ] Enregistrements CNAME ajoutés au registrar
- [ ] TXT de vérification Vercel ajouté
- [ ] TTL configuré à 3600
- [ ] Propagation vérifiée avec nslookup
- [ ] HTTPS fonctionnant
- [ ] Certificat SSL valide

---

### 10. APRÈS CONFIGURATION

```bash
# Tester toutes les URLs
curl -I https://capitune.com         # Frontend
curl -I https://www.capitune.com     # Frontend alt
curl -I https://api.capitune.com     # Backend

# Vérifier la connectivité API
curl https://api.capitune.com/users/profile

# Tester l'authentification
# Ouvrir https://capitune.com et se connecter
```

---

## TEMPLATE REGISTRAR

Copier/coller au registrar:

```
Enregistrement 1:
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Enregistrement 2:
Type: ALIAS (ou A si ALIAS pas dispo)
Name: @
Value: capitune.vercel-dns.com

Enregistrement 3:
Type: CNAME
Name: api
Value: <railway-domain-unique>

Enregistrement 4:
Type: TXT
Name: _dnsauth
Value: <vercel-verification-code>
```

---

**Questions? Consultez:**
- [Vercel Custom Domains](https://vercel.com/docs/concepts/projects/domains)
- [Railway Domains](https://docs.railway.app/deploy/static-deploys#custom-domains)
- [DNS Records Explanation](https://www.cloudflare.com/learning/dns/)
