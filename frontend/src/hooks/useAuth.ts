import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock auth check - replace with actual authentication logic
    const checkAuth = async () => {
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login - replace with actual API call
    return Promise.resolve();
  };

  const logout = async () => {
    // Mock logout
    setUser(null);
  };

  return { user, loading, login, logout };
};

export default useAuth;