import api from './api';

export const login = async (email: string, password: string) => {
  // Mock login - replace with actual API endpoint
  return Promise.resolve({ user: { id: 1, email, name: 'Store Manager' }, token: 'mock-token' });
};

export const logout = async () => {
  // Mock logout
  return Promise.resolve();
};

export const getCurrentUser = async () => {
  // Mock current user
  return Promise.resolve({ id: 1, email: 'manager@solai.com', name: 'Store Manager' });
};

export default { login, logout, getCurrentUser };