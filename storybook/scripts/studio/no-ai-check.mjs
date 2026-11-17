// Fails if the studio, the game's content loader or the database code could
// reach an AI model: no AI SDK in package.json and no AI API host or SDK name
// in the studio's sources. The browser test (e2e.mjs) also records every
// request a full edit -> publish -> rollback session makes.
import fs from 'node:fs';
import path from 'node:path';
const root = new URL('../..', import.meta.url).pathname;
const BAD = /anthropic|openai|generativelanguage|@google\/genai|google-generativeai|mistral|cohere|huggingface|replicate\.com|groq|perplexity|elevenlabs|text-to-speech|\bllm\b|\bgpt-/i;
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
let bad = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((d) => BAD.test(d)).map((d) => `package.json: ${d}`);
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
for (const dir of ['src/studio', 'src/app/admin', 'supabase/migrations'])
  for (const f of walk(path.join(root, dir)))
    fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      if (BAD.test(line) && !/no AI|not call an AI|calls an AI|AI model|no LLM/i.test(line)) bad.push(`${path.relative(root, f)}:${i + 1}: ${line.trim().slice(0, 120)}`);
    });
if (bad.length) {
  console.log('Possible AI calls found:\n' + bad.join('\n'));
  process.exit(1);
}
console.log('No AI SDKs or AI API hosts in the studio, its routes or the database code.');
