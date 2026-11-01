'use client';

import * as React from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Tabs } from '@/components/ui/Tabs';
import { Input } from '@/components/ui/Input';

/**
 * Demo: Artisan Cafe landing page — Warm Earth Organic, đủ 8 section theo prompt.
 * Chỉ dùng component dùng chung + token trong @theme. Không gọi API thật.
 * NGOẠI LỆ: trang này giữ nguyên copy tiếng Anh của prompt (các trang demo khác
 * giữ tiếng Việt). Xem BASE_README.md.
 */

const ROASTS = [
  { name: 'Ethiopia Yirgacheffe', desc: 'Jasmine, bergamot, stone fruit. Washed process.', price: '$18.00' },
  { name: 'Colombia Huila', desc: 'Caramel, red apple, cocoa nib. Honey process.', price: '$21.00' },
  { name: 'Brazil Cerrado', desc: 'Toasted hazelnut, molasses, full body. Natural process.', price: '$16.00' },
];

const MENU: Record<string, Array<{ name: string; desc: string; price: string }>> = {
  Coffee: [
    { name: 'Espresso', desc: 'Rich, syrupy single-origin shot.', price: '$3.50' },
    { name: 'Cappuccino', desc: 'Silky steamed milk, cocoa dust.', price: '$4.50' },
    { name: 'Slow Bar Pour Over', desc: 'Rotating single origin, brewed to order.', price: '$5.00' },
  ],
  Tea: [
    { name: 'Jasmine Green', desc: 'Floral, light, calming.', price: '$4.00' },
    { name: 'Chamomile Honey', desc: 'Herbal blend with local honey.', price: '$4.50' },
    { name: 'Matcha Latte', desc: 'Stone-ground matcha, oat milk.', price: '$5.50' },
  ],
  Food: [
    { name: 'Butter Croissant', desc: 'Laminated 27 layers, baked hourly.', price: '$3.75' },
    { name: 'Banana Bread', desc: 'Toasted, salted butter, walnut crumble.', price: '$4.25' },
    { name: 'Avocado Toast', desc: 'Sourdough, chili oil, pickled onion.', price: '$8.50' },
  ],
  Seasonal: [
    { name: 'Pumpkin Spice Latte', desc: 'House spice, real pumpkin.', price: '$5.75' },
    { name: 'Iced Yuzu Cooler', desc: 'Yuzu, soda, mint.', price: '$5.25' },
    { name: 'Chestnut Mocha', desc: 'Roasted chestnut, dark chocolate.', price: '$6.00' },
  ],
};

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

function WaveDivider({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 1440 64"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`block h-16 w-full ${flip ? 'rotate-180' : ''}`}
    >
      <path
        d="M0,64 C240,0 480,0 720,32 C960,64 1200,64 1440,16 L1440,64 L0,64 Z"
        className="fill-cream"
      />
    </svg>
  );
}

