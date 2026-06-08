type PhotoGalleryProps = {
  title: string;
  images: Array<{ cloudinaryUrl: string; order: number }>;
};

export function PhotoGallery({ title, images }: PhotoGalleryProps) {
  if (images.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3" aria-label="Photo gallery">
      <p className="text-sm text-stone-600">{images.length} photos</p>

      <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
        {images.map((image, index) => (
          <li
            key={image.cloudinaryUrl}
            className="min-w-[85%] snap-start overflow-hidden rounded-2xl border border-amber-200/80 bg-stone-100 sm:min-w-[70%]"
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
    </section>
  );
}
