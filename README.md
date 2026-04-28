# Frank Method Translator

Веб-приложение и CLI для преобразования английских статей и глав книг в учебный русско-английский формат: английский фрагмент с русскими пояснениями, затем тот же фрагмент без подсказок.

## Возможности

- Веб-интерфейс для GitHub Pages.
- Demo-режим без API.
- Локальный Node.js proxy для OpenAI, чтобы не публиковать API-ключ в браузере.
- CLI для обработки TXT/MD файлов.
- Тесты ядра разбиения и форматирования.
- GitHub Actions workflow для сборки Pages.

## Важно об авторских правах

Не используйте проект для нарушения авторских прав. Обрабатывайте собственные тексты, public domain, материалы с разрешением правообладателя или короткие законные фрагменты для личного обучения.

## Локальный запуск

Требуется Node.js 20.19+.

```bash
git clone https://github.com/MatveyShemiakin/frank-method-translator.git
cd frank-method-translator
npm install
cp .env.example .env
npm run dev
```

Для настоящего перевода через OpenAI откройте `.env` и добавьте ключ:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
PORT=8787
ALLOWED_ORIGIN=http://localhost:5173
```

Затем в отдельном терминале запустите proxy:

```bash
npm run server
```

В интерфейсе выберите `Proxy/OpenAI`.

## CLI

Demo без API:

```bash
node cli/frankify.mjs --input samples/article.txt --output output/demo.md --provider demo
```

Через OpenAI:

```bash
node cli/frankify.mjs --input samples/article.txt --output output/article.frank.md --provider openai --level B1
```

## GitHub Pages

1. Откройте `Settings -> Pages`.
2. В `Build and deployment` выберите `GitHub Actions`.
3. Сделайте любой commit в `main`, workflow соберет сайт.
4. После успешной сборки ссылка будет в разделе `Deployments` или `Settings -> Pages`.

## Структура

```text
cli/frankify.mjs            CLI
server/proxy.js             локальный proxy
src/frank.js                разбиение и форматирование
src/providers.js            OpenAI/proxy provider
src/main.js                 веб-интерфейс
src/styles.css              стили
tests/core.test.mjs         тесты
.github/workflows/pages.yml GitHub Pages workflow
```

## Проверка

```bash
npm test
npm run build
```
