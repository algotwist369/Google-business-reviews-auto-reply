import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) {
      localStorage.setItem('authToken', urlToken);
      setToken(urlToken);
      window.history.replaceState({}, document.title, '/');
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
  };

  return { token, logout };
};

