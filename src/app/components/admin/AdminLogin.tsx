import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

const bploLogo = new URL('../public/bplo-modified.png', import.meta.url).href;
const loginWallpaper = new URL('../public/wallpaper.png', import.meta.url).href;
import { verifyAdminLogin } from '../../utils/storage';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise(r => setTimeout(r, 800));

    if (verifyAdminLogin(username.trim(), password)) {
      onLoginSuccess();
    } else {
      setError('Invalid username or password. Please try again.');
    }
    setIsLoading(false);
  }

  return (
    <div
      className="min-h-screen bg-center bg-cover flex items-center justify-center p-4 relative"
      style={{ backgroundImage: `url(${loginWallpaper})` }}
    >
      <div className="absolute inset-0 bg-slate-900/60" aria-hidden="true" />

      <div className="relative w-full max-w-sm">
        {/* Logo & Title */}
        <div className="text-center mb-6">
            <img
              src={bploLogo}
              alt="BPLO Logo"
              className="w-14 h-14 object-contain"
            />
          </div>
          <h1 className="text-white text-2xl font-black tracking-tight">BPLO Admin Panel</h1>
          <p className="text-slate-300 text-sm mt-1">Stall Reservation Mapping System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Card Header Strip */}
          <div className="bg-blue-800 px-6 py-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-200" />
              <div>
                <h2 className="text-white text-base font-bold leading-tight">Staff Login</h2>
                <p className="text-blue-300 text-xs">Authorized BPLO personnel only</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all disabled:opacity-60"
                    disabled={isLoading}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all disabled:opacity-60"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !username || !password}
                className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl py-2.5 font-bold text-sm transition-all mt-2 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Authenticating...
                  </>
                ) : 'Sign In to Dashboard'}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-5">
          For authorized BPLO personnel only.
        </p>
      </div>
    </div>
  );
}
