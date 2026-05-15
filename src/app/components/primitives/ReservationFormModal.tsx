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
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder="Juan Dela Cruz"
                className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all
                  ${errors.fullName ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-400'}`}
                disabled={isSubmitting}
              />
            </div>
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Contact Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => handleChange('contactNumber', e.target.value)}
                placeholder="09XXXXXXXXX"
                className={`w-full pl-10 pr-4 py-2.5 border-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all
                  ${errors.contactNumber ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-400'}`}
                disabled={isSubmitting}
              />
            </div>
            {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
          </div>

          {/* Business Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Business Name <span className="text-gray-400 font-normal text-xs">(optional)</span>
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => handleChange('businessName', e.target.value)}
                placeholder="My Store Name"
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Home Address <span className="text-gray-400 font-normal text-xs">(optional)</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Barangay, Municipality, Province"
                rows={2}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all resize-none"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Reservation expires in <strong>3 days</strong> if not processed at the BPLO office. This does not guarantee final approval.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white rounded-xl py-2.5 text-sm font-bold transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
