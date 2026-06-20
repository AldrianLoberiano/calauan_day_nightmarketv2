import React, { useState, useEffect } from 'react';
import {
  LogOut, Clock, CheckCircle, XCircle, Package, ClipboardList,
  MapPin, Store, RefreshCw, ChevronRight, Eye
} from 'lucide-react';
import { VendorUser, Reservation } from '../types';
import { getVendorReservations, clearVendorSession, getVendorUser } from '../utils/storage';
import { formatPeso, getDisplayStallId, getStallColorClass } from '../utils/helpers';

const bploLogo = new URL('../components/public/bplo-modified.png', import.meta.url).href;

interface VendorDashboardProps {
  vendor: VendorUser;
  onLogout: () => void;
}

export function VendorDashboard({ vendor, onLogout }: VendorDashboardProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    loadReservations();
  }, []);

  async function loadReservations() {
    setIsLoading(true);
    try {
      const data = await getVendorReservations();
      setReservations(data);
    } catch (err) {
      console.error('Failed to load reservations:', err);
    }
    setIsLoading(false);
  }

  function handleLogout() {
    clearVendorSession();
    onLogout();
  }

  const stats = {
    total: reservations.length,
    pending: reservations.filter(r => r.status === 'pending').length,
    approved: reservations.filter(r => r.status === 'approved').length,
    occupied: reservations.filter(r => r.status === 'occupied').length,
    rejected: reservations.filter(r => r.status === 'rejected').length,
  };

  function getStatusConfig(status: string) {
    switch (status) {
      case 'pending':
        return { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock };
      case 'approved':
        return { label: 'Approved', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle };
      case 'occupied':
        return { label: 'Occupied', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Package };
      case 'rejected':
        return { label: 'Rejected', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle };
      default:
        return { label: status, color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock };
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={bploLogo} alt="Logo" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-sm font-black text-slate-800 leading-tight">Night Market</h1>
              <p className="text-[11px] text-slate-500">Vendor Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-700">{vendor.fullName}</p>
              <p className="text-[11px] text-slate-400">@{vendor.username}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-xl font-black text-slate-800">Welcome, {vendor.fullName}</h2>
          <p className="text-sm text-slate-500 mt-0.5">View and manage your stall reservations</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Pending</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">Approved</p>
            <p className="text-2xl font-black text-blue-600 mt-1">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Occupied</p>
            <p className="text-2xl font-black text-slate-600 mt-1">{stats.occupied}</p>
          </div>
        </div>

        {/* Refresh */}
        <div className="flex justify-end">
          <button
            onClick={loadReservations}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Reservations List */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-500 text-sm mt-3">Loading your reservations...</p>
          </div>
        ) : reservations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-700 font-bold text-lg">No reservations yet</p>
            <p className="text-slate-400 text-sm mt-1.5 max-w-sm mx-auto">
              You haven't made any stall reservations yet. Browse available stalls to get started.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors"
            >
              Browse Stalls
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {reservations.map(res => {
              const statusConf = getStatusConfig(res.status);
              const StatusIcon = statusConf.icon;
              return (
                <div
                  key={res.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedReservation(selectedReservation?.id === res.id ? null : res)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {res.reservationNumber}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusConf.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConf.label}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-800">Stall {getDisplayStallId(res.stallId)}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatDate(res.createdAt)}
                        {res.price != null && (
                          <span className="ml-2 text-slate-400">({formatPeso(Number(res.price))}/mo)</span>
                        )}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-300 shrink-0 mt-1 transition-transform ${selectedReservation?.id === res.id ? 'rotate-90' : ''}`} />
                  </div>

                  {selectedReservation?.id === res.id && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 font-medium">Name</span>
                          <p className="text-slate-700 font-semibold">{res.fullName}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Contact</span>
                          <p className="text-slate-700 font-semibold">{res.contactNumber}</p>
                        </div>
                        {res.businessName && (
                          <div>
                            <span className="text-slate-400 font-medium">Business</span>
                            <p className="text-slate-700 font-semibold">{res.businessName}</p>
                          </div>
                        )}
                        {res.address && (
                          <div>
                            <span className="text-slate-400 font-medium">Address</span>
                            <p className="text-slate-700 font-semibold">{res.address}</p>
                          </div>
                        )}
                      </div>
                      {res.status === 'rejected' && res.adminNotes && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                          <p className="text-[11px] font-bold text-red-600 mb-0.5">Rejection Reason</p>
                          <p className="text-xs text-red-700">{res.adminNotes}</p>
                        </div>
                      )}
                      {res.status === 'pending' && (
                        <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
                          Visit the BPLO Office to process your reservation before it expires.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
