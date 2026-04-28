import test from 'node:test';
import assert from 'node:assert/strict';
import {
  chunkSegments,
  demoTranslateSegment,
  formatMarkdown,
  splitParagraphs,
  splitSentences,
  validateTranslationItems
} from '../src/frank.js';

test('splitParagraphs splits by blank lines', () => {
  assert.deepEqual(splitParagraphs('One.\n\nTwo.\nThree.'), ['One.', 'Two. Three.']);
});

test('splitSentences preserves common abbreviations', () => {
  const result = splitSentences('Dr. Smith wrote the report. It was published in the U.S. in 2020.');
  assert.equal(result.length, 2);
  assert.equal(result[0], 'Dr. Smith wrote the report.');
});

test('chunkSegments respects max size roughly', () => {
  const chunks = chunkSegments(['aaa', 'bbb', 'ccc'], 7);
  assert.equal(chunks.length, 2);
});

test('validateTranslationItems normalizes valid items', () => {
  const items = validateTranslationItems([{ original: 'Hello', adapted: 'Hello (привет).', clean: 'Hello' }]);
  assert.equal(items[0].clean, 'Hello');
});

test('demo translation produces adapted item', () => {
  const item = demoTranslateSegment('The world is large.');
  assert.match(item.adapted, /world/);
});

test('formatMarkdown creates numbered blocks', () => {
  const md = formatMarkdown([{ original: 'A', adapted: 'A (А).', clean: 'A' }], { title: 'T' });
  assert.match(md, /^# T/);
  assert.match(md, /### 1/);
});
