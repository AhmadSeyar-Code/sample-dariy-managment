import axios from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getMediaUrl = (path) => {
  if (!path) return `${API_BASE_URL}/uploads/logos/default-dairy-logo.svg`;
  return String(path).startsWith('http') ? path : `${API_BASE_URL}${path}`;
};

export { API_BASE_URL };
