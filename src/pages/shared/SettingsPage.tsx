import { useState } from 'react';
import { User, Mail, Phone, Save, Shield, Bell, Globe2, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, Spinner, Toast } from '@/components/ui';

export function SettingsPage({ role }: { role: 'traveler' | 'business' | 'admin' }) {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone })
      .eq('id', profile.id);

    if (error) {
      setToast({ message: error.message, type: 'error' });
    } else {
      await refreshProfile();
      setToast({ message: 'Profile updated successfully', type: 'success' });
    }
    setSaving(false);
  };

  return (
    <DashboardLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Settings</h1>
        <p className="text-navy-500 mt-1">Manage your account preferences</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Profile */}
          <Card>
            <h2 className="text-lg font-bold text-navy-900 mb-6">Profile Information</h2>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-navy-700 to-navy-900 flex items-center justify-center text-white text-xl font-bold">
                {fullName.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <p className="font-semibold text-navy-900">{fullName || 'Your name'}</p>
                <p className="text-sm text-navy-400 capitalize">{role} account</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
                  <input className="input pl-11" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
                  <input className="input pl-11" value={profile?.id ? '' : ''} disabled placeholder={sessionEmail(profile?.id || '')} />
                </div>
              </div>
              <div>
                <label className="label">Phone Number</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
                  <input className="input pl-11" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
                </div>
              </div>
              <div>
                <label className="label">Account Type</label>
                <div className="relative">
                  <Shield size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
                  <input className="input pl-11 capitalize" value={role} disabled />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? <Spinner size={16} /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          </Card>

          {/* Privacy */}
          <Card>
            <h2 className="text-lg font-bold text-navy-900 mb-4">Privacy & Security</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-navy-50">
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-turquoise-600" />
                  <div>
                    <p className="text-sm font-medium text-navy-900">Identity Verification Status</p>
                    <p className="text-xs text-navy-400">Your identity is protected by row-level security</p>
                  </div>
                </div>
                <span className="badge-success">Protected</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-navy-50">
                <div className="flex items-center gap-3">
                  <Globe2 size={18} className="text-navy-500" />
                  <div>
                    <p className="text-sm font-medium text-navy-900">Data Encryption</p>
                    <p className="text-xs text-navy-400">All passport data is encrypted at rest</p>
                  </div>
                </div>
                <span className="badge-success">Enabled</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Notifications sidebar */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-bold text-navy-900 mb-4">Notifications</h2>
            <div className="space-y-3">
              {[
                { label: 'Verification alerts', desc: 'When your ID is scanned' },
                { label: 'Booking updates', desc: 'New or updated bookings' },
                { label: 'Security alerts', desc: 'Account security events' },
              ].map((item) => (
                <label key={item.label} className="flex items-center justify-between p-3 rounded-xl hover:bg-navy-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Bell size={16} className="text-navy-400" />
                    <div>
                      <p className="text-sm font-medium text-navy-900">{item.label}</p>
                      <p className="text-xs text-navy-400">{item.desc}</p>
                    </div>
                  </div>
                  <div className="relative w-10 h-6 bg-turquoise-500 rounded-full">
                    <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow-sm" />
                  </div>
                </label>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-bold text-navy-900 mb-4">Account Info</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-navy-400">Member since</span>
                <span className="font-medium text-navy-700">
                  {profile ? new Date(profile.created_at).toLocaleDateString() : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-navy-400">User ID</span>
                <span className="font-mono text-xs text-navy-500">{profile?.id.slice(0, 8)}...</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function sessionEmail(_id: string): string {
  return 'Email from your login session';
}
