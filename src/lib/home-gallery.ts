export interface HomeGalleryPhoto {
  id: string;
  src: string;
  alt: string;
}

export const DEFAULT_HOME_GALLERY_PHOTOS: HomeGalleryPhoto[] = [
  { id: "sphere-arch-hero", src: "/photos/sphere-arch-hero.jpeg", alt: "The Sphere arch entrance" },
  { id: "sphere-promo", src: "/photos/sphere-promo.jpeg", alt: "The Sphere summer day camps" },
  { id: "sphere-arch-aerial", src: "/photos/sphere-arch-aerial.jpeg", alt: "Aerial view of The Sphere" },
  { id: "sphere-pathway", src: "/photos/sphere-pathway.jpeg", alt: "Colorful pathways outside The Sphere" },
  { id: "sphere-entrance", src: "/photos/sphere-entrance.jpeg", alt: "The Sphere entrance door" },
  { id: "sphere-team", src: "/photos/sphere-team.jpeg", alt: "The Sphere team" },
  { id: "sphere-interior", src: "/photos/sphere-interior.jpeg", alt: "Inside The Sphere activities" },
];

export function parseHomeGalleryPhotos(value?: string | null): HomeGalleryPhoto[] {
  if (!value) return DEFAULT_HOME_GALLERY_PHOTOS;

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return DEFAULT_HOME_GALLERY_PHOTOS;

    return parsed
      .map((item, index) => ({
        id: typeof item.id === "string" && item.id.trim() ? item.id : `gallery-${index}`,
        src: typeof item.src === "string" ? item.src.trim() : "",
        alt: typeof item.alt === "string" && item.alt.trim() ? item.alt.trim() : `The Sphere photo ${index + 1}`,
      }))
      .filter((item) => item.src);
  } catch {
    return DEFAULT_HOME_GALLERY_PHOTOS;
  }
}

export function serializeHomeGalleryPhotos(photos: HomeGalleryPhoto[]): string {
  return JSON.stringify(
    photos.map((photo, index) => ({
      id: photo.id || `gallery-${index}`,
      src: photo.src,
      alt: photo.alt || `The Sphere photo ${index + 1}`,
    })),
  );
}
