import { io } from 'socket.io-client';

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const authFetch = async (endpoint, token, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || data?.error || 'Request failed');
    error.response = response;
    error.data = data;
    throw error;
  }

  return data;
};

export const createSocket = () => io(BASE_URL, { transports: ['websocket'] });
