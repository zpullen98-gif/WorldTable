/**
 * verify-build.mjs — assert the shipped build's contract.
 *
 * Run after `npm run build`. These are the properties that are easy to break by
 * accident and expensive to notice: the precache quietly swallowing 1,000 HTML
 * pages, a CDN link creeping back in, the offline fallback going missing.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUILD = join(ROOT, 'build');

/**
 * The base the build under inspection was made with. Every absolute URL the app
 * emits is prefixed by it, so a checker that assumes "" cannot verify a Pages
 * build — it fails on the service worker path and, worse, passes everything
 * else against output it never looked at properly.
 */
const BASE = process.env.BASE_PATH ?? '';

const results = [];
let failed = 0;

function check(label, fn) {
	try {
		results.push({ ok: true, label, detail: fn() ?? '' });
	} catch (err) {
		failed++;
		results.push({ ok: false, label, detail: err.message });
	}
}

const assert = (cond, msg) => {
	if (!cond) throw new Error(msg);
};

if (!existsSync(BUILD)) {
	console.error('\n  no build/ directory: run `npm run build` first\n');
	process.exit(1);
}

function walk(dir, out = []) {
	for (const e of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, e.name);
		if (e.isDirectory()) walk(p, out);
		else out.push(p);
	}
	return out;
}

const files = walk(BUILD);
const rel = (p) => p.slice(BUILD.length + 1).replace(/\\/g, '/');
const sw = readFileSync(join(BUILD, 'sw.js'), 'utf8');
const precached = [...sw.matchAll(/url:"([^"]+)"/g)].map((m) => m[1]);

// ── prerendered surface ──────────────────────────────────────────────────────
const html = files.filter((f) => extname(f) === '.html');

check('970 recipe pages prerendered', () => {
	const n = html.filter((f) => rel(f).startsWith('recipe/')).length;
	assert(n === 970, `found ${n}`);
	return String(n);
});

check('94 chapter pages prerendered', () => {
	const n = html.filter((f) => rel(f).startsWith('chapter/')).length;
	assert(n === 94, `found ${n}`);
	return String(n);
});

/**
 * Asserted against techniques.json rather than a magic number: the table is
 * meant to grow, and a check that has to be edited every time it grows is a
 * check people learn to edit without reading.
 */
check('every live technique has a page', () => {
	const techniques = JSON.parse(
		readFileSync(join(ROOT, 'src', 'lib', 'data', 'techniques.json'), 'utf8')
	);
	const n = html.filter((f) => rel(f).startsWith('technique/')).length;
	assert(n === techniques.length, `${techniques.length} techniques but ${n} pages`);
	assert(
		techniques.every((t) => t.recipes.length > 0),
		'a technique shipped with no recipes'
	);
	return `${n} techniques`;
});

/**
 * Read the mode bar rather than a list kept alongside it.
 *
 * This check shipped as six hardcoded filenames and was already wrong: /family
 * had been a mode for months and nothing here knew. A tab that 404s is the most
 * visible failure the build can have, and the version of this check that could
 * not see a new tab was the version that let one through — which is the exact
 * argument the technique check twenty lines up makes about magic numbers.
 */
check('every mode in the bar has a page', () => {
	const layout = readFileSync(join(ROOT, 'src', 'routes', '+layout.svelte'), 'utf8');
	const open = layout.indexOf("const MODES = [");
	assert(open >= 0, 'could not find the MODES array in +layout.svelte');
	const close = layout.indexOf('];', open);
	assert(close > open, 'MODES array is not terminated');

	// String scanning, not a regex: the array is a literal list of literals,
	// and a regex here would be one more thing to get subtly wrong.
	const body = layout.slice(open, close);
	const hrefs = [];
	let at = body.indexOf("href: '");
	while (at >= 0) {
		const from = at + 7;
		hrefs.push(body.slice(from, body.indexOf("'", from)));
		at = body.indexOf("href: '", from);
	}
	// A floor, not a count. Its job is to catch a MODES array the scanner failed
	// to PARSE — zero hrefs would otherwise pass this check vacuously and then
	// assert nothing in the loop below. It is not a claim about how many tabs
	// the app should have, and the message must not say so: the bar went from
	// ten to five deliberately, and a gate that reads as "you broke the parser"
	// on correct code is a gate people learn to edit without reading.
	assert(
		hrefs.length >= 5,
		`parsed only ${hrefs.length} modes — either the bar lost a tab, or the scanner ` +
			'no longer recognises the MODES literal (it needs the exact declaration and single-quoted hrefs)'
	);

	for (const href of hrefs) {
		const file = href === '' ? 'index.html' : `${href.slice(1)}.html`;
		assert(existsSync(join(BUILD, file)), `mode "${href || '/'}" has no page (${file})`);
	}
	return `${hrefs.length} modes`;
});

