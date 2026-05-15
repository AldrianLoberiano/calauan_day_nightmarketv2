import React, { useState } from 'react';
import { X, User, Phone, Building2, MapPin, Loader2 } from 'lucide-react';
import { Stall, Reservation } from '../../types';
import { formatPeso } from '../../utils/helpers';
import { addReservation, updateStall, generateReservationNumber, generateUUID } from '../../utils/storage';

interface ReservationFormModalProps {
  stall: Stall | null;
  onClose: () => void;
  onSuccess: (reservation: Reservation, stall: Stall) => void;
}

interface FormData {
  fullName: string;
  contactNumber: string;
  businessName: string;
  address: string;
}

interface FormErrors {
  fullName?: string;
  contactNumber?: string;
