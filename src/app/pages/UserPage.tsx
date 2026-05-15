import React, { useState, useEffect } from 'react';
import { MapPin, Info, ShieldCheck, Search, ChevronDown } from 'lucide-react';
import { Stall, Reservation } from '../types';
const headerImage = new URL('../components/public/header1.png', import.meta.url).href;
import { checkAndExpireReservations } from '../utils/storage';
import { StallMap } from '../components/primitives/StallMap';
import { StallDetailModal } from '../components/primitives/StallDetailModal';
import { ReservationFormModal } from '../components/primitives/ReservationFormModal';
import { ReceiptModal } from '../components/primitives/ReceiptModal';

export function UserPage() {
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [reserveStall, setReserveStall] = useState<Stall | null>(null);
  const [receiptData, setReceiptData] = useState<{ reservation: Reservation; stall: Stall } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  function loadStalls() {
    const updated = checkAndExpireReservations();
    setStalls(updated);
    setIsLoading(false);
  }

  useEffect(() => {
    loadStalls();
  }, []);

  const availableCount = stalls.filter(s => s.status === 'available').length;
  const pendingCount = stalls.filter(s => s.status === 'pending').length;
  const reservedCount = stalls.filter(s => s.status === 'reserved').length;
  const occupiedCount = stalls.filter(s => s.status === 'occupied').length;

  const categories = [...new Set(stalls.map(s => s.category))];
  const filteredStalls = stalls.filter(s => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (filterCategory !== 'all' && s.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return s.id.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
    }
    return true;
  });

  function handleStallClick(stall: Stall) {
    const latest = stalls.find(s => s.id === stall.id) ?? stall;
    setSelectedStall(latest);
  }

  function handleReservationSuccess(reservation: Reservation, updatedStall: Stall) {
    setReserveStall(null);
    setReceiptData({ reservation, stall: updatedStall });
    loadStalls();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <header
        className="relative text-white bg-center bg-cover"
        style={{ backgroundImage: `url(${headerImage})` }}
      >
        <div className="absolute inset-0 bg-black/45" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-black text-lg sm:text-xl leading-tight">Pwesto Reservation System</h1>
                <p className="text-blue-200 text-xs sm:text-sm">Public Market — Night Market Stall Mapping</p>
              </div>
            </div>
            <span className="text-xs sm:text-sm font-semibold text-white/80">Public View</span>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap gap-2 sm:gap-4 mt-4 pt-4 border-t border-white/20">
            <StatPill color="bg-green-500" label="Available" count={availableCount} />
            <StatPill color="bg-yellow-400" label="Pending" count={pendingCount} />
            <StatPill color="bg-red-500" label="Reserved" count={reservedCount} />
            <StatPill color="bg-gray-400" label="Occupied" count={occupiedCount} />
            <div className="ml-auto text-blue-200 text-xs self-center hidden sm:block">
              Total Stalls: <span className="text-white font-bold">{stalls.length}</span>
            </div>
          </div>
        </div>
      </header>

      {/* How it works banner */}
      <div className="bg-blue-50 border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-start sm:items-center gap-2 text-sm text-blue-800">
            <Info className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong>How to Reserve:</strong> Click on any{' '}
              <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded font-semibold">Green</span>{' '}
              stall on the map → View details → Click "Reserve" → Fill in your info → Get your reservation number.
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Interactive Map */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-800">Interactive Stall Map — Night Market</h2>
              <p className="text-xs text-gray-500 mt-0.5">Click on any stall to view details and availability</p>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Loading stall map...</p>
              </div>
            </div>
          ) : (
            <StallMap
              stalls={stalls}
              onStallClick={handleStallClick}
              selectedStallId={selectedStall?.id}
            />
          )}
        </div>

        {/* Stall Browser */}
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Stall Directory</h2>
            <p className="text-xs text-slate-500 mt-0.5">Browse and search all stalls</p>
          </div>
          <div className="p-5">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stall ID, category..."
                  className="w-full pl-10 pr-4 py-2 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400"
                />
              </div>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white w-full sm:w-auto"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="pending">Pending</option>
                  <option value="reserved">Reserved</option>
                  <option value="occupied">Occupied</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white w-full sm:w-auto"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {filteredStalls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {filteredStalls.map(stall => (
                  <StallBrowserCard key={stall.id} stall={stall} onClick={() => handleStallClick(stall)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400">
                <Search className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="font-semibold">No stalls found</p>
                <p className="text-sm">Try adjusting your filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 sm:p-6 shadow-lg shadow-slate-300/40">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <h3 className="font-bold text-sm mb-1">BPLO Office Location</h3>
              <p className="text-slate-300 text-xs">Municipal Hall, Ground Floor, Business Permits &amp; Licensing Office</p>
            </div>
            <div>
              <h3 className="font-bold text-sm mb-1">Office Hours</h3>
              <p className="text-slate-300 text-xs">Monday – Friday: 8:00 AM – 5:00 PM (No noon break)</p>
            </div>
            <div>
              <h3 className="font-bold text-sm mb-1">Important Reminder</h3>
              <p className="text-slate-300 text-xs">Reservations expire in 3 days if not processed. Present your receipt at the BPLO Office.</p>
            </div>
          </div>
        </div>
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
          onSuccess={handleReservationSuccess}
        />
      )}
      {receiptData && (
        <ReceiptModal
          reservation={receiptData.reservation}
          stall={receiptData.stall}
          onClose={() => { setReceiptData(null); loadStalls(); }}
        />
      )}
    </div>
  );
}

function StatPill({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-2.5 py-1">
      <span className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />
      <span className="text-[11px] text-white/80 uppercase tracking-wider">{label}</span>
      <span className="text-xs font-bold text-white">{count}</span>
    </div>
  );
}

function StallBrowserCard({ stall, onClick }: { stall: Stall; onClick: () => void }) {
  const statusColors: Record<string, string> = {
    available: 'border-green-300 bg-green-50',
    pending: 'border-yellow-300 bg-yellow-50',
    reserved: 'border-red-300 bg-red-50',
    occupied: 'border-gray-300 bg-gray-50',
  };
  const statusDot: Record<string, string> = {
    available: 'bg-green-500',
    pending: 'bg-yellow-400',
    reserved: 'bg-red-500',
    occupied: 'bg-gray-400',
  };

  return (
    <button
      onClick={onClick}
      className={`border-2 rounded-xl p-3 text-left hover:shadow-md transition-all hover:scale-105 group ${statusColors[stall.status]}`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-black text-gray-800">{stall.id}</span>
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 ${statusDot[stall.status]}`} />
      </div>
      <p className="text-xs text-gray-600 line-clamp-1">{stall.category}</p>
      <p className="text-xs font-bold text-gray-700 mt-1">
        {stall.status === 'available' ? `₱${stall.price.toLocaleString()}/mo` : stall.status}
      </p>
      <p className="text-[10px] text-blue-600 font-semibold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
        Click to view →
      </p>
    </button>
  );
}