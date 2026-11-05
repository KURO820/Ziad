import { useEffect, useState } from 'react';
import { AlertTriangle, Search, User2, Building2, Clock, FileText, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, Spinner, StatusBadge, PageHeader, EmptyState, Modal, Toast } from '@/components/ui';
import type { MismatchReport } from '@/types';

export function AdminReports() {
  const [reports, setReports] = useState<MismatchReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editTarget, setEditTarget] = useState<MismatchReport | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState<string>('open');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('mismatch_reports')
      .select('*, business:businesses(*), traveler:profiles!traveler_user_id(*), identity:identities(*)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setReports(data as MismatchReport[] || []);
        setLoading(false);
      });
  }, []);

  const filtered = reports.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (r.report_reason || '').toLowerCase().includes(q) ||
        (r.traveler?.full_name || '').toLowerCase().includes(q) ||
        (r.business?.business_name || '').toLowerCase().includes(q);
    }
    return true;
  });

  const openEdit = (report: MismatchReport) => {
    setEditTarget(report);
    setAdminNotes(report.admin_notes || '');
    setNewStatus(report.status);
  };

  const handleSave = async () => {
    if (!editTarget) return;
    setSaving(true);
    const { error } = await supabase
      .from('mismatch_reports')
      .update({
        status: newStatus,
        admin_notes: adminNotes,
        resolved_at: newStatus === 'resolved' || newStatus === 'dismissed' ? new Date().toISOString() : null,
      })
      .eq('id', editTarget.id);

    if (error) {
      setToast({ message: error.message, type: 'error' });
    } else {
      setReports(reports.map(r => r.id === editTarget.id ? { ...r, status: newStatus as MismatchReport['status'], admin_notes: adminNotes } : r));
      setToast({ message: 'Report updated', type: 'success' });
      setEditTarget(null);
    }
    setSaving(false);
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center py-20"><Spinner size={32} /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader title="Mismatch Reports" subtitle="Review and resolve identity mismatch reports from businesses" />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
          <input className="input pl-11" placeholder="Search reports..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input py-2.5 max-w-[180px]" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={AlertTriangle} title="No mismatch reports" description="No reports match your filters." /></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <Card key={r.id} className="p-4 hover:border-turquoise-200 transition-all cursor-pointer" >
              <div className="flex items-start gap-4" onClick={() => openEdit(r)}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  r.status === 'open' ? 'bg-accent-50' : r.status === 'resolved' ? 'bg-turquoise-50' : r.status === 'dismissed' ? 'bg-navy-50' : 'bg-blue-50'
                }`}>
                  <AlertTriangle size={20} className={
                    r.status === 'open' ? 'text-accent-600' : r.status === 'resolved' ? 'text-turquoise-600' : r.status === 'dismissed' ? 'text-navy-400' : 'text-blue-600'
                  } />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-navy-900">{r.report_reason}</p>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-navy-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1"><User2 size={12} />{r.traveler?.full_name || 'Unknown'}</span>
                    <span className="flex items-center gap-1"><Building2 size={12} />{r.business?.business_name || 'Unknown'}</span>
                    <span className="flex items-center gap-1"><Clock size={12} />{new Date(r.created_at).toLocaleDateString()}</span>
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

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Manage Report" maxWidth="max-w-md">
        {editTarget && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-navy-400">Report Reason</p>
              <p className="font-semibold text-navy-900">{editTarget.report_reason}</p>
            </div>
            {editTarget.details && (
              <div>
                <p className="text-sm text-navy-400">Details</p>
                <p className="text-sm text-navy-600">{editTarget.details}</p>
              </div>
            )}
            <div>
              <label className="label">Status</label>
              <select className="input" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>
            <div>
              <label className="label">Admin Notes</label>
              <textarea className="input min-h-[100px] resize-y" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Add investigation notes..." />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setEditTarget(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
