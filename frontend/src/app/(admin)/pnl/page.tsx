'use client';

import * as React from 'react';
import {
  Landmark,
  Download,
  FileText,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  DollarSign,
  PieChart,
  X,
} from 'lucide-react';
import { formatVND } from '@/lib/utils';

interface PnlPeriodData {
  rev: number;
  revGrowth: string;
  cogs: number;
  cogsPct: number;
  labor: number;
  laborPct: number;
  ebitda: number;
  ebitdaPct: number;
  waterfall: {
    id: string;
    name: string;
    amount: number;
    pct: number;
    target: number;
    status: string;
    details: string;
  }[];
}

const PERIOD_DATA: Record<'month' | 'quarter' | 'year', PnlPeriodData> = {
  month: {
    rev: 1285000000,
    revGrowth: '+12.4% vs tháng trước',
    cogs: 379075000,
    cogsPct: 29.5,
    labor: 308400000,
    laborPct: 24.0,
    ebitda: 359800000,
    ebitdaPct: 28.0,
    waterfall: [
      { id: 'c1', name: '1. Doanh thu thuần ẩm thực (Net F&B)', amount: 1285000000, pct: 100, target: 100, status: 'BENCHMARK', details: 'Doanh thu từ 760 lượt bàn thanh toán' },
      { id: 'c2', name: '2. Giá vốn hàng bán (COGS - Nguyên vật liệu)', amount: 379075000, pct: 29.5, target: 32, status: 'TỐT (DƯỚI TARGET)', details: 'Thịt bò Wagyu: 142M, Rượu vang: 98M, Hải sản & rau củ: 139M' },
      { id: 'c3', name: '3. Chi phí nhân công (Labor & Tip Share)', amount: 308400000, pct: 24.0, target: 26, status: 'TỐT (DƯỚI TARGET)', details: 'Lương cơ bản: 245M, Thưởng & Quỹ Tip: 63.4M' },
      { id: 'c4', name: '4. Chi phí thuê mặt bằng Connaught', amount: 128500000, pct: 10.0, target: 10, status: 'CHUẨN ĐỊNH MỨC', details: 'Hợp đồng thuê 5 năm cố định' },
      { id: 'c5', name: '5. Tiện ích (Điện 3 pha, Nước, Gas Bếp)', amount: 51400000, pct: 4.0, target: 4.5, status: 'TIẾT KIỆM', details: 'Hệ thống điện thông minh tiết kiệm 12% điện sảnh' },
      { id: 'c6', name: '6. Chi phí marketing & vận hành phụ trợ', amount: 57825000, pct: 4.5, target: 5.0, status: 'TỐT (DƯỚI TARGET)', details: 'Quảng cáo Meta/Google: 35M, Khăn ăn, nến & in ấn: 22.8M' },
    ],
  },
  quarter: {
    rev: 3740000000,
    revGrowth: '+9.8% vs Quý 3',
    cogs: 1122000000,
    cogsPct: 30.0,
    labor: 935000000,
    laborPct: 25.0,
    ebitda: 972400000,
    ebitdaPct: 26.0,
    waterfall: [
      { id: 'c1', name: '1. Doanh thu thuần ẩm thực (Net F&B)', amount: 3740000000, pct: 100, target: 100, status: 'BENCHMARK', details: 'Tổng 2.240 lượt bàn trong 3 tháng' },
      { id: 'c2', name: '2. Giá vốn hàng bán (COGS - Nguyên vật liệu)', amount: 1122000000, pct: 30.0, target: 32, status: 'TỐT (DƯỚI TARGET)', details: 'Giá vốn trung bình 30% giữ vững' },
      { id: 'c3', name: '3. Chi phí nhân công (Labor & Tip Share)', amount: 935000000, pct: 25.0, target: 26, status: 'TỐT (DƯỚI TARGET)', details: 'Tỷ trọng nhân công đạt định mức' },
      { id: 'c4', name: '4. Chi phí thuê mặt bằng Connaught', amount: 385500000, pct: 10.3, target: 10, status: 'CHUẨN ĐỊNH MỨC', details: 'Chi phí mặt bằng 3 tháng' },
      { id: 'c5', name: '5. Tiện ích (Điện 3 pha, Nước, Gas Bếp)', amount: 157080000, pct: 4.2, target: 4.5, status: 'TIẾT KIỆM', details: 'Chi phí năng lượng mùa thu ổn định' },
      { id: 'c6', name: '6. Chi phí marketing & vận hành phụ trợ', amount: 168300000, pct: 4.5, target: 5.0, status: 'TỐT (DƯỚI TARGET)', details: 'Chiến dịch Private Dining mùa lễ' },
    ],
  },
  year: {
    rev: 14200000000,
    revGrowth: '+15.2% vs Năm 2023',
    cogs: 4331000000,
    cogsPct: 30.5,
    labor: 3550000000,
    laborPct: 25.0,
    ebitda: 3692000000,
    ebitdaPct: 26.0,
    waterfall: [
      { id: 'c1', name: '1. Doanh thu thuần ẩm thực (Net F&B)', amount: 14200000000, pct: 100, target: 100, status: 'BENCHMARK', details: 'Doanh thu cả năm 2024' },
      { id: 'c2', name: '2. Giá vốn hàng bán (COGS - Nguyên vật liệu)', amount: 4331000000, pct: 30.5, target: 32, status: 'TỐT (DƯỚI TARGET)', details: 'Hợp đồng mua dài hạn giúp ổn định giá thịt và rượu' },
      { id: 'c3', name: '3. Chi phí nhân công (Labor & Tip Share)', amount: 3550000000, pct: 25.0, target: 26, status: 'TỐT (DƯỚI TARGET)', details: 'Định biên nhân sự 14 nhân sự ổn định' },
      { id: 'c4', name: '4. Chi phí thuê mặt bằng Connaught', amount: 1542000000, pct: 10.8, target: 10, status: 'CHUẨN ĐỊNH MỨC', details: 'Hợp đồng mặt bằng năm 2024' },
      { id: 'c5', name: '5. Tiện ích (Điện 3 pha, Nước, Gas Bếp)', amount: 596400000, pct: 4.2, target: 4.5, status: 'TIẾT KIỆM', details: 'Tổng năng lượng tiêu thụ 12 tháng' },
      { id: 'c6', name: '6. Chi phí marketing & vận hành phụ trợ', amount: 488600000, pct: 3.5, target: 5.0, status: 'TỐT (DƯỚI TARGET)', details: 'Kênh truyền thông nhà hàng cao cấp' },
    ],
  },
};

