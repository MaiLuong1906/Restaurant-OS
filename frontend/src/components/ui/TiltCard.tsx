'use client';

import React, { useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, type HTMLMotionProps } from 'framer-motion';

export interface TiltCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number; // Clamped between 5 and 8 degrees per Rule 04
  disabled?: boolean;
}

export function TiltCard({
  children,
  className = '',
  maxTilt = 7,
  disabled = false,
  ...props
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [isHovered, setIsHovered] = useState(false);

  // Clamp tilt within ±5° to ±8° as mandated by Rule 04 performance budget
  const clampedMaxTilt = Math.max(5, Math.min(8, maxTilt));

  // Raw mouse/pointer offset normalized -0.5 to 0.5
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth physics spring as per Rule 04 (stiffness: 300, damping: 25)
  const springConfig = { stiffness: 300, damping: 25, mass: 0.5 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  // Map offset to rotation degrees: horizontal movement tilts rotateY, vertical tilts rotateX
  const rotateX = useTransform(springY, [-0.5, 0.5], [clampedMaxTilt, -clampedMaxTilt]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-clampedMaxTilt, clampedMaxTilt]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || shouldReduceMotion || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const clientX = e.clientX;
      const clientY = e.clientY;

      const normX = (clientX - rect.left) / rect.width - 0.5;
      const normY = (clientY - rect.top) / rect.height - 0.5;

      x.set(normX);
      y.set(normY);
    },
    [disabled, shouldReduceMotion, x, y]
  );

  const handlePointerEnter = useCallback(() => {
    if (!disabled && !shouldReduceMotion) {
      setIsHovered(true);
    }
  }, [disabled, shouldReduceMotion]);

  const handlePointerLeave = useCallback(() => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  }, [x, y]);

  // If reduced motion is preferred or disabled, render static wrapper without 3D transforms
  if (shouldReduceMotion || disabled) {
    const { style, ...restProps } = props;
    return (
      <div ref={cardRef} className={className} style={style as React.CSSProperties} {...(restProps as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerLeave}
      {...props}
      style={{
        ...props.style,
        rotateX,
        rotateY,
        transformPerspective: 800,
        transformStyle: 'preserve-3d',
        willChange: isHovered ? 'transform' : 'auto',
        touchAction: 'pan-y', // Don't block vertical mobile scrolling
      }}
      className={`transition-shadow duration-200 ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default TiltCard;
