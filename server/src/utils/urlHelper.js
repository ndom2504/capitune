// Utilitaire pour générer les URLs de médias
let API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

export function setApiBaseUrl(url) {
  API_BASE_URL = url;
}

export function getMediaUrl(filename) {
  if (!filename) return '';
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  return `${API_BASE_URL}/uploads/${filename}`;
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

// Garantit une URL absolue pour médias/avatars
export function ensureAbsoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return '';
  const value = typeof pathOrUrl === 'string' 
    ? pathOrUrl 
    : (pathOrUrl?.url ?? '');
  if (!value) return '';
  // Si c'est déjà une URL absolue, la retourner
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  // Si c'est un chemin relatif, ajouter le préfixe /uploads si nécessaire
  if (value.startsWith('/uploads')) {
    return `${API_BASE_URL}${value}`;
  }
  if (value.startsWith('/')) {
    return `${API_BASE_URL}${value}`;
  }
  // Sinon ajouter /uploads/
  return `${API_BASE_URL}/uploads/${value}`;
}
