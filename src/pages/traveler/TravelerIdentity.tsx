import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IdCard, ScanLine, Edit3, Download, ShieldCheck, Calendar, Globe2, User2, FileText, Save, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, EmptyState, StatusBadge, Spinner, Modal, Toast } from '@/components/ui';
import { QRCodeCard } from '@/components/QRCodeCard';
import type { Identity } from '@/types';

export function TravelerIdentity() {
  const { profile } = useAuth();
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState<Partial<Identity>>({});

  useEffect(() => {
    if (!profile) return;
    supabase.from('identities').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).maybeSingle()
      .then(({ data }) => {
        setIdentity(data as Identity | null);
        if (data) setForm(data as Identity);
        setLoading(false);
      });
  }, [profile]);

  const handleSave = async () => {
    if (!identity || !profile) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('identities')
      .update({
        full_name: form.full_name,
        nationality: form.nationality,
        passport_number: form.passport_number,
        passport_type: form.passport_type,
        date_of_birth: form.date_of_birth,
        gender: form.gender,
        place_of_birth: form.place_of_birth,
        issue_date: form.issue_date,
        expiry_date: form.expiry_date,
        issuing_country: form.issuing_country,
        updated_at: new Date().toISOString(),
      })
      .eq('id', identity.id)
      .select()
      .maybeSingle();

    if (error) {
      setToast({ message: error.message, type: 'error' });
    } else if (data) {
      setIdentity(data as Identity);
      setToast({ message: 'Identity updated successfully', type: 'success' });
      setEditing(false);
    }
    setSaving(false);
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center py-20"><Spinner size={32} /></div></DashboardLayout>;

  if (!identity) {
    return (
      <DashboardLayout>
        <Card>
          <EmptyState
            icon={IdCard}
            title="No digital identity yet"
            description="Scan your passport to create your digital travel identity card with a unique QR code for verification."
            action={
              <Link to="/traveler/scan" className="btn-primary">
                <ScanLine size={18} />
                Scan Your Passport
              </Link>
            }
          />
        </Card>
      </DashboardLayout>
    );
  }

  const fields = [
    { label: 'Full Name', key: 'full_name', icon: User2 },
    { label: 'Nationality', key: 'nationality', icon: Globe2 },
    { label: 'Passport Number', key: 'passport_number', icon: FileText },
    { label: 'Passport Type', key: 'passport_type', icon: FileText },
    { label: 'Date of Birth', key: 'date_of_birth', icon: Calendar },
    { label: 'Gender', key: 'gender', icon: User2 },
    { label: 'Place of Birth', key: 'place_of_birth', icon: Globe2 },
    { label: 'Issue Date', key: 'issue_date', icon: Calendar },
    { label: 'Expiry Date', key: 'expiry_date', icon: Calendar },
    { label: 'Issuing Country', key: 'issuing_country', icon: Globe2 },
  ];

  return (
    <DashboardLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">My Digital Identity</h1>
          <p className="text-navy-500 mt-1">Your secure digital travel identity card</p>
        </div>
        <button onClick={() => { setForm(identity); setEditing(true); }} className="btn-secondary">
          <Edit3 size={16} />
          Edit Identity
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Digital ID Card */}
        <div className="lg:col-span-1">
          <div className="card overflow-hidden sticky top-24">
            <div className="bg-gradient-to-br from-navy-800 via-navy-900 to-navy-950 p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-turquoise-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-turquoise-400/10 rounded-full blur-2xl" />

              <div className="relative">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-turquoise-400 font-medium tracking-wider uppercase">ST&ID</p>
                    <p className="text-[10px] text-navy-400 mt-0.5">Digital Travel Identity</p>
                  </div>
                  <ShieldCheck size={24} className="text-turquoise-400" />
                </div>

                <div className="flex items-center justify-center my-6">
                  <QRCodeCard token={identity.qr_token} size={170} />
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-[10px] text-navy-400 uppercase tracking-wider">Name</p>
                    <p className="font-bold text-lg">{identity.full_name}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-navy-400 uppercase tracking-wider">Nationality</p>
                      <p className="text-sm font-medium">{identity.nationality}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-navy-400 uppercase tracking-wider">Passport No.</p>
                      <p className="text-sm font-mono text-turquoise-300">{identity.passport_number}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 flex items-center justify-between">
              <StatusBadge status={identity.status} />
              {identity.verified && <span className="badge-success"><ShieldCheck size={12} />Verified</span>}
            </div>
          </div>
        </div>

        {/* Identity Details */}
        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-lg font-bold text-navy-900 mb-6">Identity Details</h2>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
              {fields.map((field) => (
                <div key={field.key} className="flex items-start gap-3 pb-4 border-b border-navy-50">
                  <div className="w-9 h-9 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0">
                    <field.icon size={16} className="text-navy-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-navy-400 font-medium">{field.label}</p>
                    <p className="text-sm text-navy-900 font-medium mt-0.5 truncate">
                      {(identity as unknown as Record<string, string | null>)[field.key] || '—'}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-navy-100 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 text-sm text-navy-400">
                <p>Created: {new Date(identity.created_at).toLocaleDateString()}</p>
                <p>Last updated: {new Date(identity.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={editing} onClose={() => setEditing(false)} title="Edit Identity Information" maxWidth="max-w-2xl">
        <div className="grid sm:grid-cols-2 gap-4">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="label">{field.label}</label>
              <input
                className="input"
                value={((form as unknown as Record<string, string | null>)[field.key] || '') as string}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setEditing(false)} className="btn-secondary">
            <X size={16} />
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <Spinner size={16} /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
