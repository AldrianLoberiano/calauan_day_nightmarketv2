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
