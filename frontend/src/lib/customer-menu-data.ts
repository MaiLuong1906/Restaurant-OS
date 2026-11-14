import type { Dish } from '../types';

export interface CustomerDish extends Dish {
  badge?: string;
  badgeVariant?: 'recommend' | 'bestseller' | 'special' | 'neutral';
  subCategory?: 'APPETIZER' | 'MAIN' | 'SOUP' | 'DESSERT' | 'DRINK';
  isVegetarian?: boolean;
  isSpicy?: boolean;
  isHotSoup?: boolean;
  isRefreshing?: boolean;
  portionSizes?: {
    id: string;
    label: string;
    subtext: string;
    price: number; // VND integer
  }[];
  addons?: {
    id: string;
    label: string;
    subtext: string;
    extraPrice: number; // VND integer
  }[];
}

export interface PlacedBatchItem {
  id: string;
  dishId: string;
  dishName: string;
  description: string;
  imageUrl: string;
  unitLabel: string;
  quantity: number;
  unitPrice: number; // VND integer
  status: 'COOKING' | 'SERVED';
  cookingNote?: string;
  etaText?: string;
  expedited?: boolean;
}

export interface PlacedBatch {
  id: string;
  batchNumber: number;
  title: string;
  submittedAt: string;
  isCompleted: boolean;
  items: PlacedBatchItem[];
}

export function triggerHaptic(durationMs = 15): void {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // Ignore on unsupported browsers
    }
  }
}

