export function normalizeTagLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function buildTagKey(value: string) {
  return normalizeTagLabel(value).toLowerCase();
}

export function normalizeTags(values: string[]) {
  const seen = new Map<string, string>();

  for (const rawValue of values) {
    const label = normalizeTagLabel(rawValue);
    if (!label) continue;
    const tagKey = buildTagKey(label);
    if (!tagKey || seen.has(tagKey)) continue;
    seen.set(tagKey, label);
  }

  return Array.from(seen.entries())
    .sort((a, b) => a[1].localeCompare(b[1], undefined, { sensitivity: "base" }))
    .map(([, label]) => label);
}
