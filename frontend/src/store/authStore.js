import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('ttm_user') || 'null'),
  token: localStorage.getItem('ttm_token') || null,
  isAuthenticated: !!localStorage.getItem('ttm_token'),

  setAuth: (user, token) => {
    localStorage.setItem('ttm_token', token);
    localStorage.setItem('ttm_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('ttm_token');
    localStorage.removeItem('ttm_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (user) => {
    localStorage.setItem('ttm_user', JSON.stringify(user));
    set({ user });
  },
}));

export default useAuthStore;