export const PHO_CO_DISHES: CustomerDish[] = [
  {
    id: 'dish-goi-ngo-sen',
    name: 'Gỏi Ngó Sen Tôm Thịt',
    description:
      'Ngó sen Đồng Tháp giòn mát, tôm sú tươi ngọt, thịt ba chỉ xắt mỏng cùng rau răm và đậu phộng rang.',
    price: 95000,
    category: 'APPETIZER',
    subCategory: 'APPETIZER',
    badge: 'Gợi ý',
    badgeVariant: 'recommend',
    isRefreshing: true,
    isAvailable: true,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDdljf3vzNZM78xdWHq4t6ZPqN9uGdxds832ePPH6cKbsPx9ris57YOeDQLtzhRlzZ4CJtoxFZtFm-CnVX8f5hBt7KOjJ3mjIE4xfu1C6bHuSZnAQA1s9pRdBTOgdd3JNB4ZEwjF2EBKjb1tQy6AaPZOSFXCi-dEddF-MCp8bTDmwU4IuqoO9i_-iAT2wd5EbGExVrOh9kOhVXnJGo6tHkGLVOlFCTmtQMvBAXDLA',
    portionSizes: [
      {
        id: 'standard',
        label: 'Đĩa tiêu chuẩn',
        subtext: 'Phù hợp 2 - 3 người dùng',
        price: 95000,
      },
      {
        id: 'large',
        label: 'Đĩa lớn gia đình',
        subtext: 'Phù hợp 4 - 6 người dùng',
        price: 145000,
      },
    ],
    addons: [
      {
        id: 'phong-tom',
        label: 'Thêm bánh phồng tôm giòn',
        subtext: 'Đĩa 8 chiếc mới chiên',
        extraPrice: 15000,
      },
      {
        id: 'nuoc-mam',
        label: 'Thêm nước mắm chua ngọt',
        subtext: 'Bát mắm tỏi ớt pha riêng',
        extraPrice: 5000,
      },
    ],
  },
  {
    id: 'dish-nem-ran',
    name: 'Nem Rán Phố Cổ Giòn Rụm',
    description:
      'Vỏ bánh đa nem làng Chều tráng tay giòn rụm, nhân thịt nạc vai xay nhuyễn cùng miến dong, mộc nhĩ, nấm hương rừng và trứng gà tươi.',
    price: 85000,
    category: 'APPETIZER',
    subCategory: 'APPETIZER',
    badge: 'Bán chạy',
    badgeVariant: 'bestseller',
    isAvailable: true,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDhTwippnVx9NzIxsHpGTe6IjgYtTq8Lk53zBcagaClWU2gNYvake54BwWPsmQUoZppLgWvaZYBUFMogvl6MAxrEH1DyFPrrm1xgNixS12A7NaI_w1k8IwBY6wjOO__Ho_8xFWsP11La8MxadFuW5wbroSFrWsxRV4c0XmXrAn6TrllB4SI-nwoiFUOG_YIpVcN_AyGNK3snZuNjTGnUgy6BUK_3dL3tGQB37ZFIA',
    portionSizes: [
      {
        id: 'standard',
        label: 'Phần tiêu chuẩn (6 cuốn)',
        subtext: 'Phù hợp 1 - 2 người dùng',
        price: 85000,
      },
      {
        id: 'large',
        label: 'Phần lớn (10 cuốn)',
        subtext: 'Phù hợp nhóm 3 - 4 người',
        price: 135000,
      },
    ],
    addons: [
      {
        id: 'bun-tuoi',
        label: 'Thêm bún tươi Phú Đô',
        subtext: 'Đĩa 150g sợi mềm mướt',
        extraPrice: 10000,
      },
      {
        id: 'rau-song',
        label: 'Thêm rau sống tươi vườn',
        subtext: 'Kinh giới, tía tô, xà lách sạch',
        extraPrice: 10000,
      },
      {
        id: 'nuoc-cham',
        label: 'Thêm nước chấm đặc biệt',
        subtext: 'Bát mắm tỏi ớt kèm đu đủ cà rốt',
        extraPrice: 5000,
      },
    ],
  },
  {
    id: 'dish-nom-bo',
    name: 'Nộm Bò Bóp Thấu Chua Ngọt',
    description:
      'Thịt bắp bò tái chanh mềm ngọt, khế chua, chuối xanh bùi ngậy trộn thính gạo rang và rau thơm phố cổ.',
    price: 110000,
    category: 'APPETIZER',
    subCategory: 'APPETIZER',
    isSpicy: true,
    isAvailable: true,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuASX3KfwUUfCWxlrKbUn6LPSuXJWXErigx_aCZTv6YGwognAzE1Fs_R2UOceZ8TRB6R4138RGHMny2f7Dfca2X5IVGYUFiFPaG3IFHBsxSTN1eERLekMJlxVrS9c3Dl-zQDzWwRzTEduM2S9laLN4FdEZojsPaOihYomDyAEDoqQMx1XTN9x1YAwMquLZ6t0REECSrD3bYrH4XJeutbf5EkdhISRPF28i-PUafzZA',
  },
  {
    id: 'dish-pho-cuon',
    name: 'Phở Cuốn Hà Nội Bò Tươi',
    description:
      'Bánh phở tráng tay mềm dai, bò xào lăn tỏi thơm lừng cuộn xà lách, mùi ta chấm nước mắm dưa góp.',
    price: 80000,
    category: 'APPETIZER',
    subCategory: 'APPETIZER',
    badge: '6 cuốn',
    badgeVariant: 'neutral',
    isAvailable: true,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCjlMVyTCW0r37GDHMYs_UwJYcE5HiYei2x5rAgZbGuOLfxWLBD7uFk0cDQJ9cjJtTaIBx8EJTlLHRPHu4nTFMbIIopVk5tkicUfMP39HUsQZ4SJ0nFB4JkeshTWG4VXg_RPWecrqNL7cDSco4KAnIcrfTo3HHXZNeUkiQT5Pxe-EV94IMRS73-Ep40j7bXKy62w09hUHq4hYiRI-zz2vFIrW88WU870b6ArmHO4w',
  },
  {
    id: 'dish-bun-cha',
    name: 'Bún Chả Nướng Phố Cổ Than Hoa',
    description:
      'Chả miếng ba chỉ và chả viên nướng vỉ tre đượm khói thơm lừng kèm đu đủ xanh ngâm giấm ớt và bún tươi Phú Đô.',
    price: 95000,
    category: 'MAIN',
    subCategory: 'MAIN',
    badge: 'Than hoa',
    badgeVariant: 'bestseller',
    isAvailable: true,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD7yyla48hHN2Ux5BpLHqfY1me8bysp1AFW0AHazfhc41CooAHmGW4LLPF6fKPx0DcYIBH8Ol_NvX71W_Y9m9ZQ_sWOxScj-20TpH1AibuwxTU4EnsSRRmfRiE-YStHoyi_Zv67KAhw45acxXqcqAGFpd_LOw-_7-EKJ_vOBhseUeNF5XoJeXLWRtzmLUOdk08tjTdnvXJw9p2yWMtvkteypfgtTNMLFUtGv0PGtw',
    portionSizes: [
      {
        id: 'standard',
        label: 'Suất tiêu chuẩn',
        subtext: 'Chả viên + chả miếng + bún tươi',
        price: 95000,
      },
      {
        id: 'dac-biet',
        label: 'Suất đặc biệt thêm nem cua bể',
        subtext: 'Kèm 1 nem cua bể vuông giòn rụm',
        price: 130000,
      },
    ],
    addons: [
      {
        id: 'them-cha',
        label: 'Thêm bát chả nướng',
        subtext: 'Chả miếng & chả băm than hoa',
        extraPrice: 45000,
      },
      {
        id: 'them-bun',
        label: 'Thêm đĩa bún Phú Đô',
        subtext: 'Đĩa 150g sợi nhỏ',
        extraPrice: 10000,
      },
    ],
  },
  {
    id: 'dish-cha-ca',
    name: 'Chả Cá Lã Vọng Thì Là',
    description:
      'Cá lăng sông Đà ướp riềng mẻ nghệ nướng than hoa rồi xào thì là, hành củ nóng bỏng tại bàn kèm mắm tôm đánh sủi.',
    price: 175000,
    category: 'MAIN',
    subCategory: 'MAIN',
    badge: 'Tuyệt phẩm',
    badgeVariant: 'special',
    isAvailable: true,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDv0lb3NoSkQg3SbvYK2AO6Sj428LBwdcu5dNnjOr4o0dcjq6nbgtKWA20XbXMyJSlg0jSnSxXuvsum1rfJy-j1KcFWTZxJHR8UrBes-RmCkk9NMPjJwmV2-NrPbyfwhjF0nnb_Rp2FF6kLQ3P5Zx2J7UIpNj3BlJ0OMYWVi02UINqUnlRh1egGOtUcTQ9p4Ige7kc6B_YCdU-sFS7qZKi-H_nGuUWRyoirGhF1OA',
  },
  {
    id: 'dish-com-rang-dua-bo',
    name: 'Cơm Rang Dưa Bò Giòn',
    description:
      'Hạt cơm tơi vàng giòn đảo lửa lớn, dưa cải chua muối khéo xào thịt thăn bò mềm ngọt rắc hành phi.',
    price: 85000,
    category: 'MAIN',
    subCategory: 'MAIN',
    isAvailable: true,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAS8VfUlL9nXSmkyrgxwEbhJJfAtvmQIJTV7vcfQfsPqG1lrgbj9bvGQbMyC6HAq--7OWLg1RihJRZ_V2SJ4oXAyFs_VOAPWqqerQG6ewKfqh3AaUwh0bBX2EiUE8kANxbGE7sMwZAx8wPhqxuLXHaKZ4YfaipD4mggkBDtUYolR14pQRkJA_xO0hdqTu4GPv_EnwjPhZlq9YJxuaYyA3xTDv6OxFueXm-0_yNAiQ',
  },
  {
    id: 'dish-nam-kho-to-chay',
    name: 'Nấm Đông Cô Kho Tộ Chay',
    description:
      'Nấm đông cô tươi, đậu phụ non kho tiêu xanh đậm đà trong nồi đất giữ nhiệt, thanh đạm tốt cho sức khỏe.',
    price: 75000,
    category: 'MAIN',
    subCategory: 'MAIN',
    badge: 'Món chay',
    badgeVariant: 'recommend',
    isVegetarian: true,
    isAvailable: true,
    imageUrl:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60',
  },
  {
    id: 'dish-lau-rieu-cua',
    name: 'Lẩu Riêu Cua Bắp Bò (Nồi Vừa)',
    description:
      'Vị chua thanh giấm bỗng hòa cùng gạch cua đồng béo ngậy, bắp bò hoa tươi nhúng kèm hoa chuối thái sợi và đậu mơ.',
    price: 320000,
    category: 'MAIN',
    subCategory: 'SOUP',
    badge: '2-3 Người',
    badgeVariant: 'special',
    isHotSoup: true,
    isAvailable: true,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA8PCYOVXJ7ApGB20KEORrmm9oYvAjz-cVFP700v0rvS53bYSFbX0ADvHgMf6L-NR01pQ44Dy0gRy6B59kBwjc48nx_pVrvFn6r5UXK1rlUEfYM7mRB-N7kjR6lAODzO4m74c1soBU-UIDaim3GVotUIalbPm757UlY22SbzIhUbyLSZnXqs9I04ej9yNmxc28VsgvuPtyYvYgATUImriFys22KgibxJTpYZFhbfQ',
    portionSizes: [
      {
        id: 'medium-pot',
        label: 'Nồi vừa (2 - 3 người)',
        subtext: 'Đầy đủ bắp bò, sườn sụn, đậu phụ, rau',
        price: 320000,
      },
      {
        id: 'large-pot',
        label: 'Nồi lớn (4 - 6 người)',
        subtext: 'Gấp đôi bắp bò hoa & gạch cua đồng',
        price: 480000,
      },
    ],
  },
  {
    id: 'dish-che-sen',
    name: 'Chè Hạt Sen Long Nhãn',
    description:
      'Hạt sen Tây Hồ bùi mềm lồng cùi nhãn Hưng Yên giòn ngọt ngập nước đường phèn hoa bưởi thanh khiết.',
    price: 45000,
    category: 'DESSERT',
    subCategory: 'DESSERT',
    badge: 'Thanh mát',
    badgeVariant: 'recommend',
    isVegetarian: true,
    isRefreshing: true,
    isAvailable: true,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCKPiPbxVWfpAZLxg90XooN-3NSNgOTEx1jDqbZQt2Shvip7FauHOju357xhbHeiVruB_j7FnCaAhsDWjVRgA3ChmcCd0EaDu2V6chzZ5CtdYnINuGOjXUrhErUUR5vpCRjNkCYY-nxRofU1zLzc0475yaXDncNWHiITl8oHKy9IChX_mPiUa9FDnrufPq3Hz4t_U_wLOYrd_s2j8ACbLEJ2ccLCfP-RPcR3XLSag',
  },
  {
    id: 'dish-tra-sen-vang',
    name: 'Trà Sen Vàng Hạt Sen',
    description:
      'Trà ô long ủ lạnh thơm ngát, hạt sen Huế ninh mềm bùi ngậy cùng thạch củ năng giòn ngọt.',
    price: 45000,
    category: 'DRINK',
    subCategory: 'DRINK',
    isVegetarian: true,
    isRefreshing: true,
    isAvailable: true,
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC8MA9NqXUkwiN4_GV_dbrkIT6jUJX0R-5ndUOyelgt189uZQIRQMq0E1b_E61QHs5O-vElxF2TBfbvNqpH24Mvc2pX9DQlMRBkKjgCMvimjRw1cINIOUBKfj0Ni6JDxfT9W0KJQfx53ziBGbHNZjA1g-3mN0vQceOJIevt71vnnpaqSxMjePMKbPyz0rpdkZQ9NP5rGqHmDa-_0eKbJz8fyl8LK9MeRQZ3ao7qrw',
  },
];

