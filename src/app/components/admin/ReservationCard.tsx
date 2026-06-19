import {
  User, MapPin, Calendar, ChevronRight, Clock
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
    headerBg:  'bg-gradient-to-r from-amber-400 to-amber-500',
    headerText: 'text-white',
    subText:   'text-amber-100',
    badge:     'bg-white text-amber-700',
    badgeText: 'Pending',
    dot:       'bg-amber-300',
  },
  approved: {
    headerBg:  'bg-gradient-to-r from-blue-500 to-blue-600',
    headerText: 'text-white',
    subText:   'text-blue-200',
    badge:     'bg-white text-blue-700',
    badgeText: 'Approved',
    dot:       'bg-blue-300',
  },
  occupied: {
    headerBg:  'bg-gradient-to-r from-slate-500 to-slate-600',
    headerText: 'text-white',
    subText:   'text-slate-300',
    badge:     'bg-white text-slate-600',
    badgeText: 'Occupied',
    dot:       'bg-slate-400',
  },
  rejected: {
    headerBg:  'bg-gradient-to-r from-red-400 to-red-500',
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
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">

      {/* ── Colored ticket header ───────────────────────────── */}
      <div className={`${cfg.headerBg} px-4 pt-4 pb-3 relative`}>
        {/* Decorative circle cutouts */}
        <div className="absolute bottom-0 left-0 translate-y-1/2 -ml-1.5 w-3 h-3 rounded-full bg-slate-50" />
        <div className="absolute bottom-0 right-0 translate-y-1/2 -mr-1.5 w-3 h-3 rounded-full bg-slate-50" />

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`text-[10px] font-bold uppercase tracking-widest ${cfg.subText} mb-1`}>
              Reservation No.
            </p>
            <h3 className={`text-sm font-black leading-tight ${cfg.headerText} break-all`}>
              {reservation.reservationNumber}
            </h3>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm shrink-0 ${cfg.badge}`}>
            {cfg.badgeText}
          </span>
        </div>

        {/* Stall info inside header */}
        <div className={`mt-2.5 flex items-center gap-1.5 text-xs font-semibold ${cfg.headerText}`}>
          <MapPin className="w-3.5 h-3.5 opacity-80 shrink-0" />
          <span>Stall {getDisplayStallId(reservation.stallId)}</span>
          {stall && <span className={`font-normal ${cfg.subText}`}> — {stall.category}</span>}
        </div>
      </div>

      {/* ── Ticket perforation line ──────────────────────────── */}
      <div className="relative flex items-center">
        <div className={`w-3 h-3 rounded-full -ml-1.5 ${cfg.headerBg} border-2 border-white z-10`} />
        <div className="flex-1 border-t border-dashed border-slate-200 mx-1" />
        <div className={`w-3 h-3 rounded-full -mr-1.5 ${cfg.headerBg} border-2 border-white z-10`} />
      </div>

      {/* ── White body ──────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-2 space-y-2.5">
        {/* Applicant */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <span className="text-sm font-semibold text-slate-800 truncate">{reservation.fullName}</span>
        </div>

        {/* Details row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-slate-300 shrink-0" />
            <span className="text-[11px] text-slate-400">{formatDate(reservation.createdAt)}</span>
          </div>

          {reservation.status === 'pending' && (
            <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
              expired
                ? 'bg-red-100 text-red-600'
                : daysLeft <= 1
                ? 'bg-orange-100 text-orange-600'
                : 'bg-slate-100 text-slate-500'
            }`}>
              <Clock className="w-3 h-3" />
              {expired ? 'Expired' : `${daysLeft}d left`}
            </span>
          )}
        </div>
      </div>

      {/* ── View Details button ─────────────────────────────── */}
      <button
        onClick={onView}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border-t border-slate-100 text-xs font-semibold text-slate-600 transition-colors"
      >
        View Details
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
