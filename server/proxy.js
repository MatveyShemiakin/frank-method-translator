import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { validateTranslationItems } from '../src/frank.js';
import { openAIRequestBody, parseOpenAIResponse } from '../src/providers.js';

const app = express();
const port = Number(process.env.PORT || 8787);
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: allowedOrigin === '*' ? true : allowedOrigin }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'frank-method-translator-proxy' });
});

app.post('/api/frankify', async (req, res) => {
  try {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return res.status(500).send('OPENAI_API_KEY is missing. Create .env from .env.example.');
    }

    const segments = req.body?.segments;
    if (!Array.isArray(segments) || segments.length === 0) {
      return res.status(400).send('Request body must include a non-empty segments array.');
    }

    const model = process.env.OPENAI_MODEL || req.body?.model || 'gpt-4.1-mini';
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`
      },
      body: JSON.stringify(openAIRequestBody(req.body, model))
    });

    if (!response.ok) {
      const message = await response.text();
      return res.status(response.status).send(message);
    }

    const data = await response.json();
    const parsed = parseOpenAIResponse(data);
    const items = validateTranslationItems(parsed.items);
    return res.json({ items });
  } catch (error) {
    console.error(error);
    return res.status(500).send(error.message || 'Unknown server error');
  }
});

app.listen(port, () => {
  console.log(`Frank Method proxy is running on http://localhost:${port}`);
});
