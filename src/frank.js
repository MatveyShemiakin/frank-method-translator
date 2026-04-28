const DEFAULT_ABBREVIATIONS = [
  'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'Sr.', 'Jr.', 'St.', 'vs.', 'etc.', 'e.g.', 'i.e.', 'U.S.', 'U.K.'
];

export function normalizeText(text = '') {
  return String(text)
    .replace(/\r\n/g, '\n')
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim();
}

export function splitParagraphs(text = '') {
  const normalized = normalizeText(text);
  if (!normalized) return [];
  return normalized
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n+/g, ' ').trim())
    .filter(Boolean);
}

function protectAbbreviations(text) {
  let protectedText = text;
  const placeholders = new Map();
  DEFAULT_ABBREVIATIONS.forEach((abbr, index) => {
    const key = `__ABBR_${index}__`;
    const safe = abbr.replace('.', '<DOT>');
    placeholders.set(key, abbr);
    protectedText = protectedText.split(abbr).join(safe);
  });
  return { protectedText, placeholders };
}

function restoreAbbreviations(text) {
  return text.replace(/<DOT>/g, '.');
}

export function splitSentences(text = '') {
  const paragraphs = splitParagraphs(text);
  const sentences = [];
  for (const paragraph of paragraphs) {
    const { protectedText } = protectAbbreviations(paragraph);
    const parts = protectedText
      .split(/(?<=[.!?])\s+(?=["'“‘(]*[A-Z0-9])/g)
      .map(restoreAbbreviations)
      .map((part) => part.trim())
      .filter(Boolean);
    sentences.push(...parts);
  }
  return sentences;
}

export function splitByMode(text, mode = 'paragraph') {
  if (mode === 'sentence') return splitSentences(text);
  return splitParagraphs(text);
}

export function chunkSegments(segments, maxChars = 3500) {
  const chunks = [];
  let current = [];
  let length = 0;
  for (const segment of segments) {
    const separator = current.length ? 1 : 0;
    let nextLength = length + segment.length + separator;
    if (current.length && nextLength > maxChars) {
      chunks.push(current);
      current = [];
      length = 0;
      nextLength = segment.length;
    }
    current.push(segment);
    length = nextLength;
  }
  if (current.length) chunks.push(current);
  return chunks;
}

export function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function frankBlock({ original, adapted, clean }, options = {}) {
  const repeatOriginal = options.repeatOriginal !== false;
  const adaptedText = adapted || '';
  const cleanText = clean || original || '';
  if (repeatOriginal) return `${adaptedText}\n\n${cleanText}`.trim();
  return adaptedText.trim();
}

export function formatMarkdown(items, options = {}) {
  const title = options.title || 'Text in Ilya Frank style';
  const blocks = items.map((item, index) => {
    const body = frankBlock(item, options);
    return `### ${index + 1}\n\n${body}`;
  });
  return `# ${title}\n\n${blocks.join('\n\n---\n\n')}\n`;
}

export function formatPlainText(items, options = {}) {
  return items.map((item) => frankBlock(item, options)).join('\n\n---\n\n');
}

export function validateTranslationItems(items) {
  if (!Array.isArray(items)) throw new Error('Translator returned a non-array response.');
  return items.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw new Error(`Invalid item at index ${index}.`);
    }
    const original = String(item.original || item.clean || '').trim();
    const adapted = String(item.adapted || '').trim();
    const clean = String(item.clean || original).trim();
    if (!original || !adapted) {
      throw new Error(`Translator returned an incomplete item at index ${index}.`);
    }
    return { original, adapted, clean };
  });
}

export function demoTranslateSegment(segment) {
  const replacements = [
    [/\bthe\b/gi, 'the — определенный артикль'],
    [/\band\b/gi, 'and — и'],
    [/\bworld\b/gi, 'world — мир'],
    [/\bpatient\b/gi, 'patient — пациент'],
    [/\bstudy\b/gi, 'study — исследование'],
    [/\bbook\b/gi, 'book — книга'],
    [/\barticle\b/gi, 'article — статья']
  ];
  let glossary = [];
  for (const [regex, value] of replacements) {
    if (regex.test(segment)) glossary.push(value);
  }
  glossary = [...new Set(glossary)];
  const adapted = `${segment} (${glossary.length ? glossary.join('; ') : 'демо-пояснение: подключите API для полноценного перевода'}).`;
  return { original: segment, adapted, clean: segment };
}

export function createPromptPayload(segments, settings = {}) {
  return {
    sourceLanguage: settings.sourceLanguage || 'English',
    targetLanguage: settings.targetLanguage || 'Russian',
    level: settings.level || 'B1',
    style: settings.style || 'classic',
    segments
  };
}
