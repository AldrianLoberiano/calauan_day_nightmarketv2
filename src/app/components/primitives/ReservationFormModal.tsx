import React, { useState } from 'react';
import { X, User, Phone, Building2, MapPin, Loader2, Tag, Info } from 'lucide-react';
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
        {/* Header — solid color, no gradient */}
        <div className="bg-blue-800 text-white px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-blue-300 text-xs font-semibold uppercase tracking-wider mb-0.5">Stall {stall.id}</p>
            <h2 className="text-lg font-bold leading-tight">Reserve This Stall</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-blue-300 text-xs">{stall.category}</span>
              <span className="w-1 h-1 rounded-full bg-blue-500" />
              <span className="text-blue-200 text-xs font-semibold">{formatPeso(stall.price)}/month</span>
            </div>
          </div>
          {!isSubmitting && (
            <button
              onClick={onClose}
              className="text-blue-300 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-xl p-1.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Info notice */}
          <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl p-3">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              Fill in your details to reserve this stall. You will receive a <strong>Reservation Number</strong> to present at the <strong>BPLO Office</strong>.
            </p>
          </div>

          {/* Full Name */}
          <FormField
            label="Full Name"
            required
            error={errors.fullName}
            icon={<User className="w-4 h-4 text-slate-400" />}
          >
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Juan Dela Cruz"
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50 focus:bg-white ${
                errors.fullName ? 'border-red-400 bg-red-50 focus:bg-red-50' : 'border-slate-200 focus:border-blue-500'
              }`}
              disabled={isSubmitting}
            />
          </FormField>

          {/* Contact Number */}
          <FormField
            label="Contact Number"
            required
            error={errors.contactNumber}
            icon={<Phone className="w-4 h-4 text-slate-400" />}
          >
            <input
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => handleChange('contactNumber', e.target.value)}
              placeholder="09XXXXXXXXX"
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50 focus:bg-white ${
                errors.contactNumber ? 'border-red-400 bg-red-50 focus:bg-red-50' : 'border-slate-200 focus:border-blue-500'
              }`}
              disabled={isSubmitting}
            />
          </FormField>

          {/* Business Name */}
          <FormField
            label="Business Name"
            optional
            icon={<Building2 className="w-4 h-4 text-slate-400" />}
          >
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => handleChange('businessName', e.target.value)}
              placeholder="My Store Name"
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-slate-50 focus:bg-white"
              disabled={isSubmitting}
            />
          </FormField>

          {/* Address */}
          <FormField
            label="Home Address"
            optional
            icon={<MapPin className="w-4 h-4 text-slate-400" />}
            isTextarea
          >
            <textarea
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Barangay, Municipality, Province"
              rows={2}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none bg-slate-50 focus:bg-white"
              disabled={isSubmitting}
            />
          </FormField>

          <p className="text-xs text-slate-400 leading-relaxed">
            Reservation expires in <strong className="text-slate-600">3 days</strong> if not processed at the BPLO office. This does not guarantee final approval.
          </p>

          <div className="flex gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl py-2.5 text-sm font-bold transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : 'Confirm Reservation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label, required, optional, error, icon, isTextarea, children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  icon: React.ReactNode;
  isTextarea?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {optional && <span className="text-slate-400 font-normal text-xs ml-1">(optional)</span>}
      </label>
      <div className="relative">
        <span className={`absolute left-3 text-slate-400 pointer-events-none ${isTextarea ? 'top-3' : 'top-1/2 -translate-y-1/2'}`}>
          {icon}
        </span>
        {children}
      </div>
      {error && <p className="text-red-500 text-xs mt-1 flex items-center gap-1">⚠ {error}</p>}
    </div>
  );
}
