import useAuthStore from '../stores/authStore';

export default function useAuth() {
  const { user, accessToken, isLoading, login, logout } = useAuthStore();

  return {
    user,
    accessToken,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isStudent: user?.role === 'STUDENT',
    login,
    logout,
  };
}
