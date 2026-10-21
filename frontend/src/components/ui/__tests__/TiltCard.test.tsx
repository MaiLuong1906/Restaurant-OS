import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TiltCard } from '../TiltCard';

describe('TiltCard - Component hiệu ứng nghiêng 3D bằng Framer Motion', () => {
  it('phải render nội dung con (children) đầy đủ', () => {
    render(
      <TiltCard>
        <div data-testid="child-element">Món Phở Bò</div>
      </TiltCard>
    );

    expect(screen.getByTestId('child-element')).toBeDefined();
    expect(screen.getByText('Món Phở Bò')).toBeDefined();
  });

  it('phải render div tĩnh thông thường khi disabled=true', () => {
    const { container } = render(
      <TiltCard disabled className="custom-card">
        <div>Nội dung tĩnh</div>
      </TiltCard>
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('custom-card');
    // Khi disabled, không gắn transformStyle preserve-3d của 3D tilt
    expect(card.style.transform).toBeFalsy();
  });

  it('phải xử lý sự kiện pointermove và pointerleave mà không gây lỗi runtime', () => {
    const { container } = render(
      <TiltCard maxTilt={7}>
        <div>Thẻ món thử nghiệm</div>
      </TiltCard>
    );

    const card = container.firstChild as HTMLElement;

    // Giả lập kích thước thẻ món
    vi.spyOn(card, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 100,
      width: 200,
      height: 100,
      right: 300,
      bottom: 200,
      x: 100,
      y: 100,
      toJSON: () => {},
    });

    // Kích hoạt pointer enter & pointer move ở góc trên bên phải
    fireEvent.pointerEnter(card);
    fireEvent.pointerMove(card, { clientX: 250, clientY: 120 });

    // Rời con trỏ
    fireEvent.pointerLeave(card);

    expect(card).toBeDefined();
  });
});
