import { animate, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  decimals?: number;
  signed?: boolean;
  className?: string;
}

export function AnimatedCounter({
  value,
  decimals = 4,
  signed = false,
  className = '',
}: AnimatedCounterProps) {
  const prefersReducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(value);
  const previousValueRef = useRef<number>(value);
  const hasMountedRef = useRef<boolean>(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(value);
      previousValueRef.current = value;
      return;
    }

    const fromValue = hasMountedRef.current ? previousValueRef.current : Math.max(0, value - 0.15);
    hasMountedRef.current = true;

    const controls = animate(fromValue, value, {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        setDisplayValue(latest);
      },
      onComplete: () => {
        setDisplayValue(value);
        previousValueRef.current = value;
      },
    });

    return () => {
      controls.stop();
      previousValueRef.current = value;
    };
  }, [value, prefersReducedMotion]);

  const formatted = displayValue.toFixed(decimals);
  const prefix = signed && displayValue > 0 ? '+' : '';

  return (
    <span className={`font-mono tabular-nums ${className}`}>
      {prefix}
      {formatted}
    </span>
  );
}
