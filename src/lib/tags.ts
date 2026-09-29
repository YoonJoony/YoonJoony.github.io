export const normalizeTag = (tag: string) => tag.trim().replace(/^#+/, '').normalize('NFC').toLocaleLowerCase('en');

export function uniqueTags(tags: string[]) {
  const found = new Map<string, string>();
  for (const tag of tags) {
    const key = normalizeTag(tag);
    if (key && !found.has(key)) found.set(key, tag.trim().replace(/^#+/, ''));
  }
  return [...found].map(([id, label]) => ({ id, label }));
}

export function matchesTag(tags: string[], tag: string) {
  return !tag || tags.some((item) => normalizeTag(item) === normalizeTag(tag));
}
