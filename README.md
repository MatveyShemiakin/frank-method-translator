# Frank Method Translator

Программное обеспечение для преобразования английских статей и книг в учебный русско-английский формат, вдохновленный методом Ильи Франка.

Формат результата:

```text
English phrase (русский перевод и пояснение), next phrase (перевод и пояснение).

English phrase, next phrase.
```

То есть читатель сначала видит адаптированный английский текст с русскими пояснениями, а затем тот же фрагмент без подсказок.

## Что входит

- Веб-интерфейс для GitHub Pages: вставка текста, загрузка TXT/MD, скачивание TXT/Markdown.
- Локальный Node.js proxy, чтобы API-ключ не попадал в публичный фронтенд.
- CLI для больших файлов: удобно обрабатывать главы книг и длинные статьи.
- Демо-режим без API для проверки интерфейса.
- Тесты ядра разбиения и форматирования.
- GitHub Actions для сборки и публикации на GitHub Pages.

## Важное ограничение

Этот проект не должен использоваться для нарушения авторских прав. Обрабатывайте:

1. свои тексты;
2. public domain;
3. материалы с разрешением правообладателя;
4. короткие законные фрагменты для личного обучения в рамках применимого законодательства.

## Быстрый старт локально

Требуется Node.js 20.19+.

```bash
git clone https://github.com/YOUR_USER/frank-method-translator.git
cd frank-method-translator
npm install
cp .env.example .env
```

Откройте `.env` и добавьте ключ:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
PORT=8787
ALLOWED_ORIGIN=http://localhost:5173
```

Запустите proxy:

```bash
npm run server
```

Во втором терминале запустите интерфейс:

```bash
npm run dev
```

Откройте адрес, который покажет Vite, обычно `http://localhost:5173`.

## CLI для книги или большой статьи

```bash
node cli/frankify.mjs \
  --input samples/article.txt \
  --output output/article.frank.md \
  --mode paragraph \
  --level B1 \
  --title "My Article in Frank Method"
```

Демо без API:

```bash
node cli/frankify.mjs \
  --input samples/article.txt \
  --output output/demo.md \
  --provider demo
```

## Публикация на GitHub Pages

1. Создайте новый репозиторий на GitHub.
2. Загрузите все файлы этого проекта.
3. Откройте `Settings → Pages`.
4. В `Build and deployment` выберите `GitHub Actions`.
5. Сделайте commit в ветку `main`.
6. GitHub Actions соберет сайт и опубликует Pages.

Подробная инструкция: [`docs/GITHUB_PAGES.md`](docs/GITHUB_PAGES.md).

## Почему нужен proxy

Если вы вставите API key прямо в JavaScript, любой посетитель сайта сможет увидеть ключ в браузере. Поэтому production-вариант должен вызывать ваш backend/proxy. Для личного локального использования можно включить прямой режим, но публично так делать нельзя.

## Структура

```text
.
├── cli/frankify.mjs              # CLI для обработки файлов
├── server/proxy.js               # локальный proxy к OpenAI Responses API
├── src/frank.js                  # разбиение, chunking, форматирование
├── src/providers.js              # OpenAI/proxy providers
├── src/main.js                   # веб-интерфейс
├── tests/core.test.mjs           # тесты ядра
├── docs/                         # документация
└── .github/workflows/pages.yml   # GitHub Pages workflow
```

## Настройка качества перевода

В `src/providers.js` можно менять system prompt. Для медицинских/научных статей уже включено правило: точная терминология важнее литературного сглаживания. Для художественных книг можно ослабить это правило и добавить сохранение стиля автора.

## Тесты

```bash
npm test
```

## Production-идея

Для многопользовательского сайта лучше вынести `server/proxy.js` на Render, Railway, Fly.io, Vercel Functions или другой backend-хостинг, а в GitHub Pages указать URL этого backend в поле `Proxy endpoint`.
