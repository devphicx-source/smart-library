'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { firebaseLogin, getMe, checkUser } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  const router = useRouter();
  const { login } = useAuth();

  // Initialize reCAPTCHA
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
    }
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        delete window.recaptchaVerifier;
      }
    };
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your full name');
      return;
    }

    const fullPhone = `+91${phone}`;

    setLoading(true);
    try {
      // 1. Check user existence in our DB before sending OTP
      const { data } = await checkUser(fullPhone);
      
      if (mode === 'login' && !data.exists) {
        setError('No account found with this phone number. Please sign up first.');
        setLoading(false);
        return;
      }
      
      if (mode === 'signup' && data.exists) {
        setError('This phone number is already registered. Please login instead.');
        setLoading(false);
        return;
      }

      // 2. If check passes, send OTP via Firebase
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
      setConfirmationResult(confirmation);
      setStep('otp');
    } catch (err) {
      console.error('Firebase Auth Error:', err);
      if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.');
      } else {
        setError(err.message || 'Failed to send OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Verify OTP with Firebase
      const result = await confirmationResult.confirm(otp);
      const idToken = await result.user.getIdToken();

      // 2. Login to our backend with the Firebase Token
      const res = await firebaseLogin(idToken, mode === 'signup' ? name : undefined);
      
      login(res.data.token, res.data.user);
      
      if (res.data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Verification Error:', err);
      setError(err.message || 'Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError('');
    setStep('phone');
    setName('');
    setPhone('');
  };

  return (
    <div className="dark">
      <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg-primary)] text-[var(--text-primary)] relative">
        <div id="recaptcha-container"></div>
        
        <div className="w-full max-w-md">
          <div className="glass-card text-center relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 blur-[80px]" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 blur-[80px]" />
  
            <div className="relative z-10">
              <div className="mb-8">
                <div className="text-5xl mb-4 animate-bounce-slow">📚</div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  SLMS
                </h1>
                <p className="text-[var(--text-secondary)] mt-2 text-sm">Smart Library Management System</p>
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
                      <label className="block text-[11px] text-[var(--text-secondary)] uppercase tracking-wider font-bold ml-1">Full Name</label>
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
                    <label className="block text-[11px] text-[var(--text-secondary)] uppercase tracking-wider font-bold ml-1">Phone Number</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-[var(--text-secondary)] text-sm font-semibold pointer-events-none">+91</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9876543210"
                        className="input-glass !pl-12"
                        required
                      />
                    </div>
                  </div>
  
                  <button type="submit" className="btn-primary w-full py-3.5 text-sm font-bold shadow-xl shadow-indigo-500/20" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="spinner !w-4 !h-4 !border-2" /> Initializing...
                      </span>
                    ) : (
                      mode === 'login' ? 'Continue to Login' : 'Create Account'
                    )}
                  </button>
  
                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={toggleMode}
                      className="text-[13px] text-[var(--text-secondary)] hover:text-indigo-400 transition-colors"
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
                    <label className="block text-[11px] text-[var(--text-secondary)] uppercase tracking-wider font-bold text-center">Enter Verification Code</label>
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
                    <p className="text-[11px] text-[var(--text-secondary)] text-center">
                      Code sent to <span className="text-[var(--text-primary)] font-semibold">{phone}</span>
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
                      className="text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      ← Back to {mode === 'login' ? 'Login' : 'Signup'}
                    </button>
                  </div>
                </form>
              )}
  
              <p className="mt-8 text-[10px] text-[var(--text-secondary)] opacity-60 leading-relaxed max-w-[240px] mx-auto">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
