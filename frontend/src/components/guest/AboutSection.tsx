import * as React from 'react';
import { ShieldCheck, Flame, HeartHandshake } from 'lucide-react';

export function AboutSection() {
  const commitments = [
    {
      title: '100% Nguyên liệu tươi sạch',
      description: 'Tuyển chọn mỗi sáng sớm từ các nhà vườn và nguồn cung ứng đạt chuẩn an toàn vệ sinh.',
      icon: ShieldCheck,
    },
    {
      title: 'Công thức gia truyền 30 năm',
      description: 'Gia vị cổ truyền Bắc Bộ đúc kết qua nhiều thập kỷ, giữ trọn hồn cốt ẩm thực Hà Thành.',
      icon: Flame,
    },
    {
      title: 'Phục vụ tận tâm',
      description: 'Không gian ấm cúng, hiếu khách như đón người thân ghé thăm góc phố xưa.',
      icon: HeartHandshake,
    },
  ];

  return (
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#E9E4DC]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left Column: The Story */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E9E4DC]/60 text-xs font-semibold text-[#8C1D2C]">
            Về Quán Phố Cổ
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#141210] leading-tight">
            Gìn giữ tinh hoa ẩm thực truyền thống giữa lòng phố thị
          </h2>
          <div className="space-y-4 text-sm sm:text-base text-[#7A6A58] leading-relaxed">
            <p>
              Khởi nguồn từ niềm đam mê sâu sắc với ẩm thực Hà Nội xưa, Phố Cổ mang đến trải nghiệm thưởng vị chuẩn mực, nơi từng nguyên liệu tươi mới mỗi ngày được chọn lọc kỹ lưỡng để giữ trọn vị ngon ngọt nguyên bản.
            </p>
            <p>
              Chúng tôi chắt lọc tinh hoa từ những công thức gia vị cổ truyền Bắc Bộ — từ nước mắm nhĩ cốt thơm, hoa hồi, thảo quả đến nghệ vàng đượm lửa, mang lại những món ăn thanh tao nhưng đượm đà chiều sâu.
            </p>
            <p>
              Bước vào quán là tìm về một không gian ấm cúng, thư thái, nơi ánh đèn vàng dịu nhẹ hòa cùng nét mộc mạc của bàn gỗ, gợi nhắc dư vị những buổi sum vầy trọn vẹn của gia đình Việt.
            </p>
          </div>
        </div>

        {/* Right Column: 3 Commitment Cards */}
        <div className="space-y-4">
          {commitments.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="p-5 rounded-lg bg-[#FFFFFF] border border-[#E9E4DC] transition-shadow hover:shadow-xs flex items-start gap-4"
              >
                <div className="p-2.5 rounded-lg bg-[#F5F2EA] text-[#8C1D2C] shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#141210]">{item.title}</h3>
                  <p className="mt-1 text-xs sm:text-sm text-[#7A6A58] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
