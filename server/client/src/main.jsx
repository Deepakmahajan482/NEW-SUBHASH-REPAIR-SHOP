import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import App from './App.jsx';
import './index.css';

// Configure dynamic API Base URL from environment (empty string preserves Vite dev proxy)
const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
if (apiBase) {
  axios.defaults.baseURL = apiBase;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
