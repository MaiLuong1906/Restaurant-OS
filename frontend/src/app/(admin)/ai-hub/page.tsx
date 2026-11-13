'use client';

import * as React from 'react';
import {
  Wifi,
  Mic,
  QrCode,
  Zap,
  Radio,
} from 'lucide-react';
import { formatVND } from '@/lib/utils';

interface LanDevice {
  id: string;
  name: string;
  model: string;
  ip: string;
  status: 'ONLINE' | 'RESTARTING' | 'OFFLINE';
  paper: string;
  queue: number;
  temp: string;
  pingMs: number;
}

export default function AdminAiHubPage() {
  const [activeTab, setActiveTab] = React.useState<'ai' | 'lan'>('ai');
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  // VietQR Dynamic Amount
  const [qrAmount, setQrAmount] = React.useState('4620000');
  const [qrBank] = React.useState('VPBank · 109876543');

  // Whisper Audio State
  const [isRecording, setIsRecording] = React.useState(false);
  const [audioTranscript] = React.useState(
    'Cho tôi hai phần Royal Lamb Biryani, một giỏ Garlic Naan và một chai Château Margaux 2015 mang ra bàn VIP 02'
  );
  const [recognizedItems] = React.useState([
    { id: '1', name: 'Royal Lamb Biryani', qty: 2, price: 720000 },
    { id: '2', name: 'Garlic Naan Basket', qty: 1, price: 100000 },
    { id: '3', name: 'Château Margaux 2015', qty: 1, price: 8500000 },
  ]);

  // Predictive State
  const [weatherFactor, setWeatherFactor] = React.useState<'normal' | 'rain' | 'weekend'>('weekend');

  // LAN Hardware State
  const [devices, setDevices] = React.useState<LanDevice[]>([
    {
      id: 'DEV-01',
      name: 'Máy In Bill Thu Ngân (Cashier Printer)',
      model: 'Epson TM-T88VI High-Speed',
      ip: '192.168.1.20',
      status: 'ONLINE',
      paper: '68% Còn lại',
      queue: 0,
      temp: '31°C (Bình thường)',
      pingMs: 6,
    },
    {
      id: 'DEV-02',
      name: 'Máy In Phiếu Bếp BOH (Kitchen Printer)',
      model: 'Epson TM-T20III Auto-Cutter',
      ip: '192.168.1.21',
      status: 'ONLINE',
      paper: '35% (Sắp hết cuộn)',
      queue: 1,
      temp: '41°C (Ấm nhẹ)',
      pingMs: 8,
    },
    {
      id: 'DEV-03',
      name: 'Bộ Điều Khiển Màn Hình Bếp KDS',
      model: 'Raspberry Pi 4 Model B (4GB RAM)',
      ip: '192.168.1.30',
      status: 'ONLINE',
      paper: '—',
      queue: 6,
      temp: '42°C CPU',
      pingMs: 4,
    },
    {
      id: 'DEV-04',
      name: 'Trạm POS Cảm Ứng Quản Lý',
      model: 'Sunmi T2 Mini Touch POS System',
      ip: '192.168.1.10',
      status: 'ONLINE',
      paper: '—',
      queue: 0,
      temp: '36°C CPU',
      pingMs: 5,
    },
  ]);

  const toastTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const asyncTimersRef = React.useRef<NodeJS.Timeout[]>([]);

  React.useEffect(() => {
    const asyncTimers = asyncTimersRef.current;
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      asyncTimers.forEach((t) => clearTimeout(t));
    };
  }, []);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 3000);
  };

  const handlePingDevice = (deviceId: string) => {
    const dev = devices.find((d) => d.id === deviceId);
    if (!dev) return;
    const randomMs = Math.floor(Math.random() * 8) + 4;
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, pingMs: randomMs } : d))
    );
    showToast(`Ping ${dev.ip}: thời gian phản hồi = ${randomMs}ms (Giao thức ICMP OK)`);
  };

  const handleTestPrint = (deviceId: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, queue: d.queue + 1 } : d))
    );
    showToast(`Đã đẩy 1 lệnh in trang thử nghiệm đến thiết bị.`);
    const t = setTimeout(() => {
      setDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, queue: Math.max(0, d.queue - 1) } : d))
      );
    }, 2500);
    asyncTimersRef.current.push(t);
  };

  const handleRestartDevice = (deviceId: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, status: 'RESTARTING' } : d))
    );
    showToast(`Đang gửi tín hiệu khởi động lại thiết bị qua mạng LAN...`);
    const t = setTimeout(() => {
      setDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, status: 'ONLINE' } : d))
      );
      showToast(`Thiết bị đã khởi động lại và kết nối mạng LAN thành công!`);
    }, 2000);
    asyncTimersRef.current.push(t);
  };

  const predictedGuests = weatherFactor === 'weekend' ? 84 : weatherFactor === 'rain' ? 58 : 72;
  const predictedOccupancy = Math.round((predictedGuests / 90) * 100);

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
              AI Hub &amp; Quản Trị Thiết Bị LAN POS
            </h1>
            <p className="text-sm font-medium text-stone-600 max-w-2xl">
              Cổng thanh toán Dynamic VietQR, nhận dạng giọng nói gọi món Whisper AI và giám sát thiết bị phần cứng mạng nội bộ
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex items-center bg-white border border-stone-200 rounded-lg p-1 shadow-2xs">
              <button
                onClick={() => setActiveTab('ai')}
                className={`px-3.5 py-1.5 font-mono text-xs uppercase rounded font-bold transition-all cursor-pointer ${
                  activeTab === 'ai' ? 'bg-ops-brand text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Tính Năng AI (3)
              </button>
              <button
                onClick={() => setActiveTab('lan')}
                className={`px-3.5 py-1.5 font-mono text-xs uppercase rounded font-bold transition-all cursor-pointer ${
                  activeTab === 'lan' ? 'bg-ops-brand text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Thiết Bị Mạng LAN ({devices.length})
              </button>
            </div>

            <button
              onClick={() => {
                showToast('Đang gửi gói tin kiểm tra đồng loạt 4 thiết bị trạm qua switch mạng...');
                devices.forEach((d) => handlePingDevice(d.id));
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-900 border border-stone-200 rounded-lg shadow-2xs text-xs font-mono uppercase tracking-wider font-bold cursor-pointer transition-colors"
            >
              <Radio className="w-4 h-4 text-ops-brand" />
              <span>Ping Toàn Mạng LAN</span>
            </button>
          </div>
        </div>

        {/* TAB 1: AI FEATURES */}
        {activeTab === 'ai' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* AI Feature 1: Dynamic VietQR */}
            <div className="bg-white rounded-xl p-5 shadow-xs border border-ops-border border-l-4 border-l-emerald-600 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-ops-border">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-ops text-sm font-bold text-ops-ink">Thanh Toán VietQR Dynamic</h2>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-mono font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  LIVE 0đ PHÍ
                </span>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-ops-bg rounded-lg border border-ops-border space-y-3">
                <div className="w-36 h-36 bg-white border-2 border-dashed border-ops-border rounded-lg flex flex-col items-center justify-center p-2 text-center">
                  <QrCode className="w-20 h-20 text-ops-ink" />
                  <span className="font-mono text-[9px] text-ops-muted uppercase pt-1">Mã QR Động Napas 247</span>
                </div>
                <div className="text-center font-mono text-xs">
                  <span className="text-ops-muted block">{qrBank}</span>
                  <span className="font-bold text-primary-500 text-sm mt-0.5 block">
                    {formatVND(Number(qrAmount) || 0)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase font-bold text-ops-muted block">
                  Số tiền thanh toán linh hoạt (VND)
                </label>
                <input
                  type="number"
                  value={qrAmount}
                  onChange={(e) => setQrAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-ops-bg border border-ops-border rounded-lg font-mono text-sm font-bold text-ops-ink focus:outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => showToast('Đã làm mới mã Dynamic VietQR mới với webhook callback!')}
                  className="flex-1 py-2 bg-ops-bg hover:bg-stone-200 text-ops-ink border border-ops-border text-xs font-mono uppercase rounded font-semibold cursor-pointer"
                >
                  Làm mới QR
                </button>
                <button
                  onClick={() => showToast('Đang gửi lệnh in mã QR ra máy in Bill thu ngân...')}
                  className="flex-1 py-2 bg-primary-500 hover:bg-[#6F1623] text-white text-xs font-mono uppercase rounded font-bold cursor-pointer"
                >
                  In Mã QR
                </button>
              </div>
            </div>

            {/* AI Feature 2: Whisper AI Audio Ordering */}
            <div className="bg-white rounded-xl p-5 shadow-xs border border-ops-border border-l-4 border-l-blue-600 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-ops-border">
                <div className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-blue-600" />
                  <h2 className="font-ops text-sm font-bold text-ops-ink">Whisper AI Audio Ordering</h2>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-mono text-[10px] font-bold">
                  Độ chính xác: 97.3%
                </span>
              </div>

              <div className="p-3 bg-ops-bg rounded-lg border border-ops-border space-y-2">
                <span className="font-mono text-[10px] uppercase text-ops-muted font-bold block">
                  Giọng nói ghi âm gần nhất:
                </span>
                <p className="text-xs text-ops-ink italic bg-white p-2.5 rounded border border-ops-border leading-relaxed">
                  &ldquo;{audioTranscript}&rdquo;
                </p>
              </div>

              {/* Parsed Items with Adjusters */}
              <div className="space-y-1.5">
                <span className="font-mono text-[10px] uppercase text-ops-muted font-bold block">
                  Món Ăn Nhận Dạng Được ({recognizedItems.length}):
                </span>
                <div className="space-y-1.5 text-xs font-medium">
                  {recognizedItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-2 bg-emerald-50 text-emerald-900 rounded border border-emerald-200 flex items-center justify-between"
                    >
                      <span>{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">x{item.qty}</span>
                        <span className="font-mono text-emerald-800 text-[11px]">{formatVND(item.price * item.qty)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsRecording(!isRecording);
                    showToast(isRecording ? 'Đã dừng ghi âm' : 'Đang lắng nghe giọng gọi món...');
                  }}
                  className={`flex-1 py-2 text-xs font-mono uppercase rounded font-semibold cursor-pointer border ${
                    isRecording
                      ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse font-bold'
                      : 'bg-ops-bg hover:bg-stone-200 text-ops-ink border-ops-border'
                  }`}
                >
                  {isRecording ? 'Đang Lắng Nghe...' : 'Ghi Âm Lại'}
                </button>
                <button
                  onClick={() => showToast('Đã đẩy 3 món từ Whisper AI vào đơn hàng Bàn VIP 02!')}
                  className="flex-1 py-2 bg-primary-500 hover:bg-[#6F1623] text-white text-xs font-mono uppercase rounded font-bold cursor-pointer"
                >
                  Xác Nhận Đơn
                </button>
              </div>
            </div>

            {/* AI Feature 3: Peak Hour Predictive Engine */}
            <div className="bg-white rounded-xl p-5 shadow-xs border border-ops-border border-l-4 border-l-amber-600 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-ops-border">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-600" />
                  <h2 className="font-ops text-sm font-bold text-ops-ink">Dự Báo Lượng Khách Cao Điểm</h2>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setWeatherFactor('normal')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                      weatherFactor === 'normal' ? 'bg-amber-500 text-white' : 'bg-ops-bg text-ops-muted'
                    }`}
                  >
                    Ngày Thường
                  </button>
                  <button
                    onClick={() => setWeatherFactor('weekend')}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                      weatherFactor === 'weekend' ? 'bg-amber-500 text-white' : 'bg-ops-bg text-ops-muted'
                    }`}
                  >
                    Cuối Tuần
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-ops-muted">Dự báo khách tối nay:</span>
                  <span className="font-ops text-2xl font-bold text-ops-ink">{predictedGuests} Khách</span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-ops-muted">Khung giờ chạm đỉnh:</span>
                  <span className="font-mono font-bold text-primary-500">19:30 - 20:45</span>
                </div>
                <div className="w-full bg-ops-bg rounded-full h-2.5 overflow-hidden">
                  <div
                    style={{ width: `${predictedOccupancy}%` }}
                    className="bg-primary-500 h-2.5 rounded-full transition-all"
                  />
                </div>
                <span className="text-[10px] text-ops-muted text-right block font-mono">
                  Công suất bàn dự kiến: {predictedOccupancy}%
                </span>
              </div>

              <div className="p-3 bg-ops-bg rounded-lg border border-ops-border space-y-1.5 text-xs">
                <span className="font-mono text-[10px] uppercase font-bold text-ops-muted block">
                  Đề xuất sơ chế trước (Mise-en-place):
                </span>
                <p className="text-ops-ink leading-relaxed">
                  • Cơm Biryani: Chuẩn bị 28 suất trước 18:00<br />
                  • Bột Naan: Ủ sẵn 40 phần nướng lò đất<br />
                  • Thịt cừu ướp thảo mộc: 15kg sẵn sàng
                </p>
              </div>

              <button
                onClick={() => showToast('Đã gửi thông báo Mise-en-place trực tiếp đến màn hình KDS Bếp!')}
                className="w-full py-2 bg-ops-bg hover:bg-stone-200 text-ops-ink border border-ops-border text-xs font-mono uppercase rounded font-bold cursor-pointer"
              >
                Gửi Lệnh Sơ Chế Đến KDS Bếp
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: LAN HARDWARE DEVICES */}
        {activeTab === 'lan' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {devices.map((dev) => (
                <div
                  key={dev.id}
                  className="bg-white rounded-xl p-5 shadow-xs border border-ops-border space-y-3 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            dev.status === 'ONLINE'
                              ? 'bg-emerald-600 animate-pulse'
                              : dev.status === 'RESTARTING'
                              ? 'bg-amber-500 animate-spin'
                              : 'bg-rose-600'
                          }`}
                        />
                        <h3 className="font-ops text-sm font-bold text-ops-ink">{dev.name}</h3>
                      </div>
                      <span className="text-xs text-ops-muted">{dev.model}</span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
                        dev.status === 'ONLINE'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : dev.status === 'RESTARTING'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      {dev.status} ({dev.pingMs}ms)
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 py-2 border-y border-ops-border text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-ops-muted block uppercase">IP LAN</span>
                      <strong className="text-ops-ink">{dev.ip}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-ops-muted block uppercase">Hàng đợi</span>
                      <strong className="text-ops-ink">{dev.queue} Đơn</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-ops-muted block uppercase">Giấy / Nhiệt</span>
                      <strong className="text-ops-ink">{dev.paper !== '—' ? dev.paper : dev.temp}</strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
                    <button
                      onClick={() => handlePingDevice(dev.id)}
                      className="px-3 py-1.5 bg-ops-bg border border-ops-border hover:bg-stone-200 text-ops-ink text-xs font-mono uppercase rounded cursor-pointer"
                    >
                      Ping Test
                    </button>
                    <button
                      onClick={() => handleTestPrint(dev.id)}
                      className="px-3 py-1.5 bg-ops-bg border border-ops-border hover:bg-stone-200 text-ops-ink text-xs font-mono uppercase rounded font-semibold cursor-pointer"
                    >
                      In Thử
                    </button>
                    <button
                      onClick={() => handleRestartDevice(dev.id)}
                      className="px-3 py-1.5 bg-primary-500 hover:bg-[#6F1623] text-white text-xs font-mono uppercase rounded font-bold cursor-pointer"
                    >
                      Khởi Động Lại
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Global LAN Health Banner */}
            <div className="p-4 bg-white rounded-xl border border-ops-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <Wifi className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="font-bold text-ops-ink">Mạng Cục Bộ LAN POS (Subnet 192.168.1.0/24)</span>
                  <p className="text-ops-muted text-[11px]">Độ trễ trung bình: 6ms · Băng thông nội bộ: 1000 Mbps Full-Duplex</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 font-mono text-xs font-bold rounded border border-emerald-200">
                4/4 THIẾT BỊ HOẠT ĐỘNG HOÀN HẢO
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
