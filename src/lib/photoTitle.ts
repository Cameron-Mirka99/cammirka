import type { Photo } from "./api/types";

/** Priority: explicit title -> filename (decoded, extension stripped) -> fallback. */
export function getPhotoTitle(photo: Photo): string {
  const trimmed = photo.title?.trim();
  if (trimmed) return trimmed;

  const lastSegment = photo.key.split("/").pop() ?? "";
  let decoded = lastSegment;
  try {
    decoded = decodeURIComponent(lastSegment);
  } catch {
    decoded = lastSegment;
  }
  const withoutExtension = decoded.replace(/\.[^./]+$/, "");
  return withoutExtension.trim() || "Untitled image";
}
