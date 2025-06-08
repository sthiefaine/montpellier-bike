"use client";

import { useEffect, useState } from "react";

interface NumberFlowProps {
  value: number;
  duration?: number;
}

export default function NumberFlow({
  value,
  duration = 2000,
}: NumberFlowProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      const currentValue = Math.floor(progress * value);
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
}
