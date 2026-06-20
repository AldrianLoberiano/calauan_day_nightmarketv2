import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, Store, AlertCircle } from 'lucide-react';
import { vendorLoginPasscode, setVendorToken, setVendorUser } from '../utils/storage';
import { VendorUser } from '../types';

const bploLogo = new URL('../components/public/bplo-modified.png', import.meta.url).href;

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

    await new Promise(r => setTimeout(r, 600));

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-2xl">
            <img src={bploLogo} alt="BPLO Logo" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="text-slate-800 text-2xl font-black tracking-tight">Night Market</h1>
          <p className="text-slate-500 text-sm mt-1">Vendor Account Login</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-blue-700 px-6 py-4">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-200" />
              <div>
                <h2 className="text-white text-base font-bold leading-tight">Vendor Login</h2>
                <p className="text-blue-200 text-xs">Use your email and admin-provided passcode</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all disabled:opacity-60"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Passcode</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPasscode ? 'text' : 'password'}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter your 6-digit passcode"
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all disabled:opacity-60"
                    disabled={isLoading}
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !email || !passcode}
                className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl py-2.5 font-bold text-sm transition-all mt-2 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : 'Sign In'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <a
                href="/"
                className="text-center block text-slate-500 hover:text-slate-700 text-xs font-medium transition-colors"
              >
                Browse Stalls (Guest)
              </a>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-5">
          Calauan Day & Night Market Stall Reservation System
        </p>
      </div>
    </div>
  );
}
