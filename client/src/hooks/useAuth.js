import { useState, useEffect } from 'react';
import { api } from '../services/api';

export const useAuth = () => {
  const [token, setToken] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) {
      localStorage.setItem('authToken', urlToken);
      window.history.replaceState({}, document.title, '/');
      return urlToken;
    }
    return localStorage.getItem('authToken');
  });

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await api.getProfile(token);
          console.log('User profile loaded:', response.data); // Debug log
          setUser(response.data);
        } catch (error) {
          console.error('Failed to load user profile:', error);
          // If token is invalid, clear it
          if (error.response?.status === 401) {
            localStorage.removeItem('authToken');
            setToken(null);
          }
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };

  return { token, user, loading, logout, isSuperAdmin: user?.role === 'super_admin' };
};

