import { createPromptPayload, validateTranslationItems } from './frank.js';

export async function translateViaProxy(segments, settings = {}) {
  const endpoint = settings.endpoint || 'http://localhost:8787/api/frankify';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(createPromptPayload(segments, settings))
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Proxy error ${response.status}: ${message}`);
  }
  const data = await response.json();
  return validateTranslationItems(data.items);
}

export async function translateViaDirectOpenAI(segments, settings = {}) {
  const key = settings.apiKey;
  if (!key) throw new Error('OpenAI API key is required for direct browser mode. Prefer local proxy for real projects.');
  const model = settings.model || 'gpt-4.1-mini';
  const payload = openAIRequestBody(createPromptPayload(segments, settings), model);
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${message}`);
  }
  const data = await response.json();
  return validateTranslationItems(parseOpenAIResponse(data).items);
}

export function openAIRequestBody(payload, model = 'gpt-4.1-mini') {
  return {
    model,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: [
              'You transform English prose into a bilingual Russian learning text inspired by Ilya Frank style.',
              'For each input segment, preserve the complete original meaning.',
              'Create adapted text in this pattern: short English phrase followed by a natural Russian translation/explanation in parentheses, continuing through the whole segment.',
              'Then provide the clean original English text separately.',
              'Do not omit sentences. Do not add facts. Keep names, numbers, citations, and terminology intact.',
              'For articles and scientific prose, prefer accurate terminology over literary smoothing.',
              'Return only JSON that matches the schema.'
            ].join(' ')
          }
        ]
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: JSON.stringify(payload)
          }
        ]
      }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'frank_translation_schema',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  original: { type: 'string' },
                  adapted: { type: 'string' },
                  clean: { type: 'string' }
                },
                required: ['original', 'adapted', 'clean']
              }
            }
          },
          required: ['items']
        }
      }
    }
  };
}

export function parseOpenAIResponse(data) {
  if (data.output_text) return JSON.parse(data.output_text);
  const text = data.output
    ?.flatMap((item) => item.content || [])
    ?.map((part) => part.text || '')
    ?.join('')
    ?.trim();
  if (!text) throw new Error('OpenAI response has no output text.');
  return JSON.parse(text);
}
