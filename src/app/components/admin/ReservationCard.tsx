import React, { useState } from 'react';
import {
  User, Phone, MapPin, Calendar, Clock, Building2, CheckCircle,
  XCircle, Package, ChevronDown, ChevronUp, ShieldCheck, AlertCircle,
  Hash
} from 'lucide-react';
import { Reservation, Stall } from '../../types';
import { formatDate, getDaysRemaining, getStatusLabel, getStatusTextClass, isExpired } from '../../utils/helpers';
import { approveReservation, rejectReservation, markAsOccupied } from '../../utils/storage';

interface ReservationCardProps {
  reservation: Reservation;
  stall?: Stall;
  onUpdate: () => void;
}

const STATUS_CONFIG: Record<string, {
  strip: string;
  badgeBg: string;
  badgeText: string;
  pillBg: string;
  pillText: string;
  dot: string;
}> = {
  pending: {
    strip: 'bg-amber-400',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    pillBg: 'bg-amber-100',
    pillText: 'text-amber-700',
    dot: 'bg-amber-400',
  },
  approved: {
    strip: 'bg-blue-600',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    pillBg: 'bg-blue-100',
    pillText: 'text-blue-700',
    dot: 'bg-blue-500',
  },
  occupied: {
    strip: 'bg-slate-500',
    badgeBg: 'bg-slate-50',
    badgeText: 'text-slate-600',
    pillBg: 'bg-slate-100',
    pillText: 'text-slate-600',
    dot: 'bg-slate-400',
  },
  rejected: {
    strip: 'bg-red-500',
    badgeBg: 'bg-red-50',
    badgeText: 'text-red-700',
    pillBg: 'bg-red-100',
    pillText: 'text-red-600',
    dot: 'bg-red-500',
  },
};

export function ReservationCard({ reservation, stall, onUpdate }: ReservationCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const daysLeft = getDaysRemaining(reservation.expiresAt);
  const expired = isExpired(reservation.expiresAt);

  async function handleApprove() {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 600));
    approveReservation(reservation.id);
    setIsProcessing(false);
    onUpdate();
  }

  async function handleReject() {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 600));
    rejectReservation(reservation.id, rejectNotes || 'Rejected by admin.');
    setIsProcessing(false);
    setShowRejectForm(false);
    onUpdate();
  }

  async function handleMarkOccupied() {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 600));
    markAsOccupied(reservation.id);
    setIsProcessing(false);
    onUpdate();
  }

  const cfg = STATUS_CONFIG[reservation.status] ?? STATUS_CONFIG.rejected;

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex transition-all hover:shadow-md">
      {/* Left status strip */}
      <div className={`w-1.5 shrink-0 ${cfg.strip}`} />

      {/* Card body */}
      <div className="flex-1 min-w-0">
        {/* Main header */}
        <div className="px-4 pt-4 pb-3">
          {/* Top row: Res number + status badge */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Hash className="w-3 h-3 text-slate-400 shrink-0" />
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Reservation</p>
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-wider leading-tight">{reservation.reservationNumber}</h3>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0 mt-0.5">
              {/* Status badge */}
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.pillBg} ${cfg.pillText}`}>
                {getStatusLabel(reservation.status)}
              </span>
              {/* Expiry pill (only for pending) */}
              {reservation.status === 'pending' && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  expired
                    ? 'bg-red-100 text-red-600'
                    : daysLeft <= 1
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-slate-100 text-slate-500'
                }`}>
                  {expired ? '⚠ Expired' : `${daysLeft}d left`}
                </span>
              )}
            </div>
          </div>

          {/* Stall + name row */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${cfg.badgeBg}`}>
                <MapPin className={`w-3.5 h-3.5 ${cfg.badgeText}`} />
              </span>
              <span className="text-sm font-bold text-slate-800">
                Stall {reservation.stallId}
                {stall && <span className="text-slate-400 font-normal"> — {stall.category}</span>}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-slate-400" />
              </span>
              <span className="text-sm text-slate-600">{reservation.fullName}</span>
            </div>
          </div>

          {/* Date row */}
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
            <Calendar className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <span className="text-xs text-slate-400">Created: {formatDate(reservation.createdAt)}</span>
          </div>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <span>{expanded ? 'Hide Details' : 'View Details'}</span>
          {expanded
            ? <ChevronUp className="w-4 h-4" />
            : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Expanded section */}
        {expanded && (
          <div className="px-4 pb-4 pt-3 border-t border-slate-100 space-y-4">
            {/* Contact details */}
            <div className="space-y-2">
              <InfoRow icon={<Phone className="w-3.5 h-3.5 text-slate-400" />} value={reservation.contactNumber} />
              {reservation.businessName && (
                <InfoRow icon={<Building2 className="w-3.5 h-3.5 text-slate-400" />} value={reservation.businessName} />
              )}
              {reservation.address && (
                <InfoRow icon={<MapPin className="w-3.5 h-3.5 text-slate-400" />} value={reservation.address} />
              )}
              <InfoRow
                icon={<Clock className="w-3.5 h-3.5 text-slate-400" />}
                value={
                  <span>
                    Expires:{' '}
                    <span className={expired ? 'text-red-600 font-semibold' : 'text-slate-700'}>
                      {formatDate(reservation.expiresAt)}
                    </span>
                  </span>
                }
              />
            </div>

            {/* Admin notes */}
            {reservation.adminNotes && (
              <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 border border-slate-200">
                <span className="font-semibold text-slate-700">Notes: </span>{reservation.adminNotes}
              </div>
            )}

            {/* QR Code row */}
            <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-3 border border-slate-200">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(
                  reservation.reservationNumber + '|' + reservation.stallId
                )}&margin=5`}
                alt="QR Code"
                width={72}
                height={72}
                className="rounded-lg border border-slate-200 shrink-0"
              />
              <div>
                <p className="text-xs font-bold text-slate-700">Verification QR</p>
                <p className="text-xs text-slate-400 mt-0.5">Scan to verify reservation</p>
                <p className="text-[11px] text-slate-400 mt-1">Updated: {formatDate(reservation.updatedAt)}</p>
              </div>
            </div>

            {/* Admin Actions */}
            {!isProcessing && (
              <div className="border-t border-slate-100 pt-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Admin Actions</p>

                {reservation.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleApprove}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2.5 rounded-xl transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      onClick={() => setShowRejectForm(!showRejectForm)}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold px-3 py-2.5 rounded-xl transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                )}

                {reservation.status === 'approved' && (
                  <button
                    onClick={handleMarkOccupied}
                    className="w-full flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2.5 rounded-xl transition-colors"
                  >
                    <Package className="w-3.5 h-3.5" />
                    Mark as Occupied
                  </button>
                )}

                {(reservation.status === 'occupied' || reservation.status === 'rejected') && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-200">
                    <ShieldCheck className="w-4 h-4" />
                    No further actions available.
                  </div>
                )}
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center justify-center gap-2 py-3 text-sm text-slate-500">
                <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                Processing...
              </div>
            )}

            {showRejectForm && reservation.status === 'pending' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  <p className="text-xs font-bold text-red-700">Rejection Reason (optional)</p>
                </div>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  rows={2}
                  className="w-full border border-red-200 rounded-lg p-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-red-400 bg-white"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleReject}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                  >
                    Confirm Rejection
                  </button>
                  <button
                    onClick={() => setShowRejectForm(false)}
                    className="flex-1 border border-red-200 text-red-600 text-xs font-bold py-2 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="text-sm text-slate-600 leading-snug">{value}</span>
    </div>
  );
}
