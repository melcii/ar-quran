import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve as pres } from 'node:path';
import { createRequire } from 'node:module';
// Lets plain Node load the app's TypeScript (world recipes, terrain, physics)
// for the fast world validator: '@/...' paths, extensionless imports, and
// .ts/.tsx transpiled with the project's own TypeScript.
const SRC = process.env.SB_SRC ?? new URL('../../src', import.meta.url).pathname;
const req = createRequire(SRC + '/../package.json');
const ts = req('typescript');
const STUB = new Set((process.env.SB_STUB ?? '').split(',').filter(Boolean));
export async function resolve(spec, ctx, next) {
  if (STUB.has(spec) || /\.(png|jpg|ttf|glb|mp3)$/.test(spec)) return { url: 'data:text/javascript,export default {};', shortCircuit: true };
  let base = null;
  if (spec.startsWith('@/')) base = pres(SRC, spec.slice(2));
  else if ((spec.startsWith('./') || spec.startsWith('../')) && ctx.parentURL?.startsWith('file:')) base = pres(dirname(fileURLToPath(ctx.parentURL)), spec);
  if (base) for (const ext of ['.ts', '.tsx', '/index.ts', '/index.tsx', '']) { const f = base + ext; if (existsSync(f) && /\.(ts|tsx|js|mjs|json)$/.test(f)) return { url: pathToFileURL(f).href, shortCircuit: true }; }
  return next(spec, ctx);
}
export async function load(url, ctx, next) {
  if (url.startsWith('file:') && /\.tsx?$/.test(url)) {
    const src = readFileSync(fileURLToPath(url), 'utf8');
    const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, verbatimModuleSyntax: false, isolatedModules: true }, fileName: fileURLToPath(url) });
    return { format: 'module', source: out.outputText, shortCircuit: true };
  }
  return next(url, ctx);
}
