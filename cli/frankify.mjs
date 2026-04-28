#!/usr/bin/env node
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chunkSegments, demoTranslateSegment, formatMarkdown, splitByMode, validateTranslationItems } from '../src/frank.js';
import { openAIRequestBody, parseOpenAIResponse } from '../src/providers.js';

function parseArgs(argv) {
  const args = {
    input: '',
    output: 'output/frank-method-output.md',
    mode: 'paragraph',
    level: 'B1',
    maxChars: 3500,
    provider: 'openai',
    title: 'Frank Method Text',
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini'
  };
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    const value = argv[i + 1];
    if (key === '--help' || key === '-h') args.help = true;
    else if (key === '--input' || key === '-i') { args.input = value; i += 1; }
    else if (key === '--output' || key === '-o') { args.output = value; i += 1; }
    else if (key === '--mode') { args.mode = value; i += 1; }
    else if (key === '--level') { args.level = value; i += 1; }
    else if (key === '--max-chars') { args.maxChars = Number(value); i += 1; }
    else if (key === '--provider') { args.provider = value; i += 1; }
    else if (key === '--title') { args.title = value; i += 1; }
    else if (key === '--model') { args.model = value; i += 1; }
  }
  return args;
}

function help() {
  return `Frank Method Translator CLI\n\nUsage:\n  node cli/frankify.mjs --input samples/article.txt --output output/article.md\n\nOptions:\n  -i, --input       TXT/MD input file\n  -o, --output      Markdown output file\n  --mode           paragraph | sentence\n  --level          A2 | B1 | B2 | C1 | Professional\n  --max-chars      Max characters per API request\n  --provider       openai | demo\n  --model          OpenAI model name\n  --title          Markdown title\n`;
}

async function translateOpenAI(segments, args) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is missing. Copy .env.example to .env and fill it.');
  const payload = { sourceLanguage: 'English', targetLanguage: 'Russian', level: args.level, style: 'classic', segments };
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(openAIRequestBody(payload, args.model))
  });
  if (!response.ok) throw new Error(`OpenAI error ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return validateTranslationItems(parseOpenAIResponse(data).items);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.input) {
    console.log(help());
    process.exit(args.help ? 0 : 1);
  }
  const raw = await fs.readFile(args.input, 'utf8');
  const segments = splitByMode(raw, args.mode);
  const chunks = chunkSegments(segments, args.maxChars);
  const all = [];
  console.error(`Segments: ${segments.length}. API chunks: ${chunks.length}.`);
  for (let i = 0; i < chunks.length; i += 1) {
    console.error(`Processing chunk ${i + 1}/${chunks.length}...`);
    const items = args.provider === 'demo' ? chunks[i].map(demoTranslateSegment) : await translateOpenAI(chunks[i], args);
    all.push(...items);
  }
  const markdown = formatMarkdown(all, { title: args.title, repeatOriginal: true });
  await fs.mkdir(path.dirname(args.output), { recursive: true });
  await fs.writeFile(args.output, markdown, 'utf8');
  console.error(`Done: ${args.output}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
