# 📞 Système d'invitation d'amis par contacts

## Vue d'ensemble

Fonctionnalité inspirée de Facebook permettant de trouver vos amis sur Capitune en synchronisant vos contacts téléphoniques.

## Fonctionnalités

### 1. Enregistrement du numéro de téléphone
- Les utilisateurs peuvent ajouter leur numéro pour être trouvables par leurs amis
- Le numéro est haché (SHA-256) pour la protection de la vie privée
- Le hash permet la correspondance sans exposer les numéros

### 2. Import de contacts
- Formats supportés : **VCF** (vCard) et **CSV**
- Parseur intégré pour extraire noms et numéros
- Limite de 500 contacts par synchronisation

### 3. Synchronisation
- Envoi des contacts au serveur
- Matching via hash de numéros de téléphone
- Résultats en 2 catégories :
  - **Trouvés** : utilisateurs déjà sur Capitune
  - **Non trouvés** : contacts pas encore inscrits

### 4. Actions
- **Suivre** directement les utilisateurs trouvés
- **Inviter** les contacts non trouvés (à venir)

## Backend

### Routes (`/api/contacts`)

#### `PUT /me/phone`
Enregistrer/mettre à jour le numéro de téléphone de l'utilisateur connecté.

**Body:**
```json
{
  "phoneNumber": "+33612345678"
}
```

**Response:**
```json
{
  "message": "Numéro de téléphone mis à jour",
  "phoneNumber": "+33612345678"
}
```

#### `DELETE /me/phone`
Supprimer le numéro de téléphone de l'utilisateur.

**Response:**
```json
{
  "message": "Numéro de téléphone supprimé"
}
```

#### `POST /sync`
Synchroniser une liste de contacts pour trouver des utilisateurs.

**Body:**
```json
{
  "contacts": [
    { "name": "Alice", "phoneNumber": "+33612345678" },
    { "name": "Bob", "phoneNumber": "+33687654321" }
  ]
}
```

**Response:**
```json
{
  "found": [
    {
      "contactName": "Alice",
      "phoneNumber": "+33612345678",
      "user": {
        "_id": "...",
        "username": "alice_d",
        "avatar": "/uploads/..."
      }
    }
  ],
  "notFound": [
    {
      "contactName": "Bob",
      "phoneNumber": "+33687654321"
    }
  ]
}
```

### Modèle User

Champs ajoutés :
```javascript
phoneNumber: {
  type: String,
  sparse: true,
  trim: true,
  default: null
},
phoneHash: {
  type: String,
  sparse: true,
  index: true,
  default: null
}
```

## Frontend

### Page `/invite`

Composant : `InviteFriends.jsx`

**Sections :**
1. **Enregistrer son numéro** - formulaire pour ajouter le numéro
2. **Importer les contacts** - upload VCF/CSV
3. **Résultats trouvés** - liste avec bouton "Suivre"
4. **Non trouvés** - liste des contacts absents

### Navigation

Nouveau lien dans la navbar : **Inviter** (icône UserPlus)

## Sécurité & Vie privée

### Hachage des numéros
- Algorithme : **SHA-256**
- Normalisation avant hachage (suppression espaces/tirets)
- Les numéros bruts ne sont jamais stockés en clair dans les résultats de recherche
- Seul le hash est indexé et utilisé pour le matching

### Limites
- **500 contacts max** par requête de sync
- Protection contre les abus de synchronisation massive

## Format des fichiers de contacts

### CSV
```csv
name,phone
Alice Dupont,+33612345678
Bob Martin,+33687654321
```

### VCF (vCard)
```
BEGIN:VCARD
VERSION:3.0
FN:Alice Dupont
TEL:+33612345678
END:VCARD
BEGIN:VCARD
VERSION:3.0
FN:Bob Martin
TEL:+33687654321
END:VCARD
```

## Test avec l'exemple

Un fichier `contacts_example.csv` est fourni à la racine du projet pour tester la fonctionnalité.

## Prochaines améliorations

- [ ] Invitations par SMS (Twilio)
- [ ] Invitations par email
- [ ] Lien de parrainage personnalisé
- [ ] Contact Picker API (navigateurs modernes)
- [ ] Cache côté client des résultats
- [ ] Statistiques d'invitations

## Notes d'implémentation

### À faire manuellement :

1. **Modifier `server/src/models/User.js`** - ajouter `phoneNumber` et `phoneHash`
2. **Modifier `server/src/server.js`** - importer et monter `contactRoutes`

Ces fichiers existent déjà et doivent être édités manuellement (voir instructions dans le code).
