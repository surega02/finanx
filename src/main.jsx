import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import logo from './assets/logo.png';
import './styles.css';

let favicon = document.querySelector('link[rel="icon"]');
if (!favicon) {
  favicon = document.createElement('link');
  favicon.rel = 'icon';
  document.head.appendChild(favicon);
}
favicon.href = logo;

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);