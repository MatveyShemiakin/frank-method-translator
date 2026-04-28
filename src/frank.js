export function splitByMode(text, mode = 'paragraph') {
  const clean = String(text || '').replace(/\r\n/g, '\n').trim();
  if (!clean) return [];
  if (mode === 'sentence') {
    return clean
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+(?=[A-ZА-ЯЁ0-9"'])/u)
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return clean.split(/\n\s*\n/g).map((x) => x.trim()).filter(Boolean);
}

export function chunkSegments(segments, maxChars = 3500) {
  const chunks = [];
  let current = [];
  let size = 0;
  for (const segment of segments) {
    const next = String(segment || '');
    if (current.length && size + next.length > maxChars) {
      chunks.push(current);
      current = [];
      size = 0;
    }
    current.push(next);
    size += next.length;
  }
  if (current.length) chunks.push(current);
  return chunks;
}

export function demoTranslateSegment(segment) {
  return {
    source: segment,
    adapted: `${segment} (демо-перевод: здесь будет русский перевод и краткое пояснение).`,
    note: 'Demo mode: подключите proxy/OpenAI для настоящего перевода.'
  };
}

export function validateTranslationItems(items) {
  if (!Array.isArray(items)) throw new Error('Translator returned invalid JSON: items must be an array.');
  return items.map((item) => ({
    source: String(item.source || '').trim(),
    adapted: String(item.adapted || '').trim(),
    note: String(item.note || '').trim()
  })).filter((item) => item.source && item.adapted);
}

export function formatMarkdown(items, options = {}) {
  const title = options.title || 'Frank Method Text';
  const repeatOriginal = options.repeatOriginal !== false;
  const lines = [`# ${title}`, ''];
  for (const item of items) {
    lines.push(item.adapted);
    if (item.note) lines.push('', `> ${item.note}`);
    if (repeatOriginal) lines.push('', item.source);
    lines.push('', '---', '');
  }
  return lines.join('\n').trim() + '\n';
}
