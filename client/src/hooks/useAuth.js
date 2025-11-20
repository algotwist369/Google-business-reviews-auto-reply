import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
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

  const requestRef = useRef(null);

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      if (requestRef.current) {
        requestRef.current.abort();
      }

      const controller = new AbortController();
      requestRef.current = controller;

      try {
        const response = await api.getProfile(token, { signal: controller.signal });
        if (!controller.signal.aborted) {
          setUser(response.data);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        toast.error('Failed to load your profile. Please sign in again.');
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          setToken(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
        if (requestRef.current === controller) {
          requestRef.current = null;
        }
      }
    };

    loadUser();

    return () => {
      if (requestRef.current) {
        requestRef.current.abort();
        requestRef.current = null;
      }
    };
  }, [token]);

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };

  return { token, user, loading, logout, isSuperAdmin: user?.role === 'super_admin' };
};

