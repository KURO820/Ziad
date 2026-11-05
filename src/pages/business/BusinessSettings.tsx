import { useEffect, useState } from 'react';
import { Building2, Save, MapPin, Globe2, Briefcase, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, Spinner, Toast, StatusBadge } from '@/components/ui';
import type { Business, BusinessType } from '@/types';

export function BusinessSettings() {
  const { profile } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('hotel');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (!profile) return;
    supabase.from('businesses').select('*').eq('user_id', profile.id).maybeSingle().then(({ data }) => {
      const b = data as Business | null;
      setBusiness(b);
      if (b) {
        setBusinessName(b.business_name);
        setBusinessType(b.business_type);
        setCountry(b.country);
        setCity(b.city);
        setAddress(b.address || '');
      }
      setLoading(false);
    });
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);

    if (business) {
      const { error } = await supabase
        .from('businesses')
        .update({ business_name: businessName, business_type: businessType, country, city, address })
        .eq('id', business.id);
      if (error) {
        setToast({ message: error.message, type: 'error' });
      } else {
        setToast({ message: 'Business profile updated', type: 'success' });
      }
    } else {
      const { data, error } = await supabase
        .from('businesses')
        .insert({
          user_id: profile.id,
          business_name: businessName,
          business_type: businessType,
          country,
          city,
          address,
        })
        .select()
        .maybeSingle();
      if (error) {
        setToast({ message: error.message, type: 'error' });
      } else {
        setBusiness(data as Business);
        setToast({ message: 'Business profile created', type: 'success' });
      }
    }
    setSaving(false);
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center py-20"><Spinner size={32} /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900">Business Settings</h1>
        <p className="text-navy-500 mt-1">Manage your business profile and details</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-navy-100">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-turquoise-500 to-turquoise-700 flex items-center justify-center text-white">
                <Building2 size={28} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-navy-900">{business ? business.business_name : 'New Business Profile'}</h2>
                {business && (
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={business.verified ? 'verified' : 'pending'} />
                    <span className="text-sm text-navy-400 capitalize">{business.business_type.replace('_', ' ')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Business Name</label>
                <div className="relative">
                  <Building2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
                  <input className="input pl-11" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Skyline Hotels" />
                </div>
              </div>
              <div>
                <label className="label">Business Type</label>
                <div className="relative">
                  <Briefcase size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
                  <select className="input pl-11" value={businessType} onChange={(e) => setBusinessType(e.target.value as BusinessType)}>
                    <option value="hotel">Hotel</option>
                    <option value="airline">Airline</option>
                    <option value="car_rental">Car Rental</option>
                    <option value="tour_operator">Tour Operator</option>
                    <option value="cruise">Cruise</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Country</label>
                <div className="relative">
                  <Globe2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
                  <input className="input pl-11" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. France" />
                </div>
              </div>
              <div>
                <label className="label">City</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
                  <input className="input pl-11" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Paris" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Address (optional)</label>
                <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full business address" />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button onClick={handleSave} disabled={saving || !businessName || !country || !city} className="btn-primary">
                {saving ? <Spinner size={16} /> : <Save size={16} />}
                {business ? 'Save Changes' : 'Create Profile'}
              </button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-bold text-navy-900 mb-4">Verification Status</h2>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-navy-50">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-navy-900">Business Verified</p>
                  <StatusBadge status={business?.verified ? 'verified' : 'pending'} />
                </div>
                <p className="text-xs text-navy-400 mt-2">
                  {business?.verified
                    ? 'Your business is verified and can fully use the platform.'
                    : 'Verification is pending. You can still use core features.'}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-bold text-navy-900 mb-4">Account Info</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-navy-400">Member since</span>
                <span className="font-medium text-navy-700">
                  {business ? new Date(business.created_at).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
