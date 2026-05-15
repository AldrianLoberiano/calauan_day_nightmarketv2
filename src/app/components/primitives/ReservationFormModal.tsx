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

    addReservation(reservation);

    const updatedStall: Stall = {
      ...stall,
      status: 'pending',
      reservationId: reservation.id,
    };
    updateStall(updatedStall);

    setIsSubmitting(false);
    onSuccess(reservation, updatedStall);
  }

  function handleChange(field: keyof FormData, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-800 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Reserve Stall {stall.id}</h2>
            <p className="text-blue-200 text-sm">{stall.category} • {formatPeso(stall.price)}/month</p>
          </div>
          {!isSubmitting && (
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
            Fill in your details to reserve this stall. You will receive a <strong>Reservation Number</strong> that you must present at the <strong>BPLO Office</strong>.
          </div>

          {/* Full Name */}
          <div>
