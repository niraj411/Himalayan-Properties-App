"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export default function PhotoGallery({ photos, name }: { photos: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const prev = useCallback(() => setActive((i) => (i - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setActive((i) => (i + 1) % photos.length), [photos.length]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, prev, next]);

  if (photos.length === 0) return null;

  return (
    <>
      {/* Main image */}
      <div className="space-y-3">
        <div
          className="w-full h-72 md:h-96 rounded-2xl overflow-hidden bg-[#f5f3f5] cursor-zoom-in relative group"
          onClick={() => setLightbox(true)}
        >
          <img src={photos[active]} alt={name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-2xl" />
          {photos.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-lg">
              {active + 1} / {photos.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
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
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
            onClick={() => setLightbox(false)}
          >
            <X className="h-6 w-6" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {active + 1} / {photos.length}
          </div>

          {/* Prev */}
          {photos.length > 1 && (
            <button
              className="absolute left-4 text-white/70 hover:text-white p-3"
              onClick={(e) => { e.stopPropagation(); prev(); }}
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}

          {/* Image */}
          <img
            src={photos[active]}
            alt={name}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {photos.length > 1 && (
            <button
              className="absolute right-4 text-white/70 hover:text-white p-3"
              onClick={(e) => { e.stopPropagation(); next(); }}
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
