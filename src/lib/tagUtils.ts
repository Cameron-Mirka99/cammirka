/** Frontend mirror of the backend's tag normalization rules (functions/shared/tagMetadata.ts). */
export function normalizeTagLabel(label: string): string {
  return label.trim().replace(/\s+/g, " ");
}

export function buildTagKey(label: string): string {
  return normalizeTagLabel(label).toLowerCase();
}

export function normalizeTags(values: string[]): string[] {
  const byKey = new Map<string, string>();
  for (const raw of values) {
    const label = normalizeTagLabel(raw);
    if (!label) continue;
    byKey.set(buildTagKey(label), label);
  }
  return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b));
}
