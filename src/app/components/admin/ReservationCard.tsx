import React, { useState } from 'react';
import {
  User, Phone, MapPin, Calendar, Clock, Building2, CheckCircle,
  XCircle, Package, ChevronDown, ChevronUp, ShieldCheck
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

  const borderColor =
    reservation.status === 'pending' ? 'border-yellow-300' :
    reservation.status === 'approved' ? 'border-blue-300' :
    reservation.status === 'occupied' ? 'border-gray-300' :
    'border-red-200';

  return (
    <div className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${borderColor} overflow-hidden`}>
      {/* Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">Reservation</p>
            <h3 className="text-lg font-black text-gray-900 tracking-wider">{reservation.reservationNumber}</h3>

            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-sm font-semibold text-blue-700">
                Stall {reservation.stallId}
                {stall && <span className="text-gray-400 font-normal"> — {stall.category}</span>}
              </span>
            </div>

            <div className="flex items-center gap-1.5 mt-1">
              <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-700">{reservation.fullName}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${getStatusTextClass(reservation.status)}`}>
              {getStatusLabel(reservation.status)}
            </span>

            {reservation.status === 'pending' && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                expired ? 'bg-red-100 text-red-600' :
                daysLeft <= 1 ? 'bg-orange-100 text-orange-600' :
                'bg-gray-100 text-gray-500'
              }`}>
                {expired ? 'Expired' : `${daysLeft}d left`}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mt-2">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-400">Created: {formatDate(reservation.createdAt)}</span>
        </div>
      </div>

      {/* Expand/Collapse toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <span>{expanded ? 'Hide Details' : 'View Details'}</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="p-4 border-t border-gray-100 space-y-3">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-700">{reservation.contactNumber}</span>
          </div>

          {reservation.businessName && (
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-sm text-gray-700">{reservation.businessName}</span>
            </div>
          )}

          {reservation.address && (
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">{reservation.address}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-600">
              Expires: <span className={expired ? 'text-red-600 font-semibold' : 'text-gray-700'}>
                {formatDate(reservation.expiresAt)}
              </span>
            </span>
          </div>

          {reservation.adminNotes && (
            <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 border border-gray-200">
              <strong>Notes:</strong> {reservation.adminNotes}
            </div>
          )}

          <div className="flex items-center gap-4 pt-2">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(reservation.reservationNumber + '|' + reservation.stallId)}&margin=5`}
              alt="QR Code"
              width={80}
              height={80}
              className="rounded-lg border border-gray-200"
            />
            <div>
              <p className="text-xs font-bold text-gray-600">Verification QR</p>
              <p className="text-xs text-gray-400">Scan to verify reservation</p>
              <p className="text-xs text-gray-500 mt-1">Updated: {formatDate(reservation.updatedAt)}</p>
            </div>
          </div>

          {/* Admin Actions */}
          {!isProcessing && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Admin Actions</p>

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
                  className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-800 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors"
                >
                  <Package className="w-3.5 h-3.5" />
                  Mark as Occupied
                </button>
              )}

              {(reservation.status === 'occupied' || reservation.status === 'rejected') && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <ShieldCheck className="w-4 h-4" />
                  No further actions available.
                </div>
              )}
            </div>
          )}

          {isProcessing && (
            <div className="text-center py-2 text-sm text-gray-500">
              ⏳ Processing...
            </div>
          )}

          {showRejectForm && reservation.status === 'pending' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-2">
              <p className="text-xs font-bold text-red-700 mb-2">Rejection Reason (optional):</p>
              <textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={2}
                className="w-full border border-red-300 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-red-400"
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
                  className="flex-1 border border-red-300 text-red-600 text-xs font-bold py-2 rounded-lg hover:bg-red-100 transition-colors"
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
