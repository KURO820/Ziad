import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ScanLine, Calendar, ShieldCheck, AlertTriangle, ArrowRight, TrendingUp, Clock, Building2, Plane } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard, Card, EmptyState, StatusBadge, Spinner } from '@/components/ui';
import type { Business, Booking, Verification, MismatchReport } from '@/types';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, CartesianGrid,
} from 'recharts';

export function BusinessDashboard() {
  const { profile } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [reports, setReports] = useState<MismatchReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: bizData } = await supabase.from('businesses').select('*').eq('user_id', profile.id).maybeSingle();
      setBusiness(bizData as Business | null);

      if (bizData) {
        const [bkRes, verRes, repRes] = await Promise.all([
          supabase.from('bookings').select('*').eq('business_id', bizData.id).order('created_at', { ascending: false }).limit(5),
          supabase.from('verifications').select('*').eq('business_id', bizData.id).order('created_at', { ascending: false }).limit(10),
          supabase.from('mismatch_reports').select('*').eq('business_id', bizData.id).order('created_at', { ascending: false }).limit(5),
        ]);
        setBookings(bkRes.data as Booking[] || []);
        setVerifications(verRes.data as Verification[] || []);
        setReports(repRes.data as MismatchReport[] || []);
      }
      setLoading(false);
    })();
  }, [profile]);

  if (loading) return <DashboardLayout><div className="flex items-center justify-center py-20"><Spinner size={32} /></div></DashboardLayout>;

  if (!business) {
    return (
      <DashboardLayout>
        <Card>
          <EmptyState
            icon={Building2}
            title="Complete your business profile"
            description="Set up your business details to start verifying travelers and creating bookings."
            action={<Link to="/business/settings" className="btn-primary"><Building2 size={18} />Set Up Business</Link>}
          />
        </Card>
      </DashboardLayout>
    );
  }

  // Build chart data from verifications (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const verificationChart = last7Days.map(date => ({
    date: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
    verifications: verifications.filter(v => v.created_at.split('T')[0] === date).length,
  }));

  const resultPie = [
    { name: 'Verified', value: verifications.filter(v => v.result === 'verified').length, color: '#319795' },
    { name: 'Mismatch', value: verifications.filter(v => v.result === 'mismatch').length, color: '#ef4444' },
    { name: 'Not Found', value: verifications.filter(v => v.result === 'not_found').length, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const bookingTypeData = ['flight', 'hotel', 'car_rental', 'tour', 'cruise', 'other'].map(type => ({
    type: type.replace('_', ' '),
    count: bookings.filter(b => b.service_type === type).length,
  })).filter(d => d.count > 0);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900">{business.business_name}</h1>
        <p className="text-navy-500 mt-1 capitalize">{business.business_type.replace('_', ' ')} • {business.city}, {business.country}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Bookings" value={bookings.length} icon={Calendar} color="blue" />
        <StatCard label="Verifications" value={verifications.length} icon={ShieldCheck} color="turquoise" />
        <StatCard label="Open Reports" value={reports.filter(r => r.status === 'open').length} icon={AlertTriangle} color="accent" />
        <StatCard label="Verified Rate" value={verifications.length > 0 ? `${Math.round(verifications.filter(v => v.result === 'verified').length / verifications.length * 100)}%` : '—'} icon={TrendingUp} color="navy" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Verification trend */}
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-bold text-navy-900 mb-4">Verification Activity (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={verificationChart}>
              <defs>
                <linearGradient id="verifGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#319795" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#319795" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="date" stroke="#9fb3c8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9fb3c8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #d9e2ec', fontSize: 13 }} />
              <Area type="monotone" dataKey="verifications" stroke="#319795" strokeWidth={2} fill="url(#verifGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Result pie */}
        <Card>
          <h2 className="text-lg font-bold text-navy-900 mb-4">Verification Results</h2>
          {resultPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={resultPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4}>
                  {resultPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #d9e2ec', fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-navy-400 text-sm">No data yet</div>
          )}
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {resultPie.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                <span className="text-navy-600">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent bookings */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-navy-900">Recent Bookings</h2>
            <Link to="/business/bookings" className="text-sm text-turquoise-600 font-medium hover:text-turquoise-700">View all</Link>
          </div>
          {bookings.length === 0 ? (
            <EmptyState icon={Calendar} title="No bookings yet" description="Create your first booking for a traveler." />
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border border-navy-100">
                  <Plane size={16} className="text-navy-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-900 truncate">{b.origin || '—'} → {b.destination || '—'}</p>
                    <p className="text-xs text-navy-400 font-mono">{b.booking_reference}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          )}
          <Link to="/business/bookings" className="btn-secondary w-full mt-4">
            Manage Bookings
            <ArrowRight size={16} />
          </Link>
        </Card>

        {/* Recent verifications */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-navy-900">Recent Verifications</h2>
            <Link to="/business/scan" className="text-sm text-turquoise-600 font-medium hover:text-turquoise-700">Scan now</Link>
          </div>
          {verifications.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No verifications yet" description="Scan a traveler's QR code to verify their identity." />
          ) : (
            <div className="space-y-3">
              {verifications.slice(0, 5).map((v) => (
                <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl border border-navy-100">
                  <ShieldCheck size={16} className="text-navy-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-900 truncate">Verification #{v.id.slice(0, 8)}</p>
                    <p className="text-xs text-navy-400 flex items-center gap-1"><Clock size={10} />{new Date(v.created_at).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={v.result} />
                </div>
              ))}
            </div>
          )}
          <Link to="/business/scan" className="btn-primary w-full mt-4">
            <ScanLine size={16} />
            Scan & Verify
          </Link>
        </Card>
      </div>

      {/* Booking type breakdown */}
      {bookingTypeData.length > 0 && (
        <Card className="mt-6">
          <h2 className="text-lg font-bold text-navy-900 mb-4">Bookings by Service Type</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bookingTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="type" stroke="#9fb3c8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9fb3c8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #d9e2ec', fontSize: 13 }} />
              <Bar dataKey="count" fill="#319795" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </DashboardLayout>
  );
}
