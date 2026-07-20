"use client";

import { useEffect, useRef, useState } from "react";

export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      const frame = requestAnimationFrame(() => setDisplay(value));
      return () => cancelAnimationFrame(frame);
    }

    let started = false;
    function animate() {
      if (started) return;
      started = true;
      const duration = 900;
      const start = performance.now();

      function tick(now: number) {
        const elapsed = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - elapsed, 3);
        setDisplay(Math.round(eased * value));
        if (elapsed < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        animate();
      },
      { threshold: 0.4 },
    );
    observer.observe(el);

    // Salvaguardas: si el observer nunca reporta visibilidad, forzamos la animación.
    // Si ni siquiera requestAnimationFrame llega a correr, mostramos el valor final sin animar
    // en vez de dejar el número pegado en 0 para siempre.
    const animateFallback = setTimeout(animate, 1500);
    const hardFallback = setTimeout(() => setDisplay((d) => (started ? d : value)), 2500);

    return () => {
      observer.disconnect();
      clearTimeout(animateFallback);
      clearTimeout(hardFallback);
    };
  }, [value]);

  return (
    <span ref={ref}>
      {display}
      {suffix}
    </span>
  );
}
