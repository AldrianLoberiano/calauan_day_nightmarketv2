import React from 'react';
import { X, CheckCircle, MapPin, Phone, User, Calendar, Building2, Clock } from 'lucide-react';
import { Reservation, Stall } from '../../types';
import { formatDate, getDisplayStallId, getDisplaySectionByCategory, getDisplayCategoryById } from '../../utils/helpers';

interface ReceiptModalProps {
  reservation: Reservation | null;
  stall: Stall | null;
  onClose: () => void;
}

export function ReceiptModal({ reservation, stall, onClose }: ReceiptModalProps) {
  if (!reservation || !stall) return null;

  const activeReservation = reservation;
  const activeStall = stall;

  const reservationNumber = reservation?.reservationNumber ?? 'Reservation';
  // QR removed per print/plain request
  const displayStallId = getDisplayStallId(stall.id);
  const displaySection = getDisplaySectionByCategory(stall.id, stall.section, stall.category);
  const locationLabel = stall.number > 0
    ? `Section ${displaySection}, Stall ${displayStallId}`
    : `Section ${displaySection}`;

  function handlePrint() {
    window.print();
  }

  return (
    <div
      className="receipt-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @media print {
          /* Force Bondpaper (Letter) size and tighten margins */
          @page { size: 8.5in 11in; margin: 12mm; }
          body { background: #fff !important; }

          /* Hide everything except the modal */
          body * { visibility: hidden !important; }
          .receipt-modal-overlay,
          .receipt-modal-overlay * { visibility: visible !important; }

          /* Make the modal flow as the document body for printing */
          .receipt-modal-overlay {
            position: static !important;
            inset: auto !important;
            display: block !important;
            padding: 0 !important;
            background: #fff !important;
            backdrop-filter: none !important;
          }

          /* Expand shell to full page */
          .receipt-modal-shell {
            width: 100% !important;
            max-width: none !important;
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
          }

          /* Hide header and action buttons to simplify printed output */
          .receipt-modal-header,
          .receipt-modal-actions,
          .receipt-modal-close {
            display: none !important;
          }

          /* Compact the printable area */
          .receipt-modal-printable {
            padding: 6mm !important;
            font-size: 11px !important;
            line-height: 1.35 !important;
          }

          /* Simplify visual styling for print (black & white) */
          .receipt-modal-printable * {
            color: #000 !important;
            background: transparent !important;
            box-shadow: none !important;
          }

          /* Remove icons and decorative elements to save space */
          .receipt-modal-printable svg,
          .receipt-modal-printable .w-10,
          .receipt-modal-printable .rounded-xl {
            display: none !important;
          }

          /* Shrink QR and make layout compact to fit a single page */
          .receipt-modal-printable img {
            width: 80px !important;
            height: 80px !important;
            display: block !important;
            margin: 6px auto !important;
            border: none !important;
          }

          /* Remove large paddings and borders */
          .receipt-modal-printable .p-4,
          .receipt-modal-printable .p-5,
          .receipt-modal-printable .py-5,
          .receipt-modal-printable .px-4 {
            padding: 4px !important;
          }

          .receipt-modal-printable .text-3xl { font-size: 20px !important; }

          /* Prevent page breaks inside the receipt */
          .receipt-modal-printable { page-break-inside: avoid; }
          .receipt-modal-printable * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <div className="receipt-modal-shell bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-y-auto">

        {/* Success header — solid green, no gradient */}
        <div className="receipt-modal-header bg-green-700 text-white px-5 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Reservation Successful!</h2>
              <p className="text-green-200 text-xs mt-0.5">Your stall has been reserved.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="receipt-modal-close text-green-300 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-xl p-1.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt body */}
        <div className="receipt-modal-printable p-5">
          <div className="border-2 border-blue-700 rounded-xl overflow-hidden">

            {/* Receipt header — solid blue */}
            <div className="bg-blue-800 text-white text-center py-4 px-4">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-blue-300">Official Reservation Receipt</p>
              <h3 className="text-lg font-bold mt-1">Stall Public Market</h3>
              <p className="text-blue-300 text-xs mt-0.5">BPLO — Business Permits &amp; Licensing Office</p>
            </div>

            {/* Reservation number */}
            <div className="bg-slate-50 border-b-2 border-dashed border-blue-300 text-center py-5 px-4">
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Reservation Number</p>
              <p className="text-3xl font-black text-blue-800 tracking-widest mt-1">{reservation.reservationNumber}</p>
              <span className="inline-block mt-2.5 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                PENDING PROCESSING
              </span>
            </div>

            {/* Details */}
            <div className="p-4 space-y-2.5">
              <DetailRow icon={<MapPin className="w-4 h-4 text-blue-600" />} label="Stall ID"    value={`Stall ${displayStallId} — ${getDisplayCategoryById(stall.id, stall.category)}`} />
              <DetailRow icon={<MapPin className="w-4 h-4 text-blue-600" />} label="Location"   value={locationLabel} />
              <DetailRow icon={<User className="w-4 h-4 text-blue-600" />}   label="Applicant"  value={reservation.fullName} />
              <DetailRow icon={<Phone className="w-4 h-4 text-blue-600" />}  label="Contact"    value={reservation.contactNumber} />
              {reservation.businessName && (
                <DetailRow icon={<Building2 className="w-4 h-4 text-blue-600" />} label="Business Name" value={reservation.businessName} />
              )}
              {reservation.dtiNumber && (
                <DetailRow icon={<CheckCircle className="w-4 h-4 text-blue-600" />} label="DTI Number" value={reservation.dtiNumber} />
              )}
              {reservation.cedulaNumber && (
                <DetailRow icon={<CheckCircle className="w-4 h-4 text-blue-600" />} label="Cedula Number" value={reservation.cedulaNumber} />
              )}
              <DetailRow
                icon={<Calendar className="w-4 h-4 text-blue-600" />}
                label="Reserved On"
                value={formatDate(reservation.createdAt)}
              />
              <div className="border-t border-dashed border-slate-200 pt-2.5">
                <DetailRow
                  icon={<Clock className="w-4 h-4 text-red-500" />}
                  label="Expires On"
                  value={formatDate(reservation.expiresAt)}
                  valueClass="text-red-600 font-semibold"
                />
              </div>
              <div className="border-t border-dashed border-slate-200 pt-2.5">
                <DetailRow
                  icon={<span className="text-blue-600 font-bold text-sm">₱</span>}
                  label="Price"
                  value="To be discussed"
                  valueClass="text-blue-700 font-black"
                />
              </div>
            </div>

            {/* QR Code removed for simplified print */}

            {/* Instructions */}
            <div className="bg-blue-50 border-t-2 border-blue-200 p-4">
              <p className="text-sm font-bold text-blue-800 mb-2">Next Steps:</p>
              <ol className="text-sm text-blue-700 space-y-1.5 list-decimal list-inside">
                <li>Take a screenshot or capture this receipt.</li>
                <li>Visit the <strong>BPLO Office</strong> within <strong>4 to 5 days</strong>.</li>
                <li>Present your Reservation Number: <strong>{reservation.reservationNumber}</strong></li>
                <li>Complete your business permit application.</li>
              </ol>
            </div>

            {/* Footer */}
            <div className="text-center py-3 border-t border-slate-100 bg-white">
              <p className="text-[11px] text-slate-400">This is a computer-generated reservation slip.</p>
              <p className="text-[11px] text-slate-400">Valid until: {formatDate(reservation.expiresAt)}</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
          <div className="receipt-modal-actions px-5 pb-5 flex gap-2.5">
          <button
            onClick={onClose}
            className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-xl py-2.5 text-sm font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon, label, value, valueClass = 'text-slate-800 font-semibold',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
        <span className="text-[11px] text-slate-400 uppercase tracking-wide font-semibold shrink-0">{label}</span>
        <span className={`text-sm ${valueClass} sm:text-right`}>{value}</span>
      </div>
    </div>
  );
}
