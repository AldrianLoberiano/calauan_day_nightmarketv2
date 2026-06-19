import React, { useState } from 'react';
import { X, User, Phone, Building2, MapPin, Loader2, Info, ShieldCheck, FileText } from 'lucide-react';
import { Stall, Reservation } from '../../types';
import { formatPeso, getCornerDisplayStallId, getDisplayCategoryById } from '../../utils/helpers';
import { addReservation } from '../../utils/storage';

interface ReservationFormModalProps {
  stall: Stall | null;
  onClose: () => void;
  onSuccess: (reservation: Reservation, stall: Stall) => void;
  source?: string;
}

interface FormData {
  fullName: string;
  contactNumber: string;
  businessName: string;
  dtiNumber: string;
  cedulaNumber: string;
  address: string;
}

interface FormErrors {
  fullName?: string;
  contactNumber?: string;
}

export function ReservationFormModal({ stall, onClose, onSuccess, source }: ReservationFormModalProps) {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    contactNumber: '',
    businessName: '',
    dtiNumber: '',
    cedulaNumber: '',
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
    if (!stall) return;

    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));

    const result = await addReservation({
      stallId: stall.id,
      fullName: formData.fullName.trim(),
      contactNumber: formData.contactNumber.trim(),
      businessName: formData.businessName.trim() || undefined,
      dtiNumber: formData.dtiNumber.trim() || undefined,
      cedulaNumber: formData.cedulaNumber.trim() || undefined,
      address: formData.address.trim() || undefined,
      source,
    });

    setIsSubmitting(false);
    onSuccess(result.reservation, result.stall);
  }

  function handleChange(field: keyof FormData, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !isSubmitting) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white px-6 py-5 shrink-0">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 bg-white/15 backdrop-blur-sm text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Stall {getCornerDisplayStallId(stall.id)}
                  </span>
                </div>
                <h2 className="text-xl font-black tracking-tight">Reserve This Stall</h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-blue-200 text-xs font-medium">{getDisplayCategoryById(stall.id, stall.category)}</span>
                  <span className="w-1 h-1 rounded-full bg-blue-400" />
                  <span className="text-white/80 text-xs font-semibold">{formatPeso(stall.price)}</span>
                </div>
              </div>
              {!isSubmitting && (
                <button
                  onClick={onClose}
                  className="text-white/60 hover:text-white hover:bg-white/10 transition-all rounded-xl p-2 -m-2"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Scrollable Form ── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-4">

            {/* Info notice */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-3.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                Fill in your details to reserve this stall. You will receive a <strong>Reservation Number</strong> to present at the <strong>BPLO Office</strong>.
              </p>
            </div>

            {/* Full Name */}
            <FormField
              label="Full Name"
              required
              error={errors.fullName}
              icon={<User className="w-4 h-4" />}
            >
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                placeholder="Juan Dela Cruz"
                className={errors.fullName ? 'input-field-error' : 'input-field'}
                disabled={isSubmitting}
              />
            </FormField>

            {/* Contact Number */}
            <FormField
              label="Contact Number"
              required
              error={errors.contactNumber}
              icon={<Phone className="w-4 h-4" />}
            >
              <input
                type="tel"
                required
                value={formData.contactNumber}
                onChange={(e) => handleChange('contactNumber', e.target.value)}
                placeholder="09XXXXXXXXX"
                className={errors.contactNumber ? 'input-field-error' : 'input-field'}
                disabled={isSubmitting}
              />
            </FormField>

            {/* Business Name */}
            <FormField
              label="Business Name"
              optional
              icon={<Building2 className="w-4 h-4" />}
            >
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => handleChange('businessName', e.target.value)}
                placeholder="My Store Name"
                className="input-field"
                disabled={isSubmitting}
              />
            </FormField>

            {/* DTI & Cedula Row */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="DTI Number"
                optional
                icon={<FileText className="w-4 h-4" />}
              >
                <input
                  type="text"
                  value={formData.dtiNumber}
                  onChange={(e) => handleChange('dtiNumber', e.target.value)}
                  placeholder="DTI-XXXXXXXX"
                  className="input-field"
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField
                label="Cedula No."
                optional
                icon={<ShieldCheck className="w-4 h-4" />}
              >
                <input
                  type="text"
                  value={formData.cedulaNumber}
                  onChange={(e) => handleChange('cedulaNumber', e.target.value)}
                  placeholder="Cedula-XXXXXXXX"
                  className="input-field"
                  disabled={isSubmitting}
                />
              </FormField>
            </div>

            {/* Address */}
            <FormField
              label="Home Address"
              optional
              icon={<MapPin className="w-4 h-4" />}
              isTextarea
            >
              <textarea
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Barangay, Municipality, Province"
                rows={2}
                className="input-field resize-none"
                disabled={isSubmitting}
              />
            </FormField>
          </div>

          {/* ── Sticky Footer ── */}
          <div className="border-t border-slate-100 bg-white px-5 py-4 space-y-3">
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Reservation expires in <strong className="text-slate-600">3 days</strong> if not processed at the BPLO office. This does not guarantee final approval.
            </p>
            <div className="flex gap-2">
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
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white rounded-xl py-2.5 text-sm font-bold transition-all shadow-lg shadow-blue-500/25 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : 'Confirm Reservation'}
              </button>
            </div>
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
        <span className={`absolute left-3.5 text-slate-400 pointer-events-none ${isTextarea ? 'top-3' : 'top-1/2 -translate-y-1/2'}`}>
          {icon}
        </span>
        {children}
      </div>
      {error && (
        <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
