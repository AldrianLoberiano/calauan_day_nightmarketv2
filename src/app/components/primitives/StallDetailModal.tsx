import React from 'react';
import { X, MapPin, Tag, Ruler, ShoppingBag, CheckCircle, Clock, XCircle, MinusCircle } from 'lucide-react';
import { Stall } from '../../types';
import { formatPeso, getStatusTextClass, getStatusLabel } from '../../utils/helpers';

interface StallDetailModalProps {
  stall: Stall | null;
  onClose: () => void;
  onReserve: (stall: Stall) => void;
}

export function StallDetailModal({ stall, onClose, onReserve }: StallDetailModalProps) {
  if (!stall) return null;

  const statusIcon: Record<string, React.ReactNode> = {
    available: <CheckCircle className="w-3.5 h-3.5" />,
    pending:   <Clock className="w-3.5 h-3.5" />,
    reserved:  <XCircle className="w-3.5 h-3.5" />,
    occupied:  <MinusCircle className="w-3.5 h-3.5" />,
  };

  const sizeLabel: Record<string, string> = {
    small:  'Small (6 sqm)',
    medium: 'Medium (10 sqm)',
    large:  'Large (16 sqm)',
    corner: 'Corner (20 sqm)',
  };

  const locationLabel = stall.number > 0
    ? `Section ${stall.section}, Stall ${stall.id}`
    : `Section ${stall.section}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Stall Image */}
        <div className="relative h-44 sm:h-52 overflow-hidden bg-slate-100">
          <img
            src={stall.image}
            alt={`Stall ${stall.id}`}
            className="w-full h-full object-cover"
          />
          {/* Dark scrim only at bottom */}
          <div className="absolute inset-0 bg-slate-900/30" />
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-slate-900/50" />

          {/* Stall ID & Category */}
          <div className="absolute bottom-3 left-4">
            <h2 className="text-white text-2xl font-black drop-shadow-sm">Stall {stall.id}</h2>
            <p className="text-white/80 text-sm font-medium">{stall.category}</p>
          </div>

          {/* Status badge */}
          <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${getStatusTextClass(stall.status)} ring-1 ring-white/20`}>
            {statusIcon[stall.status]}
            {getStatusLabel(stall.status)}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 left-3 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white rounded-full p-1.5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <InfoTile icon={<Tag className="w-4 h-4 text-blue-600" />} label="Monthly Rent" value={formatPeso(stall.price)} />
            <InfoTile icon={<Ruler className="w-4 h-4 text-blue-600" />} label="Size" value={sizeLabel[stall.size]} />
            <InfoTile icon={<MapPin className="w-4 h-4 text-blue-600" />} label="Location" value={locationLabel} />
            <InfoTile icon={<ShoppingBag className="w-4 h-4 text-blue-600" />} label="Type" value={stall.category} />
          </div>

          <p className="text-sm text-slate-600 leading-relaxed mb-4">{stall.description}</p>

          {stall.status === 'pending' && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">This stall is currently under review. Please check back later or choose another stall.</p>
            </div>
          )}
          {(stall.status === 'reserved' || stall.status === 'occupied') && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">This stall is not available. Please select another stall from the map.</p>
            </div>
          )}

          <div className="flex gap-2.5">
            <button
              onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl py-2.5 transition-colors text-sm font-semibold"
            >
              Close
            </button>
            {stall.status === 'available' && (
              <button
                onClick={() => onReserve(stall)}
                className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-xl py-2.5 transition-colors text-sm font-bold shadow-sm"
              >
                Reserve This Stall
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">{label}</p>
        <p className="text-sm font-bold text-slate-800 mt-0.5 leading-tight">{value}</p>
      </div>
    </div>
  );
}
