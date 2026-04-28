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
              'You transform English text into an Ilya Frank-inspired bilingual reading format for Russian-speaking learners.',
              'For each segment return JSON only.',
              'Keep the original English meaning and terminology exactly.',
              'For scientific and medical text, preserve technical terms and translate precisely rather than artistically.',
              'The adapted field must contain the English segment with Russian translation/explanation in parentheses after meaningful phrases.',
              'Do not add copyrighted text beyond the user-provided segment.'
            ].join(' ')
          }
        ]
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: JSON.stringify({
              sourceLanguage: payload.sourceLanguage || 'English',
              targetLanguage: payload.targetLanguage || 'Russian',
              learnerLevel: payload.level || 'B1',
              style: payload.style || 'classic',
              segments: payload.segments || []
            })
          }
        ]
      }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'frank_method_translation',
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
                  source: { type: 'string' },
                  adapted: { type: 'string' },
                  note: { type: 'string' }
                },
                required: ['source', 'adapted', 'note']
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
  const direct = data?.output_text;
  if (direct) return JSON.parse(direct);

  const text = data?.output
    ?.flatMap((item) => item.content || [])
    ?.filter((part) => part.type === 'output_text' || part.type === 'text')
    ?.map((part) => part.text)
    ?.join('\n');

  if (!text) throw new Error('OpenAI response did not contain output text.');
  return JSON.parse(text);
}

export async function translateViaProxy({ endpoint, segments, level, style }) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sourceLanguage: 'English',
      targetLanguage: 'Russian',
      level,
      style,
      segments
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Proxy error ${response.status}: ${message}`);
  }

  return response.json();
}
