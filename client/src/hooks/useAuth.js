import { useState } from 'react';

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

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
  };

  return { token, logout };
};

