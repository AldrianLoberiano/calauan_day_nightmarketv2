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
