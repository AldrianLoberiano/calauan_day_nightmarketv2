import { useState, useEffect } from 'react';
import { Info, Search, ChevronDown, Store, MapPin, Clock, ShieldCheck, LayoutGrid, Map as MapIcon } from 'lucide-react';
import { Stall, Reservation } from '../types';
const headerImage = new URL('../components/public/header1.png', import.meta.url).href;
const bploLogo = new URL('../components/public/bplo-modified.png', import.meta.url).href;
import { checkAndExpireReservations } from '../utils/storage';
import { getDisplayStallId, getDisplayCategoryById } from '../utils/helpers';
import { StallMap } from '../components/primitives/StallMap';
import { StallGridView } from '../components/primitives/StallGridView';
import { StallDetailModal } from '../components/primitives/StallDetailModal';
import { ReservationFormModal } from '../components/primitives/ReservationFormModal';
import { ReceiptModal } from '../components/primitives/ReceiptModal';

export function UserPage() {
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [reserveStall, setReserveStall] = useState<Stall | null>(null);
  const [receiptData, setReceiptData] = useState<{ reservation: Reservation; stall: Stall } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [mapView, setMapView] = useState<'design' | 'grid'>('design');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  async function loadStalls() {
    const updated = await checkAndExpireReservations();
    setStalls(Array.isArray(updated) ? updated : []);
    setIsLoading(false);
  }

  useEffect(() => {
    void loadStalls();

    // Subscribe to server-sent events for realtime updates
    const apiBase = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
    const eventsUrl = `${apiBase}/events`;
    const es = new EventSource(eventsUrl);
    const reload = () => { void loadStalls(); };
    es.addEventListener('reservation-created', reload as EventListener);
    es.addEventListener('reservation-updated', reload as EventListener);
    es.addEventListener('reservation-deleted', reload as EventListener);
    es.onerror = () => {
      // EventSource will auto-retry; no-op here. Could add backoff/logging.
    };

    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => {
      clearInterval(interval);
      try { es.close(); } catch (e) {}
    };
  }, []);

  const safeStalls = Array.isArray(stalls) ? stalls : [];
  const availableCount = safeStalls.filter(s => s.status === 'available').length;
  const pendingCount = safeStalls.filter(s => s.status === 'pending').length;
  const reservedCount = safeStalls.filter(s => s.status === 'reserved').length;
  const occupiedCount = safeStalls.filter(s => s.status === 'occupied').length;

  const categories = ['Food', 'Non-Food'];

  function mapCategory(category: string) {
    if (category === 'Cooked Food' || category === 'Vegetables & Fruits') return 'Food';
    return 'Non-Food';
  }
  const filteredStalls = safeStalls.filter(s => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (filterCategory !== 'all' && mapCategory(s.category) !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return s.id.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
    }
    return true;
  });

  const directoryLayout = [
    { label: 'A', start: 1, end: 47, displayStart: 1 },
    { label: 'B', start: 48, end: 91, displayStart: 1 },
    { label: 'AA', start: 92, end: 133, displayStart: 1 },
    { label: 'BB', start: 134, end: 167, displayStart: 1 },
    { label: 'C', start: 168, end: 204, displayStart: 1 },
    { label: 'D', start: 205, end: 243, displayStart: 1 },
  ];
  const directoryRanges: Record<string, string> = {
    A: '1-47',
    B: '1-44',
    AA: '1-42',
    BB: '1-34',
    C: '1-37',
    D: '1-39',
  };
  const directoryAssignment = new Map<string, { label: string; index: number; displayStart: number }>();
  const numberedStalls = safeStalls.filter(s => s.number > 0);
  for (const stall of numberedStalls) {
    const numericId = Number(stall.id);
    if (!Number.isFinite(numericId)) continue;
    const group = directoryLayout.find(g => numericId >= g.start && numericId <= g.end);
    if (!group) continue;
    directoryAssignment.set(stall.id, {
      label: group.label,
      index: numericId - group.start + 1,
      displayStart: group.displayStart,
    });
  }
  const assignedIds = new Set(directoryAssignment.keys());
  const unassigned = numberedStalls
    .filter(stall => !assignedIds.has(stall.id))
    .sort((a, b) => a.number - b.number || a.id.localeCompare(b.id));
  unassigned.forEach((stall, idx) => {
    directoryAssignment.set(stall.id, { label: 'Other', index: idx + 1, displayStart: 1 });
  });
  const cornerStalls = safeStalls.filter(s => s.number === 0);
  const directoryOrder = [
    ...directoryLayout.map(group => group.label),
    ...(cornerStalls.length ? ['G'] : []),
  ];
  const groupedDirectory = directoryOrder
    .map((label) => {
      const items = filteredStalls
        .filter((stall) => {
          if (label === 'G') return stall.number === 0;
          const meta = directoryAssignment.get(stall.id);
          return meta?.label === label;
        })
        .sort((a, b) => {
          if (label === 'G') return a.id.localeCompare(b.id);
          const aMeta = directoryAssignment.get(a.id);
          const bMeta = directoryAssignment.get(b.id);
          return (aMeta?.index ?? 0) - (bMeta?.index ?? 0);
        })
        .map((stall) => {
          if (label === 'G') {
            return { stall, displayId: getDisplayStallId(stall.id) };
          }
          const meta = directoryAssignment.get(stall.id);
          if (!meta) {
            return { stall, displayId: stall.id };
          }
          const displayNumber = (meta.displayStart - 1) + meta.index;
          return { stall, displayId: `${label}${displayNumber}` };
        });

      return { label, items };
    })
    .filter(group => group.items.length > 0);

  function handleStallClick(stall: Stall) {
    const latest = safeStalls.find(s => s.id === stall.id) ?? stall;
    setSelectedStall(latest);
  }

  function handleReservationSuccess(reservation: Reservation, updatedStall: Stall) {
    setReserveStall(null);
    setReceiptData({ reservation, stall: updatedStall });
    loadStalls();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header */}
      <header
        className="fixed top-0 inset-x-0 z-50 text-white bg-center bg-cover"
        style={{ backgroundImage: `url(${headerImage})` }}
      >
        <div className="absolute inset-0 bg-slate-900/55" aria-hidden="true" />
        <div className="relative max-w-8xl mx-auto px-3 sm:px-5 py-2.5 sm:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden">
                <img src={bploLogo} alt="BPLO Logo" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <h1 className="font-black text-base sm:text-lg leading-tight tracking-tight">Stall Reservation System</h1>
                <p className="text-blue-200 text-xs sm:text-sm font-medium">Night Market Stall Mapping</p>
              </div>
            </div>
            <div className="text-xs text-blue-100 font-semibold bg-white/10 backdrop-blur-sm rounded-xl px-3 py-1.5 ring-1 ring-white/15">
              {now.toLocaleDateString([], { year: 'numeric', month: 'short', day: '2-digit' })}
              <span className="mx-1.5 text-blue-200/80">|</span>
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>
        </div>
      </header>

      {/* How it works banner */}
      <div className="bg-blue-700 border-b border-blue-800 pt-16 sm:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
          <div className="flex items-start sm:items-center gap-2 text-sm text-white">
            <Info className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0 opacity-80" />
            <span className="text-blue-100">
              <strong className="text-white">How to Reserve:</strong> Click on any{' '}
              <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded font-semibold">Green</span>{' '}
              stall on the map → View details → Click "Reserve" → Fill in your info → Get your reservation number.
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-8xl mx-auto px-3 sm:px-5 py-5 space-y-4">

        {/* Stat Summary Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <StatPill color="bg-green-500" label="Available" count={availableCount} />
            <div className="w-px h-4 bg-slate-200 hidden sm:block" />
            <StatPill color="bg-amber-400" label="Pending" count={pendingCount} />
            <div className="w-px h-4 bg-slate-200 hidden sm:block" />
            <StatPill color="bg-red-500" label="Reserved" count={reservedCount} />
            <div className="w-px h-4 bg-slate-200 hidden sm:block" />
            <StatPill color="bg-slate-400" label="Occupied" count={occupiedCount} />
            <div className="ml-auto flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200">
              <Store className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-500">Total: <span className="text-slate-800 font-bold">{stalls.length}</span></span>
            </div>
          </div>
        </div>

        {/* Interactive Map */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Map section header */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-800">Interactive Stall Map — Night Market</h2>
                <p className="text-xs text-slate-500 mt-0.5">Click on any stall to view details and availability</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-4 text-[11px] text-slate-500 hidden sm:flex">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />Available</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />Pending</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />Reserved</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block" />Occupied</span>
                </div>
              </div>
            </div>

            {/* View selector dropdown */}
              <div className="relative inline-block" id="map-view-dropdown-wrapper" style={{ zIndex: 1000 }}>
                <button
                  id="map-view-selector"
                  onClick={() => setDropdownOpen(o => !o)}
                  style={{ color: '#334155' }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 transition-all duration-200 border border-slate-200"
                >
                  {mapView === 'design' ? (
                    <MapIcon className="w-4 h-4 text-blue-600" />
                  ) : (
                    <LayoutGrid className="w-4 h-4 text-blue-600" />
                  )}
                  <span>{mapView === 'design' ? 'Design Map' : 'All Stalls (1–300)'}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                      dropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0"
                      style={{ zIndex: 999 }}
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div
                      className="absolute left-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 py-1 min-w-[200px] overflow-hidden"
                      style={{ animation: 'fadeSlideDown 0.15s ease', zIndex: 1000 }}
                    >
                      <button
                        id="map-view-design-tab"
                        onClick={() => { setMapView('design'); setDropdownOpen(false); }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 16px',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#1e293b',
                          background: mapView === 'design' ? '#f1f5f9' : 'transparent',
                          border: 'none',
                          borderLeft: mapView === 'design' ? '3px solid #3b82f6' : '3px solid transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = mapView === 'design' ? '#f1f5f9' : 'transparent'; }}
                      >
                        <MapIcon style={{ width: 16, height: 16, flexShrink: 0, color: '#3b82f6' }} />
                        Design Map
                      </button>
                      <button
                        id="map-view-grid-tab"
                        onClick={() => { setMapView('grid'); setDropdownOpen(false); }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 16px',
                          fontSize: '13px',
                          fontWeight: 500,
                          color: '#1e293b',
                          background: mapView === 'grid' ? '#f1f5f9' : 'transparent',
                          border: 'none',
                          borderLeft: mapView === 'grid' ? '3px solid #3b82f6' : '3px solid transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = mapView === 'grid' ? '#f1f5f9' : 'transparent'; }}
                      >
                        <LayoutGrid style={{ width: 16, height: 16, flexShrink: 0, color: '#3b82f6' }} />
                        All Stalls (1–300)
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="w-10 h-10 border-3 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderWidth: 3 }} />
                <p className="text-slate-500 text-sm font-medium">Loading stall map...</p>
              </div>
            </div>
          ) : mapView === 'design' ? (
            <StallMap
              stalls={stalls}
              onStallClick={handleStallClick}
              selectedStallId={selectedStall?.id}
            />
          ) : (
            <StallGridView
              stalls={stalls}
              onStallClick={handleStallClick}
              selectedStallId={selectedStall?.id}
            />
          )}
        </div>

        {/* Stall Directory */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">Stall Directory</h2>
              <p className="text-xs text-slate-500 mt-0.5">Browse and search all stalls</p>
            </div>
            <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-medium">
              {filteredStalls.length} stalls
            </span>
          </div>
          <div className="p-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stall ID, category..."
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all"
                />
              </div>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white w-full sm:w-auto transition-all"
                >
                  <option value="all">All Status</option>
                  <option value="available">Available</option>
                  <option value="pending">Pending</option>
                  <option value="reserved">Reserved</option>
                  <option value="occupied">Occupied</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white w-full sm:w-auto transition-all"
                >
                  <option value="all">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {groupedDirectory.length > 0 ? (
              <div className="space-y-6">
                {groupedDirectory.map(group => (
                  <div key={group.label}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-slate-800">
                        Section {group.label}
                        {directoryRanges[group.label] ? ` (${directoryRanges[group.label]})` : ''}
                      </h3>
                      <span className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-2 py-0.5 font-semibold">
                        {group.items.length} stalls
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {group.items.map(({ stall, displayId }) => (
                        <StallBrowserCard
                          key={stall.id}
                          stall={stall}
                          displayId={displayId}
                          onClick={() => handleStallClick(stall)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="font-semibold text-slate-500">No stalls found</p>
                <p className="text-sm mt-1">Try adjusting your filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div
          className="relative text-white rounded-2xl p-4 sm:p-5 overflow-hidden"
          style={{ backgroundImage: `url(${headerImage})` }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg, rgba(76, 29, 149, 0.92), rgba(88, 28, 135, 0.85) 45%, rgba(30, 27, 75, 0.92))',
            }}
            aria-hidden="true"
          />
          <div className="relative grid sm:grid-cols-3 gap-5">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-blue-200" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">BPLO Office Location</h3>
                <p className="text-blue-300 text-xs leading-relaxed">Municipal Hall, Ground Floor, Business Permits &amp; Licensing Office</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-4 h-4 text-blue-200" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">Office Hours</h3>
                <p className="text-blue-300 text-xs leading-relaxed">Monday – Friday: 8:00 AM – 5:00 PM (No noon break)</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-blue-200" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">Important Reminder</h3>
                <p className="text-blue-300 text-xs leading-relaxed">Reservations expire in 3 days if not processed. Present your receipt at the BPLO Office.</p>
              </div>
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
          onClose={() => { setReceiptData(null); void loadStalls(); }}
        />
      )}
    </div>
  );
}

function StatPill({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <span className="text-xs font-black text-slate-800 bg-slate-100 rounded-md px-1.5 py-0.5 min-w-[1.5rem] text-center">{count}</span>
    </div>
  );
}

function StallBrowserCard({ stall, onClick, displayId }: { stall: Stall; onClick: () => void; displayId?: string }) {
  const statusConfig: Record<string, { border: string; bg: string; dot: string; badge: string; badgeText: string }> = {
    available: {
      border: 'border-green-200 hover:border-green-400',
      bg: 'bg-green-50 hover:bg-green-100/70',
      dot: 'bg-green-500',
      badge: 'bg-green-100 text-green-700',
      badgeText: 'Available',
    },
    pending: {
      border: 'border-amber-200 hover:border-amber-400',
      bg: 'bg-amber-50 hover:bg-amber-100/70',
      dot: 'bg-amber-400',
      badge: 'bg-amber-100 text-amber-700',
      badgeText: 'Pending',
    },
    reserved: {
      border: 'border-red-200 hover:border-red-400',
      bg: 'bg-red-50 hover:bg-red-100/70',
      dot: 'bg-red-500',
      badge: 'bg-red-100 text-red-700',
      badgeText: 'Reserved',
    },
    occupied: {
      border: 'border-slate-200 hover:border-slate-400',
      bg: 'bg-slate-50 hover:bg-slate-100/70',
      dot: 'bg-slate-400',
      badge: 'bg-slate-100 text-slate-600',
      badgeText: 'Occupied',
    },
  };

  const cfg = statusConfig[stall.status] ?? statusConfig.occupied;

  return (
    <button
      onClick={onClick}
      className={`border rounded-xl p-3 text-left transition-all duration-150 hover:shadow-md active:scale-95 group ${cfg.border} ${cfg.bg}`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-black text-slate-800 tracking-wide">{displayId ?? stall.id}</span>
        <span className={`w-2 h-2 rounded-full shrink-0 mt-1 ${cfg.dot}`} />
      </div>
      <p className="text-[11px] text-slate-500 line-clamp-1 mb-1.5">{getDisplayCategoryById(stall.id, stall.category)}</p>
      <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md ${cfg.badge}`}>
        {stall.status === 'available' ? 'To be discussed' : cfg.badgeText}
      </span>
      <p className="text-[10px] text-blue-600 font-semibold mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        View details →
      </p>
    </button>
  );
}