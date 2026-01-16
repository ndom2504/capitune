// Simple API client for Capitune Mobile
const API_HOST = process.env.EXPO_PUBLIC_API_HOST || 'http://192.168.0.10:3000'; // TODO: set your machine IP

const jsonHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {})
});

const fetchJson = async (url, options = {}) => {
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) {
    const detail = data?.message || data?.error || data?.raw || '';
    const err = new Error(`HTTP ${res.status} on ${url}${detail ? `: ${detail}` : ''}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
};

export const getConversations = async (token) => {
  return fetchJson(`${API_HOST}/api/inside/conversations?limit=50`, {
    headers: jsonHeaders(token)
  });
};

export const getMessages = async (threadId, token) => {
  return fetchJson(`${API_HOST}/api/inside/conversations/${threadId}/messages?limit=50`, {
    headers: jsonHeaders(token)
  });
};

export const sendMessage = async (threadId, content, token) => {
  return fetchJson(`${API_HOST}/api/inside/conversations/${threadId}/messages`, {
    method: 'POST',
    headers: jsonHeaders(token),
    body: JSON.stringify({ content })
  });
};

export const getRequests = async (token) => {
  return fetchJson(`${API_HOST}/api/inside/requests?status=pending`, {
    headers: jsonHeaders(token)
  });
};

export const resolveUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/')) return `${API_HOST}${url}`;
  return `${API_HOST}/uploads/${url}`;
};
