import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Auto-attach JWT to every /api/* request and handle 401 globally
const _fetch = window.fetch.bind(window);
window.fetch = async (url, opts = {}) => {
  const token = localStorage.getItem('salon_token');
  if (token && typeof url === 'string' && url.startsWith('/api/') && !url.includes('/api/auth/login')) {
    opts = { ...opts, headers: { ...opts.headers, Authorization: `Bearer ${token}` } };
  }
  const res = await _fetch(url, opts);
  if (res.status === 401 && typeof url === 'string' && !url.includes('/api/auth/')) {
    localStorage.removeItem('salon_token');
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