export const INITIAL_PLACED_BATCHES: PlacedBatch[] = [
  {
    id: 'batch-2',
    batchNumber: 2,
    title: 'Đợt 2 · Gửi lúc 12:05',
    submittedAt: '12:05',
    isCompleted: false,
    items: [
      {
        id: 'placed-item-1',
        dishId: 'dish-lau-rieu-cua',
        dishName: 'Lẩu Riêu Cua Bắp Bò',
        description: 'Bắp bò hoa, riêu cua đồng, quẩy giòn & mồng tơi',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBaGCjDiXZ_2p66-rdoTXQGiZ9ieJZpsOajIgBhzNT6JVcvZMArx4EzN0-Nga1a99GiYWV4h1CxwTRK6AOADalGT6-l6WMqQ0viodQHpVtM3ltT0ef0cy67pMkOdEA4vP4sghuiN0x9x8w4FVO5FfT0Y6omSJpmkD3a7T4Ojz1iEHIDXAApPLDQ1Qh_O9lWB8SlpPW7jPz7GUoOWi3zM-Kpy3Eo9YGxWAacFp1GIw',
        unitLabel: '1 nồi',
        quantity: 1,
        unitPrice: 385000,
        status: 'COOKING',
        cookingNote: 'Bếp đang đun sôi nước lẩu',
        etaText: 'Đang nấu (~5-7p)',
        expedited: false,
      },
      {
        id: 'placed-item-2',
        dishId: 'dish-nom-bo',
        dishName: 'Nộm Bò Bóp Thấu',
        description: 'Khế chua, chuối chát, mè rang thơm bùi',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuA-EdyRkIfDX-_85fGo7mQJnZoP8wt-od5UVv4O6hIhDGTSAs4kEIPV3jEvaoQL1DSAxuhi8xxJ9uFFiv-j0R3qIfuoFkK3NccR_5EK89ijlRGhWLdeNNTtN-kFHEiHwSzTqUMDGy4jyQaeKkaqxaezgj1x5EQ-8hW7IcXkMmCNttcwz2VZrUOXxwzmEbbV2NlTQHxHFZrVCDUBO78LAzeSOd8ESbkJ8-2Ziy1fNA',
        unitLabel: '1 đĩa',
        quantity: 1,
        unitPrice: 145000,
        status: 'SERVED',
      },
    ],
  },
  {
    id: 'batch-1',
    batchNumber: 1,
    title: 'Đợt 1 · Gửi lúc 11:32',
    submittedAt: '11:32',
    isCompleted: true,
    items: [
      {
        id: 'placed-item-3',
        dishId: 'dish-nem-ran',
        dishName: 'Nem Rán Phố Cổ',
        description: 'Vỏ bánh tráng giòn rụm, thịt nạc dăm & nấm hương',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDGjFOQcUofhJV4JKnIoBjfs-QWGm1I19eUXoDHh_hGXG2Elf47_bndl-QvOYVUFiFSIxCXIhobezuCVNFvWTdj3Q9BIxFWq21MQbfeS0qW19ZQzSuCKaLQSp-4uePGfej5vTcD1uDj5_THHwUy2C171sryLw9eUVEh4eLMQH5SnfvYhf2sVro8Wqm7wZctBKRROARp1EK7YHoPmURYbQ7uYmCrUzmcTtqHRlekUQ',
        unitLabel: '1 phần',
        quantity: 1,
        unitPrice: 95000,
        status: 'SERVED',
      },
      {
        id: 'placed-item-4',
        dishId: 'dish-bun-cha',
        dishName: 'Bún Chả Nướng Phố Cổ',
        description: 'Chả miếng than hoa & chả viên kèm dưa góp đu đủ',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuAw6SlbMBs2oo_Kjtvxn5AsTsd8omuvptasfsbFyL7dj6NvxLf07t1yEA8ZJdHnTBE6lVBHpI26ZlrYfrydPHMTAWj4R0YTmPeEbr594djuWyIixzS7ZYXuVHDF4K_3cf38azr45o-XULsHB2cZyIElZtVIDHtXXC0LmCBeJu21zcfUvQQNLvX-J8Q_mho9acym9-y4lx6DR7kU3cGicdL61Wsg4qeQnEJUPN9_Ew',
        unitLabel: '2 phần',
        quantity: 2,
        unitPrice: 95000,
        status: 'SERVED',
      },
      {
        id: 'placed-item-5',
        dishId: 'dish-tra-sen-vang',
        dishName: 'Trà Sen Vàng Hạt Sen',
        description: 'Hạt sen Huế ninh mềm, kem béo nhẹ ngọt thanh',
        imageUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuDPRF8Rw43ff1p-JzhUdfM84xgtL_V8GIFeDcDNOaOVrkrHX0gK0BKS4hvwhcETecvEaLWQ4MVbEvrP1Ta98kzuveoZ6CY_YNo0hT5ZGaMPKvPO0WdYbNZKeH1EDIy42zMtJzoSGt-rttYt4Y0amBlskISKwlXf54L1PJGIS6BMVCD0P9pWMA7vB9gt9wqg8l3AUNHr0cwTlWGlF2EIPJRmR0m1IerEulgewgwAdQ',
        unitLabel: '1 ly',
        quantity: 1,
        unitPrice: 55000,
        status: 'SERVED',
      },
    ],
  },
];

