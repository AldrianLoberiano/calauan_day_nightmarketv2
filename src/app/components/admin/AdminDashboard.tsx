import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, RefreshCw, LogOut, LayoutDashboard, ClipboardList,
  MapPin, CheckCircle, Clock, XCircle, Package,
  TrendingUp, Users, Activity
} from 'lucide-react';
import { Reservation, Stall } from '../../types';
import { getReservations, checkAndExpireReservations } from '../../utils/storage';
import { ReservationCard } from './ReservationCard';
import { StallMap } from '../primitives/StallMap';
import { StallDetailModal } from '../primitives/StallDetailModal';
import { ReservationFormModal } from '../primitives/ReservationFormModal';
import { ReceiptModal } from '../primitives/ReceiptModal';

const headerImage = new URL('../public/header1.png', import.meta.url).href;
const bploLogo = new URL('../public/bplo-modified.png', import.meta.url).href;

interface AdminDashboardProps {
  onLogout: () => void;
}

type TabId = 'dashboard' | 'reservations' | 'map';
type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected' | 'occupied';

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [reserveStall, setReserveStall] = useState<Stall | null>(null);
  const [receiptData, setReceiptData] = useState<{ reservation: Reservation; stall: Stall } | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  function loadData() {
    const updatedStalls = checkAndExpireReservations();
    setStalls(updatedStalls);
    setReservations(getReservations());
    setLastRefresh(new Date());
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const total = reservations.length;
    const pending = reservations.filter(r => r.status === 'pending').length;
    const approved = reservations.filter(r => r.status === 'approved').length;
    const rejected = reservations.filter(r => r.status === 'rejected').length;
    const occupied = reservations.filter(r => r.status === 'occupied').length;

    const availableStalls = stalls.filter(s => s.status === 'available').length;
    const totalStalls = stalls.length;
    const occupiedStalls = stalls.filter(s => s.status === 'occupied').length;
    const pendingStalls = stalls.filter(s => s.status === 'pending').length;
    const reservedStalls = stalls.filter(s => s.status === 'reserved').length;

    return { total, pending, approved, rejected, occupied, availableStalls, totalStalls, occupiedStalls, pendingStalls, reservedStalls };
  }, [reservations, stalls]);

  const filteredReservations = useMemo(() => {
    return reservations
      .filter(r => {
        if (filterStatus !== 'all' && r.status !== filterStatus) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            r.reservationNumber.toLowerCase().includes(q) ||
            r.fullName.toLowerCase().includes(q) ||
            r.stallId.toLowerCase().includes(q) ||
            r.contactNumber.includes(q) ||
            (r.businessName?.toLowerCase().includes(q) ?? false)
          );
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reservations, filterStatus, searchQuery]);

  function getStallForReservation(res: Reservation): Stall | undefined {
    return stalls.find(s => s.id === res.stallId);
  }

  const tabs = [
    { id: 'dashboard' as TabId, label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'reservations' as TabId, label: 'Reservations', icon: <ClipboardList className="w-4 h-4" />, badge: stats.pending > 0 ? stats.pending : undefined },
    { id: 'map' as TabId, label: 'Stall Map', icon: <MapPin className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin Header */}
      <header
        className="relative text-white shadow-lg sticky top-0 z-40 bg-center bg-cover"
        style={{ backgroundImage: `url(${headerImage})` }}
      >
        <div className="absolute inset-0 bg-slate-900/55 pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 flex items-center justify-center overflow-hidden">
              <img src={bploLogo} alt="BPLO Logo" className="w-9 h-9 object-contain" />
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg leading-tight tracking-tight">BPLO Admin Panel</h1>
              <p className="text-blue-200 text-xs hidden sm:block font-medium">Stall Reservation Mapping System</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-xs text-white/80 ring-1 ring-white/15">
              <Activity className="w-3 h-3 text-green-300" />
              <span>Refreshed {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <button
              onClick={loadData}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ring-1 ring-white/15 hover:ring-white/30"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-0.5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all relative ${
                  activeTab === tab.id
                    ? 'border-white text-white'
                    : 'border-transparent text-blue-300 hover:text-white hover:border-blue-300/50'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.badge !== undefined && (
                  <span className="ml-0.5 bg-amber-400 text-amber-900 text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-800">Overview</h2>
                <p className="text-sm text-slate-500 mt-0.5">Real-time stall and reservation statistics</p>
              </div>
            </div>

            {/* Reservation Stats */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Reservation Statistics</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={<Users className="w-5 h-5" />} label="Total" value={stats.total} color="blue" />
                <StatCard icon={<Clock className="w-5 h-5" />} label="Pending" value={stats.pending} color="yellow" />
                <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Approved" value={stats.approved} color="green" />
                <StatCard icon={<XCircle className="w-5 h-5" />} label="Rejected" value={stats.rejected} color="red" />
              </div>
            </div>

            {/* Stall Stats */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Stall Status Overview</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={<MapPin className="w-5 h-5" />} label="Available" value={stats.availableStalls} color="green" />
                <StatCard icon={<Clock className="w-5 h-5" />} label="Pending" value={stats.pendingStalls} color="yellow" />
                <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Reserved" value={stats.reservedStalls} color="blue" />
                <StatCard icon={<Package className="w-5 h-5" />} label="Occupied" value={stats.occupiedStalls} color="gray" />
              </div>
            </div>

            {/* Occupancy bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-700">Market Occupancy</h3>
                <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
                  {stats.totalStalls} total stalls
                </span>
              </div>
              <div className="flex items-end gap-3 mb-3">
                <span className="text-4xl font-black text-slate-800 leading-none">
                  {stats.totalStalls > 0
                    ? Math.round(((stats.totalStalls - stats.availableStalls) / stats.totalStalls) * 100)
                    : 0}%
                </span>
                <span className="text-sm text-slate-500 mb-1">
                  utilized ({stats.totalStalls - stats.availableStalls}/{stats.totalStalls})
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                {stats.occupiedStalls > 0 && (
                  <div className="bg-slate-500 h-full rounded-full" style={{ width: `${(stats.occupiedStalls / stats.totalStalls) * 100}%` }} />
                )}
                {stats.reservedStalls > 0 && (
                  <div className="bg-red-500 h-full rounded-full" style={{ width: `${(stats.reservedStalls / stats.totalStalls) * 100}%` }} />
                )}
                {stats.pendingStalls > 0 && (
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: `${(stats.pendingStalls / stats.totalStalls) * 100}%` }} />
                )}
                {stats.availableStalls > 0 && (
                  <div className="bg-green-400 h-full rounded-full" style={{ width: `${(stats.availableStalls / stats.totalStalls) * 100}%` }} />
                )}
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />Available ({stats.availableStalls})</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />Pending ({stats.pendingStalls})</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Reserved ({stats.reservedStalls})</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" />Occupied ({stats.occupiedStalls})</span>
              </div>
            </div>

            {stats.pending > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Actions</h3>
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{stats.pending} pending</span>
                  </div>
                  <button onClick={() => setActiveTab('reservations')} className="text-xs text-blue-600 font-semibold hover:underline">
                    View all →
                  </button>
                </div>
                <div className="space-y-3">
                  {reservations
                    .filter(r => r.status === 'pending')
                    .slice(0, 3)
                    .map(res => (
                      <ReservationCard
                        key={res.id}
                        reservation={res}
                        stall={getStallForReservation(res)}
                        onUpdate={loadData}
                      />
                    ))}
                </div>
              </div>
            )}

            {stats.pending === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-green-800 font-bold">All caught up!</p>
                <p className="text-green-600 text-sm mt-1">No pending reservations to process.</p>
              </div>
            )}
          </div>
        )}

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-800">All Reservations</h2>
                <p className="text-sm text-slate-500">{filteredReservations.length} of {reservations.length} records</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, reservation no., stall ID..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="occupied">Occupied</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {filteredReservations.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredReservations.map(res => (
                  <ReservationCard
                    key={res.id}
                    reservation={res}
                    stall={getStallForReservation(res)}
                    onUpdate={loadData}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <ClipboardList className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-slate-600 font-semibold">No reservations found.</p>
                <p className="text-slate-400 text-sm mt-1">
                  {searchQuery ? 'Try a different search term.' : 'No reservations have been made yet.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Map Tab */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-slate-800">Stall Map (Admin View)</h2>
              <p className="text-sm text-slate-500">Click on any stall to view details or manage its reservation.</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <StallMap
                stalls={stalls}
                onStallClick={(stall) => setSelectedStall(stall)}
              />
            </div>
          </div>
        )}
      </main>

      {selectedStall && (
        <StallDetailModal
          stall={selectedStall}
          onClose={() => setSelectedStall(null)}
          onReserve={(stall) => {
            setSelectedStall(null);
            setReserveStall(stall);
          }}
        />
      )}
      {reserveStall && (
        <ReservationFormModal
          stall={reserveStall}
          onClose={() => setReserveStall(null)}
          onSuccess={(reservation, updatedStall) => {
            setReserveStall(null);
            setReceiptData({ reservation, stall: updatedStall });
            loadData();
          }}
        />
      )}
      {receiptData && (
        <ReceiptModal
          reservation={receiptData.reservation}
          stall={receiptData.stall}
          onClose={() => { setReceiptData(null); loadData(); }}
        />
      )}
    </div>
  );
}

function StatCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
}) {
  const colorMap = {
    blue: { wrap: 'bg-blue-50 border-blue-100', icon: 'bg-blue-100 text-blue-600', text: 'text-blue-800' },
  };

  return (
    <div className={`rounded-2xl border-2 p-4 ${colorMap[color]} flex items-center gap-3`}>
      <div className="shrink-0 opacity-70">{icon}</div>
      <div>
        <p className="text-2xl font-black leading-tight">{value}</p>
        <p className="text-xs font-semibold opacity-70 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}
