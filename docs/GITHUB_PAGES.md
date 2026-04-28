# Публикация на GitHub Pages

1. Откройте репозиторий на GitHub.
2. Перейдите в `Settings -> Pages`.
3. В блоке `Build and deployment` выберите `GitHub Actions`.
4. Откройте вкладку `Actions` и запустите workflow вручную или сделайте commit в `main`.
5. После успешной сборки GitHub покажет публичную ссылку Pages.

## Важное ограничение

GitHub Pages публикует только статический frontend. API-ключ OpenAI нельзя хранить в браузере или в публичном репозитории.

Для настоящего перевода используйте один из вариантов:

- локальный proxy `server/proxy.js` для личного использования;
- backend на Render, Railway, Fly.io, Vercel Functions или другом сервере;
- CLI на своем компьютере.

Demo-режим работает прямо на Pages без API.
