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

