import { useState } from 'react';
import { AdminLogin } from '../components/admin/AdminLogin';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { getAdminToken, setAdminToken, clearAdminSession } from '../utils/storage';

export function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return !!getAdminToken();
    } catch {
      return false;
    }
  });

  function handleLoginSuccess(token: string) {
    setAdminToken(token);
    setIsAuthenticated(true);
  }

  function handleLogout() {
    clearAdminSession();
    setIsAuthenticated(false);
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
}
