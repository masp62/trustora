"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PhotoGalleryProps = {
  title: string;
  images: Array<{ cloudinaryUrl: string; order: number }>;
};

export function PhotoGallery({ title, images }: PhotoGalleryProps) {
  const scrollRef = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const count = images.length;

  const scrollToIndex = useCallback(
    (index: number) => {
      const list = scrollRef.current;
      if (!list) return;
      const child = list.children[index] as HTMLElement | undefined;
      child?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
      setActiveIndex(index);
    },
    [],
  );

  const goNext = useCallback(() => {
    setActiveIndex((prev) => {
      const next = Math.min(prev + 1, count - 1);
      scrollToIndex(next);
      return next;
    });
  }, [count, scrollToIndex]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => {
      const next = Math.max(prev - 1, 0);
      scrollToIndex(next);
      return next;
    });
  }, [scrollToIndex]);

  useEffect(() => {
    const list = scrollRef.current;
    if (!list) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Array.from(list.children).indexOf(entry.target as HTMLElement);
            if (idx !== -1) setActiveIndex(idx);
          }
        }
      },
      { root: list, threshold: 0.6 },
    );

    for (const child of Array.from(list.children)) {
      observer.observe(child);
    }
    return () => observer.disconnect();
  }, [count]);

  if (count === 0) {
    return null;
  }

  return (
    <section
      className="relative space-y-3"
      aria-label="Photo gallery"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") goPrev();
        if (e.key === "ArrowRight") goNext();
      }}
      tabIndex={0}
      role="region"
    >
      <p className="text-sm text-gray-600">
        {activeIndex + 1} / {count} photos
      </p>

      <div className="relative">
        <ul
          ref={scrollRef}
          className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((image, index) => (
            <li
              key={image.cloudinaryUrl}
              className="min-w-[85%] snap-start overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 sm:min-w-[70%]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.cloudinaryUrl}
                alt={`${title} photo ${index + 1}`}
                className="h-[20rem] w-full object-cover sm:h-[28rem]"
              />
            </li>
          ))}
        </ul>

        {count > 1 && (
          <>
            <button
              onClick={goPrev}
              disabled={activeIndex === 0}
              className="touch-target absolute top-1/2 left-2 -translate-y-1/2 rounded-full border border-white/40 bg-white/80 p-3 shadow-md backdrop-blur transition hover:bg-white disabled:opacity-30"
              aria-label="Previous photo"
            >
              <ChevronLeft className="size-5 text-gray-800" />
            </button>
            <button
              onClick={goNext}
              disabled={activeIndex === count - 1}
              className="touch-target absolute top-1/2 right-2 -translate-y-1/2 rounded-full border border-white/40 bg-white/80 p-3 shadow-md backdrop-blur transition hover:bg-white disabled:opacity-30"
              aria-label="Next photo"
            >
              <ChevronRight className="size-5 text-gray-800" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="flex justify-center gap-1.5" role="tablist" aria-label="Gallery navigation">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`touch-target relative inline-flex items-center justify-center rounded-full transition ${
                index === activeIndex
                  ? "text-brand"
                  : "text-gray-300 hover:text-gray-400"
              }`}
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Go to photo ${index + 1}`}
            >
              <span className="size-2 rounded-full bg-current" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
