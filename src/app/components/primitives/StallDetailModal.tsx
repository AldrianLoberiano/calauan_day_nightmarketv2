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
