import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, Store, AlertCircle } from 'lucide-react';
import { vendorLoginPasscode, setVendorToken, setVendorUser } from '../../utils/storage';
import { VendorUser } from '../../types';

const bploLogo = '/images/bplo-modified.png';
const loginWallpaper = '/images/vendors.jpg';

interface VendorLoginPageProps {
  onLoginSuccess: (vendor: VendorUser) => void;
}

export function VendorLoginPage({ onLoginSuccess }: VendorLoginPageProps) {
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await vendorLoginPasscode(email.trim(), passcode.trim());
      setVendorToken(result.token);
      setVendorUser(result.vendor);
      onLoginSuccess(result.vendor);
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('401') || msg.includes('Invalid')) {
        setError('Invalid email or passcode. Please try again.');
      } else if (msg.includes('403') || msg.includes('inactive')) {
        setError('Account is inactive. Contact the administrator.');
      } else {
        setError('Login failed. Please check your connection.');
      }
    }
    setIsLoading(false);
  }

  return (
    <div
      className="min-h-[100dvh] bg-center bg-cover flex items-center justify-center p-4 sm:p-6 relative"
      style={{ backgroundImage: `url(${loginWallpaper})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/70" aria-hidden="true" />

      <div className="relative w-full max-w-xs sm:max-w-sm">
        {/* Logo & Title */}
        <div className="text-center mb-3 sm:mb-6">
          <img src={bploLogo} alt="BPLO Logo" className="w-10 h-10 sm:w-16 sm:h-16 object-contain mx-auto mb-2 sm:mb-4" />
          <h1 className="text-white text-base sm:text-2xl font-black tracking-tight">Night Market</h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-0.5 sm:mt-1">Vendor Account Login</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden">
          <div
            className="px-4 py-2.5 sm:px-6 sm:py-4"
            style={{
              background: 'linear-gradient(135deg, #1a0533 0%, #2d1066 25%, #4c1d95 50%, #6b21a8 75%, #2d1066 100%)',
            }}
          >
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-9 sm:h-9 bg-white/15 rounded-lg sm:rounded-xl flex items-center justify-center">
                <Store className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white text-sm sm:text-base font-bold leading-tight">Vendor Login</h2>
                <p className="text-purple-200 text-[10px] sm:text-xs">Email and admin-provided passcode</p>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all disabled:opacity-60"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1 sm:mb-1.5">Passcode</label>
                <div className="relative">
                  <Lock className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                  <input
                    type={showPasscode ? 'text' : 'password'}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="6-digit passcode"
                    className="w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-3 border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all disabled:opacity-60"
                    disabled={isLoading}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 w-7 h-7 sm:min-w-[40px] sm:min-h-[40px] flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors rounded-lg"
                    tabIndex={-1}
                  >
                    {showPasscode ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-2 sm:p-3">
                  <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !email || !passcode}
                className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg sm:rounded-xl py-2 sm:py-3.5 font-bold text-xs sm:text-sm transition-all mt-1 sm:mt-2 flex items-center justify-center gap-2 shadow-sm shadow-blue-700/25 min-h-[36px] sm:min-h-[48px]"
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-slate-400 text-[10px] sm:text-xs mt-3 sm:mt-5">
          Calauan Day & Night Market Stall Reservation System
        </p>
        <a
          href="/"
          className="mt-3 block text-center text-xs text-blue-400 hover:text-blue-300 font-semibold underline transition-colors"
        >
          Go to Public Map
        </a>
      </div>
    </div>
  );
}
