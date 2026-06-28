import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, RefreshCw, LogOut, LayoutDashboard, ClipboardList,
  MapPin, CheckCircle, Clock, XCircle, Package,
  TrendingUp, Users, LayoutGrid, Map as MapIcon,
  ChevronDown, Settings, Database, CalendarClock, Shield,
  BarChart3, PieChart as PieChartIcon,
  Download, FileSpreadsheet, FileText, File
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Reservation, Stall } from '../../types';
import {
  getReservations,
  checkAndExpireReservations,
  resetStorage,
  extendPendingReservations,
} from '../../utils/storage';
import { ReservationCard } from './ReservationCard';
import { ReservationDetailsModal } from './ReservationDetailsModal';
import { StallMap } from '../stalls/StallMap';
import { StallGridView } from '../stalls/StallGridView';
import { StallDetailModal } from '../stalls/StallDetailModal';
import { ReservationFormModal } from '../stalls/ReservationFormModal';
import { ReceiptModal } from '../stalls/ReceiptModal';
import { exportToCSV, exportToExcel, exportToWord } from '../../utils/export';
import { VendorManagement } from './VendorManagement';

const bploLogo = '/images/bplo-modified.png';

interface AdminDashboardProps {
  onLogout: () => void;
}

type TabId = 'dashboard' | 'reservations-a' | 'reservations-b' | 'design-map' | 'all-stalls' | 'vendors';
type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected' | 'occupied';

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [stallsDesignMap, setStallsDesignMap] = useState<Stall[]>([]);
  const [stallsAllStalls, setStallsAllStalls] = useState<Stall[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedStall, setSelectedStall] = useState<Stall | null>(null);
  const [reserveStall, setReserveStall] = useState<Stall | null>(null);
  const [receiptData, setReceiptData] = useState<{ reservation: Reservation; stall: Stall } | null>(null);
  const [activeReservationId, setActiveReservationId] = useState<string | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showExtendConfirm, setShowExtendConfirm] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  async function loadData() {
    const [stallsDesign, stallsAll, updatedReservations] = await Promise.all([
      checkAndExpireReservations('design_map'),
      checkAndExpireReservations('all_stalls'),
      getReservations(),
    ]);
    const combinedMap = new Map<string, Stall>();
    [...(Array.isArray(stallsDesign) ? stallsDesign : []), ...(Array.isArray(stallsAll) ? stallsAll : [])].forEach(s => {
      const existing = combinedMap.get(s.id);
      if (!existing || (s.status !== 'available' && existing.status === 'available')) {
        combinedMap.set(s.id, s);
      }
    });
    setStalls(Array.from(combinedMap.values()));
    setStallsDesignMap(Array.isArray(stallsDesign) ? stallsDesign : []);
    setStallsAllStalls(Array.isArray(stallsAll) ? stallsAll : []);
    setReservations(updatedReservations);
  }

  useEffect(() => {
    void loadData();
    const interval = setInterval(() => {
      void loadData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  async function handleReset() {
    setIsResetting(true);
    try {
      await resetStorage();
      await loadData();
    } catch (err) {
      console.error(err);
      window.alert('Reset failed. Please try again.');
    } finally {
      setIsResetting(false);
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setShowAccountMenu(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAccountMenu, showExportMenu]);

  function handleExport(format: 'csv' | 'excel' | 'word') {
    const isMapA = activeTab === 'reservations-a';
    const source = isMapA ? 'design_map' : 'all_stalls';
    const mapLabel = isMapA ? 'MapA' : 'MapB';
    const relevantReservations = reservations.filter(r => r.source === source);
    const relevantStalls = isMapA ? stallsDesignMap : stallsAllStalls;

    if (format === 'csv') exportToCSV(relevantReservations, relevantStalls, mapLabel);
    else if (format === 'excel') exportToExcel(relevantReservations, relevantStalls, mapLabel);
    else exportToWord(relevantReservations, relevantStalls, mapLabel);

    setShowExportMenu(false);
  }

  async function handleExtend() {
    setIsExtending(true);
    try {
      await extendPendingReservations();
      await loadData();
    } catch (err) {
      console.error(err);
      window.alert('Extend failed. Please try again.');
    } finally {
      setIsExtending(false);
      setShowExtendConfirm(false);
    }
  }

  const stats = useMemo(() => {
    const reservationsA = reservations.filter(r => r.source === 'design_map' || !r.source);
    const reservationsB = reservations.filter(r => r.source === 'all_stalls');

    const total = reservations.length;
    const pending = reservations.filter(r => r.status === 'pending').length;
    const approved = reservations.filter(r => r.status === 'approved').length;
    const rejected = reservations.filter(r => r.status === 'rejected').length;
    const occupied = reservations.filter(r => r.status === 'occupied').length;
    const pendingA = reservationsA.filter(r => r.status === 'pending').length;
    const pendingB = reservationsB.filter(r => r.status === 'pending').length;

    const availableStalls = stalls.filter(s => s.status === 'available').length;
    const totalStalls = stalls.length;
    const occupiedStalls = stalls.filter(s => s.status === 'occupied').length;
    const pendingStalls = stalls.filter(s => s.status === 'pending').length;
    const reservedStalls = stalls.filter(s => s.status === 'reserved').length;

    // Map A (design_map) stalls
    const stallsA = stallsDesignMap;
    const stallsAAvailable = stallsA.filter(s => s.status === 'available').length;
    const stallsAPending = stallsA.filter(s => s.status === 'pending').length;
    const stallsAReserved = stallsA.filter(s => s.status === 'reserved').length;
    const stallsAOccupied = stallsA.filter(s => s.status === 'occupied').length;
    const reservationsATotal = reservationsA.length;
    const reservationsAPending = reservationsA.filter(r => r.status === 'pending').length;
    const reservationsAApproved = reservationsA.filter(r => r.status === 'approved').length;
    const reservationsARejected = reservationsA.filter(r => r.status === 'rejected').length;
    const reservationsAOccupied = reservationsA.filter(r => r.status === 'occupied').length;

    // Map B (all_stalls) stalls
    const stallsB = stallsAllStalls;
    const stallsBAvailable = stallsB.filter(s => s.status === 'available').length;
    const stallsBPending = stallsB.filter(s => s.status === 'pending').length;
    const stallsBReserved = stallsB.filter(s => s.status === 'reserved').length;
    const stallsBOccupied = stallsB.filter(s => s.status === 'occupied').length;
    const reservationsBTotal = reservationsB.length;
    const reservationsBPending = reservationsB.filter(r => r.status === 'pending').length;
    const reservationsBApproved = reservationsB.filter(r => r.status === 'approved').length;
    const reservationsBRejected = reservationsB.filter(r => r.status === 'rejected').length;
    const reservationsBOccupied = reservationsB.filter(r => r.status === 'occupied').length;

    return {
      total, pending, approved, rejected, occupied, pendingA, pendingB,
      availableStalls, totalStalls, occupiedStalls, pendingStalls, reservedStalls,
      stallsA: { total: stallsA.length, available: stallsAAvailable, pending: stallsAPending, reserved: stallsAReserved, occupied: stallsAOccupied },
      stallsB: { total: stallsB.length, available: stallsBAvailable, pending: stallsBPending, reserved: stallsBReserved, occupied: stallsBOccupied },
      reservationsA: { total: reservationsATotal, pending: reservationsAPending, approved: reservationsAApproved, rejected: reservationsARejected, occupied: reservationsAOccupied },
      reservationsB: { total: reservationsBTotal, pending: reservationsBPending, approved: reservationsBApproved, rejected: reservationsBRejected, occupied: reservationsBOccupied },
    };
  }, [reservations, stalls, stallsDesignMap, stallsAllStalls]);

  const filteredReservations = useMemo(() => {
    return reservations
      .filter(r => {
        if (activeTab === 'reservations-a' && r.source !== 'design_map') return false;
        if (activeTab === 'reservations-b' && r.source !== 'all_stalls') return false;
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
  }, [reservations, filterStatus, searchQuery, activeTab]);

  function getStallForReservation(res: Reservation): Stall | undefined {
    const source = res.source;
    if (source === 'all_stalls') {
      return stallsAllStalls.find(s => s.id === res.stallId);
    }
    return stallsDesignMap.find(s => s.id === res.stallId);
  }

  const tabs = [
    { id: 'dashboard' as TabId, label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'reservations-a' as TabId, label: 'Map A Reservations', icon: <ClipboardList className="w-4 h-4" />, badge: stats.pendingA > 0 ? stats.pendingA : undefined },
    { id: 'reservations-b' as TabId, label: 'Map B Reservations', icon: <ClipboardList className="w-4 h-4" />, badge: stats.pendingB > 0 ? stats.pendingB : undefined },
    { id: 'design-map' as TabId, label: 'Map A', icon: <MapIcon className="w-4 h-4" /> },
    { id: 'all-stalls' as TabId, label: 'Map B', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'vendors' as TabId, label: 'Vendors', icon: <Users className="w-4 h-4" /> },
  ];

  const activeReservation = activeReservationId
    ? reservations.find(r => r.id === activeReservationId) ?? null
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Top Header Bar ── */}
      <header
        className="relative text-white shadow-lg sticky top-0 z-40"
      >
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #1a0533 0%, #2d1066 25%, #4c1d95 50%, #6b21a8 75%, #2d1066 100%)',
          }}
        />
        <div className="absolute inset-0 bg-slate-900/30 pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden">
              <img src={bploLogo} alt="BPLO Logo" className="w-9 h-9 object-contain" />
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg leading-tight tracking-tight">BPLO Admin Panel</h1>
              <p className="text-purple-200 text-xs hidden sm:block font-medium">Stall Reservation Mapping System</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Account Menu */}
            <div className="relative" ref={accountMenuRef}>
              <button
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all ring-1 ring-white/15 hover:ring-white/30"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                  A
                </div>
                <span className="hidden sm:inline">Admin</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showAccountMenu ? 'rotate-180' : ''}`} />
              </button>

              {showAccountMenu && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[#1e1e1e] rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50">
                  <div className="px-4 pt-4 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                        A
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Admin</p>
                        <p className="text-gray-400 text-xs">BPLO Admin Panel</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <button
                      onClick={() => { setShowAccountMenu(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                    >
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span>Admin Panel</span>
                    </button>
                    <button
                      onClick={() => { setShowAccountMenu(false); setShowSettingsModal(true); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-gray-400" />
                      <span>Settings</span>
                    </button>
                  </div>
                  <div className="border-t border-white/10 py-2">
                    <button
                      onClick={() => { setShowAccountMenu(false); setShowLogoutConfirm(true); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Toolbar: Tabs + Quick Actions ── */}
      <div className="sticky top-[60px] z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 h-12">
            {/* Tab Navigation */}
            <nav className="flex items-center gap-1 overflow-x-auto -mb-px scrollbar-none">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border-b-2 transition-all whitespace-nowrap rounded-t-lg ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="ml-0.5 bg-amber-400 text-amber-900 text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-5">

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Page Header */}
            <div>
              <h2 className="text-xl font-black text-slate-800">Dashboard Overview</h2>
              <p className="text-sm text-slate-500 mt-0.5">Real-time stall and reservation statistics for both maps</p>
            </div>

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard icon={<Package className="w-5 h-5" />} label="Total Stalls" value={stats.totalStalls} />
              <StatCard icon={<Users className="w-5 h-5" />} label="Total Reservations" value={stats.total} />
              <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Occupancy Rate" value={stats.totalStalls > 0 ? Math.round(((stats.totalStalls - stats.availableStalls) / stats.totalStalls) * 100) : 0} suffix="%" />
              <StatCard icon={<Clock className="w-5 h-5" />} label="Pending Action" value={stats.pending} />
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Bar Chart: Map A vs Map B Stalls */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-slate-600" />
                  <h3 className="text-sm font-bold text-slate-700">Stall Status Comparison</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Map A', Available: stats.stallsA.available, Pending: stats.stallsA.pending, Reserved: stats.stallsA.reserved, Occupied: stats.stallsA.occupied },
                      { name: 'Map B', Available: stats.stallsB.available, Pending: stats.stallsB.pending, Reserved: stats.stallsB.reserved, Occupied: stats.stallsB.occupied },
                    ]} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: 12 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Available" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Pending" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Reserved" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Occupied" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie Chart: Overall Distribution */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <PieChartIcon className="w-4 h-4 text-slate-600" />
                  <h3 className="text-sm font-bold text-slate-700">Overall Stall Distribution</h3>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Available', value: stats.availableStalls },
                          { name: 'Pending', value: stats.pendingStalls },
                          { name: 'Reserved', value: stats.reservedStalls },
                          { name: 'Occupied', value: stats.occupiedStalls },
                        ].filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        <Cell fill="#22c55e" />
                        <Cell fill="#fbbf24" />
                        <Cell fill="#ef4444" />
                        <Cell fill="#94a3b8" />
                      </Pie>
                      <Tooltip
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                        formatter={(value: number) => [`${value} stalls`, '']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* ── Map A & Map B Side by Side ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Map A Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <MapIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">Map A</h3>
                        <p className="text-[11px] text-slate-400">{stats.stallsA.total} stalls</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
                      {stats.stallsA.total > 0 ? Math.round(((stats.stallsA.total - stats.stallsA.available) / stats.stallsA.total) * 100) : 0}% utilized
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  {/* Mini occupancy bar */}
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex gap-0.5 mb-4">
                    {stats.stallsA.occupied > 0 && (
                      <div className="bg-slate-500 h-full rounded-full" style={{ width: `${(stats.stallsA.occupied / stats.stallsA.total) * 100}%` }} />
                    )}
                    {stats.stallsA.reserved > 0 && (
                      <div className="bg-red-500 h-full rounded-full" style={{ width: `${(stats.stallsA.reserved / stats.stallsA.total) * 100}%` }} />
                    )}
                    {stats.stallsA.pending > 0 && (
                      <div className="bg-amber-400 h-full rounded-full" style={{ width: `${(stats.stallsA.pending / stats.stallsA.total) * 100}%` }} />
                    )}
                    {stats.stallsA.available > 0 && (
                      <div className="bg-green-400 h-full rounded-full" style={{ width: `${(stats.stallsA.available / stats.stallsA.total) * 100}%` }} />
                    )}
                  </div>
                  {/* Stall counts */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <MiniStat label="Available" value={stats.stallsA.available} dotColor="bg-green-400" />
                    <MiniStat label="Pending" value={stats.stallsA.pending} dotColor="bg-amber-400" />
                    <MiniStat label="Reserved" value={stats.stallsA.reserved} dotColor="bg-red-500" />
                    <MiniStat label="Occupied" value={stats.stallsA.occupied} dotColor="bg-slate-500" />
                  </div>
                  {/* Reservations summary */}
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Reservations</p>
                    <div className="flex gap-2">
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg px-2 py-1">{stats.reservationsA.total} total</span>
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 rounded-lg px-2 py-1">{stats.reservationsA.pending} pending</span>
                      <span className="text-xs font-semibold text-green-700 bg-green-50 rounded-lg px-2 py-1">{stats.reservationsA.approved} approved</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map B Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                        <LayoutGrid className="w-4 h-4 text-violet-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">Map B</h3>
                        <p className="text-[11px] text-slate-400">{stats.stallsB.total} stalls</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1">
                      {stats.stallsB.total > 0 ? Math.round(((stats.stallsB.total - stats.stallsB.available) / stats.stallsB.total) * 100) : 0}% utilized
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  {/* Mini occupancy bar */}
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden flex gap-0.5 mb-4">
                    {stats.stallsB.occupied > 0 && (
                      <div className="bg-slate-500 h-full rounded-full" style={{ width: `${(stats.stallsB.occupied / stats.stallsB.total) * 100}%` }} />
                    )}
                    {stats.stallsB.reserved > 0 && (
                      <div className="bg-red-500 h-full rounded-full" style={{ width: `${(stats.stallsB.reserved / stats.stallsB.total) * 100}%` }} />
                    )}
                    {stats.stallsB.pending > 0 && (
                      <div className="bg-amber-400 h-full rounded-full" style={{ width: `${(stats.stallsB.pending / stats.stallsB.total) * 100}%` }} />
                    )}
                    {stats.stallsB.available > 0 && (
                      <div className="bg-green-400 h-full rounded-full" style={{ width: `${(stats.stallsB.available / stats.stallsB.total) * 100}%` }} />
                    )}
                  </div>
                  {/* Stall counts */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <MiniStat label="Available" value={stats.stallsB.available} dotColor="bg-green-400" />
                    <MiniStat label="Pending" value={stats.stallsB.pending} dotColor="bg-amber-400" />
                    <MiniStat label="Reserved" value={stats.stallsB.reserved} dotColor="bg-red-500" />
                    <MiniStat label="Occupied" value={stats.stallsB.occupied} dotColor="bg-slate-500" />
                  </div>
                  {/* Reservations summary */}
                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Reservations</p>
                    <div className="flex gap-2">
                      <span className="text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg px-2 py-1">{stats.reservationsB.total} total</span>
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 rounded-lg px-2 py-1">{stats.reservationsB.pending} pending</span>
                      <span className="text-xs font-semibold text-green-700 bg-green-50 rounded-lg px-2 py-1">{stats.reservationsB.approved} approved</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Pending Reservations ── */}
            {stats.pending > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Actions</h3>
                    <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{stats.pending} pending</span>
                  </div>
                  <button onClick={() => setActiveTab('reservations-a')} className="text-xs text-blue-600 font-semibold hover:underline">
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
                        onView={() => setActiveReservationId(res.id)}
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
        {(activeTab === 'reservations-a' || activeTab === 'reservations-b') && (
          <div className="space-y-5">
            {/* Header with stats */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-800">
                    {activeTab === 'reservations-a' ? 'Map A Reservations' : 'Map B Reservations'}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {filteredReservations.length} of {activeTab === 'reservations-a'
                      ? reservations.filter(r => r.source === 'design_map').length
                      : reservations.filter(r => r.source === 'all_stalls').length} records
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Export Dropdown */}
                  <div className="relative" ref={exportMenuRef}>
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export
                    </button>
                    {showExportMenu && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                        <button
                          onClick={() => handleExport('csv')}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <File className="w-4 h-4 text-green-600" />
                          <span>Download CSV</span>
                        </button>
                        <button
                          onClick={() => handleExport('excel')}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          <span>Download Excel</span>
                        </button>
                        <button
                          onClick={() => handleExport('word')}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span>Download Word</span>
                        </button>
                      </div>
                    )}
                  </div>
              </div>
            </div>
            </div>

            {/* Search & Filter bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, reservation no., stall ID, contact..."
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 focus:bg-white transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                    className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="occupied">Occupied</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="px-3 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Results */}
            {filteredReservations.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredReservations.map(res => (
                  <ReservationCard
                    key={res.id}
                    reservation={res}
                    stall={getStallForReservation(res)}
                    onView={() => setActiveReservationId(res.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ClipboardList className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-700 font-bold text-lg">No reservations found</p>
                <p className="text-slate-400 text-sm mt-1.5 max-w-sm mx-auto">
                  {searchQuery
                    ? `No results for "${searchQuery}". Try adjusting your search or filter.`
                    : 'No reservations have been made yet for this map.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Design Map Tab */}
        {activeTab === 'design-map' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-slate-800">Map A</h2>
              <p className="text-sm text-slate-500">Click on any stall to view details or manage its reservation.</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 pt-3 pb-0 border-b border-slate-100">
                <div className="flex items-center gap-4 text-[11px] text-slate-500 pb-3">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />Available</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />Pending</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />Reserved</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block" />Occupied</span>
                </div>
              </div>
              <StallMap
                stalls={stallsDesignMap}
                onStallClick={(stall) => setSelectedStall(stall)}
              />
            </div>
          </div>
        )}

        {/* All Stalls Tab */}
        {activeTab === 'all-stalls' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-slate-800">Map B</h2>
              <p className="text-sm text-slate-500">Click on any stall to view details or manage its reservation.</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 pt-3 pb-0 border-b border-slate-100">
                <div className="flex items-center gap-4 text-[11px] text-slate-500 pb-3">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />Available</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" />Pending</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />Reserved</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block" />Occupied</span>
                </div>
              </div>
              <StallGridView
                stalls={stallsAllStalls}
                onStallClick={(stall) => setSelectedStall(stall)}
                selectedStallId={selectedStall?.id}
              />
            </div>
          </div>
        )}
        {/* Vendors Tab */}
        {activeTab === 'vendors' && (
          <VendorManagement />
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
          source={activeTab === 'all-stalls' ? 'all_stalls' : 'design_map'}
        />
      )}
      {receiptData && (
        <ReceiptModal
          reservation={receiptData.reservation}
          stall={receiptData.stall}
          onClose={() => { setReceiptData(null); void loadData(); }}
        />
      )}
      {activeReservation && (
        <ReservationDetailsModal
          reservation={activeReservation}
          stall={getStallForReservation(activeReservation)}
          onClose={() => setActiveReservationId(null)}
          onUpdate={() => { void loadData(); }}
        />
      )}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowLogoutConfirm(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 text-center">
            <h3 className="text-lg font-black text-slate-800">Log out?</h3>
            <p className="text-sm text-slate-500 mt-2">You will be signed out of the admin panel.</p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowResetConfirm(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 text-center">
            <h3 className="text-lg font-black text-slate-800">Reset all stalls?</h3>
            <p className="text-sm text-slate-500 mt-2">
              This will set every stall to available, clear all reservations, and reset the counter.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
                <span>Clear reservations</span>
              </div>
              <span className="text-slate-400">→</span>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                <span>Stalls available</span>
              </div>
              <span className="text-slate-400">→</span>
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Counter reset</span>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold py-2.5 rounded-xl transition-colors"
                disabled={isResetting}
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
                disabled={isResetting}
              >
                {isResetting ? 'Resetting...' : 'Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showExtendConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowExtendConfirm(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 text-center">
            <h3 className="text-lg font-black text-slate-800">Extend pending reservations?</h3>
            <p className="text-sm text-slate-500 mt-2">
              This adds 1 day to the expiry of all pending reservations.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowExtendConfirm(false)}
                className="flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold py-2.5 rounded-xl transition-colors"
                disabled={isExtending}
              >
                Cancel
              </button>
              <button
                onClick={handleExtend}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
                disabled={isExtending}
              >
                {isExtending ? 'Extending...' : 'Extend'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    </div>
  );
}

function StatCard({
  icon, label, value, suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-slate-100 text-slate-800">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black leading-tight text-slate-800">{value}{suffix}</p>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, dotColor }: { label: string; value: number; dotColor: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5 text-xs text-slate-500">
        <span className={`w-2 h-2 rounded-full ${dotColor} inline-block`} />
        {label}
      </span>
      <span className="text-sm font-bold text-slate-800">{value}</span>
    </div>
  );
}
