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
    } else if (!/^(09|\+639)\d{9}$/.test(formData.contactNumber.trim())) {
      newErrors.contactNumber = 'Enter a valid Philippine mobile number (e.g., 09XXXXXXXXX).';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 3);

    const reservation: Reservation = {
      id: generateUUID(),
      reservationNumber: generateReservationNumber(),
      stallId: stall.id,
      fullName: formData.fullName.trim(),
      contactNumber: formData.contactNumber.trim(),
      businessName: formData.businessName.trim() || undefined,
      address: formData.address.trim() || undefined,
      status: 'pending',
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      updatedAt: now.toISOString(),
    };
