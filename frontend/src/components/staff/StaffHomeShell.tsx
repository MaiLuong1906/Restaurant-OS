import * as React from 'react';

export interface ShiftInfo {
  title: string;
  subtitle?: string;
  startTime: string;
  endTime: string;
  area: string;
  nextShift?: string;
  statusBadge?: React.ReactNode;
  checkInStatus?: React.ReactNode;
}

export interface StaffHomeShellProps {
  userName: string;
  roleChip: React.ReactNode;
  shift: ShiftInfo;
  roleCard: React.ReactNode;
  shiftExtraRows?: React.ReactNode;
  extraSections?: React.ReactNode;
  headerAction?: React.ReactNode;
  subtitle?: React.ReactNode;
}

export function StaffHomeShell({
  userName,
  roleChip,
  shift,
  roleCard,
  shiftExtraRows,
  extraSections,
  headerAction,
  subtitle,
}: StaffHomeShellProps) {
  return (
    <div className="min-h-full bg-ops-bg text-ink font-sans">
      <div className="w-full max-w-[480px] md:max-w-4xl lg:max-w-6xl mx-auto px-4 py-4 md:py-6">
        {/* Header Lời chào & vai trò */}
        <section className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#2B2118]">
              Xin chào{userName ? `, ${userName}` : ''}
            </h1>
            {subtitle ? (
              <div className="mt-1 text-xs md:text-sm text-ops-muted">
                {subtitle}
              </div>
            ) : null}
            <div className="mt-2.5">
              {roleChip}
            </div>
          </div>
          {headerAction ? (
            <div className="flex flex-wrap items-center gap-2">
              {headerAction}
            </div>
          ) : null}
        </section>

        {/* Grid thẻ Ca & Thẻ Nghiệp vụ Role */}
        <div className={`grid grid-cols-1 ${roleCard ? 'md:grid-cols-2' : ''} gap-4 md:gap-5`}>
          {/* Thẻ ca làm việc hôm nay chuẩn B2 */}
          <section className="bg-white border border-sand-200 rounded-2xl p-5 md:p-6 shadow-warm flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold text-ink">{shift.title}</h2>
                  {shift.subtitle ? (
                    <p className="mt-0.5 text-sm text-muted">{shift.subtitle}</p>
                  ) : null}
                </div>
                {shift.statusBadge}
              </div>

              <div className="my-4 border-t border-sand-200/80" />

              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted">Giờ ca</span>
                  <span className="ops-nums font-bold text-ink">
                    {shift.startTime} – {shift.endTime}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted">Khu vực</span>
                  <span className="font-bold text-ink">{shift.area}</span>
                </div>
                {shift.nextShift ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Ca tiếp theo</span>
                    <span className="ops-nums font-medium text-muted">{shift.nextShift}</span>
                  </div>
                ) : null}
                {shiftExtraRows}
              </div>
            </div>

            {shift.checkInStatus ? (
              <div className="mt-5 border-t border-sand-100 pt-4">
                {shift.checkInStatus}
              </div>
            ) : null}
          </section>

          {roleCard}
        </div>

        {/* Các sections mở rộng (Dị ứng, Thao tác nhanh, Lương, Quỹ phép, v.v.) */}
        {extraSections ? (
          <div className="mt-4 md:mt-5 space-y-4 md:space-y-5">
            {extraSections}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default StaffHomeShell;
