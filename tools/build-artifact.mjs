// Builds out/kartcis-frame-uji.html: one self-contained page for a claude.ai Artifact test link.
// The page inlines chars/characters.js, frames.js and artifact/app.js (each in its own scope, since both
// characters.js and frames.js define helpers such as `star`), the logo as a data URI and the mark SVG.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const noExport = s => s.replace(/^export\s+(const|function|class|let)\s/gm, '$1 ');

const chars = noExport(read('chars/characters.js'));
const frames = noExport(read('frames.js').replace(/^import .*characters\.js';\s*$/m, 'const { build, paint, C } = CH;'));
if (/^\s*(import|export)\s/m.test(chars + frames)) throw new Error('import/export tersisa di sumber');
const app = read('artifact/app.js');
const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'assets/logo-a2.png')).toString('base64');
const mark = read('assets/mark.svg').trim().replace('<svg ', '<svg aria-hidden="true" ').replace(/\s*\n\s*/g, '');

const script = [
  '(() => {',
  "'use strict';",
  `const LOGO = ${JSON.stringify(logo)};`,
  'const CH = (() => {', chars, 'return { build, paint, C };', '})();',
  'const FR = (() => {', frames, 'return { W, H, FRAMES, renderOverlay };', '})();',
  app,
  '})();',
].join('\n');
if (script.includes('</script')) throw new Error('teks </script ada di dalam skrip');

const html = read('artifact/shell.html')
  .replace('/*__MARK__*/', () => mark)
  .replace('/*__SCRIPT__*/', () => script);
const out = path.join(ROOT, 'out', 'kartcis-frame-uji.html');
fs.writeFileSync(out, html);
console.log('ditulis', path.relative(ROOT, out), Math.round(html.length / 1024) + ' KB');
