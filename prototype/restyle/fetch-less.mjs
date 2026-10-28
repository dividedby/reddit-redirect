// Fetches reddit.less and every file it @imports (recursively) into the vendor dir.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const base = 'https://raw.githubusercontent.com/reddit-archive/reddit/master/r2/r2/public/static/css/';
const out = process.argv[2];
const seen = new Set();
async function get(rel) {
  if (seen.has(rel)) return; seen.add(rel);
  const res = await fetch(base + rel);
  if (!res.ok) { console.log('missing', rel, res.status); return; }
  const text = await res.text();
  await mkdir(path.dirname(path.join(out, rel)), { recursive: true });
  await writeFile(path.join(out, rel), text);
  for (const m of text.matchAll(/@import\s+(?:\([^)]*\)\s*)?["']([^"']+)["']/g)) {
    let r = path.posix.join(path.posix.dirname(rel), m[1]);
    if (!/\.(less|css)$/.test(r)) r += '.less';
    await get(r);
  }
}
await get('reddit.less');
console.log('files', seen.size);
