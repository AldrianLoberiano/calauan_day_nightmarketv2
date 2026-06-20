import React, { useState, useEffect, useRef } from 'react';
import {
  LogOut, Clock, CheckCircle, XCircle, Package, ClipboardList,
  MapPin, Store, RefreshCw, ChevronRight, ChevronDown, Eye, User, Phone,
  Building2, Calendar, AlertTriangle, ExternalLink
} from 'lucide-react';
import { VendorUser, Reservation } from '../../types';
import { getVendorReservations, clearVendorSession, getVendorUser } from '../../utils/storage';
import { formatPeso, getDisplayStallId, getStallColorClass } from '../../utils/helpers';

const bploLogo = '/images/bplo-modified.png';

interface VendorDashboardProps {
  vendor: VendorUser;
  onLogout: () => void;
}

export function VendorDashboard({ vendor, onLogout }: VendorDashboardProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadReservations();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
        return { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400', icon: Clock };
      case 'approved':
        return { label: 'Approved', color: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-400', icon: CheckCircle };
      case 'occupied':
        return { label: 'Occupied', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400', icon: Package };
      case 'rejected':
        return { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-400', icon: XCircle };
      default:
        return { label: status, color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400', icon: Clock };
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString('en-PH', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="relative text-white shadow-lg sticky top-0 z-40">
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{
            background: 'linear-gradient(135deg, #1a0533 0%, #2d1066 25%, #4c1d95 50%, #6b21a8 75%, #2d1066 100%)',
          }}
        />
        <div className="absolute inset-0 bg-slate-900/30 pointer-events-none" />
        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
              <img src={bploLogo} alt="Logo" className="w-9 h-9 object-contain" />
            </div>
            <div>
              <h1 className="font-black text-base sm:text-lg leading-tight tracking-tight">BPLO Night Market</h1>
              <p className="text-purple-200 text-xs hidden sm:block font-medium">
                {vendor.event ? `${vendor.event} Vendor` : 'Vendor Portal'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Profile Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all ring-1 ring-white/15 hover:ring-white/30"
              >
                <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xs font-bold ring-1 ring-white/30">
                  {vendor.fullName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline">{vendor.fullName.split(' ')[0]}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[#1e1e1e] rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50">
                  <div className="px-4 pt-4 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg ring-2 ring-white/30">
                        {vendor.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{vendor.fullName}</p>
                        <p className="text-gray-400 text-xs">{vendor.email}</p>
                      </div>
                    </div>
                  </div>
                  {vendor.businessName && (
                    <div className="px-4 py-3 border-b border-white/10">
                      <div className="flex items-center gap-2 text-gray-300 text-xs">
                        <Building2 className="w-3.5 h-3.5 text-gray-500" />
                        <span>{vendor.businessName}</span>
                      </div>
                    </div>
                  )}
                  <div className="py-2">
                    <a
                      href="/"
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                      <span>Browse Stalls</span>
                    </a>
                  </div>
                  <div className="border-t border-white/10 py-2">
                    <button
                      onClick={() => { setShowProfileMenu(false); handleLogout(); }}
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

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 relative overflow-hidden">
          <div className="relative">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800">Welcome, {vendor.fullName}</h2>
            <p className="text-slate-500 text-sm mt-0.5">View and manage your stall reservations</p>
              <div className="flex items-center gap-1.5 mt-2 text-slate-500 text-xs">
            {vendor.businessName && (
              <div className="flex items-center gap-1.5 mt-2 text-slate-500 text-xs">
                <Building2 className="w-3.5 h-3.5" />
                <span>{vendor.businessName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-black" />
              </div>
              <p className="text-[11px] font-bold text-black uppercase tracking-wider">Total</p>
            </div>
            <p className="text-2xl font-black text-black">{stats.total}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-black" />
              </div>
              <p className="text-[11px] font-bold text-black uppercase tracking-wider">Pending</p>
            </div>
            <p className="text-2xl font-black text-black">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-black" />
              </div>
              <p className="text-[11px] font-bold text-black uppercase tracking-wider">Approved</p>
            </div>
            <p className="text-2xl font-black text-black">{stats.approved}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-black" />
              </div>
              <p className="text-[11px] font-bold text-black uppercase tracking-wider">Occupied</p>
            </div>
            <p className="text-2xl font-black text-black">{stats.occupied}</p>
          </div>
        </div>

        {/* Refresh + Link */}
        <div className="flex items-center justify-between">
          <a
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-black bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Browse Stalls
          </a>
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
        <div>
          <h3 className="text-base font-bold text-slate-800 mb-3">Your Reservations</h3>
          {isLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-500 text-sm mt-3">Loading your reservations...</p>
            </div>
          ) : reservations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="w-8 h-8 text-black" />
              </div>
              <p className="text-slate-700 font-bold text-lg">No reservations yet</p>
              <p className="text-slate-400 text-sm mt-1.5 max-w-sm mx-auto">
                You haven't made any stall reservations yet. Browse available stalls to get started.
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 bg-black hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors"
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
                const isExpanded = selectedReservation?.id === res.id;
                return (
                  <div
                    key={res.id}
                    className={`bg-white rounded-2xl border transition-all cursor-pointer ${
                      isExpanded ? 'border-purple-200 shadow-md ring-1 ring-purple-100' : 'border-slate-200 hover:shadow-md'
                    }`}
                    onClick={() => setSelectedReservation(isExpanded ? null : res)}
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                              {res.reservationNumber}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusConf.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                              {statusConf.label}
                            </span>
                          </div>
                          <p className="text-sm font-bold text-slate-800">Stall {getDisplayStallId(res.stallId)}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(res.createdAt)}
                            </span>
                            {res.price != null && (
                              <span className="text-slate-400">{formatPeso(Number(res.price))}/mo</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-slate-300 shrink-0 mt-1 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 border-t border-slate-100 mt-0">
                        <div className="pt-3 space-y-3">
                          {/* Contact Details */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-start gap-2 bg-slate-50 rounded-xl p-3">
                              <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Applicant</p>
                                <p className="text-xs font-bold text-slate-700 mt-0.5">{res.fullName}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2 bg-slate-50 rounded-xl p-3">
                              <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Contact</p>
                                <p className="text-xs font-bold text-slate-700 mt-0.5">{res.contactNumber}</p>
                              </div>
                            </div>
                            {res.businessName && (
                              <div className="flex items-start gap-2 bg-slate-50 rounded-xl p-3">
                                <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Business</p>
                                  <p className="text-xs font-bold text-slate-700 mt-0.5">{res.businessName}</p>
                                </div>
                              </div>
                            )}
                            {res.address && (
                              <div className="flex items-start gap-2 bg-slate-50 rounded-xl p-3">
                                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Address</p>
                                  <p className="text-xs font-bold text-slate-700 mt-0.5">{res.address}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Rejection Reason */}
                          {res.status === 'rejected' && res.adminNotes && (
                            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                              <div>
                                <p className="text-[11px] font-bold text-red-600 mb-0.5">Rejection Reason</p>
                                <p className="text-xs text-red-700">{res.adminNotes}</p>
                              </div>
                            </div>
                          )}

                          {/* Pending Notice */}
                          {res.status === 'pending' && (
                            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                              <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                              <p className="text-xs text-amber-700">
                                Visit the BPLO Office to process your reservation before it expires.
                              </p>
                            </div>
                          )}

                          {/* Approved Notice */}
                          {res.status === 'approved' && (
                            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3">
                              <CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                              <p className="text-xs text-blue-700">
                                Your reservation has been approved! Visit the stall to set up your business.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
