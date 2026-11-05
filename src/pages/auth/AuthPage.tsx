import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail, Lock, User, ArrowRight, Plane, ShieldCheck, Building2, Shield, Loader2,
  Phone, MessageSquare, CheckCircle2, KeyRound,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';
import type { UserRole } from '@/types';

type AuthMethod = 'email' | 'phone' | 'google';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { signIn, signUp, signInWithGoogle, signInWithPhone, verifyPhoneOtp } = useAuth();
  const navigate = useNavigate();

  const [method, setMethod] = useState<AuthMethod>('email');

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('traveler');

  // Phone form state
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
        setLoading(false);
      } else {
        navigate('/');
      }
    } else {
      if (fullName.trim().length < 2) {
        setError('Please enter your full name');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, role, fullName);
      if (error) {
        setError(error);
        setLoading(false);
      } else {
        navigate('/');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setInfo(null);
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error);
      setLoading(false);
    }
    // If successful, browser redirects to Google — no need to setLoading(false)
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    if (phone.trim().length < 8) {
      setError('Please enter a valid phone number');
      setLoading(false);
      return;
    }

    const { error } = await signInWithPhone(phone.trim());
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      setInfo('A verification code has been sent to your phone. Enter it below to continue.');
      setOtpSent(true);
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (otpCode.trim().length < 4) {
      setError('Please enter the verification code');
      setLoading(false);
      return;
    }

    const { error } = await verifyPhoneOtp(phone.trim(), otpCode.trim());
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  const resetPhone = () => {
    setOtpSent(false);
    setOtpCode('');
    setInfo(null);
    setError(null);
  };

  const methodTabs: { key: AuthMethod; label: string; icon: React.ElementType }[] = [
    { key: 'email', label: 'Email', icon: Mail },
    { key: 'phone', label: 'Phone', icon: Phone },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-turquoise-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-turquoise-500/10 rounded-full blur-3xl" />
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }}
          />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <Logo light size="lg" />

          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-display font-bold leading-tight text-balance">
                Digital identity for the modern traveler
              </h1>
              <p className="text-navy-300 mt-4 text-lg max-w-md">
                Secure passport scanning, QR verification, and seamless booking management — all in one premium platform.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: ShieldCheck, title: 'Bank-grade security', desc: 'Your passport data is encrypted and protected' },
                { icon: Plane, title: 'Global travel identity', desc: 'One digital card works everywhere' },
                { icon: Building2, title: 'For businesses & travelers', desc: 'Built for the entire travel ecosystem' },
              ].map((feature) => (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon size={20} className="text-turquoise-400" />
                  </div>
                  <div>
                    <p className="font-semibold">{feature.title}</p>
                    <p className="text-sm text-navy-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-navy-400">
            Trusted by travel businesses worldwide
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-navy-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Logo size="md" />
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-bold text-navy-900">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-navy-500 mt-2">
              {mode === 'login'
                ? 'Sign in to access your travel identity dashboard'
                : 'Join ST&ID to start your digital travel identity'}
            </p>
          </div>

          {/* Google sign-in — always visible */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-white text-navy-700 font-medium rounded-xl border border-navy-200 hover:bg-navy-50 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 mb-4"
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px bg-navy-200" />
            <span className="text-xs text-navy-400 font-medium uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-navy-200" />
          </div>

          {/* Method tabs */}
          <div className="flex gap-2 p-1 bg-navy-100 rounded-xl mb-5">
            {methodTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setMethod(tab.key); setError(null); setInfo(null); }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  method === tab.key
                    ? 'bg-white text-navy-900 shadow-sm'
                    : 'text-navy-500 hover:text-navy-700'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Email method */}
          {method === 'email' && (
            <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
              {mode === 'register' && (
                <div>
                  <label className="label">Full Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="input pl-11"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input pl-11"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-11"
                    required
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="label">I am a...</label>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { value: 'traveler', label: 'Traveler', icon: Plane, desc: 'Personal travel ID' },
                      { value: 'business', label: 'Business', icon: Building2, desc: 'Verify travelers' },
                      { value: 'admin', label: 'Admin', icon: Shield, desc: 'Platform admin' },
                    ] as const).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRole(opt.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          role === opt.value
                            ? 'border-turquoise-500 bg-turquoise-50'
                            : 'border-navy-200 bg-white hover:border-navy-300'
                        }`}
                      >
                        <opt.icon size={20} className={role === opt.value ? 'text-turquoise-600' : 'text-navy-400'} />
                        <p className={`font-semibold mt-2 ${role === opt.value ? 'text-turquoise-700' : 'text-navy-700'}`}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-navy-400">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 animate-slide-down">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-base py-3"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Phone method */}
          {method === 'phone' && (
            <div className="space-y-5 animate-fade-in">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <label className="label">Phone Number</label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 555 000 0000"
                        className="input pl-11"
                        required
                      />
                    </div>
                    <p className="text-xs text-navy-400 mt-2 flex items-start gap-1.5">
                      <MessageSquare size={12} className="flex-shrink-0 mt-0.5" />
                      Enter your number with country code. We'll send you a one-time verification code via SMS.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 animate-slide-down">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full text-base py-3"
                  >
                    {loading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        Send Verification Code
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="p-4 rounded-xl bg-turquoise-50 border border-turquoise-200 flex items-start gap-3 animate-slide-down">
                    <CheckCircle2 size={20} className="text-turquoise-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-turquoise-800">Code sent to {phone}</p>
                      <button type="button" onClick={resetPhone} className="text-xs text-turquoise-600 hover:text-turquoise-700 font-medium mt-1">
                        Use a different number
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="label">Verification Code</label>
                    <div className="relative">
                      <KeyRound size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        className="input pl-11 text-center text-lg tracking-[0.3em] font-mono"
                        maxLength={6}
                        required
                      />
                    </div>
                    <p className="text-xs text-navy-400 mt-2">Enter the 6-digit code we sent to your phone.</p>
                  </div>

                  {info && (
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-700 animate-slide-down">
                      {info}
                    </div>
                  )}

                  {error && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 animate-slide-down">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full text-base py-3"
                  >
                    {loading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        Verify & Continue
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {mode === 'register' && !otpSent && (
                <p className="text-xs text-navy-400 text-center">
                  After verification, you'll choose your account type and complete your profile.
                </p>
              )}
            </div>
          )}

          <p className="text-center text-navy-500 mt-6">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <Link to="/register" className="text-turquoise-600 font-semibold hover:text-turquoise-700">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link to="/login" className="text-turquoise-600 font-semibold hover:text-turquoise-700">
                  Sign in
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
