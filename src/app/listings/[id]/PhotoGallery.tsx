"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function PhotoGallery({ photos, name }: { photos: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const prev = useCallback(() => setActive((i) => (i - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setActive((i) => (i + 1) % photos.length), [photos.length]);

  // Keyboard nav + lock body scroll
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") setLightbox(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightbox, prev, next]);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
    touchStartX.current = null;
  };

  if (photos.length === 0) return null;

  return (
    <>
      {/* Main image + thumbnails */}
      <div className="space-y-3">
        <div
          className="w-full h-72 md:h-96 rounded-2xl overflow-hidden bg-[#f5f3f5] cursor-zoom-in relative group"
          onClick={() => setLightbox(true)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <img src={photos[active]} alt={name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-2xl" />
          {photos.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-lg">
              {active + 1} / {photos.length}
            </div>
          )}
        </div>

        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`flex-shrink-0 h-16 w-24 rounded-xl overflow-hidden bg-[#f5f3f5] transition-all ${
                  i === active ? "ring-2 ring-[#4f17ce] ring-offset-1" : "opacity-60 hover:opacity-100"
                }`}
              >
                <img src={photo} alt={`${name} ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/92 flex flex-col" onClick={() => setLightbox(false)}>
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <span className="text-white/60 text-sm">{active + 1} / {photos.length}</span>
            <button
              className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
              onClick={() => setLightbox(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Image area */}
          <div
            className="flex-1 flex items-center justify-center min-h-0 px-2"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={() => setLightbox(false)}
          >
            <img
              src={photos[active]}
              alt={name}
              className="max-h-full max-w-full object-contain rounded-xl"
              style={{ maxHeight: "calc(100dvh - 120px)" }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Bottom controls */}
          {photos.length > 1 && (
            <div
              className="flex items-center justify-center gap-6 py-4 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                onClick={prev}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              {/* Dot indicators (up to 12) */}
              <div className="flex gap-1.5">
                {photos.slice(0, 12).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`rounded-full transition-all ${
                      i === active ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/30"
                    }`}
                  />
                ))}
                {photos.length > 12 && <span className="text-white/40 text-xs self-center ml-1">+{photos.length - 12}</span>}
              </div>
              <button
                className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                onClick={next}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
