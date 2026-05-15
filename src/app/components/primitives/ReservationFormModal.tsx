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
}

export function ReservationFormModal({ stall, onClose, onSuccess }: ReservationFormModalProps) {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    contactNumber: '',
    businessName: '',
    address: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!stall) return null;

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required.';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Please enter your full name.';
    }
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required.';
