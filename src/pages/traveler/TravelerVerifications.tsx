import { useEffect, useState } from 'react';
import { ShieldCheck, Clock, Building2, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, EmptyState, StatusBadge, Spinner, PageHeader } from '@/components/ui';
import type { Verification } from '@/types';

export function TravelerVerifications() {
  const { profile } = useAuth();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('verifications')
      .select('*, business:businesses(*), identity:identities(*)')
      .eq('traveler_user_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setVerifications(data as Verification[]);
        setLoading(false);
      });
  }, [profile]);

  const filtered = verifications.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (v.business?.business_name || '').toLowerCase().includes(q) || v.result.toLowerCase().includes(q);
  });

  if (loading) return <DashboardLayout><div className="flex items-center justify-center py-20"><Spinner size={32} /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader title="Verification History" subtitle="Every time a business scans your QR code, it's recorded here" />

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
        <input
          className="input pl-11"
          placeholder="Search by business name or result..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={ShieldCheck} title="No verification records" description="When a travel business scans your identity QR code, the verification will appear here." />
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((v) => (
            <Card key={v.id} className="p-4 hover:border-turquoise-200 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  v.result === 'verified' ? 'bg-turquoise-50' : v.result === 'mismatch' ? 'bg-red-50' : 'bg-accent-50'
                }`}>
                  <ShieldCheck size={20} className={
                    v.result === 'verified' ? 'text-turquoise-600' : v.result === 'mismatch' ? 'text-red-600' : 'text-accent-600'
                  } />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy-900 truncate">
                    {v.business?.business_name || 'Unknown business'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-navy-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Building2 size={12} />
                      {v.business?.business_type.replace('_', ' ') || 'Business'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(v.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {v.notes && <p className="text-xs text-navy-400 mt-1.5">{v.notes}</p>}
                </div>
                <StatusBadge status={v.result} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
