import './styles.css';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import {
  chunkSegments,
  demoTranslateSegment,
  formatMarkdown,
  formatPlainText,
  splitByMode,
  validateTranslationItems
} from './frank.js';
import {
  translateViaDirectOpenAI,
  translateViaLibreTranslate,
  translateViaMyMemory,
  translateViaProxy
} from './providers.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const app = document.querySelector('#app');

app.innerHTML = `
  <main class="container">
    <section class="hero">
      <div class="badge">English → Russian · bilingual reader</div>
      <h1>Переводчик текстов по методу Ильи Франка</h1>
      <p class="lead">Загрузите английскую статью, главу книги или PDF, выберите провайдера и получите учебный текст: английский фрагмент с русским пояснением, затем повтор чистого оригинала.</p>
    </section>

    <section class="card">
      <div class="controls">
        <div class="field">
          <label for="provider">Провайдер</label>
          <select id="provider">
            <option value="mymemory" selected>MyMemory online</option>
            <option value="libre">LibreTranslate endpoint</option>
            <option value="proxy">Локальный proxy / API</option>
            <option value="direct">OpenAI напрямую из браузера</option>
            <option value="demo">Демо без API</option>
          </select>
        </div>
        <div class="field">
          <label for="endpoint">Proxy / LibreTranslate endpoint</label>
          <input id="endpoint" value="https://libretranslate.com/translate" />
        </div>
        <div class="field">
          <label for="model">Модель OpenAI</label>
          <input id="model" value="gpt-4.1-mini" />
        </div>
        <div class="field">
          <label for="level">Уровень читателя</label>
          <select id="level"><option>A2</option><option selected>B1</option><option>B2</option><option>C1</option><option>Professional</option></select>
        </div>
        <div class="field">
          <label for="mode">Разбивка</label>
          <select id="mode"><option value="paragraph" selected>По абзацам</option><option value="sentence">По предложениям</option></select>
        </div>
        <div class="field">
          <label for="maxChars">Размер пакета</label>
          <input id="maxChars" type="number" min="300" max="12000" step="100" value="900" />
        </div>
        <div class="field">
          <label for="title">Название результата</label>
          <input id="title" value="Frank Method Text" />
        </div>
        <div class="field">
          <label for="file">PDF / TXT / MD файл</label>
          <input id="file" type="file" accept=".pdf,.txt,.md,.markdown,application/pdf,text/plain,text/markdown" />
        </div>
      </div>
      <details>
        <summary class="small">API key для прямого OpenAI-режима. Не сохраняется и не отправляется в GitHub.</summary>
        <div class="field" style="margin-top: 10px; max-width: 560px;"><label for="apiKey">API key</label><input id="apiKey" type="password" autocomplete="off" placeholder="sk-..." /></div>
      </details>
    </section>

    <section class="grid" style="margin-top: 18px;">
      <div class="card">
        <h2>Исходный английский текст</h2>
        <textarea id="source" spellcheck="false" placeholder="Paste English text here...">The study examined visual outcomes after cataract surgery. Patients were followed for six months, and postoperative refraction was compared with the predicted target.</textarea>
        <div class="actions"><button class="primary" id="run">Преобразовать</button><button class="secondary" id="clear">Очистить</button></div>
        <div id="status" class="status"></div>
      </div>
      <div class="card">
        <h2>Результат</h2>
        <div id="output" class="output" aria-live="polite"></div>
        <div class="actions"><button class="secondary" id="copy">Скопировать</button><button class="secondary" id="downloadTxt">Скачать TXT</button><button class="secondary" id="downloadMd">Скачать Markdown</button></div>
      </div>
    </section>
  </main>
`;

const $ = (id) => document.getElementById(id);
let lastItems = [];

function setStatus(message, type = '') {
  const el = $('status');
  el.textContent = message;
  el.className = `status ${type}`;
}

function getSettings() {
  return {
    provider: $('provider').value,
    endpoint: $('endpoint').value.trim(),
    libreEndpoint: $('endpoint').value.trim(),
    model: $('model').value.trim() || 'gpt-4.1-mini',
    level: $('level').value,
    mode: $('mode').value,
    maxChars: Number($('maxChars').value || 900),
    title: $('title').value.trim() || 'Frank Method Text',
    apiKey: $('apiKey').value.trim(),
    sourceLanguage: 'English',
    targetLanguage: 'Russian',
    style: 'classic'
  };
}

async function extractPdfText(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    setStatus(`Извлекаю текст PDF: страница ${pageNumber}/${pdf.numPages}...`);
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items.map((item) => item.str).join(' ').replace(/\s+/g, ' ').trim();
    if (text) pages.push(text);
  }
  return pages.join('\n\n');
}

async function translateChunk(chunk, settings) {
  if (settings.provider === 'demo') return chunk.map(demoTranslateSegment);
  if (settings.provider === 'mymemory') return translateViaMyMemory(chunk, settings);
  if (settings.provider === 'libre') return translateViaLibreTranslate(chunk, settings);
  if (settings.provider === 'direct') return translateViaDirectOpenAI(chunk, settings);
  return translateViaProxy(chunk, settings);
}

$('file').addEventListener('change', async (event) => {
  try {
    const file = event.target.files?.[0];
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    $('source').value = isPdf ? await extractPdfText(file) : await file.text();
    setStatus(`Файл загружен: ${file.name}. Символов: ${$('source').value.length}.`, 'ok');
  } catch (error) {
    setStatus(`Не удалось прочитать файл: ${error.message}`, 'error');
  }
});

$('run').addEventListener('click', async () => {
  try {
    const settings = getSettings();
    const text = $('source').value.trim();
    if (!text) throw new Error('Добавьте английский текст или загрузите файл.');
    const segments = splitByMode(text, settings.mode);
    if (!segments.length) throw new Error('Не удалось выделить фрагменты текста.');
    const chunks = chunkSegments(segments, settings.maxChars);
    setStatus(`Найдено фрагментов: ${segments.length}. Пакетов: ${chunks.length}.`);
    $('output').textContent = '';
    lastItems = [];
    for (let i = 0; i < chunks.length; i += 1) {
      setStatus(`Перевожу пакет ${i + 1} из ${chunks.length}...`);
      const translated = validateTranslationItems(await translateChunk(chunks[i], settings));
      lastItems.push(...translated);
      $('output').textContent = formatPlainText(lastItems, { repeatOriginal: true });
    }
    setStatus(`Готово. Создано блоков: ${lastItems.length}.`, 'ok');
  } catch (error) {
    console.error(error);
    setStatus(error.message, 'error');
  }
});

$('clear').addEventListener('click', () => {
  $('source').value = '';
  $('output').textContent = '';
  lastItems = [];
  setStatus('');
});

$('copy').addEventListener('click', async () => {
  const text = $('output').textContent.trim();
  if (!text) return setStatus('Нечего копировать.', 'error');
  await navigator.clipboard.writeText(text);
  setStatus('Результат скопирован.', 'ok');
});

function download(filename, content, type = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

$('downloadTxt').addEventListener('click', () => {
  const text = $('output').textContent.trim();
  if (!text) return setStatus('Нечего скачивать.', 'error');
  download('frank-method-output.txt', text);
});

$('downloadMd').addEventListener('click', () => {
  if (!lastItems.length) return setStatus('Сначала выполните преобразование.', 'error');
  const settings = getSettings();
  download('frank-method-output.md', formatMarkdown(lastItems, { title: settings.title, repeatOriginal: true }), 'text/markdown;charset=utf-8');
});
