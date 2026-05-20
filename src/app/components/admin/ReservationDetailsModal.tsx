import React, { useState } from 'react';
import {
  X, User, Phone, MapPin, Clock, Building2, CheckCircle,
  XCircle, Package, AlertCircle, Calendar, ShieldCheck, Tag
} from 'lucide-react';
import { Reservation, Stall } from '../../types';
import { formatDate, getDaysRemaining, isExpired, getDisplayStallId } from '../../utils/helpers';
import { approveReservation, rejectReservation, markAsOccupied, updateReservationAdmin, deleteReservation } from '../../utils/storage';

interface ReservationDetailsModalProps {
  reservation: Reservation;
  stall?: Stall;
  onClose: () => void;
  onUpdate: () => void;
}

const STATUS: Record<string, {
  headerBg: string;
  headerText: string;
  subText: string;
  badge: string;
  badgeText: string;
  dot: string;
}> = {
  pending: {
    headerBg: 'bg-amber-500',
    headerText: 'text-white',
    subText: 'text-amber-100',
    badge: 'bg-white text-amber-700',
    badgeText: 'Pending',
    dot: 'bg-amber-300',
  },
  approved: {
    headerBg: 'bg-blue-700',
    headerText: 'text-white',
    subText: 'text-blue-200',
    badge: 'bg-white text-blue-700',
    badgeText: 'Approved',
    dot: 'bg-blue-300',
  },
  occupied: {
    headerBg: 'bg-slate-600',
    headerText: 'text-white',
    subText: 'text-slate-300',
    badge: 'bg-white text-slate-600',
    badgeText: 'Occupied',
    dot: 'bg-slate-400',
  },
  rejected: {
    headerBg: 'bg-red-600',
    headerText: 'text-white',
    subText: 'text-red-200',
    badge: 'bg-white text-red-600',
    badgeText: 'Rejected',
    dot: 'bg-red-300',
  },
};