export default function AdminPnlPage() {
  const [period, setPeriod] = React.useState<'month' | 'quarter' | 'year'>('month');
  const [selectedCostLine, setSelectedCostLine] = React.useState<any | null>(null);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const currentData = PERIOD_DATA[period];

  const MONTHLY_TREND = [
    { month: 'T6', pct: 22, height: 55 },
    { month: 'T7', pct: 19, height: 48 },
    { month: 'T8', pct: 24, height: 60 },
    { month: 'T9', pct: 25, height: 63 },
    { month: 'T10', pct: 26, height: 66 },
    { month: 'T11', pct: 28, height: 72, isCurrent: true },
  ];

  return (
    <div className="w-full">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-ops-ink text-white px-4 py-2.5 rounded-lg shadow-lg border border-ops-border text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
          {toastMsg}
        </div>
      )}

      {/* Top Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5 sm:space-y-6 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-stone-200">
          <div className="space-y-1">
            <h1 className="font-ops text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-stone-900">
              Báo Cáo P&amp;L &amp; Phân Tích Lợi Nhuận
            </h1>
            <p className="text-sm font-medium text-stone-600 max-w-2xl">
              Phân tích cấu trúc doanh thu thuần, tỷ trọng định mức COGS, chi phí nhân công và biên lợi nhuận hoạt động EBITDA
            </p>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <div className="inline-flex items-center bg-white border border-stone-200 rounded-lg p-1 shadow-2xs">
              <button
                onClick={() => {
                  setPeriod('month');
                  showToast('Chuyển sang báo cáo P&L Tháng 11');
                }}
                className={`px-3 py-1.5 font-mono text-xs uppercase rounded font-bold transition-all cursor-pointer ${
                  period === 'month' ? 'bg-ops-brand text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Tháng 11
              </button>
              <button
                onClick={() => {
                  setPeriod('quarter');
                  showToast('Chuyển sang báo cáo P&L Quý 4');
                }}
                className={`px-3 py-1.5 font-mono text-xs uppercase rounded font-bold transition-all cursor-pointer ${
                  period === 'quarter' ? 'bg-ops-brand text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Quý 4
              </button>
              <button
                onClick={() => {
                  setPeriod('year');
                  showToast('Chuyển sang báo cáo P&L Cả Năm 2024');
                }}
                className={`px-3 py-1.5 font-mono text-xs uppercase rounded font-bold transition-all cursor-pointer ${
                  period === 'year' ? 'bg-ops-brand text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Năm 2024
              </button>
            </div>

            <button
              onClick={() => showToast('Đang kết xuất báo cáo P&L định dạng PDF có chữ ký điện tử...')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 rounded-lg shadow-2xs text-xs font-mono uppercase tracking-wider font-bold cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4 text-stone-600" />
              <span>Xuất PDF</span>
            </button>
          </div>
        </div>

        {/* 4 Core Financial Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-2xs border border-stone-200 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="font-mono text-xs uppercase tracking-wider text-stone-700 font-bold">
                Doanh Thu Thuần (Gross Revenue)
              </span>
              <div className="font-ops text-2xl xl:text-3xl font-extrabold text-stone-900 pt-1">
                {formatVND(currentData.rev)}
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-stone-200 flex items-center justify-between text-xs">
              <span className="text-emerald-700 font-bold flex items-center gap-1 font-mono">
                <TrendingUp className="w-3.5 h-3.5" />
                {currentData.revGrowth}
              </span>
              <span className="font-mono text-stone-500 text-xs font-semibold">100% Doanh thu</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-2xs border border-stone-200 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="font-mono text-xs uppercase tracking-wider text-stone-700 font-bold">
                Chi Phí Thực Phẩm (COGS)
              </span>
              <div className="font-ops text-2xl xl:text-3xl font-extrabold text-stone-900 pt-1">
                {formatVND(currentData.cogs)}
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-stone-200 flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {currentData.cogsPct}% DOANH THU
              </span>
              <span className="text-stone-500 text-xs font-mono font-semibold">Target: ≤ 32%</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-2xs border border-stone-200 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="font-mono text-xs uppercase tracking-wider text-stone-700 font-bold">
                Chi Phí Nhân Công (Labor)
              </span>
              <div className="font-ops text-2xl xl:text-3xl font-extrabold text-stone-900 pt-1">
                {formatVND(currentData.labor)}
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-stone-200 flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {currentData.laborPct}% DOANH THU
              </span>
              <span className="text-stone-500 text-xs font-mono font-semibold">Target: ≤ 26%</span>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-2xs border border-stone-200 border-l-4 border-l-ops-brand flex flex-col justify-between">
            <div className="space-y-1">
              <span className="font-mono text-xs uppercase tracking-wider text-ops-brand font-bold">
                Lợi Nhuận EBITDA Hoạt Động
              </span>
              <div className="font-ops text-2xl xl:text-3xl font-extrabold text-ops-brand pt-1">
                {formatVND(currentData.ebitda)}
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-stone-200 flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {currentData.ebitdaPct}% BIÊN LỢI NHUẬN
              </span>
              <span className="text-emerald-700 font-bold text-xs font-mono">Vượt Target</span>
            </div>
          </div>
        </div>

        {/* 2-Column: Waterfall Table & Trend Visualizer */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Waterfall Table (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-xs border border-ops-border space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-ops-border">
              <div>
                <h2 className="font-ops text-base font-bold text-ops-ink">Bảng Phân Tách Chi Phí Hoạt Động (P&amp;L Waterfall)</h2>
                <p className="text-xs text-ops-muted">Click vào từng dòng chi phí để xem chi tiết diễn giải và nhật ký chứng từ</p>
              </div>
              <span className="font-mono text-xs font-bold text-primary-500 bg-primary-500/10 px-2.5 py-1 rounded uppercase">
                {period === 'month' ? 'Tháng 11' : period === 'quarter' ? 'Quý 4' : 'Năm 2024'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[550px]">
                <thead>
                  <tr className="bg-ops-bg border-b border-ops-border text-ops-muted font-mono text-[10px] uppercase">
                    <th className="py-2.5 px-3 font-bold">Hạng Mục Doanh Thu &amp; Chi Phí</th>
                    <th className="py-2.5 px-3 text-right font-bold">Số Tiền (VND)</th>
                    <th className="py-2.5 px-3 text-right font-bold">% DT</th>
                    <th className="py-2.5 px-3 text-right font-bold">Định Mức</th>
                    <th className="py-2.5 px-3 text-center font-bold">Đánh Giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ops-border font-mono">
                  {currentData.waterfall.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedCostLine(row)}
                      className="hover:bg-ops-bg transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 px-3 font-sans font-medium text-ops-ink group-hover:text-primary-500">
                        {row.name}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-ops-ink">{formatVND(row.amount)}</td>
                      <td className="py-2.5 px-3 text-right text-ops-muted">{row.pct}%</td>
                      <td className="py-2.5 px-3 text-right text-ops-muted">{row.target}%</td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {/* EBITDA Highlight Row */}
                  <tr className="bg-emerald-50/70 border-t-2 border-emerald-600 font-bold">
                    <td className="py-3 px-3 font-sans text-sm text-emerald-900">
                      ★ LỢI NHUẬN HOẠT ĐỘNG (EBITDA)
                    </td>
                    <td className="py-3 px-3 text-right text-sm text-emerald-900">{formatVND(currentData.ebitda)}</td>
                    <td className="py-3 px-3 text-right text-sm text-emerald-900">{currentData.ebitdaPct}%</td>
                    <td className="py-3 px-3 text-right text-sm text-emerald-800">23.0%</td>
                    <td className="py-3 px-3 text-center font-sans">
                      <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">
                        VƯỢT TRỘI
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: EBITDA Trend & AI Insight (1 col) */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-5 shadow-xs border border-ops-border space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-ops-border">
                <h3 className="font-ops text-sm font-bold text-ops-ink">Xu Hướng EBITDA (6 Tháng)</h3>
                <span className="font-mono text-xs text-emerald-700 font-bold">+6% Tăng trưởng</span>
              </div>
              <div className="h-44 flex items-end justify-between gap-2 pt-4 px-2">
                {MONTHLY_TREND.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => showToast(`Biên lợi nhuận ${item.month}: ${item.pct}% EBITDA`)}
                    className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end cursor-pointer group"
                  >
                    <span className="font-mono text-[10px] font-bold text-ops-muted group-hover:text-primary-500">
                      {item.pct}%
                    </span>
                    <div
                      style={{ height: `${item.height}%` }}
                      className={`w-full max-w-[36px] rounded-t transition-all ${
                        item.isCurrent ? 'bg-primary-500' : 'bg-stone-300 group-hover:bg-stone-400'
                      }`}
                    />
                    <span className="font-mono text-[11px] font-semibold text-ops-ink">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Advisory Box */}
            <div className="bg-white rounded-xl p-5 shadow-xs border border-ops-border border-l-4 border-l-amber-600 space-y-3">
              <div className="flex items-center gap-2 text-primary-500">
                <Sparkles className="w-4 h-4" />
                <h3 className="font-ops text-xs uppercase font-bold tracking-wider">
                  Khuyến Nghị Tối Ưu Chi Phí
                </h3>
              </div>
              <p className="text-xs text-ops-muted leading-relaxed">
                Biên lợi nhuận gộp Tháng 11 đạt đỉnh 28.0% nhờ kiểm soát định lượng BOM rượu vang Château Margaux tốt. Tháng 12 dự kiến lượng đặt bàn tiệc cuối năm tăng 35%, nên chốt sớm các đơn PO nguyên liệu để giữ COGS dưới 29%.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Chi Tiết Dòng Chi Phí Waterfall */}
      {selectedCostLine && (
        <div className="fixed inset-0 bg-stone-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-ops-border space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-ops-border">
              <div>
                <h3 className="font-ops text-base font-bold text-ops-ink">{selectedCostLine.name}</h3>
                <span className="text-xs text-ops-muted font-mono">{selectedCostLine.status}</span>
              </div>
              <button
                onClick={() => setSelectedCostLine(null)}
                className="w-7 h-7 rounded hover:bg-ops-bg text-ops-muted flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-ops-bg rounded-lg space-y-1 font-mono">
                <div className="flex justify-between text-ops-muted">
                  <span>Tổng giá trị phát sinh:</span>
                  <strong className="text-ops-ink text-sm">{formatVND(selectedCostLine.amount)}</strong>
                </div>
                <div className="flex justify-between text-ops-muted">
                  <span>Tỷ trọng thực tế trên doanh thu:</span>
                  <span className="font-bold text-primary-500">{selectedCostLine.pct}%</span>
                </div>
                <div className="flex justify-between text-ops-muted">
                  <span>Định mức trần mục tiêu:</span>
                  <span>{selectedCostLine.target}%</span>
                </div>
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-ops-muted block mb-1">
                  Diễn giải chứng từ &amp; Phân bổ chi tiết:
                </span>
                <p className="p-3 bg-ops-bg rounded-lg border border-ops-border text-ops-ink leading-relaxed">
                  {selectedCostLine.details}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-ops-border">
              <button
                onClick={() => setSelectedCostLine(null)}
                className="px-4 py-2 bg-primary-500 hover:bg-[#6F1623] text-white text-xs font-mono uppercase rounded font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
