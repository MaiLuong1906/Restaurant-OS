'use client';

import * as React from 'react';
import Link from 'next/link';
import { PHO_CO_DISHES, FALLBACK_DISH_IMAGE, CustomerDish } from '@/lib/customer-menu-data';
import { formatVnd } from '@/lib/formatMoney';

function DishCard({ dish }: { dish: CustomerDish }) {
  const [imgSrc, setImgSrc] = React.useState<string>(dish.imageUrl || FALLBACK_DISH_IMAGE);
  const [hasFallback, setHasFallback] = React.useState(false);

  const handleImageError = () => {
    if (!hasFallback) {
      setHasFallback(true);
      setImgSrc(FALLBACK_DISH_IMAGE);
    }
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E9E4DC] rounded-lg overflow-hidden flex flex-col transition-shadow hover:shadow-md">
      {/* Dish Image */}
      <div className="relative aspect-4/3 w-full bg-[#E9E4DC]/40 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt={dish.name}
          onError={handleImageError}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {dish.badge && (
          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded bg-[#8C1D2C] text-white text-xs font-semibold shadow-xs">
            {dish.badge}
          </span>
        )}
      </div>

      {/* Dish Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-[#141210] line-clamp-1">{dish.name}</h3>
          <p className="mt-1 text-xs text-[#7A6A58] line-clamp-2 leading-relaxed">
            {dish.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-[#E9E4DC]/60 flex items-center justify-between">
          <span className="text-sm font-bold text-[#8C1D2C]">
            {formatVnd(dish.price)}
          </span>
          <Link
            href="/menu"
            className="text-xs font-semibold text-[#7A6A58] hover:text-[#8C1D2C] transition-colors"
          >
            Chi tiết &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

export function FeaturedDishes() {
  // Matched dishes from PHO_CO_DISHES preserving data order:
  // 1. Gỏi Ngó Sen Tôm Thịt
  // 2. Nem Rán Phố Cổ Giòn Rụm
  // 3. Phở Cuốn Hà Nội Bò Tươi
  // 4. Bún Chả Nướng Phố Cổ Than Hoa
  const featuredIds = ['dish-goi-ngo-sen', 'dish-nem-ran', 'dish-pho-cuon', 'dish-bun-cha'];
  const dishes = PHO_CO_DISHES.filter((d) => featuredIds.includes(d.id));

  return (
    <section id="featured" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold text-[#141210] tracking-tight">
          Món Nổi Bật
        </h2>
        <p className="mt-2 text-sm text-[#7A6A58]">
          Những hương vị gia truyền trứ danh được thực khách yêu thích nhất tại Phố Cổ.
        </p>
      </div>

      {/* Grid: 1 col on mobile 390px, 2 on tablet, 4 on desktop 1440px */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {dishes.map((dish) => (
          <DishCard key={dish.id} dish={dish} />
        ))}
      </div>

      {/* Section Footer CTA */}
      <div className="mt-10 text-center">
        <Link
          href="/menu"
          className="inline-flex items-center justify-center min-h-[48px] px-8 py-3 rounded-lg bg-[#8C1D2C] hover:bg-[#6F1623] text-white text-sm font-semibold transition-colors active:scale-[0.98] shadow-sm"
        >
          Xem toàn bộ thực đơn
        </Link>
      </div>
    </section>
  );
}
