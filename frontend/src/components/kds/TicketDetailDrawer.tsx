'use client';

import * as React from 'react';
import { Ticket } from '@/types';
import { SlaTimer } from './SlaTimer';
import { X, AlertTriangle, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface TicketDetailDrawerProps {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
  onComplete: (ticketId: string) => void;
  onReportIncident?: (ticketId: string) => void;
  hasPendingAlert?: boolean;
}

export function TicketDetailDrawer({
  ticket,
  open,
  onClose,
  onComplete,
  onReportIncident,
  hasPendingAlert,
}: TicketDetailDrawerProps) {
  const [allergyExpanded, setAllergyExpanded] = React.useState<boolean>(false);
  const [incidentReported, setIncidentReported] = React.useState<boolean>(false);
  const [isCompleting, setIsCompleting] = React.useState<boolean>(false);

  // Reset local state when ticket changes
  React.useEffect(() => {
    setAllergyExpanded(false);
    setIncidentReported(false);
    setIsCompleting(false);
  }, [ticket?.id]);

  // Handle ESC key to close
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open || !ticket) return null;

  // Lấy danh sách dị ứng từ các món
  const allergies = Array.from(
    new Set(
      ticket.items
        .map((i) => i.allergy?.trim())
        .filter((a): a is string => Boolean(a && a.length > 0))
    )
  );

  const entryTime = new Date(ticket.createdAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalDishes = ticket.items.length;
  const totalPortions = ticket.items.reduce((sum, item) => sum + item.quantity, 0);

  const handleCompleteClick = () => {
    if (isCompleting || hasPendingAlert) return;
    setIsCompleting(true);
    onComplete(ticket.id);
    onClose();
  };

  const handleIncidentClick = () => {
    setIncidentReported(true);
    if (onReportIncident) {
      onReportIncident(ticket.id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity duration-[280ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết ${ticket.tableNo} - Ticket #${ticket.id}`}
    >
      <div
        className="w-full max-w-[520px] min-w-[360px] md:min-w-[480px] bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-[280ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Scrollable Container (Khu vực 1, 2, 3) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Khu vực 1: Header */}
          <div className="flex items-start justify-between min-h-[52px] pb-4 border-b border-ops-border">
            <div>
              <h2 className="text-2xl font-black text-ops-ink">{ticket.tableNo}</h2>
              <span className="text-xs font-mono font-bold text-ops-muted uppercase tracking-wider">
                TICKET #{ticket.id}
              </span>
            </div>

            {/* Nút đóng duy nhất 44x44 (vùng chạm 48px), chỉ đóng không hủy */}
            <div className="h-12 w-12 flex items-center justify-center">
              <button
                type="button"
                onClick={onClose}
                className="w-11 h-11 rounded-lg border border-ops-border bg-white hover:bg-neutral-100 active:scale-98 flex items-center justify-center text-ops-ink shadow-xs transition-transform"
                aria-label="Đóng drawer, quay lại hàng đợi (không đổi trạng thái ticket)"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Khu vực 2: Trạng thái & SLA */}
          <div className="space-y-2 bg-[#F6F4F0] p-4 rounded-lg border border-ops-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ops-muted uppercase tracking-wider">
                Thời gian chờ
              </span>
              <SlaTimer createdAt={ticket.createdAt} slaDeadline={ticket.slaDeadline} />
            </div>
            <p className="text-xs text-ops-muted font-medium">
              Vào bếp lúc: <strong className="text-ops-ink font-mono">{entryTime}</strong>
            </p>
          </div>

          {/* Khu vực 3: Nội dung chế biến */}
          {/* Dị ứng collapsible */}
          {allergies.length > 0 && (
            <div className="rounded-lg border border-[#FBE3DE] bg-[#FDEAE6] overflow-hidden">
              <button
                type="button"
                onClick={() => setAllergyExpanded((prev) => !prev)}
                className="w-full px-4 py-3 bg-[#8C1D2C] text-white font-bold text-sm flex items-center justify-between"
                aria-expanded={allergyExpanded}
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>CẢNH BÁO DỊ ỨNG: {allergies.join(', ')}</span>
                </span>
                {allergyExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {allergyExpanded && (
                <div className="p-3 text-xs text-[#8C1D2C] bg-[#FDEAE6] border-t border-[#FBE3DE]">
                  Cần chế biến dụng cụ riêng, chú ý không để lẫn nguyên liệu gây dị ứng: {allergies.join(', ')}.
                </div>
              )}
            </div>
          )}

          {/* Danh sách món */}
          <div>
            <div className="flex items-center justify-between mb-3 pb-1 border-b border-ops-border">
              <h3 className="font-extrabold text-base text-ops-ink">Món cần làm</h3>
              <span className="text-xs font-semibold text-ops-muted">
                {String(totalDishes).padStart(2, '0')} món &bull; {String(totalPortions).padStart(2, '0')} phần
              </span>
            </div>

            <div className="space-y-3">
              {ticket.items.map((item) => {
                const isDone = item.status === 'READY' || item.status === 'SERVED';
                const isRejected = item.status === 'REJECTED';

                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 p-2 rounded border border-ops-border bg-white shadow-xs ${
                      isDone
                        ? 'opacity-40 line-through'
                        : isRejected
                        ? 'opacity-30 line-through text-danger-500'
                        : ''
                    }`}
                  >
                    {/* Badge số lượng nền #F5F2EA */}
                    <div className="w-10 h-10 shrink-0 rounded-lg bg-[#F5F2EA] border border-[#E9E4DC] flex items-center justify-center font-black text-ops-ink text-base">
                      {item.quantity}×
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-ops-ink text-base leading-snug">
                        {item.dishName}
                      </div>
                      {item.notes && (
                        <p className="text-xs text-ops-muted mt-0.5">&bull; {item.notes}</p>
                      )}
                      {item.allergy && (
                        <span className="inline-block mt-1 text-[11px] font-bold text-danger-700 bg-danger-50 px-2 py-0.5 rounded border border-danger-200">
                          Dị ứng: {item.allergy}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lưu ý chế biến chung của ticket */}
          {ticket.customerNotes && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                Lưu ý chế biến
              </h4>
              <p className="text-sm text-amber-950">{ticket.customerNotes}</p>
            </div>
          )}
        </div>

        {/* Khu vực 4: Sticky Footer cố định cuối drawer */}
        <div className="p-6 border-t border-ops-border bg-white space-y-3">
          <button
            type="button"
            disabled={isCompleting || hasPendingAlert}
            onClick={handleCompleteClick}
            className={`w-full h-12 rounded-lg font-bold text-base flex items-center justify-center gap-2 shadow-xs transition-all ${
              hasPendingAlert
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300'
                : 'bg-ops-brand hover:bg-ops-brand-dark active:scale-98 text-white disabled:opacity-50'
            }`}
          >
            <Check className="h-5 w-5" />
            <span>{hasPendingAlert ? 'Khóa (Có thay đổi chưa xác nhận)' : '✓ Hoàn tất ticket'}</span>
          </button>

          <button
            type="button"
            disabled={incidentReported}
            onClick={handleIncidentClick}
            className="w-full py-2 text-center text-sm font-semibold text-ops-muted hover:text-danger-600 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
          >
            <AlertTriangle className="h-4 w-4 text-danger-600" />
            <span>{incidentReported ? 'Đã báo sự cố cho Bếp trưởng' : 'Báo sự cố (không thể chế biến)'}</span>
          </button>

          {incidentReported && (
            <div className="text-xs text-danger-700 bg-danger-50 p-2.5 rounded border border-danger-200 text-center">
              Đã báo sự cố — Quản lý/Bếp trưởng xử lý. Ticket vẫn ở hàng đợi cho đến khi có quyết định.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
