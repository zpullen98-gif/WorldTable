/**
 * The whole bottle list as its own file (the wine deep dive, 4 October 2026):
 * tools/house/build-winelist.mjs and its gate tools/house/check-winelist.mjs,
 * driven here by producer files made up for the test (one stub producer per
 * catalogue entry and a line for every section), so the suite proves the tools
 * whatever the writers have delivered. The real file is proved by running the
 * gate itself once it exists.
 */
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
/* The tools are plain .mjs scripts outside the typed program: loaded by a computed address, so the
   type check never walks them. */
const tool = (name: string) => import(/* @vite-ignore */ pathToFileURL(join(ROOT, 'tools', 'house', name)).href);
const { CATALOGUE, OUT, buildWinelist, mergeProducerFiles, winelistText, sectionOfPlace } = await tool('build-winelist.mjs');
const { winelistProblems, MAX_BYTES } = await tool('check-winelist.mjs');
type Raw = Record<string, any>;
const catalogue: Raw = JSON.parse(readFileSync(CATALOGUE, 'utf8'));
const page = readFileSync(join(ROOT, 'tools', 'house', 'brennans', 'pages', 'binwise-wine-list-2026-10-03.txt'), 'utf8');
const pack: Raw = JSON.parse(readFileSync(join(ROOT, 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json'), 'utf8'));
const DASHES = new RegExp(['\\u2014', '\\u2013', '&' + 'mdash;', ' ' + '-- '].join('|'));
const noDash = (s: string) => DASHES.test(s);

/** Producer files that describe every entry: two files splitting the list, with one producer described in both. */
function stubFiles(): Array<{ file: string; data: Raw }> {
	const a: Raw = { producers: {}, entries: {}, places: {} };
	const b: Raw = { producers: {}, entries: {}, places: {} };
	for (const e of catalogue.entries) {
		const f = e.n % 2 ? a : b;
		const key = 'p-' + (e.n % 300);
		f.entries[e.n] = key;
		f.producers[key] = { name: 'Producer ' + (e.n % 300), region: 'A region', country: 'France', line: 'Who they are, in one sentence.', tell: 'What a server can say. Two sentences of it.' };
		if (!a.places[e.section]) a.places[e.section] = { title: e.section, line: 'What this part of the list is and how to steer through it.' };
	}
	b.producers['p-1'] = { name: 'Producer 1', region: 'A region', country: 'France', line: 'Who they are, in one longer sentence than before.', tell: 'What a server can say. Two sentences of it.' };
	return [{ file: 'a.json', data: a }, { file: 'b.json', data: b }];
}

describe('build-winelist', () => {
	it('builds a file the gate passes, deterministically, under the cap', () => {
		const one = buildWinelist(catalogue, stubFiles(), pack);
		expect(one.failures).toEqual([]);
		const text = winelistText(one.list);
		expect(winelistText(buildWinelist(catalogue, stubFiles(), pack).list)).toBe(text);
		expect(Buffer.byteLength(text)).toBeLessThan(MAX_BYTES);
		const list = JSON.parse(text);
		expect(list.format).toBe('oot-winelist');
		expect(list.entries).toHaveLength(catalogue.entries.length);
		expect(list.sections).toHaveLength(36);
		expect(list.entries[0].slice(0, 9)).toEqual([1, 'By the Glass', '', catalogue.entries[0].name, 'NV', 28, '750ml', 'p-1', 'g']);
		expect(winelistProblems(text, catalogue, page, pack, noDash)).toEqual([]);
	});

	it('keeps the fuller of two descriptions and reports the clash; refuses one entry given two producers', () => {
		const m = mergeProducerFiles(stubFiles());
		expect(m.producers['p-1'].line).toBe('Who they are, in one longer sentence than before.');
		expect(m.clashes).toEqual(["producer p-1: described in a.json and b.json; kept b.json's, the fuller"]);
		const files = stubFiles();
		files[1].data.entries['1'] = 'p-2';
		expect(mergeProducerFiles(files).failures).toEqual(['entry 1: a.json gives it to p-1 and b.json to p-2']);
	});

	it('fails an entry with no producer, a section with no line, and a pack bottle the catalogue lacks', () => {
		const files = stubFiles();
		delete files[0].data.entries['1'];
		delete files[0].data.places['Rosé'];
		const p = JSON.parse(JSON.stringify(pack));
		p.house.wines.push({ ...p.house.wines[0], id: 'w-testbot1', name: 'Nowhere', list: 'bottle', bin: '0', vintage: '1900', size: '750ml' });
		const f = buildWinelist(catalogue, files, p).failures;
		expect(f).toContain(`entry 1 (${catalogue.entries[0].name} NV) has no producer in any producer file`);
		expect(f).toContain('the place Rosé has no title and line in any producer file');
		expect(f.some((x: string) => x.startsWith("the pack's bottle Nowhere"))).toBe(true);
	});

	it('names a whole card by bin, vintage and size, every entry of that bin', () => {
		/* A half-bottle bin no bottle in the pack already carries, so the test's card is the only one on it. */
		const taken = new Set(pack.house.wines.filter((w: Raw) => w.list === 'bottle').map((w: Raw) => w.bin));
		const e = catalogue.entries.find((x: Raw) => x.bin && x.section === 'Half-bottles' && !taken.has(x.bin));
		const twins = catalogue.entries.filter((x: Raw) => x.bin === e.bin && x.vintage === e.vintage && x.size === e.size).map((x: Raw) => x.n);
		const p = JSON.parse(JSON.stringify(pack));
		p.house.wines.push({ ...p.house.wines[0], id: 'w-testbot1', name: 'A half', list: 'bottle', bin: e.bin, vintage: e.vintage, size: e.size.replace('ml', ' ml') });
		const { list, failures } = buildWinelist(catalogue, stubFiles(), p);
		expect(failures).toEqual([]);
		const mine = Object.keys(list.cards).map(Number).filter((n) => list.cards[n] === 'w-testbot1');
		expect(mine).toEqual(twins);
		expect(winelistProblems(winelistText(list), catalogue, page, p, noDash)).toEqual([]);
		expect(winelistProblems(winelistText(list), catalogue, page, pack, noDash)).toContain(`cards: entry ${twins[0]} names w-testbot1, which is no wine in the pack`);
	});

	it('reads a place to its section by the longest prefix', () => {
		const s = ['France ~ Burgundy ~ White', 'Champagne'];
		expect(sectionOfPlace('France ~ Burgundy ~ White ~ Meursault', s)).toBe('France ~ Burgundy ~ White');
		expect(sectionOfPlace('Champagne', s)).toBe('Champagne');
		expect(sectionOfPlace('Champagnes', s)).toBe('');
	});
});

describe('check-winelist', () => {
	const good = () => JSON.parse(winelistText(buildWinelist(catalogue, stubFiles(), pack).list));
	const problems = (list: Raw) => winelistProblems(JSON.stringify(list), catalogue, page, pack, noDash);

	it('refuses a price that is not the printed one, a missing entry, a dash, allergen talk and a stray place', () => {
		let l = good();
		l.entries[5][5] = l.entries[5][5] + 1;
		expect(problems(l).some((p: string) => /the price \d+ is not the catalogue's/.test(p))).toBe(true);
		l = good();
		l.entries.pop();
		expect(problems(l)[0]).toMatch(/entries; the catalogue holds/);
		l = good();
		l.producers['p-3'].tell = 'Old vines ' + String.fromCharCode(0x2014) + ' and old ways.';
		expect(problems(l).some((p: string) => p.includes('carries a dash'))).toBe(true);
		l = good();
		l.producers['p-4'].line = 'Made with no added sulphites, so it is vegan.';
		expect(problems(l).some((p: string) => p.includes('speaks of "sulphites"'))).toBe(true);
		l = good();
		l.entries[0][1] = 'Champagne';
		expect(problems(l)).toContain('entry 1: the place Champagne does not belong to its section By the Glass');
	});

	it('says plainly when a producer file is missing, and when the list is not built', () => {
		const dir = mkdtempSync(join(tmpdir(), 'oot-winelist-'));
		const r = spawnSync(process.execPath, [join(ROOT, 'tools', 'house', 'build-winelist.mjs'), '--producers', join(dir, 'producers-a.json')], { encoding: 'utf8' });
		expect(r.status).toBe(1);
		expect(r.stderr).toContain('producers-a.json is missing');
		const missing = join(dir, 'list.json');
		const c = spawnSync(process.execPath, [join(ROOT, 'tools', 'house', 'check-winelist.mjs'), '--file', missing], { encoding: 'utf8' });
		expect(c.status).toBe(1);
		expect(c.stderr).toContain('run node tools/house/build-winelist.mjs');
	});

	it('passes the shipped list, when it has been built', () => {
		if (!existsSync(OUT)) return;
		const r = spawnSync(process.execPath, [join(ROOT, 'tools', 'house', 'check-winelist.mjs')], { encoding: 'utf8' });
		expect(r.status, r.stderr).toBe(0);
	});
});