export const STAFF_QUICK_REQUESTS = [
  {
    id: 'utensils',
    title: 'Thêm bát đĩa, đũa',
    subtitle: 'Bát con, thìa muỗng',
    requestText: 'Lấy thêm chén đĩa, thìa đũa',
    iconName: 'utensils',
  },
  {
    id: 'ice-tea',
    title: 'Thêm đá / Châm trà',
    subtitle: 'Trà lài, âu đá lạnh',
    requestText: 'Châm thêm trà đá, lấy đá lạnh',
    iconName: 'coffee',
  },
  {
    id: 'clean-table',
    title: 'Dọn đĩa đã dùng',
    subtitle: 'Thu dọn đĩa trống',
    requestText: 'Dọn bớt đĩa trống trên bàn',
    iconName: 'sparkles',
  },
  {
    id: 'expedite',
    title: 'Giục món đang đợi',
    subtitle: 'Kiểm tra tiến độ bếp',
    requestText: 'Kiểm tra món đang chờ lâu',
    iconName: 'clock',
  },
  {
    id: 'condiments',
    title: 'Gia vị / Chanh ớt',
    subtitle: 'Tỏi ngâm, tương ớt',
    requestText: 'Xin thêm gia vị tỏi ớt, chanh',
    iconName: 'flame',
  },
  {
    id: 'consult',
    title: 'Tư vấn thực đơn',
    subtitle: 'Khẩu vị, định lượng',
    requestText: 'Cần nhân viên tư vấn chọn món',
    iconName: 'message',
  },
] as const;
