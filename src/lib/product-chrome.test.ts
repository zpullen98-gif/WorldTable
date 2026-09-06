import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * The product chrome every wing of Outside Of Time shares (contracts E and
 * F): the document title ends ' · Outside Of Time' on the base and every page
 * title is '<Page> · The World Table'; the status bar meta is 'black'; the
 * footer carries Privacy · Terms to the product's root pages, and only when
 * there is a base to be above.
 */
function svelteFiles(dir: string, out: string[] = []): string[] {
	for (const e of readdirSync(dir)) {
		const p = join(dir, e);
		if (statSync(p).isDirectory()) svelteFiles(p, out);
		else if (p.endsWith('.svelte')) out.push(p);
	}
	return out;
}

const files = [...svelteFiles('src/routes'), 'src/lib/components/RecipeDetailView.svelte'];
const titled = files
	.map((f) => ({ f, titles: [...readFileSync(f, 'utf8').matchAll(/<title>([^<]*)<\/title>/g)].map((m) => m[1]) }))
	.filter((x) => x.titles.length);

describe('titles', () => {
	it('the layout carries the product-suffixed base title', () => {
		const layout = titled.find((x) => x.f.endsWith('+layout.svelte'))!;
		expect(layout.titles).toEqual(['The World Table · Outside Of Time']);
	});

	it('every page title is "<Page> · The World Table", middle dot, no colon or bar', () => {
		const pages = titled.filter((x) => !x.f.endsWith('+layout.svelte'));
		expect(pages.length).toBeGreaterThan(20);
		for (const { f, titles } of pages) {
			for (const t of titles) {
				expect(t, f).toMatch(/ · The World Table$/);
				expect(t, f).not.toMatch(/[:|] The World Table$/);
				expect(t, f).not.toMatch(/—| -- /);
				expect(t.replace(/ · The World Table$/, '').trim(), `${f}: empty page name`).not.toBe('');
			}
		}
	});
});

describe('the layout head and footer', () => {
	const layout = readFileSync('src/routes/+layout.svelte', 'utf8');

	it('sets the status bar style to black beside the capable meta', () => {
		expect(layout).toContain('<meta name="apple-mobile-web-app-status-bar-style" content="black" />');
	});

	it('links Privacy and Terms at the product root, external, only under a base', () => {
		const footer = layout.slice(layout.indexOf('<footer>'), layout.indexOf('</footer>'));
		const legal = footer.slice(footer.indexOf('{#if base}'), footer.indexOf('{/if}'));
		expect(legal).toContain('<a href="/privacy.html" rel="external">Privacy</a>');
		expect(legal).toContain('<a href="/terms.html" rel="external">Terms</a>');
		expect(legal.replace(/\s+/g, ' ')).toMatch(/Privacy<\/a> · <a/);
	});

	it('renders the manifest link only when a manifest was named', () => {
		expect(layout).toMatch(/\{#if __MANIFEST_HREF__\}\s*<link rel="manifest" href=\{__MANIFEST_HREF__\} \/>\s*\{\/if\}/);
	});
});
