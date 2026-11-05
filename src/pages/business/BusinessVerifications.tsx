import { useEffect, useState } from 'react';
import { ShieldCheck, Clock, Search, User2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, EmptyState, StatusBadge, Spinner, PageHeader } from '@/components/ui';
import type { Verification, Business } from '@/types';

export function BusinessVerifications() {
  const { profile } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: bizData } = await supabase.from('businesses').select('*').eq('user_id', profile.id).maybeSingle();
      setBusiness(bizData as Business | null);
      if (bizData) {
        const { data } = await supabase
          .from('verifications')
          .select('*, traveler:profiles!traveler_user_id(*), identity:identities(*)')
          .eq('business_id', bizData.id)
          .order('created_at', { ascending: false });
        setVerifications(data as Verification[] || []);
      }
      setLoading(false);
    })();
  }, [profile]);

  const filtered = verifications.filter((v) => {
    if (filter !== 'all' && v.result !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (v.traveler?.full_name || '').toLowerCase().includes(q) || v.result.toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) return <DashboardLayout><div className="flex items-center justify-center py-20"><Spinner size={32} /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader title="Verification History" subtitle="All identity verifications performed by your business" />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
          <input className="input pl-11" placeholder="Search by traveler name or result..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input py-2.5 max-w-[180px]" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Results</option>
          <option value="verified">Verified</option>
          <option value="mismatch">Mismatch</option>
          <option value="not_found">Not Found</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={ShieldCheck} title="No verifications yet" description="Scan a traveler's QR code to start verifying identities." /></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((v) => (
            <Card key={v.id} className="p-4 hover:border-turquoise-200 transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  v.result === 'verified' ? 'bg-turquoise-50' : v.result === 'mismatch' ? 'bg-red-50' : 'bg-accent-50'
                }`}>
                  <ShieldCheck size={20} className={v.result === 'verified' ? 'text-turquoise-600' : v.result === 'mismatch' ? 'text-red-600' : 'text-accent-600'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy-900 truncate flex items-center gap-2">
                    <User2 size={14} className="text-navy-400" />
                    {v.traveler?.full_name || 'Unknown traveler'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-navy-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1"><Clock size={12} />{new Date(v.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    {v.identity && <span className="font-mono">Passport: {v.identity.passport_number}</span>}
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
