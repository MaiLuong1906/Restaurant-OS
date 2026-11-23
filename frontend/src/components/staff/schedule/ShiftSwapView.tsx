'use client';

import * as React from 'react';
import { Shift, SwapPeerCandidate, ShiftSwapRequest } from '@/types';
import { ArrowLeft, AlertCircle, Search } from 'lucide-react';

export interface ShiftSwapViewProps {
  ownShifts: Shift[];
  selectedOwnShiftId: string;
  peers: SwapPeerCandidate[];
  search: string;
  selectedPeerId: string;
  reason: string;
  submitting: boolean;
  successSwap: ShiftSwapRequest | null;
  error: string | null;
  onBackToSchedule: () => void;
  onSelectOwnShift: (shiftId: string) => void;
  onChangeSearch: (query: string) => void;
  onSelectPeer: (peerId: string) => void;
  onChangeReason: (reason: string) => void;
  onSubmit: () => void;
  onResetForm: () => void;
}

export function ShiftSwapView({
  ownShifts,
  selectedOwnShiftId,
  peers,
  search,
  selectedPeerId,
  reason,
  submitting,
  successSwap,
  error,
  onBackToSchedule,
  onSelectOwnShift,
  onChangeSearch,
  onSelectPeer,
  onChangeReason,
  onSubmit,
  onResetForm,
}: ShiftSwapViewProps) {
  const filteredPeers = React.useMemo(
    () =>
      peers.filter(
        (p) =>
          p.staffName.toLowerCase().includes(search.toLowerCase()) ||
          p.shiftTitle.toLowerCase().includes(search.toLowerCase()) ||
          p.zone.toLowerCase().includes(search.toLowerCase())
      ),
    [peers, search]
  );

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBackToSchedule}
        className="inline-flex min-h-[48px] items-center gap-2 rounded-lg border border-[#E9E4DC] bg-white px-4 py-3 text-[#2B2118] font-semibold text-sm no-underline hover:bg-neutral-50 active:scale-98 transition-transform"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Lịch ca</span>
      </button>

      {!successSwap ? (
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-[#2B2118]">Đổi ca</h1>
            <p className="text-xs text-[#7A6A58] mt-0.5">
              Người nhận xác nhận trước, sau đó quản lý duyệt
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-[#D14B3A] text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Ca của tôi muốn đổi */}
          <div>
            <label className="block text-xs font-semibold text-[#7A6A58] uppercase tracking-wider mb-2">
              Ca của tôi muốn đổi
            </label>
            {ownShifts.length === 0 ? (
              <div className="p-4 bg-white border border-[#E9E4DC] rounded-lg text-sm text-[#7A6A58]">
                Bạn không có ca làm việc nào sắp tới để đổi.
              </div>
            ) : (
              <div className="space-y-2">
                {ownShifts.map((shift) => {
                  const isSelected = shift.id === selectedOwnShiftId;
                  return (
                    <div
                      key={shift.id}
                      onClick={() => onSelectOwnShift(shift.id)}
                      className={`p-3 rounded-lg border min-h-[52px] flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-red-50/60 border-[#8C1D2C]'
                          : 'bg-white border-[#E9E4DC] hover:border-[#8C1D2C]/40'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold text-[#2B2118]">
                          {shift.date} · {shift.startTime} – {shift.endTime}
                        </div>
                        <div className="text-xs text-[#7A6A58] mt-0.5">
                          {shift.zone || 'Khu vực bếp'}
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="b8-own-shift"
                        checked={isSelected}
                        onChange={() => onSelectOwnShift(shift.id)}
                        className="w-4 h-4 accent-[#8C1D2C]"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Đổi với nhân viên */}
          <div>
            <label className="block text-xs font-semibold text-[#7A6A58] uppercase tracking-wider mb-2">
              Đổi với nhân viên
            </label>
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-[#7A6A58] absolute left-3 top-3.5" />
              <input
                type="search"
                value={search}
                onChange={(e) => onChangeSearch(e.target.value)}
                placeholder="Tìm theo tên…"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-[#E9E4DC] rounded-lg text-sm focus:outline-none focus:border-[#8C1D2C] min-h-[44px]"
              />
            </div>

            {filteredPeers.length === 0 ? (
              <div className="p-4 bg-white border border-[#E9E4DC] rounded-lg text-center text-sm text-[#7A6A58]">
                Không tìm thấy nhân viên phù hợp.
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPeers.map((peer) => {
                  const isSelected = peer.staffId === selectedPeerId;
                  return (
                    <div
                      key={peer.staffId}
                      onClick={() => onSelectPeer(peer.staffId)}
                      className={`p-3 rounded-lg border min-h-[56px] flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-red-50/60 border-[#8C1D2C]'
                          : 'bg-white border-[#E9E4DC] hover:border-[#8C1D2C]/40'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-bold text-[#2B2118]">
                          {peer.staffName} · {peer.shiftTitle}
                        </div>
                        <div className="text-xs text-[#7A6A58] mt-0.5">
                          {peer.shiftDate} · {peer.shiftTime} · {peer.zone}
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="b8-peer"
                        checked={isSelected}
                        onChange={() => onSelectPeer(peer.staffId)}
                        className="w-4 h-4 accent-[#8C1D2C]"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Lý do */}
          <div>
            <label className="block text-xs font-semibold text-[#7A6A58] uppercase tracking-wider mb-1">
              Lý do
            </label>
            <textarea
              value={reason}
              onChange={(e) => onChangeReason(e.target.value)}
              placeholder="Ví dụ: việc gia đình"
              className="w-full p-3 bg-white border border-[#E9E4DC] rounded-lg text-sm focus:outline-none focus:border-[#8C1D2C] min-h-[80px]"
            />
          </div>

          {/* Nút gửi đổi ca */}
          <button
            type="button"
            disabled={!selectedOwnShiftId || !selectedPeerId || submitting}
            onClick={onSubmit}
            className="w-full py-3 bg-[#8C1D2C] hover:bg-[#6F1623] disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm min-h-[48px] flex items-center justify-center transition-colors"
          >
            {submitting ? 'Đang gửi...' : 'Gửi yêu cầu đổi ca'}
          </button>
          <p className="text-xs text-[#7A6A58] text-center">
            Chọn ca của bạn và người muốn đổi thì mới gửi được.
          </p>
        </div>
      ) : (
        /* Chi tiết yêu cầu sau khi gửi */
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-[#E9E4DC] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#2B2118]">Yêu cầu của tôi</h2>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
                Chờ người nhận xác nhận
              </span>
            </div>

            <div className="space-y-2 text-sm border-t border-[#F6F4F0] pt-2">
              <div className="flex justify-between py-1">
                <span className="text-[#7A6A58]">Lý do</span>
                <span className="font-medium text-[#141210]">{successSwap.reason || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-t border-[#F6F4F0]">
                <span className="text-[#7A6A58]">Thời gian gửi</span>
                <span className="font-medium text-[#141210]">Vừa xong</span>
              </div>
            </div>

            <p className="text-xs text-[#7A6A58] pt-2 border-t border-[#F6F4F0]">
              Người nhận xác nhận thì yêu cầu sẽ được chuyển đến quản lý để phê duyệt.
            </p>
            <p className="text-xs text-[#D14B3A] font-medium">
              Muốn hủy yêu cầu này thì gặp quản lý.
            </p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={onBackToSchedule}
              className="w-full py-3 bg-[#8C1D2C] hover:bg-[#6F1623] text-white font-semibold rounded-lg min-h-[48px] flex items-center justify-center transition-colors"
            >
              Xem lịch ca
            </button>
            <button
              type="button"
              onClick={onResetForm}
              className="w-full py-3 text-[#7A6A58] hover:text-[#2B2118] text-sm font-semibold min-h-[44px] flex items-center justify-center"
            >
              Đổi ca khác
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
