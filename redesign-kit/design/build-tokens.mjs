#!/usr/bin/env node
// Regenerates css/pr-tokens.css and css/pr-fonts.css from tokens.json. No dependencies.
// Usage: node redesign-kit/design/build-tokens.mjs   (then copy the two files to wherever part 01 placed them)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const t = JSON.parse(fs.readFileSync(path.join(dir, 'tokens.json'), 'utf8'));
const FONT = { 'Archivo': 'ProductReels Archivo', 'Archivo Expanded': 'ProductReels Archivo Expanded' };
const first = t.color.themes[0].id;
const val = (v) => (typeof v === 'string' ? v : v[first]);
const fam = (stack) => Object.keys(FONT).sort((a, b) => b.length - a.length).reduce((s, k) => s.split(`"${k}"`).join(`"${FONT[k]}"`), stack);
const out = ['/* ProductReels 1.1.0 design tokens. Generated from tokens.json: edit tokens.json, not this file. */', '.pr-app, .prs, .pr-portal {'];
for (const c of t.color.tokens) { const v = val(c.value); const m = /^\{(.+)\}$/.exec(v); out.push(`  --pr-${c.name}: ${m ? `var(--pr-${m[1]})` : v};`); }
for (const f of ['shadow', 'spacing', 'radius', 'size']) for (const x of t[f].tokens) out.push(`  --pr-${x.name}: ${val(x.value)};`);
for (const [k, v] of Object.entries(t.type.families)) out.push(`  --pr-font-${k}: ${fam(v)};`);
out.push('}', '');
for (const g of t.type.groups) for (const s of g.styles) {
  let d = `font-family: var(--pr-font-${s.family || g.family}); font-size: ${s.fontSize}; line-height: ${s.lineHeight}; font-weight: ${s.fontWeight};`;
  if (s.letterSpacing) d += ` letter-spacing: ${s.letterSpacing};`;
  out.push(`.pr-t-${s.name} { ${d} }`);
}
fs.writeFileSync(path.join(dir, 'css', 'pr-tokens.css'), out.join('\n') + '\n');
const fonts = ['/* Admin screens only. Never enqueue on the storefront or in the block editor canvas. Archivo, SIL OFL 1.1: see ../fonts/OFL.txt. */'];
for (const f of t.type.fonts) fonts.push(`@font-face { font-family: "${FONT[f.family]}"; src: url("../fonts/${path.basename(f.file)}") format("woff2"); font-weight: ${f.weight}; font-style: normal; font-display: swap; }`);
fs.writeFileSync(path.join(dir, 'css', 'pr-fonts.css'), fonts.join('\n') + '\n');
console.log('Wrote css/pr-tokens.css and css/pr-fonts.css');
