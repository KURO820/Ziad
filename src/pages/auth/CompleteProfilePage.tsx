import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Building2, Shield, User, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';
import type { UserRole } from '@/types';

export function CompleteProfilePage() {
  const { completeProfile, session } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('traveler');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2) {
      setError('Please enter your full name');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await completeProfile(role, fullName.trim());
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  const emailOrPhone = session?.user?.email || session?.user?.phone || session?.user?.user_metadata?.full_name || 'your account';

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-50 p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <div className="card p-8 animate-scale-in">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-navy-900">Complete Your Profile</h2>
            <p className="text-navy-500 mt-2">
              You're signed in as <span className="font-medium text-navy-700">{emailOrPhone}</span>. Tell us a bit more to finish setting up your account.
            </p>
          </div>

          <form onSubmit={handleComplete} className="space-y-5">
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
                  defaultValue={session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || ''}
                  required
                />
              </div>
            </div>

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
                  Complete Setup
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
