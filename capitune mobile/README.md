# Capitune Mobile (Expo SDK 54)

Prototype mobile React Native (Expo) pour tester Inside avec l'API existante.

## Prérequis
- Node.js LTS
- Expo CLI (`npm i -g expo` facultatif)
- Expo Go 54 sur votre téléphone

## Configuration
Définissez l'API accessible depuis le téléphone (IP du PC) :

```bash
# Remplacez par votre IP locale
setx EXPO_PUBLIC_API_HOST http://192.168.0.10:3000
```

Sous Windows PowerShell, relancez ensuite le terminal.

## Installation
```bash
cd "C:\capitune\capitune mobile"
npm install
```

## Lancer
```bash
npm start
```
Scannez le QR code avec Expo Go. L'écran Inside liste les conversations, ouvre les messages, envoie du texte et propose 3 icônes (audio, vidéo, fichier).

## Limitations actuelles
- Les icônes audio/vidéo envoient un message d'intention (pas d'appel natif).
- Le trombone ouvre le sélecteur de fichiers et envoie un message avec nom et taille (pas d'upload). 

Pour activer l'upload réel ou les appels, on pourra ajouter :
- Upload: backend endpoint multipart + `fetch` avec `FormData`.
- Appels: WebRTC natif (ex: react-native-webrtc) ou services externes.