export function ReservationDetailsModal({
  reservation,
  stall,
  onClose,
  onUpdate,
}: ReservationDetailsModalProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Reservation>({ ...reservation });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const daysLeft = getDaysRemaining(reservation.expiresAt);
  const expired = isExpired(reservation.expiresAt);
  const cfg = STATUS[reservation.status] ?? STATUS.rejected;

  async function handleApprove() {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 600));
    await approveReservation(reservation.id);
    setIsProcessing(false);
    onUpdate();
  }

  async function handleReject() {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 600));
    await rejectReservation(reservation.id, rejectNotes || 'Rejected by admin.');
    setIsProcessing(false);
    setShowRejectForm(false);
    onUpdate();
  }

  async function handleMarkOccupied() {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 600));
    await markAsOccupied(reservation.id);
    setIsProcessing(false);
    onUpdate();
  }

  async function handleSaveChanges() {
    setIsProcessing(true);
    const updated: Reservation = {
      ...editData,
      updatedAt: new Date().toISOString(),
    };
    await updateReservationAdmin(updated);
    await new Promise(r => setTimeout(r, 400));
    setIsProcessing(false);
    setIsEditing(false);
    onUpdate();
  }

  async function handleDelete() {
    setIsProcessing(true);
    await deleteReservation(reservation.id);
    await new Promise(r => setTimeout(r, 400));
    setIsProcessing(false);
    setShowDeleteConfirm(false);
    onUpdate();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className={`${cfg.headerBg} px-5 py-4 relative`}>
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '14px 14px',
            }}
          />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${cfg.subText} mb-1`}>
                Reservation No.
              </p>
              <h3 className={`text-xl font-black tracking-wider leading-none ${cfg.headerText}`}>
                {reservation.reservationNumber}
              </h3>
              <div className={`mt-2 flex items-center gap-1.5 text-sm font-semibold ${cfg.headerText}`}>
                <MapPin className="w-3.5 h-3.5 opacity-80 shrink-0" />
                <span>Stall {getDisplayStallId(reservation.stallId)}</span>
                {stall && <span className={`font-normal text-xs ${cfg.subText}`}>— {stall.category}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-sm shrink-0 ${cfg.badge}`}>
                {cfg.badgeText}
              </span>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <span className="text-sm font-semibold text-slate-700 truncate">{reservation.fullName}</span>
            </div>
            {reservation.status === 'pending' && (
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                expired
                  ? 'bg-red-100 text-red-600'
                  : daysLeft <= 1
                  ? 'bg-orange-100 text-orange-600'
                  : 'bg-slate-100 text-slate-500'
              }`}>
                {expired ? 'Expired' : `${daysLeft}d left`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-slate-300 shrink-0" />
            <span className="text-[11px] text-slate-400">Created: {formatDate(reservation.createdAt)}</span>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2.5">
            {isEditing ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Full Name</label>
                  <input
                    value={editData.fullName}
                    onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Contact Number</label>
                  <input
                    value={editData.contactNumber}
                    onChange={(e) => setEditData({ ...editData, contactNumber: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Business Name</label>
                  <input
                    value={editData.businessName ?? ''}
                    onChange={(e) => setEditData({ ...editData, businessName: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600">DTI Number</label>
                  <input
                    value={editData.dtiNumber ?? ''}
                    onChange={(e) => setEditData({ ...editData, dtiNumber: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Cedula Number</label>
                  <input
                    value={editData.cedulaNumber ?? ''}
                    onChange={(e) => setEditData({ ...editData, cedulaNumber: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600">Status</label>
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value as Reservation['status'] })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="occupied">Occupied</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600">Address</label>
                  <input
                    value={editData.address ?? ''}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600">Price</label>
                  <input
                    value={editData.price ?? ''}
                    onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600">Admin Notes</label>
                  <textarea
                    value={editData.adminNotes ?? ''}
                    onChange={(e) => setEditData({ ...editData, adminNotes: e.target.value })}
                    rows={2}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            ) : (
              <>
                <InfoRow icon={<Phone className="w-3.5 h-3.5 text-slate-400" />} value={reservation.contactNumber} />
                {reservation.businessName && (
                  <InfoRow icon={<Building2 className="w-3.5 h-3.5 text-slate-400" />} value={reservation.businessName} />
                )}
                {reservation.dtiNumber && (
                  <InfoRow icon={<ShieldCheck className="w-3.5 h-3.5 text-slate-400" />} value={`DTI: ${reservation.dtiNumber}`} />
                )}
                {reservation.cedulaNumber && (
                  <InfoRow icon={<ShieldCheck className="w-3.5 h-3.5 text-slate-400" />} value={`Cedula: ${reservation.cedulaNumber}`} />
                )}
                {reservation.price && (
                  <InfoRow icon={<Tag className="w-3.5 h-3.5 text-slate-400" />} value={`Price: ${reservation.price}`} />
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
              </>
            )}
          </div>

          {reservation.adminNotes && (
            <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 border border-slate-200">
              <strong className="text-slate-700">Notes:</strong> {reservation.adminNotes}
            </div>
          )}

          <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
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

          {!isProcessing && (
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Actions</p>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing((prev) => !prev)}
                  className="flex-1 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold py-2.5 rounded-xl transition-colors"
                >
                  {isEditing ? 'Cancel Edit' : 'Edit'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold py-2.5 rounded-xl transition-colors"
                >
                  Delete
                </button>
              </div>

              {isEditing && (
                <button
                  onClick={handleSaveChanges}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
                >
                  Save Changes
                </button>
              )}

              {reservation.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={handleApprove}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectForm(!showRejectForm)}
                    className="flex-1 flex items-center justify-center gap-1.5 border border-red-300 text-red-600 hover:bg-red-50 text-xs font-bold py-2.5 rounded-xl transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              )}

              {reservation.status === 'approved' && (
                <button
                  onClick={handleMarkOccupied}
                  className="w-full flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
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
      </div>
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-5 text-center">
            <h3 className="text-lg font-black text-slate-800">Delete reservation?</h3>
            <p className="text-sm text-slate-500 mt-2">This action cannot be undone.</p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
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
