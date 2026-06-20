import { useState, useEffect } from 'react';
import { VendorLoginPage } from './VendorLoginPage';
import { VendorDashboard } from './VendorDashboard';
import { getVendorToken, getVendorUser, clearVendorSession } from '../utils/storage';
import { VendorUser } from '../types';

export function VendorPage() {
  const [vendor, setVendor] = useState<VendorUser | null>(() => {
    const token = getVendorToken();
    const user = getVendorUser();
    return token && user ? user : null;
  });

  function handleLoginSuccess(v: VendorUser) {
    setVendor(v);
  }

  function handleLogout() {
    clearVendorSession();
    setVendor(null);
  }

  if (!vendor) {
    return <VendorLoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return <VendorDashboard vendor={vendor} onLogout={handleLogout} />;
}
