'use client';

import * as React from 'react';
import { Ticket } from '@/types';
import { SlaTimer } from './SlaTimer';
import { X, AlertTriangle, Check, ChevronDown, ChevronUp, Lock } from 'lucide-react';

interface TicketDetailDrawerProps {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
  onComplete: (ticketId: string) => void;
  onReportIncident?: (ticketId: string, itemId: string, reason: string) => Promise<void> | void;
  hasPendingAlert?: boolean;
  disabledComplete?: boolean;
}

export function TicketDetailDrawer({
  ticket,
  open,
  onClose,
  onComplete,
  onReportIncident,
  hasPendingAlert,
  disabledComplete,
}: TicketDetailDrawerProps) {
  const [allergyExpanded, setAllergyExpanded] = React.useState<boolean>(false);
  const [incidentFormOpen, setIncidentFormOpen] = React.useState<boolean>(false);
  const [selectedIncidentItemId, setSelectedIncidentItemId] = React.useState<string>('');
  const [incidentReason, setIncidentReason] = React.useState<string>('');
  const [incidentError, setIncidentError] = React.useState<string | null>(null);
  const [isSubmittingIncident, setIsSubmittingIncident] = React.useState<boolean>(false);
  const [incidentReported, setIncidentReported] = React.useState<boolean>(false);
  const [isCompleting, setIsCompleting] = React.useState<boolean>(false);

  const rejectableItems = React.useMemo(
    () =>
      ticket
        ? ticket.items.filter((i) => i.status === 'WAITING' || i.status === 'READY')
        : [],
    [ticket]
  );

  const actionableItems = ticket ? ticket.items.filter((i) => i.status !== 'REJECTED') : [];
  const allRejected = actionableItems.length === 0;
  const allReady = !allRejected && actionableItems.every((i) => i.status === 'READY');

  // Reset local state when ticket changes
  React.useEffect(() => {
    setAllergyExpanded(false);
    setIncidentFormOpen(false);
    setIncidentReason('');
    setIncidentError(null);
    setIsSubmittingIncident(false);
    setIncidentReported(false);
    setIsCompleting(false);
  }, [ticket?.id]);

  React.useEffect(() => {
    if (rejectableItems.length > 0 && !rejectableItems.some((i) => i.id === selectedIncidentItemId)) {
      setSelectedIncidentItemId(rejectableItems[0].id);
    } else if (rejectableItems.length === 0) {
      setSelectedIncidentItemId('');
    }
  }, [rejectableItems, selectedIncidentItemId]);

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

  const trimmedReason = incidentReason.trim();
  const isIncidentReasonValid = trimmedReason.length >= 5 && trimmedReason.length <= 200;

  const handleCompleteClick = () => {
    if (isCompleting || hasPendingAlert || disabledComplete || !ticket.items.some((i) => i.status === 'WAITING')) return;
    setIsCompleting(true);
    onComplete(ticket.id);
    onClose();
  };

  const handleIncidentToggle = () => {
    setIncidentError(null);
    setIncidentFormOpen((prev) => !prev);
  };

  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncidentItemId || !isIncidentReasonValid || isSubmittingIncident) {
      setIncidentError('Lý do sự cố là bắt buộc và phải từ 5 đến 200 ký tự.');
      return;
    }

    try {
      setIsSubmittingIncident(true);
      setIncidentError(null);
      if (onReportIncident) {
        await onReportIncident(ticket.id, selectedIncidentItemId, trimmedReason);
      }
      setIncidentReported(true);
      setIncidentFormOpen(false);
      setIncidentReason('');
    } catch (err) {
      setIncidentError((err as Error).message || 'Không thể báo sự cố món ăn');
    } finally {
      setIsSubmittingIncident(false);
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
            disabled={isCompleting || hasPendingAlert || disabledComplete || !ticket.items.some((i) => i.status === 'WAITING')}
            onClick={handleCompleteClick}
            className={`w-full h-12 rounded-lg font-bold text-base flex items-center justify-center gap-2 shadow-xs transition-all ${
              hasPendingAlert || disabledComplete || !ticket.items.some((i) => i.status === 'WAITING')
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300'
                : 'bg-ops-brand hover:bg-ops-brand-dark active:scale-98 text-white disabled:opacity-50'
            }`}
          >
            {hasPendingAlert ? (
              <>
                <Lock className="h-5 w-5" />
                <span>Khóa (Có thay đổi chưa xác nhận)</span>
              </>
            ) : allRejected ? (
              <>
                <Lock className="h-5 w-5" />
                <span>Đã báo sự cố</span>
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                <span>{allReady ? 'Đã hoàn tất' : 'Hoàn tất ticket'}</span>
              </>
            )}
          </button>

          {!incidentFormOpen && (
            <button
              type="button"
              disabled={rejectableItems.length === 0}
              onClick={handleIncidentToggle}
              className="w-full py-2 text-center text-sm font-semibold text-ops-muted hover:text-danger-600 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              <AlertTriangle className="h-4 w-4 text-danger-600" />
              <span>Báo sự cố (không thể chế biến)</span>
            </button>
          )}

          {incidentFormOpen && (
            <form onSubmit={handleSubmitIncident} className="space-y-2.5 p-3 rounded-lg border border-danger-200 bg-danger-50/60">
              {rejectableItems.length > 1 && (
                <div>
                  <label htmlFor="incident-item-select" className="block text-xs font-bold text-ops-ink mb-1">
                    Chọn món gặp sự cố
                  </label>
                  <select
                    id="incident-item-select"
                    value={selectedIncidentItemId}
                    onChange={(e) => setSelectedIncidentItemId(e.target.value)}
                    className="w-full px-2.5 py-2 text-sm rounded border border-ops-border bg-white text-ops-ink"
                  >
                    {rejectableItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.quantity}× {item.dishName} ({item.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="incident-reason-input" className="block text-xs font-bold text-ops-ink mb-1">
                  Lý do từ chối (5–200 ký tự) <span className="text-danger-600">*</span>
                </label>
                <input
                  id="incident-reason-input"
                  type="text"
                  value={incidentReason}
                  onChange={(e) => {
                    setIncidentReason(e.target.value);
                    if (incidentError) setIncidentError(null);
                  }}
                  maxLength={200}
                  placeholder="hết nguyên liệu, cháy món..."
                  className="w-full px-3 py-2 text-sm rounded border border-ops-border bg-white text-ops-ink focus:outline-none focus:ring-2 focus:ring-danger-500"
                />
                <div className="flex justify-between items-center mt-1">
                  <span className={`text-[11px] ${trimmedReason.length > 0 && !isIncidentReasonValid ? 'text-danger-600 font-semibold' : 'text-ops-muted'}`}>
                    {trimmedReason.length < 5 ? 'Cần ít nhất 5 ký tự' : 'Hợp lệ'}
                  </span>
                  <span className="text-[11px] text-ops-muted">{trimmedReason.length}/200</span>
                </div>
              </div>

              {incidentError && (
                <p className="text-xs text-danger-700 font-semibold">{incidentError}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleIncidentToggle}
                  className="flex-1 h-10 rounded-lg border border-ops-border bg-white text-xs font-bold text-ops-ink hover:bg-neutral-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!selectedIncidentItemId || !isIncidentReasonValid || isSubmittingIncident}
                  className="flex-1 h-10 rounded-lg bg-danger-600 hover:bg-danger-700 text-white text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingIncident ? 'Đang gửi...' : 'Xác nhận báo sự cố'}
                </button>
              </div>
            </form>
          )}

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
