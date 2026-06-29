import React, { useState, useEffect, useRef } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

const bploLogo = '/images/bplo-modified.png';
const loginWallpaper = '/images/wallpaper.png';
import { verifyAdminLogin } from '../../utils/storage';

interface AdminLoginProps {
  onLoginSuccess: (token: string) => void;
}

function generateCaptcha(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaText, setCaptchaText] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    refreshCaptcha();
  }, []);

  function refreshCaptcha() {
    const text = generateCaptcha();
    setCaptchaText(text);
    setCaptchaInput('');
    setTimeout(() => drawCaptcha(text), 0);
  }

  function drawCaptcha(text: string) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, width, height);

    // Noise lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `hsl(${Math.random() * 360}, 50%, 70%)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.lineTo(Math.random() * width, Math.random() * height);
      ctx.stroke();
    }

    // Noise dots
    for (let i = 0; i < 30; i++) {
      ctx.fillStyle = `hsl(${Math.random() * 360}, 50%, 60%)`;
      ctx.beginPath();
      ctx.arc(Math.random() * width, Math.random() * height, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Characters
    const fontSize = 28;
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textBaseline = 'middle';
    const charWidth = width / (text.length + 1);
    for (let i = 0; i < text.length; i++) {
      ctx.fillStyle = `hsl(${Math.random() * 360}, 60%, 35%)`;
      ctx.save();
      const x = charWidth * (i + 1);
      const y = height / 2 + (Math.random() - 0.5) * 10;
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.4);
      ctx.fillText(text[i], 0, 0);
      ctx.restore();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (captchaInput !== captchaText) {
      setError('Captcha verification failed. Please try again.');
      refreshCaptcha();
      return;
    }

    setIsLoading(true);

    try {
      const token = await verifyAdminLogin(username.trim(), password);
      if (token) {
        onLoginSuccess(token);
      } else {
        setError('Invalid username or password. Please try again.');
      }
    } catch {
      setError('Login failed. Please check your connection.');
    }
    setIsLoading(false);
  }

  return (
    <div
      className="min-h-screen bg-center bg-cover flex items-center justify-center p-4 relative"
      style={{ backgroundImage: `url(${loginWallpaper})` }}
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px]" aria-hidden="true" />

      <div className="relative w-full max-w-sm">
        {/* Logo & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4 rounded-2xl">
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
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Card Header Strip */}
          <div
            className="px-6 py-4"
            style={{
              background: 'linear-gradient(135deg, #1a0533 0%, #2d1066 25%, #4c1d95 50%, #6b21a8 75%, #2d1066 100%)',
            }}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-200" />
              <div>
                <h2 className="text-white text-base font-bold leading-tight">Staff Login</h2>
                <p className="text-purple-200 text-xs">Authorized BPLO personnel only</p>
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

              {/* CAPTCHA */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Verification Code</label>
                <div className="flex items-center gap-2">
                  <canvas
                    ref={canvasRef}
                    width={160}
                    height={50}
                    className="rounded-xl border border-slate-200 shrink-0"
                  />
                  <button
                    type="button"
                    onClick={refreshCaptcha}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
                    title="Refresh captcha"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <input
                  type="text"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  placeholder="Type the code above"
                  className="w-full px-4 py-2.5 mt-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all disabled:opacity-60"
                  disabled={isLoading}
                  autoComplete="off"
                />
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
                disabled={isLoading || !username || !password || !captchaInput}
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
        <a
          href="/"
          className="mt-3 block text-center text-xs text-slate-300 hover:text-white font-semibold underline transition-colors"
        >
          Go to Public Map
        </a>
      </div>
    </div>
  );
}
