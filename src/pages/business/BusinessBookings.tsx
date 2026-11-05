import { useEffect, useState } from 'react';
import { Calendar, Plus, Plane, MapPin, Search, Filter, User2, Building2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, EmptyState, StatusBadge, Spinner, PageHeader, Modal, Toast } from '@/components/ui';
import type { Booking, Business, Profile, Identity, ServiceType } from '@/types';

export function BusinessBookings() {
  const { profile } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [creating, setCreating] = useState(false);

  // Form state
  const [travelerEmail, setTravelerEmail] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('flight');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [foundTraveler, setFoundTraveler] = useState<Profile | null>(null);
  const [foundIdentity, setFoundIdentity] = useState<Identity | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data: bizData } = await supabase.from('businesses').select('*').eq('user_id', profile.id).maybeSingle();
      setBusiness(bizData as Business | null);
      if (bizData) {
        const { data: bkData } = await supabase
          .from('bookings')
          .select('*, traveler:profiles!traveler_user_id(*)')
          .eq('business_id', bizData.id)
          .order('created_at', { ascending: false });
        setBookings(bkData as Booking[] || []);
      }
      setLoading(false);
    })();
  }, [profile]);

  const searchTraveler = async () => {
    if (!travelerEmail.trim()) return;
    setSearching(true);
    setFoundTraveler(null);
    setFoundIdentity(null);

    const { data: traveler } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'traveler')
      .ilike('full_name', `%${travelerEmail}%`)
      .limit(5);

    // Also try to get the user by email through auth - but we can't directly.
    // Instead let's search by traveler_user_id or name
    if (traveler && traveler.length > 0) {
      setFoundTraveler(traveler[0] as Profile);
      const { data: ident } = await supabase
        .from('identities')
        .select('*')
        .eq('user_id', traveler[0].id)
        .maybeSingle();
      if (ident) setFoundIdentity(ident as Identity);
    }
    setSearching(false);
  };

  const handleCreate = async () => {
    if (!business || !foundTraveler) return;
    setCreating(true);
    const { error } = await supabase.from('bookings').insert({
      business_id: business.id,
      traveler_user_id: foundTraveler.id,
      identity_id: foundIdentity?.id || null,
      service_type: serviceType,
      origin: origin || null,
      destination: destination || null,
      start_date: startDate || new Date().toISOString().split('T')[0],
      end_date: endDate || null,
      notes: notes || null,
      status: 'confirmed',
    });

    if (error) {
      setToast({ message: error.message, type: 'error' });
    } else {
      setToast({ message: 'Booking created successfully', type: 'success' });
      setCreateOpen(false);
      resetForm();
      // Refresh bookings
      const { data } = await supabase
        .from('bookings')
        .select('*, traveler:profiles!traveler_user_id(*)')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });
      setBookings(data as Booking[] || []);
    }
    setCreating(false);
  };

  const updateBookingStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
    if (error) {
      setToast({ message: error.message, type: 'error' });
    } else {
      setBookings(bookings.map(b => b.id === id ? { ...b, status: status as Booking['status'] } : b));
      setToast({ message: 'Booking updated', type: 'success' });
    }
  };

  const resetForm = () => {
    setTravelerEmail('');
    setServiceType('flight');
    setOrigin('');
    setDestination('');
    setStartDate('');
    setEndDate('');
    setNotes('');
    setFoundTraveler(null);
    setFoundIdentity(null);
  };

  const filtered = bookings.filter((b) => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (b.booking_reference || '').toLowerCase().includes(q) ||
        (b.origin || '').toLowerCase().includes(q) ||
        (b.destination || '').toLowerCase().includes(q) ||
        (b.traveler?.full_name || '').toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) return <DashboardLayout><div className="flex items-center justify-center py-20"><Spinner size={32} /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PageHeader
        title="Bookings"
        subtitle="Create and manage travel bookings for travelers"
        action={<button onClick={() => setCreateOpen(true)} className="btn-primary"><Plus size={18} />New Booking</button>}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
          <input className="input pl-11" placeholder="Search by traveler, destination, or reference..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
        <Card><EmptyState icon={Calendar} title="No bookings yet" description="Create your first booking for a traveler." action={<button onClick={() => setCreateOpen(true)} className="btn-primary"><Plus size={18} />Create Booking</button>} /></Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map((b) => (
            <Card key={b.id} className="hover:border-turquoise-200 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-navy-100 to-navy-200 flex items-center justify-center flex-shrink-0">
                  <Plane size={20} className="text-navy-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-bold text-navy-900 text-lg">
                      {b.origin || '—'} → {b.destination || '—'}
                    </p>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-navy-400 mt-2 flex-wrap">
                    <span className="flex items-center gap-1.5"><User2 size={14} />{b.traveler?.full_name || 'Unknown traveler'}</span>
                    <span className="flex items-center gap-1.5"><Calendar size={14} />{b.start_date}{b.end_date ? ` → ${b.end_date}` : ''}</span>
                    <span className="capitalize flex items-center gap-1.5"><MapPin size={14} />{b.service_type.replace('_', ' ')}</span>
                  </div>
                  {b.notes && <p className="text-sm text-navy-500 mt-2">{b.notes}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <p className="font-mono text-sm text-turquoise-600 font-semibold">{b.booking_reference}</p>
                  {b.status !== 'completed' && b.status !== 'cancelled' && (
                    <div className="flex gap-2">
                      {b.status === 'confirmed' && (
                        <button onClick={() => updateBookingStatus(b.id, 'completed')} className="text-xs px-3 py-1.5 rounded-lg bg-turquoise-100 text-turquoise-700 hover:bg-turquoise-200 font-medium">Complete</button>
                      )}
                      {b.status === 'pending' && (
                        <button onClick={() => updateBookingStatus(b.id, 'confirmed')} className="text-xs px-3 py-1.5 rounded-lg bg-turquoise-100 text-turquoise-700 hover:bg-turquoise-200 font-medium">Confirm</button>
                      )}
                      <button onClick={() => updateBookingStatus(b.id, 'cancelled')} className="text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-medium">Cancel</button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create booking modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Booking" maxWidth="max-w-2xl">
        <div className="space-y-4">
          {/* Traveler search */}
          <div>
            <label className="label">Search Traveler by Name</label>
            <div className="flex gap-2">
              <input className="input" placeholder="Enter traveler name..." value={travelerEmail} onChange={(e) => setTravelerEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchTraveler()} />
              <button onClick={searchTraveler} disabled={searching} className="btn-secondary">
                {searching ? <Spinner size={16} /> : <Search size={16} />}
                Search
              </button>
            </div>
          </div>

          {foundTraveler && (
            <div className="p-4 rounded-xl bg-turquoise-50 border border-turquoise-200 flex items-center gap-3 animate-slide-down">
              <div className="w-10 h-10 rounded-xl bg-turquoise-500 flex items-center justify-center text-white font-semibold">
                {foundTraveler.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-navy-900">{foundTraveler.full_name}</p>
                <p className="text-xs text-navy-400">{foundIdentity ? `Passport: ${foundIdentity.passport_number}` : 'No identity card'}</p>
              </div>
              <span className="ml-auto badge-success">Found</span>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Service Type</label>
              <select className="input" value={serviceType} onChange={(e) => setServiceType(e.target.value as ServiceType)}>
                <option value="flight">Flight</option>
                <option value="hotel">Hotel</option>
                <option value="car_rental">Car Rental</option>
                <option value="tour">Tour</option>
                <option value="cruise">Cruise</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div><label className="label">Origin</label><input className="input" value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="e.g. New York" /></div>
            <div><label className="label">Destination</label><input className="input" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g. Paris" /></div>
            <div><label className="label">Start Date</label><input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div><label className="label">End Date</label><input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea className="input min-h-[80px] resize-y" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional booking details..." />
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={() => setCreateOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleCreate} disabled={!foundTraveler || creating} className="btn-primary">
              {creating ? <Spinner size={16} /> : <Plus size={16} />}
              Create Booking
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