check('a deep link renders its dish without JavaScript', () => {
	const page = readFileSync(join(BUILD, 'recipe', 'cacio-e-pepe.html'), 'utf8');
	assert(page.includes('Cacio e Pepe'), 'name missing from prerendered HTML');
	assert(page.includes('Pecorino Romano'), 'ingredients missing');
	assert(page.includes('the starch does the emulsifying'), 'note missing');
	return 'name, ingredients and note all in the HTML';
});

check('the collided slugs both resolved', () => {
	assert(existsSync(join(BUILD, 'recipe', 'bun-thit-nuong-vietnamese.html')), 'missing Vietnamese');
	assert(existsSync(join(BUILD, 'recipe', 'bun-thit-nuong-lunch-atlas.html')), 'missing Lunch Atlas');
	return 'both chapter-qualified pages exist';
});

// ── service worker ───────────────────────────────────────────────────────────
check('service worker generated', () => {
	assert(sw.length > 1000, 'sw.js is suspiciously small');
	assert(precached.length > 0, 'precache manifest is empty');
	return `${precached.length} entries`;
});

check('every precache entry exists on disk', () => {
	// The check that was too weak once: a manifestTransform bug prefixed all 66
	// entries with client/, every install fetch 404'd, and the service worker
	// never survived a single build. Counting entries did not catch it; only
	// resolving each URL against the build output does.
	const missing = precached.filter((u) => {
		const p = join(BUILD, decodeURIComponent(u.split('?')[0]).replace(/^\//, ''));
		return !existsSync(p);
	});
	assert(missing.length === 0, `${missing.length} entries 404 at install: ${missing.slice(0, 3).join(', ')}`);
	assert(!precached.some((u) => u.startsWith('client/') || u.includes('server/')), 'unstripped output-dir prefixes in manifest');
	return `${precached.length} entries, all real`;
});

check('the offline shell itself is precached', () => {
	assert(precached.some((u) => u.endsWith('shell.html')), 'shell.html missing from precache — offline navigation would fail');
	return 'shell.html in manifest';
});

check('service worker registers with an absolute path', () => {
	// SvelteKit's relative-paths default makes vite-pwa register './sw.js' —
	// which resolves to /recipe/sw.js on a deep link and 404s, so a user whose
	// first visit is a shared link never gets offline capability.
	const chunks = walk(join(BUILD, '_app')).filter((f) => f.endsWith('.js'));
	const want = `\`${BASE}/sw.js\``;
	const registers = chunks.some((f) => readFileSync(f, 'utf8').includes(want));
	assert(registers, `no absolute ${BASE}/sw.js registration found — check kit paths.relative`);
	return `${BASE}/sw.js, scope ${BASE || '/'}`;
});

/**
 * Jekyll eats `_app/`. Without this file GitHub Pages deploys the HTML and
 * 404s every script, stylesheet and font it references — a blank page that
 * looks like a broken app rather than a missing dotfile.
 */
check('.nojekyll present for GitHub Pages', () => {
	assert(existsSync(join(BUILD, '.nojekyll')), 'missing build/.nojekyll: Jekyll will strip _app/');
	return 'Jekyll disabled';
});

/**
 * Guards the false green that hid the base-path failure: `verify:build` was run
 * against a stale build/ from an earlier, differently-based run and passed all
 * sixteen checks while the actual build had errored out.
 */
check('the build on disk matches the base being verified', () => {
	const page = readFileSync(join(BUILD, 'index.html'), 'utf8');
	const assetRef = BASE ? `${BASE}/_app/` : '/_app/';
	assert(
		page.includes(assetRef),
		`index.html has no ${assetRef} reference — build/ was made with a different BASE_PATH than ${JSON.stringify(BASE)}`
	);
	return `base ${JSON.stringify(BASE)}`;
});

check('precache holds no prerendered HTML', () => {
	const pages = precached.filter((u) => u.includes('.html') && !u.includes('shell.html'));
	assert(pages.length === 0, `${pages.length} HTML pages precached: ${pages.slice(0, 3).join(', ')}`);
	return 'none — navigateFallback reconstructs them';
});

/**
 * The check this replaced was `/shell\.html/.test(sw)` — which passes whether
 * the fallback reads 'shell.html' or '/shell.html', and the difference between
 * those two strings was the entire offline story on the deployed origin. A
 * substring test cannot see a resolution bug; resolve it the way Workbox does.
 */
check('offline navigation fallback resolves to a precached URL', () => {
	assert(existsSync(join(BUILD, 'shell.html')), 'shell.html not emitted');

	const m = sw.match(/createHandlerBoundToURL\(\s*["']([^"']+)["']\s*\)/);
	assert(m, 'no createHandlerBoundToURL(...) in sw.js — navigateFallback is not wired at all');
	const fallback = m[1];

	// Workbox resolves the fallback AND every precache key against the service
	// worker's own location. Reproduce that, at the base this build targets.
	const swUrl = new URL(`https://example.test${BASE}/sw.js`);
	const resolved = new URL(fallback, swUrl).href;
	const precachedUrls = precached.map((u) => new URL(u, swUrl).href);

	assert(
		precachedUrls.includes(resolved),
		`navigateFallback ${JSON.stringify(fallback)} resolves to ${resolved}, which is NOT in the ` +
			`precache — createHandlerBoundToURL throws non-precached-url and the NavigationRoute ` +
			`never registers, so the app has no offline navigation`
	);
	return `${fallback} -> ${resolved.replace('https://example.test', '')}`;
});

check('precache stays under 2 MB gzipped', () => {
	let raw = 0;
	let gz = 0;
	for (const f of files) {
		const r = '/' + rel(f);
		if (!precached.some((u) => u === r || u === rel(f))) continue;
		const b = readFileSync(f);
		raw += b.length;
		gz += gzipSync(b).length;
	}
	// Fall back to the whole non-HTML payload if URL matching missed (the plugin
	// may prefix entries); the point is to notice growth, not to be clever.
	if (gz === 0) {
		for (const f of files) {
			if (extname(f) === '.html' || extname(f) === '.woff') continue;
			const b = readFileSync(f);
			raw += b.length;
			gz += gzipSync(b).length;
		}
	}
	const mb = gz / 1048576;
	assert(mb < 2, `${mb.toFixed(2)} MB gzipped`);
	return `${mb.toFixed(2)} MB gzipped (${(raw / 1048576).toFixed(2)} MB raw)`;
});

// ── offline integrity ────────────────────────────────────────────────────────
check('no third-party resource references', () => {
	const offenders = [];
	for (const f of files) {
		if (!['.html', '.css', '.js'].includes(extname(f))) continue;
		const text = readFileSync(f, 'utf8');
		for (const host of ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net', 'unpkg.com']) {
			if (text.includes(host)) offenders.push(`${rel(f)} -> ${host}`);
		}
	}
	assert(offenders.length === 0, offenders.slice(0, 3).join('; '));
	return 'fonts self-hosted, no CDNs';
});

check('fonts are latin subsets only', () => {
	const woff2 = files.filter((f) => extname(f) === '.woff2');
	assert(woff2.length > 0, 'no woff2 emitted');
	assert(woff2.length <= 16, `${woff2.length} font files — a non-latin subset has crept back in`);
	return `${woff2.length} files`;
});

check('PWA manifest and icons present', () => {
	const m = JSON.parse(readFileSync(join(BUILD, 'manifest.webmanifest'), 'utf8'));
	assert(m.name && m.start_url && m.display === 'standalone', 'manifest is incomplete');
	for (const icon of m.icons) {
		assert(existsSync(join(BUILD, icon.src)), `missing icon ${icon.src}`);
	}
	assert(
		m.icons.some((i) => i.purpose === 'maskable'),
		'no maskable icon'
	);
	return `${m.icons.length} icons incl. maskable`;
});

// ── report ───────────────────────────────────────────────────────────────────
const pad = (s, n) => String(s).padEnd(n);
console.log('\n  verifying build/\n');
for (const r of results) console.log(`  ${r.ok ? '✓' : '✗'} ${pad(r.label, 46)} ${r.detail}`);
console.log('');
if (failed) {
	console.error(`  ${failed} of ${results.length} checks FAILED\n`);
	process.exit(1);
}
console.log(`  all ${results.length} checks passed\n`);
