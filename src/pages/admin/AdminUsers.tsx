import { useEffect, useState } from 'react';
import { Users, Search, Shield, Building2, Plane, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, Spinner, StatusBadge, PageHeader, EmptyState, Modal, Toast } from '@/components/ui';
import type { Profile, Business } from '@/types';

export function AdminUsers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [verifyTarget, setVerifyTarget] = useState<Business | null>(null);

  useEffect(() => {
    (async () => {
      const [pRes, bRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('businesses').select('*').order('created_at', { ascending: false }),
      ]);
      setProfiles(pRes.data as Profile[] || []);
      setBusinesses(bRes.data as Business[] || []);
      setLoading(false);
    })();
  }, []);

  const businessMap = new Map(businesses.map(b => [b.user_id, b]));

  const filtered = profiles.filter((p) => {
    if (filter !== 'all' && p.role !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.full_name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    }
    return true;
  });

  const toggleVerify = async (biz: Business) => {
    const { error } = await supabase.from('businesses').update({ verified: !biz.verified }).eq('id', biz.id);
    if (error) {
      setToast({ message: error.message, type: 'error' });
    } else {
      setBusinesses(businesses.map(b => b.id === biz.id ? { ...b, verified: !biz.verified } : b));
      setToast({ message: `Business ${biz.verified ? 'unverified' : 'verified'}`, type: 'success' });
    }
    setVerifyTarget(null);
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center py-20"><Spinner size={32} /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader title="User Management" subtitle="Manage all travelers, businesses, and admins" />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
          <input className="input pl-11" placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input py-2.5 max-w-[180px]" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Roles</option>
          <option value="traveler">Travelers</option>
          <option value="business">Businesses</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-navy-100 flex items-center justify-center"><Users size={18} className="text-navy-500" /></div>
          <div><p className="text-2xl font-bold text-navy-900">{profiles.length}</p><p className="text-xs text-navy-400">Total Users</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-turquoise-50 flex items-center justify-center"><Plane size={18} className="text-turquoise-600" /></div>
          <div><p className="text-2xl font-bold text-navy-900">{profiles.filter(p => p.role === 'traveler').length}</p><p className="text-xs text-navy-400">Travelers</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Building2 size={18} className="text-blue-600" /></div>
          <div><p className="text-2xl font-bold text-navy-900">{profiles.filter(p => p.role === 'business').length}</p><p className="text-xs text-navy-400">Businesses</p></div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center"><Shield size={18} className="text-accent-600" /></div>
          <div><p className="text-2xl font-bold text-navy-900">{profiles.filter(p => p.role === 'admin').length}</p><p className="text-xs text-navy-400">Admins</p></div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={Users} title="No users found" /></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p) => {
            const biz = businessMap.get(p.id);
            const roleIcon = p.role === 'traveler' ? Plane : p.role === 'business' ? Building2 : Shield;
            const RoleIcon = roleIcon;
            return (
              <Card key={p.id} className="p-4 hover:border-turquoise-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    p.role === 'traveler' ? 'bg-turquoise-50 text-turquoise-600' :
                    p.role === 'business' ? 'bg-blue-50 text-blue-600' :
                    'bg-accent-50 text-accent-600'
                  }`}>
                    <RoleIcon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-navy-900 truncate">{p.full_name}</p>
                    <div className="flex items-center gap-3 text-xs text-navy-400 mt-0.5 flex-wrap">
                      <span className="capitalize font-medium">{p.role}</span>
                      <span>Joined {new Date(p.created_at).toLocaleDateString()}</span>
                      {biz && <span>• {biz.business_name} ({biz.city}, {biz.country})</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {biz && (
                      <button
                        onClick={() => setVerifyTarget(biz)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                          biz.verified ? 'bg-turquoise-100 text-turquoise-700 hover:bg-turquoise-200' : 'bg-accent-100 text-accent-700 hover:bg-accent-200'
                        }`}
                      >
                        {biz.verified ? 'Verified' : 'Unverified'}
                      </button>
                    )}
                    <span className="text-xs font-mono text-navy-300">{p.id.slice(0, 8)}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={!!verifyTarget} onClose={() => setVerifyTarget(null)} title="Toggle Business Verification" maxWidth="max-w-md">
        {verifyTarget && (
          <div className="space-y-4">
            <p className="text-navy-600">
              {verifyTarget.verified
                ? `Unverify ${verifyTarget.business_name}? They will lose their verified badge.`
                : `Verify ${verifyTarget.business_name}? This confirms the business is legitimate.`}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setVerifyTarget(null)} className="btn-secondary">Cancel</button>
              <button onClick={() => toggleVerify(verifyTarget)} className={verifyTarget.verified ? 'btn-danger' : 'btn-primary'}>
                {verifyTarget.verified ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                {verifyTarget.verified ? 'Unverify' : 'Verify Business'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
