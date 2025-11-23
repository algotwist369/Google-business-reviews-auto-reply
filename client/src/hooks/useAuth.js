import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '../services/api';

export const useAuth = () => {
  const getInitialTokens = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const urlRefreshToken = urlParams.get('refreshToken');

    if (urlToken) {
      localStorage.setItem('authToken', urlToken);
      if (urlRefreshToken) {
        localStorage.setItem('authRefreshToken', urlRefreshToken);
      }
      window.history.replaceState({}, document.title, '/');
      return {
        token: urlToken,
        refreshToken: urlRefreshToken || localStorage.getItem('authRefreshToken')
      };
    }

    return {
      token: localStorage.getItem('authToken'),
      refreshToken: localStorage.getItem('authRefreshToken')
    };
  };

  const initialTokens = getInitialTokens();

  const [token, setToken] = useState(initialTokens.token);
  const [refreshToken, setRefreshToken] = useState(initialTokens.refreshToken);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const requestRef = useRef(null);
  const refreshPromiseRef = useRef(null);

  const clearSession = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authRefreshToken');
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const saveTokens = useCallback((nextToken, nextRefreshToken) => {
    if (nextToken) {
      localStorage.setItem('authToken', nextToken);
      setToken(nextToken);
    }
    if (nextRefreshToken) {
      localStorage.setItem('authRefreshToken', nextRefreshToken);
      setRefreshToken(nextRefreshToken);
    }
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) {
      return null;
    }

    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = (async () => {
        try {
          const response = await api.refreshToken(refreshToken);
          if (response?.token && response?.refreshToken) {
            saveTokens(response.token, response.refreshToken);
            return response.token;
          }
          return null;
        } catch (error) {
          clearSession();
          return null;
        } finally {
          refreshPromiseRef.current = null;
        }
      })();
    }

    return refreshPromiseRef.current;
  }, [refreshToken, saveTokens, clearSession]);

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
        if (error.response?.status === 401) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            try {
              const retryResponse = await api.getProfile(newToken, { signal: controller.signal });
              if (!controller.signal.aborted) {
                setUser(retryResponse.data);
              }
              return;
            } catch (retryError) {
              if (controller.signal.aborted) {
                return;
              }
              toast.error('Failed to load your profile. Please sign in again.');
              clearSession();
              return;
            }
          } else {
            toast.error('Session expired. Please sign in again.');
            clearSession();
            return;
          }
        } else {
          toast.error('Failed to load your profile. Please sign in again.');
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
  }, [token, refreshAccessToken, clearSession]);

  const logout = useCallback(async () => {
    try {
      if (token && refreshToken) {
        await api.logout(token, refreshToken);
      }
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      clearSession();
    }
  }, [token, refreshToken, clearSession]);

  return { token, user, loading, logout, isSuperAdmin: user?.role === 'super_admin' };
};

