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
