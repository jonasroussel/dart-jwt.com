import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = resolve(scriptDir, '..');
const fontDir = resolve(scriptDir, 'fonts');

const RESVG_OPTS = {
  font: {
    fontDirs: [fontDir],
    loadSystemFonts: false,
    defaultFontFamily: 'IBM Plex Sans',
  },
};

function renderSvg(svg, pngRelPath, width) {
  const resvg = new Resvg(svg, {
    ...RESVG_OPTS,
    fitTo: { mode: 'width', value: width },
  });
  const png = resvg.render().asPng();
  writeFileSync(resolve(root, pngRelPath), png);
  console.log(`\u2713 ${pngRelPath} (${png.length.toLocaleString()} bytes, ${width}px wide)`);
}

// apple-touch-icon: reuse favicon.svg but strip the baked rounded corners.
// iOS applies its own ~22% corner-radius mask on the home screen. Baking in
// a smaller radius would leave transparent slivers between our rounding and
// iOS's — so we render the apple-touch as a full-bleed square and let iOS round it.
const faviconSvg = readFileSync(resolve(root, 'public/favicon.svg'), 'utf8');
const appleTouchSvg = faviconSvg.replace(/rx="12"/g, 'rx="0"');
renderSvg(appleTouchSvg, 'public/apple-touch-icon.png', 180);

// OG image: 1200×630, rendered from its own source SVG.
const ogSvg = readFileSync(resolve(root, 'src/assets/og-image.svg'), 'utf8');
renderSvg(ogSvg, 'public/og-image.png', 1200);
