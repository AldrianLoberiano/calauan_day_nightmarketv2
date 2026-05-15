import React, { useRef } from 'react';
import { X, Printer, CheckCircle, MapPin, Phone, User, Calendar, Building2, Clock } from 'lucide-react';
import { Reservation, Stall } from '../../types';
import { formatDate, formatPeso } from '../../utils/helpers';

interface ReceiptModalProps {
  reservation: Reservation | null;
  stall: Stall | null;
  onClose: () => void;
}

export function ReceiptModal({ reservation, stall, onClose }: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!reservation || !stall) return null;

  const qrData = encodeURIComponent(
    `RES:${reservation.reservationNumber}|STALL:${reservation.stallId}|NAME:${reservation.fullName}|TEL:${reservation.contactNumber}`
  );
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}&margin=10`;
  const locationLabel = stall.number > 0
    ? `Section ${stall.section}, Stall ${stall.id}`
    : `Section ${stall.section}`;

  function handlePrint() {
    const printContents = receiptRef.current?.innerHTML ?? '';
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Reservation Receipt — ${reservation.reservationNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #111; }
            .receipt { max-width: 500px; margin: auto; border: 2px solid #1d4ed8; border-radius: 12px; padding: 24px; }
            .header { text-align: center; border-bottom: 2px dashed #93c5fd; padding-bottom: 16px; margin-bottom: 16px; }
            .title { font-size: 22px; font-weight: bold; color: #1d4ed8; }
            .res-num { font-size: 28px; font-weight: bold; letter-spacing: 2px; color: #111; margin: 8px 0; }
            .badge { background: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-block; }
            .row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
            .label { color: #6b7280; }
            .value { font-weight: bold; }
            .qr { text-align: center; margin: 16px 0; }
            .notice { background: #eff6ff; border: 1px solid #93c5fd; border-radius: 8px; padding: 12px; font-size: 13px; color: #1e40af; margin-top: 16px; }
            .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px; border-top: 1px dashed #d1d5db; padding-top: 12px; }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    win.document.close();
    win.print();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-y-auto">
        {/* Success header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8" />
            <div>
              <h2 className="text-lg font-bold">Reservation Successful!</h2>
              <p className="text-green-100 text-sm">Your stall has been reserved.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt body */}
        <div ref={receiptRef} className="p-6">
          <div className="border-2 border-blue-700 rounded-xl overflow-hidden">
            {/* Receipt header */}
            <div className="bg-blue-700 text-white text-center py-4 px-4">
              <p className="text-xs uppercase tracking-widest font-semibold text-blue-200">Official Reservation Receipt</p>
              <h3 className="text-xl font-bold mt-1">Pwesto Public Market</h3>
              <p className="text-blue-200 text-xs mt-0.5">BPLO — Business Permits &amp; Licensing Office</p>
            </div>

            {/* Reservation number */}
            <div className="bg-gray-50 border-b-2 border-dashed border-blue-300 text-center py-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Reservation Number</p>
              <p className="text-3xl font-black text-blue-800 tracking-widest mt-1">{reservation.reservationNumber}</p>
              <span className="inline-block mt-2 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                PENDING PROCESSING
              </span>
            </div>

            {/* Details */}
            <div className="p-4 space-y-3">
              <DetailRow icon={<MapPin className="w-4 h-4 text-blue-600" />} label="Stall ID" value={`Stall ${stall.id} — ${stall.category}`} />
              <DetailRow icon={<MapPin className="w-4 h-4 text-blue-600" />} label="Location" value={locationLabel} />
              <DetailRow icon={<User className="w-4 h-4 text-blue-600" />} label="Applicant" value={reservation.fullName} />
              <DetailRow icon={<Phone className="w-4 h-4 text-blue-600" />} label="Contact" value={reservation.contactNumber} />
              {reservation.businessName && (
                <DetailRow icon={<Building2 className="w-4 h-4 text-blue-600" />} label="Business Name" value={reservation.businessName} />
              )}
              <DetailRow
                icon={<Calendar className="w-4 h-4 text-blue-600" />}
                label="Reserved On"
                value={formatDate(reservation.createdAt)}
              />
              <DetailRow
                icon={<Clock className="w-4 h-4 text-red-500" />}
                label="Expires On"
                value={formatDate(reservation.expiresAt)}
              />
              <div className="border-t border-dashed border-gray-200 pt-3">
                <DetailRow
                  icon={<span className="text-blue-600 font-bold text-sm">₱</span>}
                  label="Monthly Rent"
                  value={`${formatPeso(stall.price)} / month`}
                  valueClass="text-blue-700 font-black"
                />
              </div>
            </div>

            {/* QR Code */}
            <div className="border-t-2 border-dashed border-blue-300 py-4 flex flex-col items-center gap-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Scan for Verification</p>
              <img
                src={qrUrl}
                alt="Reservation QR Code"
                width={120}
                height={120}
                className="rounded-lg border border-gray-200"
              />
              <p className="text-xs text-gray-400">Show this QR at the BPLO Office</p>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border-t-2 border-blue-200 p-4">
              <p className="text-sm font-bold text-blue-800 mb-1">Next Steps:</p>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Take a screenshot or print this receipt.</li>
                <li>Visit the <strong>BPLO Office</strong> within <strong>3 days</strong>.</li>
                <li>Present your Reservation Number: <strong>{reservation.reservationNumber}</strong></li>
                <li>Complete your business permit application.</li>
              </ol>
            </div>

            {/* Footer */}
            <div className="text-center py-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">This is a computer-generated reservation slip.</p>
              <p className="text-xs text-gray-400">Valid until: {formatDate(reservation.expiresAt)}</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 border-2 border-blue-700 text-blue-700 hover:bg-blue-50 rounded-xl py-2.5 text-sm font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-blue-700 hover:bg-blue-800 text-white rounded-xl py-2.5 text-sm font-bold transition-colors"
          >
            Done
