import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('HomeHero Component Source & CTA Assertions', () => {
  const heroPath = path.resolve(
    __dirname,
    '../../../../src/components/guest/HomeHero.tsx'
  );
  const heroSource = fs.readFileSync(heroPath, 'utf8');

  it('asserts brand heading and positioning in source', () => {
    expect(heroSource).toContain('Phố Cổ');
    expect(heroSource).toContain('Ẩm Thực Truyền Thống Hà Nội');
  });

  it('asserts CTA 1 links to /menu', () => {
    expect(heroSource).toContain('href="/menu"');
    expect(heroSource).toContain('Xem thực đơn');
  });

  it('asserts CTA 2 handles booking callback and event fallback', () => {
    expect(heroSource).toContain('Đặt bàn');
    expect(heroSource).toContain('onBookTable()');
    expect(heroSource).toContain("CustomEvent('phoco:open-booking')");
  });

  it('asserts performance and touch target hygiene in hero source', () => {
    expect(heroSource).toContain('active:scale-[0.98]');
    expect(heroSource).not.toContain('active:scale-95');
    expect(heroSource).toContain('min-h-[48px]');
  });
});