export default function DemoCafeLandingPage() {
  const [menuTab, setMenuTab] = React.useState<string>('Coffee');
  const [subscribed, setSubscribed] = React.useState(false);

  return (
    <div className="bg-cream text-ink">
      {/* 1. Navbar */}
      <header className="sticky top-0 z-40 border-b border-sand-200 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-6 md:px-12">
          <a href="/cafe-landing" className="font-display text-2xl italic text-primary-600">
            Artisan
          </a>
          <nav className="hidden items-center gap-8 text-sm font-semibold md:flex" aria-label="Chính">
            <button type="button" className="cursor-pointer transition-colors hover:text-primary-600" onClick={() => scrollToId('menu')}>
              Menu
            </button>
            <button type="button" className="cursor-pointer transition-colors hover:text-primary-600" onClick={() => scrollToId('story')}>
              Our Story
            </button>
            <button type="button" className="cursor-pointer transition-colors hover:text-primary-600" onClick={() => scrollToId('visit')}>
              Visit Us
            </button>
          </nav>
          <Button size="md" onClick={() => scrollToId('menu')}>
            Order Online
          </Button>
        </div>
      </header>

      {/* 2. Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(196,113,74,0.15),transparent_65%)]"
        />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 md:px-12 md:py-24 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <p className="text-sm font-semibold tracking-widest text-primary-700">ARTISAN CAFE · EST. 2016</p>
            <h1 className="font-display text-display font-semibold leading-[1.1]">
              Slow coffee. <em>Good people.</em> No rush.
            </h1>
            <p className="max-w-xl text-body font-normal text-sand-600">
              A neighborhood cafe built around slow mornings, honest roasts, and room to stay a
              little longer. Come as you are — the kettle is already on.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" onClick={() => scrollToId('menu')}>
                Explore the Menu
              </Button>
              <Button size="lg" variant="secondary" onClick={() => scrollToId('story')}>
                Our Story
              </Button>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
            <svg viewBox="0 0 400 320" className="w-full" fill="none">
              <circle cx="200" cy="160" r="120" stroke="var(--color-primary-400)" strokeWidth="1.5" strokeDasharray="6 8" />
              <circle cx="200" cy="160" r="78" stroke="var(--color-primary-300)" strokeWidth="1.5" strokeDasharray="4 8" />
              <path d="M40 240 C 120 180, 180 300, 260 220 S 360 120, 380 90" stroke="var(--color-primary-400)" strokeWidth="1.5" strokeDasharray="6 8" strokeLinecap="round" />
              <path d="M60 80 C 110 120, 150 60, 210 100" stroke="var(--color-sage-500)" strokeWidth="1.5" strokeDasharray="6 8" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </section>

      {/* 3. Featured Items Grid (Signature Roasts) */}
      <section>
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-16 md:px-12 md:py-24">
          <h2 className="font-display text-h1 font-semibold">Signature Roasts</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {ROASTS.map((roast) => (
              <Card key={roast.name}>
                <div className="flex flex-col gap-4">
                  <div className="flex h-44 items-center justify-center rounded-blob bg-gradient-to-br from-primary-200 via-sand-200 to-sage-200">
                    <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" stroke="var(--color-primary-400)" strokeWidth="1.5" strokeDasharray="5 5">
                      <ellipse cx="24" cy="24" rx="16" ry="20" />
                      <path d="M24 4 C 16 16, 32 32, 24 44" />
                    </svg>
                  </div>
                  <h3 className="font-display text-h3 font-semibold">{roast.name}</h3>
                  <p className="text-sm text-sand-600">{roast.desc}</p>
                  <p className="font-display text-base font-semibold text-primary-700">{roast.price}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Story */}
      <section id="story" className="bg-story">
        <WaveDivider />
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 md:px-12 md:py-24 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <h2 className="font-display text-h1 font-semibold">Grown from love of the craft.</h2>
            <p className="text-body text-sand-600">
              We started with one roaster, a borrowed grinder, and a stubborn belief: coffee
              tastes better when nobody is in a hurry. Every bean is sourced from farms we know
              by name, roasted in small batches, and brewed like it matters — because it does.
            </p>
            <p className="text-body text-sand-600">
              Slow here is not a slogan. It is the way we source, the way we roast, and the
              way we welcome you to stay for one more cup.
            </p>
          </div>
          <div className="relative overflow-hidden rounded-blob bg-gradient-to-br from-primary-200 via-sand-200 to-sage-200">
            <div className="flex h-80 items-center justify-center">
              <svg viewBox="0 0 48 48" className="h-16 w-16" fill="none" stroke="var(--color-primary-400)" strokeWidth="1.5" strokeDasharray="5 5">
                <ellipse cx="24" cy="24" rx="16" ry="20" />
                <path d="M24 4 C 16 16, 32 32, 24 44" />
              </svg>
            </div>
            <div aria-hidden="true" className="absolute inset-0 bg-brown-600/20 mix-blend-multiply" />
          </div>
        </div>
        <WaveDivider flip />
      </section>

      {/* 5. Process */}
      <section>
        <div className="mx-auto flex max-w-7xl flex-col gap-12 px-6 py-16 text-center md:px-12 md:py-24">
          <h2 className="font-display text-h1 font-semibold">From cherry to cup</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center gap-4">
              <span className="flex h-24 w-24 items-center justify-center rounded-blob bg-cream-dark">
                <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" stroke="var(--color-primary-600)" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M24 6 C 14 6, 8 14, 8 24 C 8 34, 14 42, 24 42 C 34 42, 40 34, 40 24 C 40 14, 34 6, 24 6 Z" />
                  <path d="M24 10 C 18 18, 30 30, 24 38" />
                </svg>
              </span>
              <h3 className="font-display text-h3 font-semibold italic">1. Source</h3>
              <p className="max-w-xs text-sm text-sand-600">Lots we can trace back to a single hillside, bought at fair prices.</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <span className="flex h-24 w-24 items-center justify-center rounded-blob bg-cream-dark">
                <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" stroke="var(--color-primary-600)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M24 4 C 26 10, 32 12, 32 20 A 8 8 0 0 1 16 20 C 16 14, 20 12, 20 8 C 22 12, 23 14, 24 16 C 24 12, 23 8, 24 4 Z" />
                  <path d="M14 34 H 34" />
                </svg>
              </span>
              <h3 className="font-display text-h3 font-semibold italic">2. Roast</h3>
              <p className="max-w-xs text-sm text-sand-600">Small batches, roasted light enough to keep the origin talking.</p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <span className="flex h-24 w-24 items-center justify-center rounded-blob bg-cream-dark">
                <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" stroke="var(--color-primary-600)" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M10 18 H 38 V 26 A 12 12 0 0 1 26 38 H 22 A 12 12 0 0 1 10 26 Z" />
                  <path d="M38 20 H 42 A 4 4 0 0 1 42 28 H 38" />
                  <path d="M18 10 C 18 8, 20 8, 20 6 M 26 10 C 26 8, 28 8, 28 6" />
                </svg>
              </span>
              <h3 className="font-display text-h3 font-semibold italic">3. Brew</h3>
              <p className="max-w-xs text-sm text-sand-600">Poured slow, served warm, never rushed out the door.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Menu Preview */}
      <section id="menu">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-16 md:px-12 md:py-24">
          <h2 className="font-display text-h1 font-semibold">Menu Preview</h2>
          <Tabs
            items={['Coffee', 'Tea', 'Food', 'Seasonal'].map((t) => ({ id: t, label: t }))}
            value={menuTab}
            onChange={setMenuTab}
          />
          <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
            {MENU[menuTab].map((item) => (
              <div key={item.name} className="flex flex-col gap-1 break-words">
                <div className="flex items-baseline gap-3">
                  <p className="font-display text-h3 font-semibold italic">{item.name}</p>
                  <span aria-hidden="true" className="flex-1 border-b border-dotted border-sand-300" />
                  <p className="font-bold text-primary-700">{item.price}</p>
                </div>
                <p className="text-sm text-sand-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Newsletter */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-12 md:py-24">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 rounded-playful bg-primary-50 px-6 py-12 text-center md:px-12">
            <h2 className="font-display text-h1 font-semibold">Join the slow mornings club.</h2>
            <p className="text-body text-sand-600">
              One letter a week: new roasts, brew guides, and first dibs on seasonal cups.
            </p>
            {subscribed ? (
              <p className="font-semibold text-primary-700">Welcome to the club — check your inbox for a warm hello.</p>
            ) : (
              <form
                className="flex w-full flex-col gap-4 sm:flex-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubscribed(true);
                }}
              >
                <Input aria-label="Email address" type="email" required placeholder="you@example.com" className="flex-1" />
                <Button size="lg" type="submit">
                  Subscribe
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer id="visit" className="border-t border-sand-200 bg-cream-dark">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-16 md:grid-cols-4 md:px-12">
          <div className="flex flex-col gap-4">
            <p className="font-display text-2xl italic text-primary-600">Artisan</p>
            <p className="text-sm text-sand-600">
              A slow cafe for good people. Roasted in-house, poured with patience.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-display text-h3 font-semibold">Visit Us</h3>
            <p className="text-sm text-sand-600">123 Slow Lane, Portland, OR</p>
            <p className="text-sm text-sand-600">Open daily · 7:00 – 18:00</p>
          </div>
          <nav className="flex flex-col gap-2" aria-label="Footer">
            <h3 className="font-display text-h3 font-semibold">Links</h3>
            <a className="text-sm text-sand-600 transition-colors hover:text-primary-600" href="/cafe-landing">Shop</a>
            <a className="text-sm text-sand-600 transition-colors hover:text-primary-600" href="/cafe-landing">Wholesale</a>
            <a className="text-sm text-sand-600 transition-colors hover:text-primary-600" href="/cafe-landing">Careers</a>
            <a className="text-sm text-sand-600 transition-colors hover:text-primary-600" href="/cafe-landing">Gift Cards</a>
          </nav>
          <div className="flex flex-col gap-2">
            <h3 className="font-display text-h3 font-semibold">Social</h3>
            <a className="text-sm text-sand-600 transition-colors hover:text-primary-600" href="/cafe-landing">Instagram</a>
            <a className="text-sm text-sand-600 transition-colors hover:text-primary-600" href="/cafe-landing">Facebook</a>
            <a className="text-sm text-sand-600 transition-colors hover:text-primary-600" href="/cafe-landing">X</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
