import { useEffect, useState } from 'react';
import { Calendar, Search, Plane, MapPin, Building2, User2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, Spinner, StatusBadge, PageHeader, EmptyState } from '@/components/ui';
import type { Booking } from '@/types';

export function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    supabase
      .from('bookings')
      .select('*, business:businesses(*), traveler:profiles!traveler_user_id(*)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setBookings(data as Booking[] || []);
        setLoading(false);
      });
  }, []);

  const filtered = bookings.filter((b) => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (b.booking_reference || '').toLowerCase().includes(q) ||
        (b.origin || '').toLowerCase().includes(q) ||
        (b.destination || '').toLowerCase().includes(q) ||
        (b.business?.business_name || '').toLowerCase().includes(q) ||
        (b.traveler?.full_name || '').toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) return <DashboardLayout><div className="flex items-center justify-center py-20"><Spinner size={32} /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader title="All Bookings" subtitle="Monitor all travel bookings across the platform" />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
          <input className="input pl-11" placeholder="Search bookings..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input py-2.5 max-w-[180px]" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={Calendar} title="No bookings found" /></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((b) => (
            <Card key={b.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-navy-100 to-navy-200 flex items-center justify-center flex-shrink-0">
                  <Plane size={18} className="text-navy-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-navy-900">{b.origin || '—'} → {b.destination || '—'}</p>
                  <div className="flex items-center gap-3 text-xs text-navy-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1"><Building2 size={12} />{b.business?.business_name || '—'}</span>
                    <span className="flex items-center gap-1"><User2 size={12} />{b.traveler?.full_name || '—'}</span>
                    <span className="flex items-center gap-1"><MapPin size={12} />{b.service_type.replace('_', ' ')}</span>
                    <span className="flex items-center gap-1"><Calendar size={12} />{b.start_date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-mono text-xs text-turquoise-600">{b.booking_reference}</span>
                  <StatusBadge status={b.status} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
