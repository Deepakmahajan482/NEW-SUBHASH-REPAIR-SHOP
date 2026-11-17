import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

const SUPER_ADMIN_EMAIL = (import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'deepakmahajan3028@gmail.com').toLowerCase();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('subhash_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('subhash_token') || null;
  });

  const [loading, setLoading] = useState(true);

  // Synchronize Axios default Authorization header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const data = response.data;
      
      const isSuper = (data.email || '').toLowerCase() === SUPER_ADMIN_EMAIL || !!data.isSuperAdmin;
      const userPayload = {
        _id: data._id,
        name: data.name,
        email: data.email,
        role: isSuper ? 'superadmin' : data.role,
        isSuperAdmin: isSuper,
      };

      localStorage.setItem('subhash_token', data.token);
      localStorage.setItem('subhash_user', JSON.stringify(userPayload));

      setToken(data.token);
      setUser(userPayload);
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;

      return { success: true, user: userPayload };
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed';
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem('subhash_token');
    localStorage.removeItem('subhash_user');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  };

  const isSuperAdmin = Boolean(
    user && (user.isSuperAdmin || (user.email && user.email.toLowerCase() === SUPER_ADMIN_EMAIL))
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isSuperAdmin,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
