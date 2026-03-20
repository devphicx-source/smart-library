'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sendOtp, verifyOtp } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
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

    setLoading(true);
    try {
      await sendOtp(phone);
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card w-full max-w-md text-center">
        {/* Header */}
        <div className="mb-8">
          <div className="text-5xl mb-4">📚</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            SLMS
          </h1>
          <p className="text-slate-400 mt-2">Smart Library Management System</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="text-left">
              <label className="block text-sm text-slate-400 mb-2">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                className="input-glass"
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner !w-4 !h-4 !border-2" /> Sending...
                </span>
              ) : (
                'Send OTP'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-left">
              <label className="block text-sm text-slate-400 mb-2">Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="input-glass text-center text-2xl tracking-[0.5em]"
                required
              />
              <p className="text-xs text-slate-500 mt-2">Sent to {phone}</p>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner !w-4 !h-4 !border-2" /> Verifying...
                </span>
              ) : (
                'Verify & Login'
              )}
            </button>
            <button
              type="button"
              onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
              className="text-sm text-slate-400 hover:text-indigo-400 transition-colors"
            >
              ← Change number
            </button>
          </form>
        )}

        <p className="mt-6 text-xs text-slate-600">
          By logging in you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}
