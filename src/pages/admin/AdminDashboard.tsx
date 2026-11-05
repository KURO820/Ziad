import { useEffect, useState } from 'react';
import { Users, Calendar, ShieldCheck, AlertTriangle, Building2, Plane, TrendingUp, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard, Card, Spinner, StatusBadge, EmptyState } from '@/components/ui';
import type { Profile, Business, Booking, Verification, MismatchReport } from '@/types';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';

export function AdminDashboard() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [reports, setReports] = useState<MismatchReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [pRes, bRes, bkRes, vRes, rRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('businesses').select('*').order('created_at', { ascending: false }),
        supabase.from('bookings').select('*, business:businesses(*), traveler:profiles!traveler_user_id(*)').order('created_at', { ascending: false }).limit(10),
        supabase.from('verifications').select('*, business:businesses(*)').order('created_at', { ascending: false }).limit(10),
        supabase.from('mismatch_reports').select('*, business:businesses(*), traveler:profiles!traveler_user_id(*)').order('created_at', { ascending: false }).limit(10),
      ]);

      setProfiles(pRes.data as Profile[] || []);
      setBusinesses(bRes.data as Business[] || []);
      setBookings(bkRes.data as Booking[] || []);
      setVerifications(vRes.data as Verification[] || []);
      setReports(rRes.data as MismatchReport[] || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <DashboardLayout><div className="flex items-center justify-center py-20"><Spinner size={32} /></div></DashboardLayout>;

  const travelers = profiles.filter(p => p.role === 'traveler');
  const businessUsers = profiles.filter(p => p.role === 'business');
  const admins = profiles.filter(p => p.role === 'admin');
  const openReports = reports.filter(r => r.status === 'open');

  // Activity chart - last 14 days
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().split('T')[0];
  });
  const activityChart = last14Days.map(date => ({
    date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    verifications: verifications.filter(v => v.created_at.split('T')[0] === date).length,
    bookings: bookings.filter(b => b.created_at.split('T')[0] === date).length,
  }));

  const rolePie = [
    { name: 'Travelers', value: travelers.length, color: '#319795' },
    { name: 'Businesses', value: businessUsers.length, color: '#102a43' },
    { name: 'Admins', value: admins.length, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900">Platform Overview</h1>
        <p className="text-navy-500 mt-1">Monitor and manage the entire ST&ID platform</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={profiles.length} icon={Users} color="navy" />
        <StatCard label="Businesses" value={businesses.length} icon={Building2} color="turquoise" />
        <StatCard label="Total Bookings" value={bookings.length} icon={Calendar} color="blue" />
        <StatCard label="Open Reports" value={openReports.length} icon={AlertTriangle} color={openReports.length > 0 ? 'accent' : 'navy'} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Travelers" value={travelers.length} icon={Plane} color="turquoise" />
        <StatCard label="Verifications" value={verifications.length} icon={ShieldCheck} color="navy" />
        <StatCard label="Mismatch Reports" value={reports.length} icon={AlertTriangle} color="accent" />
        <StatCard label="Growth" value="Active" icon={TrendingUp} color="blue" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Activity chart */}
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-bold text-navy-900 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-turquoise-600" />
            Platform Activity (Last 14 Days)
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={activityChart}>
              <defs>
                <linearGradient id="verifGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#319795" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#319795" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bookGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#102a43" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#102a43" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="date" stroke="#9fb3c8" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#9fb3c8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #d9e2ec', fontSize: 13 }} />
              <Area type="monotone" dataKey="verifications" stroke="#319795" strokeWidth={2} fill="url(#verifGrad2)" />
              <Area type="monotone" dataKey="bookings" stroke="#102a43" strokeWidth={2} fill="url(#bookGrad)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-2">
            <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded-full bg-turquoise-600" /><span className="text-navy-600">Verifications</span></div>
            <div className="flex items-center gap-1.5 text-xs"><div className="w-3 h-3 rounded-full bg-navy-900" /><span className="text-navy-600">Bookings</span></div>
          </div>
        </Card>

        {/* Role distribution */}
        <Card>
          <h2 className="text-lg font-bold text-navy-900 mb-4">User Distribution</h2>
          {rolePie.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={rolePie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4}>
                  {rolePie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #d9e2ec', fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[260px] flex items-center justify-center text-navy-400 text-sm">No users yet</div>
          )}
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {rolePie.map((d) => (
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
          <h2 className="text-lg font-bold text-navy-900 mb-4">Recent Bookings</h2>
          {bookings.length === 0 ? (
            <EmptyState icon={Calendar} title="No bookings" />
          ) : (
            <div className="space-y-3">
              {bookings.slice(0, 6).map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border border-navy-100">
                  <Plane size={16} className="text-navy-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-900 truncate">{b.origin || '—'} → {b.destination || '—'}</p>
                    <p className="text-xs text-navy-400 truncate">{b.business?.business_name} • {b.traveler?.full_name}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Open reports */}
        <Card>
          <h2 className="text-lg font-bold text-navy-900 mb-4">Open Mismatch Reports</h2>
          {openReports.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No open reports" description="All mismatch reports are resolved." />
          ) : (
            <div className="space-y-3">
              {openReports.slice(0, 6).map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-navy-100">
                  <AlertTriangle size={16} className="text-accent-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-900 truncate">{r.report_reason}</p>
                    <p className="text-xs text-navy-400 truncate">{r.traveler?.full_name} • {r.business?.business_name}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
