import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { IdCard, ScanLine, Plane, ShieldCheck, Calendar, Clock, ArrowRight, MapPin, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard, Card, EmptyState, StatusBadge, Spinner } from '@/components/ui';
import type { Identity, Booking, Verification } from '@/types';
import { QRCodeCard } from '@/components/QRCodeCard';

export function TravelerDashboard() {
  const { profile } = useAuth();
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const [idRes, bkRes, verRes] = await Promise.all([
        supabase.from('identities').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).maybeSingle(),
        supabase.from('bookings').select('*, business:businesses(*)').eq('traveler_user_id', profile.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('verifications').select('*, business:businesses(*)').eq('traveler_user_id', profile.id).order('created_at', { ascending: false }).limit(5),
      ]);

      if (idRes.data) setIdentity(idRes.data as Identity);
      if (bkRes.data) setBookings(bkRes.data as Booking[]);
      if (verRes.data) setVerifications(verRes.data as Verification[]);
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <DashboardLayout><div className="flex items-center justify-center py-20"><Spinner size={32} /></div></DashboardLayout>;

  const upcomingTrips = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const completedTrips = bookings.filter(b => b.status === 'completed');

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900">Welcome, {profile?.full_name}</h1>
        <p className="text-navy-500 mt-1">Manage your digital travel identity and trips</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Identity Status" value={identity ? (identity.verified ? 'Verified' : 'Pending') : 'None'} icon={IdCard} color={identity?.verified ? 'turquoise' : 'accent'} />
        <StatCard label="Upcoming Trips" value={upcomingTrips.length} icon={Plane} color="blue" />
        <StatCard label="Completed Trips" value={completedTrips.length} icon={CheckCircle2} color="navy" />
        <StatCard label="Times Verified" value={verifications.length} icon={ShieldCheck} color="turquoise" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Identity card */}
        <div className="lg:col-span-1">
          {identity ? (
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-navy-800 to-navy-950 -m-6 mb-0 p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-turquoise-500/20 rounded-full blur-3xl" />
                <div className="relative flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs text-turquoise-400 font-medium tracking-wider uppercase">Digital Identity</p>
                    <p className="text-lg font-bold mt-1">{identity.full_name}</p>
                  </div>
                  <StatusBadge status={identity.status} />
                </div>
                <div className="relative space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-navy-400">Nationality</span>
                    <span className="font-medium">{identity.nationality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-400">Passport</span>
                    <span className="font-mono text-turquoise-300">{identity.passport_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-navy-400">Expires</span>
                    <span className="font-medium">{identity.expiry_date || 'N/A'}</span>
                  </div>
                </div>
              </div>
              <div className="p-6 pt-4">
                <QRCodeCard token={identity.qr_token} size={160} />
                <Link to="/traveler/identity" className="btn-secondary w-full mt-4">
                  View Full Identity
                  <ArrowRight size={16} />
                </Link>
              </div>
            </Card>
          ) : (
            <Card>
              <EmptyState
                icon={IdCard}
                title="No identity yet"
                description="Scan your passport to create your digital travel identity card."
                action={
                  <Link to="/traveler/scan" className="btn-primary">
                    <ScanLine size={18} />
                    Scan Passport
                  </Link>
                }
              />
            </Card>
          )}
        </div>

        {/* Upcoming trips */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-navy-900">Upcoming Trips</h2>
              <Link to="/traveler/trips" className="text-sm text-turquoise-600 font-medium hover:text-turquoise-700">View all</Link>
            </div>
            {upcomingTrips.length === 0 ? (
              <EmptyState icon={Plane} title="No upcoming trips" description="Your booked trips will appear here." />
            ) : (
              <div className="space-y-3">
                {upcomingTrips.map((trip) => (
                  <div key={trip.id} className="flex items-center gap-4 p-4 rounded-xl border border-navy-100 hover:border-turquoise-200 hover:bg-turquoise-50/30 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-navy-100 flex items-center justify-center flex-shrink-0">
                      <Plane size={18} className="text-navy-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-navy-900 truncate">
                        {trip.origin || '—'} → {trip.destination || '—'}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-navy-400 mt-1">
                        <span className="flex items-center gap-1"><Calendar size={12} />{trip.start_date}</span>
                        <span className="capitalize">{trip.service_type.replace('_', ' ')}</span>
                        <span className="font-mono">{trip.booking_reference}</span>
                      </div>
                    </div>
                    <StatusBadge status={trip.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent verifications */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-navy-900">Recent Verifications</h2>
              <Link to="/traveler/verifications" className="text-sm text-turquoise-600 font-medium hover:text-turquoise-700">View all</Link>
            </div>
            {verifications.length === 0 ? (
              <EmptyState icon={ShieldCheck} title="No verifications yet" description="When a business scans your QR code, the record will appear here." />
            ) : (
              <div className="space-y-3">
                {verifications.map((v) => (
                  <div key={v.id} className="flex items-center gap-4 p-3 rounded-xl border border-navy-100">
                    <div className="w-9 h-9 rounded-lg bg-turquoise-50 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck size={16} className="text-turquoise-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy-900 truncate">
                        {v.business?.business_name || 'Unknown business'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-navy-400 mt-0.5">
                        <Clock size={12} />
                        {new Date(v.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <StatusBadge status={v.result} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
