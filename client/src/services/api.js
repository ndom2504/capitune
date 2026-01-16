import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth services
export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  saveUser: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
  }
};

// Post services
export const postService = {
  getAllPosts: () => api.get('/posts'),
  getPostById: (id) => api.get(`/posts/${id}`),
  createPost: (postData) => api.post('/posts', postData),
  likePost: (id) => api.post(`/posts/${id}/like`),
  unlikePost: (id) => api.delete(`/posts/${id}/like`),
  addComment: (id, comment) => api.post(`/posts/${id}/comments`, comment),
  deletePost: (id) => api.delete(`/posts/${id}`)
};

// User services
export const userService = {
  getAllUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  getUserPosts: (id) => api.get(`/users/${id}/posts`),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  followUser: (id) => api.post(`/users/${id}/follow`),
  unfollowUser: (id) => api.delete(`/users/${id}/follow`)
};

// Community services
export const communityService = {
  getAllCommunities: () => api.get('/communities'),
  getCommunityById: (id) => api.get(`/communities/${id}`),
  createCommunity: (communityData) => api.post('/communities', communityData),
  joinCommunity: (id) => api.post(`/communities/${id}/join`),
  leaveCommunity: (id) => api.delete(`/communities/${id}/join`)
};

export default api;
