import { useEffect, useState } from 'react';
import { Plane, Calendar, MapPin, Building2, Filter, Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, EmptyState, StatusBadge, Spinner, PageHeader } from '@/components/ui';
import type { Booking } from '@/types';

export function TravelerTrips() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('bookings')
      .select('*, business:businesses(*), identity:identities(*)')
      .eq('traveler_user_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setBookings(data as Booking[]);
        setLoading(false);
      });
  }, [profile]);

  const filtered = bookings.filter((b) => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        b.booking_reference.toLowerCase().includes(q) ||
        (b.origin || '').toLowerCase().includes(q) ||
        (b.destination || '').toLowerCase().includes(q) ||
        (b.business?.business_name || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) return <DashboardLayout><div className="flex items-center justify-center py-20"><Spinner size={32} /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader title="My Trips" subtitle="View and manage all your travel bookings" />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            className="input pl-11"
            placeholder="Search by reference, destination, or business..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-navy-400" />
          <select className="input py-2.5" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={Plane} title="No trips found" description="Your travel bookings will appear here once a business creates one for you." />
        </Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((booking) => (
            <Card key={booking.id} className="hover:border-turquoise-200 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-navy-100 to-navy-200 flex items-center justify-center flex-shrink-0">
                  <Plane size={20} className="text-navy-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-bold text-navy-900 text-lg">
                      {booking.origin || 'Departure'} → {booking.destination || 'Arrival'}
                    </p>
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-navy-400 mt-2 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Building2 size={14} />
                      {booking.business?.business_name || 'Unknown business'}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {booking.start_date}{booking.end_date ? ` → ${booking.end_date}` : ''}
                    </span>
                    <span className="capitalize flex items-center gap-1.5">
                      <MapPin size={14} />
                      {booking.service_type.replace('_', ' ')}
                    </span>
                  </div>
                  {booking.notes && <p className="text-sm text-navy-500 mt-2">{booking.notes}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-navy-400">Booking Ref</p>
                  <p className="font-mono text-sm text-turquoise-600 font-semibold">{booking.booking_reference}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
