import React, { useRef } from 'react';
import { X, Printer, CheckCircle, MapPin, Phone, User, Calendar, Building2, Clock } from 'lucide-react';
import { Reservation, Stall } from '../types';
import { formatDate, formatPeso } from '../utils/helpers';

interface ReceiptModalProps {
  reservation: Reservation | null;
  stall: Stall | null;
  onClose: () => void;
}

