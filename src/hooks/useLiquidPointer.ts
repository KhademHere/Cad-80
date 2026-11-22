import type { PointerEvent } from 'react';

export function handleLiquidPointerMove<T extends HTMLElement>(
  event: PointerEvent<T>
): void {
  if (event.pointerType === 'touch') return;
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  el.style.setProperty('--mouse-x', `${x}px`);
  el.style.setProperty('--mouse-y', `${y}px`);
}
