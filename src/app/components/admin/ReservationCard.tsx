import React, { useState } from 'react';
import {
  User, Phone, MapPin, Calendar, Clock, Building2, CheckCircle,
  XCircle, Package, ChevronDown, ChevronUp, ShieldCheck, AlertCircle
} from 'lucide-react';
import { Reservation, Stall } from '../../types';
import { formatDate, getDaysRemaining, getStatusLabel, getStatusTextClass, isExpired } from '../../utils/helpers';
import { approveReservation, rejectReservation, markAsOccupied } from '../../utils/storage';

interface ReservationCardProps {
  reservation: Reservation;
  stall?: Stall;
  onUpdate: () => void;
}

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

  const statusConfig: Record<string, { border: string; accent: string }> = {
    pending:  { border: 'border-amber-200',  accent: 'bg-amber-500' },
    approved: { border: 'border-blue-200',   accent: 'bg-blue-600' },
    occupied: { border: 'border-slate-200',  accent: 'bg-slate-500' },
    rejected: { border: 'border-red-200',    accent: 'bg-red-500' },
  };
  const cfg = statusConfig[reservation.status] ?? statusConfig.rejected;

  return (
    <div className={`bg-white rounded-2xl border transition-all overflow-hidden shadow-sm ${cfg.border}`}>
      {/* Colored top accent bar */}
      <div className={`h-1 w-full ${cfg.accent}`} />

      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-0.5">Reservation</p>
            <h3 className="text-base font-black text-slate-900 tracking-wider">{reservation.reservationNumber}</h3>

            <div className="flex items-center gap-1.5 mt-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-sm font-semibold text-blue-700">
                Stall {reservation.stallId}
                {stall && <span className="text-slate-400 font-normal"> — {stall.category}</span>}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-1">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-sm text-slate-600">{reservation.fullName}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${getStatusTextClass(reservation.status)}`}>
              {getStatusLabel(reservation.status)}
            </span>

            {reservation.status === 'pending' && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                expired ? 'bg-red-100 text-red-600' :
                daysLeft <= 1 ? 'bg-orange-100 text-orange-600' :
                'bg-slate-100 text-slate-500'
              }`}>
                {expired ? '⚠ Expired' : `${daysLeft}d left`}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Created: {formatDate(reservation.createdAt)}</span>
        </div>
      </div>

      {/* Expand/Collapse toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
      >
        <span>{expanded ? 'Hide Details' : 'View Details'}</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="p-4 border-t border-slate-100 space-y-3">
          <div className="grid grid-cols-1 gap-2">
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
                  Expires: <span className={expired ? 'text-red-600 font-semibold' : 'text-slate-700'}>
                    {formatDate(reservation.expiresAt)}
                  </span>
                </span>
              }
            />
          </div>

          {reservation.adminNotes && (
            <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 border border-slate-200">
              <span className="font-semibold text-slate-700">Notes: </span>{reservation.adminNotes}
            </div>
          )}

          {/* QR Code */}
          <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-3 border border-slate-200">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(reservation.reservationNumber + '|' + reservation.stallId)}&margin=5`}
              alt="QR Code"
              width={80}
              height={80}
              className="rounded-lg border border-slate-200 shrink-0"
            />
            <div>
              <p className="text-xs font-bold text-slate-700">Verification QR</p>
              <p className="text-xs text-slate-400 mt-0.5">Scan to verify reservation</p>
              <p className="text-xs text-slate-400 mt-1">Updated: {formatDate(reservation.updatedAt)}</p>
            </div>
          </div>

          {/* Admin Actions */}
          {!isProcessing && (
            <div className="pt-1 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Admin Actions</p>

              {reservation.status === 'pending' && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleApprove}
                    className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectForm(!showRejectForm)}
                    className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              )}

              {reservation.status === 'approved' && (
                <button
                  onClick={handleMarkOccupied}
                  className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                >
                  <Package className="w-3.5 h-3.5" />
                  Mark as Occupied
                </button>
              )}

              {(reservation.status === 'occupied' || reservation.status === 'rejected') && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 rounded-lg px-3 py-2">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
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
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-1">
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
