"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
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
    if (Math.abs(dx) > 40) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  if (photos.length === 0) return null;

  return (
    <>
      {/* Main image + thumbnails */}
      <div className="space-y-4 min-w-0">
        <div
          className="w-full h-80 md:h-[28rem] rounded-[2rem] overflow-hidden bg-surface-container-low cursor-zoom-in relative group shadow-ambient transition-transform duration-500 hover:shadow-2xl"
          onClick={() => setLightbox(true)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <Image
            src={photos[active]}
            alt={name}
            fill
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
            priority
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 rounded-[2rem]" />
          {photos.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md text-white text-xs font-medium px-4 py-1.5 rounded-full shadow-ambient">
              {active + 1} / {photos.length}
            </div>
          )}
        </div>

        {photos.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide py-1 px-1">
            {photos.map((photo, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`relative flex-shrink-0 h-20 w-32 rounded-2xl overflow-hidden bg-surface-container-low transition-all duration-300 transform shadow-sm ${
                  i === active 
                    ? "ring-2 ring-primary ring-offset-2 scale-105 z-10 shadow-ambient" 
                    : "opacity-70 hover:opacity-100 hover:scale-105"
                }`}
              >
                <Image src={photo} alt={`${name} ${i + 1}`} fill sizes="128px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-2xl flex flex-col transition-all duration-500 ease-in-out animate-in fade-in zoom-in-95" 
          onClick={() => setLightbox(false)}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <span className="text-white/80 text-sm font-medium tracking-widest">{active + 1} / {photos.length}</span>
            <button
              className="text-white/80 hover:text-white p-2 rounded-2xl bg-white/5 hover:bg-white/20 transition-all duration-300 backdrop-blur-xl"
              onClick={() => setLightbox(false)}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Image area */}
          <div
            className="flex-1 flex items-center justify-center min-h-0 px-4 relative"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={() => setLightbox(false)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={active} // Forces re-render on active change to trigger animation
              src={photos[active]}
              alt={name}
              className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ maxHeight: "calc(100dvh - 140px)" }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Bottom controls */}
          {photos.length > 1 && (
            <div
              className="flex items-center justify-center gap-8 py-6 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="flex items-center justify-center w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 hover:scale-110 text-white transition-all duration-300 backdrop-blur-xl shadow-ambient"
                onClick={prev}
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              
              {/* Dot indicators */}
              <div className="flex gap-2.5">
                {photos.slice(0, 12).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`rounded-full transition-all duration-500 ease-out ${
                      i === active ? "w-8 h-2 bg-white" : "w-2 h-2 bg-white/30 hover:bg-white/50 hover:scale-150"
                    }`}
                  />
                ))}
                {photos.length > 12 && <span className="text-white/50 text-xs self-center font-medium ml-2">+{photos.length - 12}</span>}
              </div>

              <button
                className="flex items-center justify-center w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 hover:scale-110 text-white transition-all duration-300 backdrop-blur-xl shadow-ambient"
                onClick={next}
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
