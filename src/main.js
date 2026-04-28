import './styles.css';
import { chunkSegments, demoTranslateSegment, formatMarkdown, splitByMode, validateTranslationItems } from './frank.js';
import { translateViaProxy } from './providers.js';

const app = document.querySelector('#app');
app.innerHTML = `
<main class="shell">
  <section class="hero">
    <h1>Frank Method Translator</h1>
    <p>Инструмент для преобразования английского текста в учебный русско-английский формат.</p>
  </section>
  <section class="panel controls">
    <label>Provider<select id="provider"><option value="demo">Demo</option><option value="proxy">Proxy/OpenAI</option></select></label>
    <label>Proxy URL<input id="endpoint" value="http://localhost:8787/api/frankify"></label>
    <label>Mode<select id="mode"><option value="paragraph">Paragraph</option><option value="sentence">Sentence</option></select></label>
    <label>Level<select id="level"><option>A2</option><option selected>B1</option><option>B2</option><option>C1</option><option>Professional</option></select></label>
  </section>
  <section class="panel">
    <label>Title<input id="title" value="Frank Method Text"></label>
    <label>English text<textarea id="source" placeholder="Paste English text here"></textarea></label>
    <button id="run">Transform</button>
    <p id="status">Ready.</p>
  </section>
  <section class="panel">
    <h2>Output</h2>
    <textarea id="output" placeholder="Result"></textarea>
  </section>
</main>`;

const el = (id) => document.getElementById(id);

el('run').addEventListener('click', async () => {
  const raw = el('source').value.trim();
  if (!raw) {
    el('status').textContent = 'Paste English text first.';
    return;
  }
  el('run').disabled = true;
  try {
    const segments = splitByMode(raw, el('mode').value);
    const chunks = chunkSegments(segments, 3500);
    const items = [];
    for (let i = 0; i < chunks.length; i += 1) {
      el('status').textContent = `Processing ${i + 1}/${chunks.length}...`;
      if (el('provider').value === 'demo') {
        items.push(...chunks[i].map(demoTranslateSegment));
      } else {
        const data = await translateViaProxy({
          endpoint: el('endpoint').value,
          segments: chunks[i],
          level: el('level').value,
          style: 'classic'
        });
        items.push(...validateTranslationItems(data.items));
      }
    }
    el('output').value = formatMarkdown(items, { title: el('title').value, repeatOriginal: true });
    el('status').textContent = 'Done.';
  } catch (error) {
    el('status').textContent = error.message;
  } finally {
    el('run').disabled = false;
  }
});
