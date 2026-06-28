import React from 'react';
import { X, CheckCircle, MapPin, Phone, User, Calendar, Building2, Clock, Download, Printer, FileText } from 'lucide-react';
import { Reservation, Stall } from '../../types';
import { formatDate, getDisplayStallId, getDisplaySectionByCategory, getDisplayCategoryById } from '../../utils/helpers';

interface ReceiptModalProps {
  reservation: Reservation | null;
  stall: Stall | null;
  onClose: () => void;
}

export function ReceiptModal({ reservation, stall, onClose }: ReceiptModalProps) {
  if (!reservation || !stall) return null;

  const displayStallId = getDisplayStallId(stall.id);
  const displaySection = getDisplaySectionByCategory(stall.id, stall.section, stall.category);
  const locationLabel = stall.number > 0
    ? `Section ${displaySection}, Stall ${displayStallId}`
    : `Section ${displaySection}`;

  function handlePrint() {
    window.print();
  }

  function handleDownload() {
    const receiptContent = generateReceiptText(reservation, stall, displayStallId, displaySection, locationLabel);
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${reservation.reservationNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="receipt-modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @media print {
          @page { size: 8.5in 11in; margin: 12mm; }
          body { background: #fff !important; }
          body * { visibility: hidden !important; }
          .receipt-modal-overlay,
          .receipt-modal-overlay * { visibility: visible !important; }
          .receipt-modal-overlay {
            position: static !important; inset: auto !important;
            display: block !important; padding: 0 !important;
            background: #fff !important; backdrop-filter: none !important;
          }
          .receipt-modal-shell {
            width: 100% !important; max-width: none !important;
            max-height: none !important; overflow: visible !important;
            box-shadow: none !important; border-radius: 0 !important;
          }
          .receipt-modal-header, .receipt-modal-actions, .receipt-modal-close {
            display: none !important;
          }
          .receipt-modal-printable {
            padding: 6mm !important; font-size: 11px !important;
            line-height: 1.35 !important;
          }
          .receipt-modal-printable * {
            color: #000 !important; background: transparent !important;
            box-shadow: none !important;
          }
          .receipt-modal-printable svg { display: none !important; }
          .receipt-modal-printable .p-4,
          .receipt-modal-printable .p-5,
          .receipt-modal-printable .py-5,
          .receipt-modal-printable .px-4 { padding: 4px !important; }
          .receipt-modal-printable .text-3xl { font-size: 20px !important; }
          .receipt-modal-printable { page-break-inside: avoid; }
          .receipt-modal-printable * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="receipt-modal-shell bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-hidden flex flex-col">

        {/* Success header */}
        <div className="receipt-modal-header relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-600" />
          <div className="relative px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-1 ring-white/30">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-white text-lg font-black leading-tight">Reservation Successful!</h2>
                <p className="text-emerald-100 text-xs mt-0.5 font-medium">Your stall has been reserved.</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="receipt-modal-close text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-xl p-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable receipt body */}
        <div className="receipt-modal-printable flex-1 overflow-y-auto">
          <div className="p-5">

            {/* Official receipt card */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

              {/* Receipt top — navy */}
              <div className="bg-slate-800 text-center py-5 px-5 relative overflow-hidden">
                <div className="absolute inset-0 opacity-5">
                  <div className="absolute top-2 left-4 w-16 h-16 border border-white rounded-full" />
                  <div className="absolute bottom-1 right-6 w-10 h-10 border border-white rounded-full" />
                </div>
                <div className="relative">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">Official Reservation Receipt</p>
                  <h3 className="text-xl font-black text-white mt-1.5 tracking-tight">Stall Public Market</h3>
                  <p className="text-slate-400 text-xs mt-1 font-medium">BPLO — Business Permits &amp; Licensing Office</p>
                </div>
              </div>

              {/* Reservation number highlight */}
              <div className="bg-gradient-to-b from-slate-50 to-white text-center py-6 px-5 border-b border-dashed border-slate-200 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
                <p className="text-[10px] text-slate-400 uppercase tracking-[0.15em] font-bold">Reservation Number</p>
                <p className="text-3xl font-black text-slate-900 tracking-wider mt-2 font-mono">{reservation.reservationNumber}</p>
                <div className="inline-flex items-center gap-1.5 mt-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">
                  <Clock className="w-3 h-3" />
                  PENDING PROCESSING
                </div>
              </div>

              {/* Details */}
              <div className="p-5 space-y-0">
                <DetailRow icon={<MapPin className="w-4 h-4" />} label="Stall ID" value={`Stall ${displayStallId} — ${getDisplayCategoryById(stall.id, stall.category)}`} />
                <DetailRow icon={<MapPin className="w-4 h-4" />} label="Location" value={locationLabel} />
                <DetailRow icon={<User className="w-4 h-4" />} label="Applicant" value={reservation.fullName} />
                <DetailRow icon={<Phone className="w-4 h-4" />} label="Contact" value={reservation.contactNumber} />
                {reservation.businessName && (
                  <DetailRow icon={<Building2 className="w-4 h-4" />} label="Business Name" value={reservation.businessName} />
                )}
                {reservation.dtiNumber && (
                  <DetailRow icon={<FileText className="w-4 h-4" />} label="DTI Number" value={reservation.dtiNumber} />
                )}
                {reservation.cedulaNumber && (
                  <DetailRow icon={<FileText className="w-4 h-4" />} label="Cedula Number" value={reservation.cedulaNumber} />
                )}
                <DetailRow icon={<Calendar className="w-4 h-4" />} label="Reserved On" value={formatDate(reservation.createdAt)} />
                <div className="border-t border-dashed border-slate-200 my-3" />
                <DetailRow icon={<Clock className="w-4 h-4 text-red-500" />} label="Expires On" value={formatDate(reservation.expiresAt)} valueClass="text-red-600 font-bold" />
                <div className="border-t border-dashed border-slate-200 my-3" />
                <DetailRow icon={<span className="text-emerald-600 font-black text-sm">₱</span>} label="Price" value="To be discussed" valueClass="text-emerald-700 font-black" />
              </div>

              {/* Next Steps */}
              <div className="mx-5 mb-5 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm font-black text-blue-900 mb-2.5 flex items-center gap-1.5">
                  <span className="w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">i</span>
                  Next Steps
                </p>
                <ol className="text-xs text-blue-800 space-y-2 list-none">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-blue-200 text-blue-700 text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">1</span>
                    Take a screenshot or capture this receipt.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-blue-200 text-blue-700 text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">2</span>
                    Visit the <strong>BPLO Office</strong> within <strong>4 days</strong>.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-blue-200 text-blue-700 text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">3</span>
                    Present your Reservation Number: <strong className="font-mono">{reservation.reservationNumber}</strong>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 bg-blue-200 text-blue-700 text-[10px] font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">4</span>
                    Complete your business permit application.
                  </li>
                </ol>
              </div>

              {/* Footer */}
              <div className="text-center py-3 border-t border-slate-100 bg-slate-50/50">
                <p className="text-[11px] text-slate-400">This is a computer-generated reservation slip.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Valid until: {formatDate(reservation.expiresAt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="receipt-modal-actions px-5 pb-5 pt-2 bg-white border-t border-slate-100">
          <div className="flex gap-2.5">
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-3 text-sm font-bold transition-colors"
            >
              <Download className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-3 text-sm font-bold transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center gap-2 flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl py-3 text-sm font-bold transition-all shadow-lg shadow-blue-500/25"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function generateReceiptText(
  reservation: Reservation,
  stall: Stall,
  displayStallId: string,
  displaySection: string,
  locationLabel: string,
): string {
  const lines = [
    '==========================================',
    '      OFFICIAL RESERVATION RECEIPT',
    '         Stall Public Market',
    '  BPLO — Business Permits & Licensing Office',
    '==========================================',
    '',
    `Reservation Number: ${reservation.reservationNumber}`,
    `Status: PENDING PROCESSING`,
    '',
    `Stall ID:      Stall ${displayStallId} — ${getDisplayCategoryById(stall.id, stall.category)}`,
    `Location:      ${locationLabel}`,
    `Applicant:     ${reservation.fullName}`,
    `Contact:       ${reservation.contactNumber}`,
  ];
  if (reservation.businessName) lines.push(`Business Name: ${reservation.businessName}`);
  if (reservation.dtiNumber) lines.push(`DTI Number:    ${reservation.dtiNumber}`);
  if (reservation.cedulaNumber) lines.push(`Cedula Number: ${reservation.cedulaNumber}`);
  lines.push(
    `Reserved On:   ${formatDate(reservation.createdAt)}`,
    `Expires On:    ${formatDate(reservation.expiresAt)}`,
    `Price:         To be discussed`,
    '',
    '------------------------------------------',
    'NEXT STEPS:',
    '1. Take a screenshot or capture this receipt.',
    '2. Visit the BPLO Office within 4 to 5 days.',
    `3. Present your Reservation Number: ${reservation.reservationNumber}`,
    '4. Complete your business permit application.',
    '------------------------------------------',
    '',
    'This is a computer-generated reservation slip.',
    `Valid until: ${formatDate(reservation.expiresAt)}`,
  );
  return lines.join('\n');
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
    <div className="flex items-start gap-3 py-2.5">
      <span className="text-blue-600 mt-0.5 shrink-0">{icon}</span>
      <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
        <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold shrink-0">{label}</span>
        <span className={`text-sm ${valueClass} sm:text-right leading-snug`}>{value}</span>
      </div>
    </div>
  );
}
