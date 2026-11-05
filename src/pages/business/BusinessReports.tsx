import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Search, User2, FileText } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, EmptyState, StatusBadge, Spinner, PageHeader } from '@/components/ui';
import type { MismatchReport, Business } from '@/types';

export function BusinessReports() {
  const { profile } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [reports, setReports] = useState<MismatchReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: bizData } = await supabase.from('businesses').select('*').eq('user_id', profile.id).maybeSingle();
      setBusiness(bizData as Business | null);
      if (bizData) {
        const { data } = await supabase
          .from('mismatch_reports')
          .select('*, traveler:profiles!traveler_user_id(*), identity:identities(*)')
          .eq('business_id', bizData.id)
          .order('created_at', { ascending: false });
        setReports(data as MismatchReport[] || []);
      }
      setLoading(false);
    })();
  }, [profile]);

  const filtered = reports.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.report_reason || '').toLowerCase().includes(q) || (r.traveler?.full_name || '').toLowerCase().includes(q);
  });

  if (loading) return <DashboardLayout><div className="flex items-center justify-center py-20"><Spinner size={32} /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader title="Mismatch Reports" subtitle="Identity mismatch reports submitted by your business" />

      <div className="relative mb-6">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
        <input className="input pl-11" placeholder="Search by traveler name or reason..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={AlertTriangle} title="No mismatch reports" description="When you report an identity mismatch during verification, it will appear here." /></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <Card key={r.id} className="p-4 hover:border-turquoise-200 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-accent-50">
                  <AlertTriangle size={20} className="text-accent-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-navy-900">{r.report_reason}</p>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-navy-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1"><User2 size={12} />{r.traveler?.full_name || 'Unknown traveler'}</span>
                    <span className="flex items-center gap-1"><Clock size={12} />{new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    {r.identity && <span className="flex items-center gap-1 font-mono"><FileText size={12} />{r.identity.passport_number}</span>}
                  </div>
                  {r.details && <p className="text-sm text-navy-500 mt-2">{r.details}</p>}
                  {r.admin_notes && (
                    <div className="mt-3 p-3 rounded-xl bg-navy-50 text-sm text-navy-600">
                      <p className="text-xs font-semibold text-navy-400 mb-1">Admin Notes</p>
                      {r.admin_notes}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
