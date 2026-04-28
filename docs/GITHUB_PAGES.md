# Пошаговая публикация на GitHub Pages

## 1. Создать репозиторий

1. Откройте GitHub.
2. Нажмите `New repository`.
3. Название: `frank-method-translator`.
4. Visibility: `Public` или `Private`.
5. Нажмите `Create repository`.

## 2. Загрузить проект через сайт GitHub

Самый простой вариант:

1. Откройте созданный репозиторий.
2. Нажмите `Add file → Upload files`.
3. Перетащите все файлы и папки проекта.
4. Нажмите `Commit changes`.

## 3. Включить GitHub Pages

1. Откройте `Settings` репозитория.
2. В меню слева нажмите `Pages`.
3. В блоке `Build and deployment` выберите `GitHub Actions`.
4. Перейдите во вкладку `Actions` и дождитесь завершения workflow `Deploy Vite site to GitHub Pages`.
5. После завершения откройте ссылку Pages, которую GitHub покажет в `Settings → Pages`.

## 4. Локальный proxy для реального перевода

GitHub Pages — статический хостинг. Он не хранит секретные ключи и не должен напрямую знать ваш API key.

Для личного компьютера:

```bash
npm install
cp .env.example .env
npm run server
npm run dev
```

Для публичного доступа разверните `server/proxy.js` на backend-хостинге и укажите его URL в поле `Proxy endpoint`.

## 5. Проверка

1. Вставьте короткий английский абзац.
2. Выберите `Демо без API`, чтобы проверить интерфейс.
3. Затем выберите `Локальный proxy / API` и проверьте реальный перевод.
4. Скачайте результат как TXT или Markdown.
