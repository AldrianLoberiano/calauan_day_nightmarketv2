import {
  User, MapPin, Calendar, ChevronRight
} from 'lucide-react';
import { Reservation, Stall } from '../../types';
import { formatDate, getDaysRemaining, isExpired, getDisplayStallId } from '../../utils/helpers';

interface ReservationCardProps {
  reservation: Reservation;
  stall?: Stall;
  onView: () => void;
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
    headerBg:  'bg-amber-500',
    headerText: 'text-white',
    subText:   'text-amber-100',
    badge:     'bg-white text-amber-700',
    badgeText: 'Pending',
    dot:       'bg-amber-300',
  },
  approved: {
    headerBg:  'bg-blue-700',
    headerText: 'text-white',
    subText:   'text-blue-200',
    badge:     'bg-white text-blue-700',
    badgeText: 'Approved',
    dot:       'bg-blue-300',
  },
  occupied: {
    headerBg:  'bg-slate-600',
    headerText: 'text-white',
    subText:   'text-slate-300',
    badge:     'bg-white text-slate-600',
    badgeText: 'Occupied',
    dot:       'bg-slate-400',
  },
  rejected: {
    headerBg:  'bg-red-600',
    headerText: 'text-white',
    subText:   'text-red-200',
    badge:     'bg-white text-red-600',
    badgeText: 'Rejected',
    dot:       'bg-red-300',
  },
};

export function ReservationCard({ reservation, stall, onView }: ReservationCardProps) {

  const daysLeft   = getDaysRemaining(reservation.expiresAt);
  const expired    = isExpired(reservation.expiresAt);
  const cfg        = STATUS[reservation.status] ?? STATUS.rejected;

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 bg-white">

      {/* ── Colored ticket header ───────────────────────────── */}
      <div className={`${cfg.headerBg} px-3 pt-3 pb-3 relative`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`text-[9px] font-bold uppercase tracking-widest ${cfg.subText} mb-0.5`}>
              Reservation No.
            </p>
            <h3 className={`text-sm font-black leading-tight ${cfg.headerText} break-all`}>
              {reservation.reservationNumber}
            </h3>
          </div>
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full shadow-sm shrink-0 ${cfg.badge}`}>
            {cfg.badgeText}
          </span>
        </div>

        {/* Stall info inside header */}
        <div className={`mt-2 flex items-center gap-1 text-xs font-semibold ${cfg.headerText}`}>
          <MapPin className="w-3 h-3 opacity-80 shrink-0" />
          <span>Stall {getDisplayStallId(reservation.stallId)}</span>
          {stall && <span className={`font-normal ${cfg.subText}`}>— {stall.category}</span>}
        </div>
      </div>

      {/* ── Ticket perforation line ──────────────────────────── */}
      <div className="relative flex items-center">
        <div className={`w-3 h-3 rounded-full -ml-1.5 ${cfg.headerBg} border-2 border-white z-10`} />
        <div className="flex-1 border-t border-dashed border-slate-200 mx-1" />
        <div className={`w-3 h-3 rounded-full -mr-1.5 ${cfg.headerBg} border-2 border-white z-10`} />
      </div>

      {/* ── White body ──────────────────────────────────────── */}
      <div className="px-3 pt-2 pb-1">
        {/* Applicant + expiry */}
        <div className="flex items-center justify-between gap-2">
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

        {/* Date */}
        <div className="flex items-center gap-1.5 mt-3 mb-1">
          <Calendar className="w-3 h-3 text-slate-300 shrink-0" />
          <span className="text-[11px] text-slate-400">Created: {formatDate(reservation.createdAt)}</span>
        </div>
      </div>

      {/* ── Expand toggle ───────────────────────────────────── */}
      <button
        onClick={onView}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
      >
        <span>View Details</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
