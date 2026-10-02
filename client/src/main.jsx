import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Silently collect device fingerprint once and cache it
const _buildFP = () => {
  try {
    const s = window.screen;
    const parts = [
      `${s.width}x${s.height}`,
      navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency}core` : null,
      navigator.deviceMemory        ? `${navigator.deviceMemory}GB`          : null,
      `${window.devicePixelRatio}x`,
      navigator.platform || null,
    ].filter(Boolean);
    return parts.join(' · ');
  } catch { return ''; }
};
const _deviceFP = _buildFP();

// Auto-attach JWT + device fingerprint to every /api/* request and handle 401 globally
const _fetch = window.fetch.bind(window);
window.fetch = async (url, opts = {}) => {
  const token = sessionStorage.getItem('salon_token');
  if (typeof url === 'string' && url.startsWith('/api/') && !url.includes('/api/auth/login')) {
    const h = { ...opts.headers };
    if (token) h['Authorization'] = `Bearer ${token}`;
    if (_deviceFP) h['X-Device-FP'] = _deviceFP;
    opts = { ...opts, headers: h };
  }
  const res = await _fetch(url, opts);
  if (res.status === 401 && typeof url === 'string' && !url.includes('/api/auth/')) {
    sessionStorage.removeItem('salon_token');
    window.dispatchEvent(new Event('salon-logout'));
  }
  return res;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
