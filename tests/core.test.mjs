import test from 'node:test';
import assert from 'node:assert/strict';
import { chunkSegments, demoTranslateSegment, formatMarkdown, splitByMode, validateTranslationItems } from '../src/frank.js';

test('splitByMode splits paragraphs', () => {
  assert.deepEqual(splitByMode('One.\n\nTwo.'), ['One.', 'Two.']);
});

test('splitByMode splits sentences', () => {
  assert.deepEqual(splitByMode('One. Two? Three!', 'sentence'), ['One.', 'Two?', 'Three!']);
});

test('chunkSegments respects max size', () => {
  assert.deepEqual(chunkSegments(['aaa', 'bbb', 'ccc'], 7), [['aaa', 'bbb'], ['ccc']]);
});

test('demoTranslateSegment returns adapted text', () => {
  const item = demoTranslateSegment('Hello world.');
  assert.equal(item.source, 'Hello world.');
  assert.match(item.adapted, /демо-перевод/);
});

test('validateTranslationItems filters invalid rows', () => {
  const result = validateTranslationItems([{ source: 'A', adapted: 'B', note: '' }, { source: '', adapted: 'C' }]);
  assert.equal(result.length, 1);
});

test('formatMarkdown includes adapted and original', () => {
  const md = formatMarkdown([{ source: 'Hello.', adapted: 'Hello (Привет).', note: '' }], { title: 'T' });
  assert.match(md, /# T/);
  assert.match(md, /Hello \(Привет\)\./);
  assert.match(md, /Hello\./);
});
