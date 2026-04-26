"use client";

import { useEffect, useRef, useState } from "react";
import type { RakutenProduct } from "@/types";
import RakutenProductCard from "./RakutenProductCard";

const ROTATE_INTERVAL_MS = 3500;
const SWIPE_THRESHOLD_PX = 40;

interface Props {
  products: RakutenProduct[];
}

export default function AdCarousel({ products }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const isDragging = useRef(false);

  const count = products.length;

  const startAutoRotate = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (count < 2) return;
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % count);
    }, ROTATE_INTERVAL_MS);
  };

  useEffect(() => {
    startAutoRotate();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const goTo = (index: number) => {
    setCurrentIndex(index);
    startAutoRotate();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.touches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 8) isDragging.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (!isDragging.current || Math.abs(diff) < SWIPE_THRESHOLD_PX) return;
    if (diff < 0) {
      goTo((currentIndex + 1) % count);
    } else {
      goTo((currentIndex - 1 + count) % count);
    }
  };

  if (count === 0) return null;

  return (
    <div>
      {/* カード */}
      <div
        className="relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {products.map((product, i) => (
            <div key={i} className="w-full shrink-0">
              <RakutenProductCard product={product} fullWidth />
            </div>
          ))}
        </div>
      </div>

      {/* ドットインジケーター */}
      {count > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            marginTop: 10,
          }}
        >
          {products.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`ad ${i + 1}`}
              style={{
                width: 5,
                height: 5,
                borderRadius: 999,
                border: "none",
                padding: 0,
                cursor: "pointer",
                background:
                  i === currentIndex ? "var(--hd-ink)" : "var(--hd-hair)",
                transition: "background-color 300ms ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
