'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendOtp, verifyOtp } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    const phoneRegex = /^\+91\d{10}$/;
    if (!phoneRegex.test(phone)) {
      setError('Enter full 10-digit number after +91 (e.g. +919876543210)');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your full name');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(phone, mode === 'signup' ? name : undefined);
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await verifyOtp(phone, otp);
      login(res.data.token, res.data.user);
      if (res.data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setStep('phone');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#080b16]">
      <div className="w-full max-w-md">
        <div className="glass-card text-center relative overflow-hidden">
          {/* Decorative Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 blur-[80px]" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 blur-[80px]" />

          <div className="relative z-10">
            {/* Header */}
            <div className="mb-8">
              <div className="text-5xl mb-4 animate-bounce-slow">📚</div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                SLMS
              </h1>
              <p className="text-slate-400 mt-2 text-sm">Smart Library Management System</p>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center animate-shake">
                {error}
              </div>
            )}

            {step === 'phone' ? (
              <form onSubmit={handleSendOtp} className="space-y-5 text-left">
                {mode === 'signup' && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                    <label className="block text-[11px] text-slate-500 uppercase tracking-wider font-bold ml-1">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Prince Mishra"
                      className="input-glass"
                      required
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <label className="block text-[11px] text-slate-500 uppercase tracking-wider font-bold ml-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="input-glass"
                    required
                  />
                </div>

                <button type="submit" className="btn-primary w-full py-3.5 text-sm font-bold shadow-xl shadow-indigo-500/20" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="spinner !w-4 !h-4 !border-2" /> Sending OTP...
                    </span>
                  ) : (
                    mode === 'login' ? 'Continue to Login' : 'Create Account'
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={toggleMode}
                    className="text-[13px] text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    {mode === 'login' ? (
                      <>Don&apos;t have an account? <span className="text-indigo-400 font-bold">Sign Up</span></>
                    ) : (
                      <>Already have an account? <span className="text-indigo-400 font-bold">Log In</span></>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6 text-left animate-in fade-in zoom-in-95 duration-300">
                <div className="space-y-3">
                  <label className="block text-[11px] text-slate-500 uppercase tracking-wider font-bold text-center">Enter Verification Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="input-glass text-center text-3xl tracking-[0.4em] font-mono !py-4"
                    required
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-500 text-center">
                    Code sent to <span className="text-slate-300 font-semibold">{phone}</span>
                  </p>
                </div>

                <button type="submit" className="btn-primary w-full py-4 text-sm font-bold shadow-xl shadow-indigo-500/25" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="spinner !w-4 !h-4 !border-2" /> Verifying...
                    </span>
                  ) : (
                    'Verify & Enter'
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                    className="text-[12px] text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    ← Back to {mode === 'login' ? 'Login' : 'Signup'}
                  </button>
                </div>
              </form>
            )}

            <p className="mt-8 text-[10px] text-slate-600 leading-relaxed max-w-[240px] mx-auto">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
