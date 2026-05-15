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
    available: <CheckCircle className="w-4 h-4" />,
    pending: <Clock className="w-4 h-4" />,
    reserved: <XCircle className="w-4 h-4" />,
    occupied: <MinusCircle className="w-4 h-4" />,
  };

  const sizeLabel: Record<string, string> = {
    small: 'Small (6 sqm)',
    medium: 'Medium (10 sqm)',
    large: 'Large (16 sqm)',
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
        <div className="relative h-48 sm:h-56 overflow-hidden">
          <img
            src={stall.image}
            alt={`Stall ${stall.id}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          <div className="absolute bottom-3 left-4">
            <h2 className="text-white text-2xl font-bold drop-shadow-lg">Stall {stall.id}</h2>
            <p className="text-white/80 text-sm">{stall.category}</p>
          </div>

          <div className={`absolute top-3 right-3 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusTextClass(stall.status)}`}>
            {statusIcon[stall.status]}
            {getStatusLabel(stall.status)}
          </div>

          <button
            onClick={onClose}
            className="absolute top-3 left-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full p-1.5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
              <Tag className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Monthly Rent</p>
                <p className="text-sm font-bold text-gray-800">{formatPeso(stall.price)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
              <Ruler className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Size</p>
                <p className="text-sm font-bold text-gray-800 capitalize">{sizeLabel[stall.size]}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
              <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Location</p>
                <p className="text-sm font-bold text-gray-800">{locationLabel}</p>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3">
              <ShoppingBag className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Type</p>
                <p className="text-sm font-bold text-gray-800">{stall.category}</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 leading-relaxed mb-5">{stall.description}</p>

          {stall.status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-sm text-yellow-800">
              This stall is currently under review. Please check back later or choose another stall.
            </div>
          )}
          {(stall.status === 'reserved' || stall.status === 'occupied') && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-800">
