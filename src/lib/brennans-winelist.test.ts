/**
 * The whole bottle list as its own file (the wine deep dive, 4 October 2026):
 * tools/house/build-winelist.mjs and its gate tools/house/check-winelist.mjs,
 * driven here by producer files made up for the test (one stub producer per
 * catalogue entry and a line for every section), so the suite proves the tools
 * whatever the writers have delivered. The real file is proved by running the
 * gate itself once it exists.
 *
 * The wine list review of 28 November 2026: the entries carry stable keys
 * (tools/house/carry-winelist.mjs and its ledger), the producer files map keys,
 * and a bottle that left the list is written in a past group. The stub cases
 * run on the catalogue the shipped list was read on, with the shipped pack, so
 * they hold before and after an edition; the past cases run on the real ledger
 * with the shipped pack's bottles moved and re-binned as the paste of
 * 28 November prints them.
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
const { CATALOGUE, LEDGER, OUT, buildWinelist, mergeProducerFiles, winelistText, sectionOfPlace, loadIsPast } = await tool('build-winelist.mjs');
const { winelistProblems, pageOf, MAX_BYTES } = await tool('check-winelist.mjs');
const { catalogueFile, carry, ledgerProblems, readCatalogues } = await tool('carry-winelist.mjs');
type Raw = Record<string, any>;
/* The catalogue the shipped list was read on: the one the shipped pack's cards stand on. */
const shipped: Raw = JSON.parse(readFileSync(OUT, 'utf8'));
const catalogue: Raw = JSON.parse(readFileSync(catalogueFile(shipped.readOn), 'utf8'));
const page = pageOf(catalogue, catalogueFile(shipped.readOn));
const pack: Raw = JSON.parse(readFileSync(join(ROOT, 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json'), 'utf8'));
const ledger: Raw = JSON.parse(readFileSync(LEDGER, 'utf8'));
const catalogues: Raw = readCatalogues(ledger);
const pages: Raw = Object.fromEntries(Object.entries(catalogues).map(([l, c]: [string, any]) => [l, pageOf(c, catalogueFile(c.readOn))]));
const isPast = loadIsPast();
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
		expect(list.entries[0].slice(0, 9)).toEqual([1, 'By the Glass', '', catalogue.entries[0].name, 'NV', catalogue.entries[0].price, '750ml', 'p-1', 'g']);
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

describe('the stable keys and the past (28 November 2026)', () => {
	const nov: Raw = JSON.parse(readFileSync(CATALOGUE, 'utf8'));
	const novPage = pageOf(nov, CATALOGUE);
	/* The shipped pack as the paste of 28 November prints its bottles: the seven that left filed under
	   Past bottles, the five re-binned and the Louis Michel at its new vintage. */
	const PAST = ['w-in6wnlqj', 'w-8j6qflst', 'w-q8m4sesk', 'w-iegw2pmn', 'w-t2fuz2wj', 'w-6osv9e9t', 'w-owg1ibls'];
	const BINS: Record<string, string> = { 'w-iawg2ni8': '102122', 'w-zxu9f2du': '32843', 'w-4ubmmj4a': '25555', 'w-uwpmn81x': '21923', 'w-sdqxd93y': '31303', 'w-o5v4lzkc': '26553' };
	const novPack = (): Raw => {
		const p = JSON.parse(JSON.stringify(pack));
		for (const w of p.house.wines) {
			if (PAST.includes(w.id)) w.section = 'Past bottles';
			if (BINS[w.id]) w.bin = BINS[w.id];
			if (w.id === 'w-o5v4lzkc') w.vintage = '2023';
		}
		return p;
	};
	/** Stub producer files keyed by the ledger: every key of every catalogue, one stub producer each. */
	function keyedFiles(): Array<{ file: string; data: Raw }> {
		const a: Raw = { producers: {}, entries: {}, places: {} };
		for (const [l, keys] of Object.entries(ledger.keys) as Array<[string, Raw]>) {
			for (const [n, key] of Object.entries(keys)) {
				const pk = 'p-' + (Number(n) % 300);
				a.entries[key as string] = pk;
				a.producers[pk] = { name: 'Producer ' + pk, region: 'A region', country: 'France', line: 'Who they are, in one sentence.', tell: 'What a server can say. Two sentences of it.' };
			}
			for (const e of catalogues[l].entries) if (!a.places[e.section]) a.places[e.section] = { title: e.section, line: 'What this part of the list is and how to steer through it.' };
		}
		return [{ file: 'keyed.json', data: a }];
	}
	const opts = (extra: Raw = {}) => ({ ledger, catalogues, isPast, ...extra });
	const check = (list: Raw, p: Raw, extra: Raw = {}) => winelistProblems(typeof list === 'string' ? list : JSON.stringify(list), nov, novPage, p, noDash, { ledger, catalogues, pages, isPast, ...extra });

	it('the two pastes print the house Champagne at 28 and then 30 a glass', () => {
		expect(catalogues.a.entries[0].price).toBe(28);
		expect(nov.entries[0].price).toBe(30);
		expect(nov.entries[0].name).toBe(catalogues.a.entries[0].name);
	});

	it('holds the committed ledger, and carrying 3 October onto 28 November again gives its keys', () => {
		expect(ledgerProblems(ledger, catalogues)).toEqual([]);
		const before = { ...ledger, keys: { a: ledger.keys.a }, current: 'a' };
		const r = carry(before, catalogues, 'a', 'b', ledger.rulings.filter((x: Raw) => x.catalogue === 'b'));
		expect(r.failures).toEqual([]);
		expect(r.keys).toEqual(ledger.keys.b);
		expect(r.left).toEqual(ledger.left);
		expect(Object.keys(r.left)).toHaveLength(73);
		expect(r.minted).toHaveLength(56);
	});

	it('refuses a carry that joins two vintages unless a ruling names it', () => {
		const l = JSON.parse(JSON.stringify(ledger));
		const roll = l.rulings.find((x: Raw) => x.from === 'a780');
		l.rulings = l.rulings.filter((x: Raw) => x !== roll);
		expect(ledgerProblems(l, catalogues).some((s: string) => s.includes('carries a780') && s.includes('only a ruling carries that'))).toBe(true);
		const m = JSON.parse(JSON.stringify(ledger));
		const vin = (n: number) => catalogues.b.entries.find((e: Raw) => e.n === n);
		const n1 = Object.keys(m.keys.b).map(Number).find((n) => /^a/.test(m.keys.b[n]) && vin(n).vintage !== 'NV' && vin(n + 1) && vin(n + 1).vintage !== vin(n).vintage && /^b/.test(m.keys.b[n + 1]))!;
		m.keys.b[n1 + 1] = m.keys.b[n1];
		m.keys.b[n1] = 'b' + n1;
		expect(ledgerProblems(m, catalogues).some((s: string) => s.includes('another wine') || s.includes('names rows'))).toBe(true);
	});

	it('writes the bottles that left as one past group, carded, and the gate passes it', () => {
		const p = novPack();
		const { list, failures } = buildWinelist(nov, keyedFiles(), p, opts());
		expect(failures).toEqual([]);
		expect(list.past).toHaveLength(1);
		expect(list.past[0].lastPrinted).toBe('2026-10-03');
		expect(list.past[0].entries).toHaveLength(60);
		expect(Object.values(list.past[0].cards).sort()).toEqual([...PAST, 'w-iuzjmgz4', 'w-4qmphesw'].sort());
		expect(Object.values(list.cards)).not.toContain('w-in6wnlqj');
		const text = winelistText(list);
		expect(text.indexOf('"past":[')).toBeLessThan(text.indexOf('"entries":[\n[1,'));
		expect(check(text, p)).toEqual([]);
	});

	it('refuses a served wine carded on a past row, a past wine on a live one, and a missing past row', () => {
		const p = novPack();
		const good = () => JSON.parse(winelistText(buildWinelist(nov, keyedFiles(), p, opts()).list));
		let l = good();
		const n = Object.keys(l.past[0].cards).find((k) => l.past[0].cards[k] === 'w-in6wnlqj')!;
		l.past[0].cards[n] = 'w-iawg2ni8';
		expect(check(l, p).some((s: string) => s.includes('a wine the house still serves, on a bottle that left the list'))).toBe(true);
		l = good();
		l.cards[1] = 'w-in6wnlqj';
		expect(check(l, p).some((s: string) => s.includes('a past wine, on a live row'))).toBe(true);
		l = good();
		const gone = l.past[0].entries.pop();
		expect(check(l, p).some((s: string) => s.includes(`(entry ${gone[0]},`) && s.includes('has no past row'))).toBe(true);
		l = good();
		l.past[0].entries.push(l.entries[40]);
		expect(check(l, p).some((s: string) => s.includes('is no bottle that left the list') || s.includes('still printed'))).toBe(true);
		/* A past bottle of the pack with no row: the build fails, naming it. */
		const q = novPack();
		q.house.wines.find((w: Raw) => w.id === 'w-iawg2ni8').section = 'Past bottles';
		expect(buildWinelist(nov, keyedFiles(), q, opts()).failures.some((s: string) => s.includes('past bottle Chapel Down'))).toBe(true);
	});

	it('writes a row with no producer as pending only when asked; the gate reports it and --release refuses it', () => {
		const p = novPack();
		const files = keyedFiles();
		delete files[0].data.entries[ledger.keys.b[21]];
		expect(buildWinelist(nov, files, p, opts()).failures.some((s: string) => s.startsWith('entry 21 ') && s.includes('has no producer'))).toBe(true);
		const { list, failures } = buildWinelist(nov, files, p, opts({ pending: true }));
		expect(failures).toEqual([]);
		expect(list.pending).toEqual([21]);
		expect(list.entries[20][7]).toBe('');
		expect(check(list, p)).toEqual([]);
		expect(check(list, p, { release: true })).toEqual([expect.stringMatching(/^1 live entry is pending a producer \(21\)/)]);
		const l = JSON.parse(JSON.stringify(list));
		l.entries[21][7] = '';
		expect(check(l, p).some((s: string) => s.startsWith('entry 22 ') && s.includes('no described producer'))).toBe(true);
	});

	it('rebuilds the list of 3 October from the ledger as the stub build did before it', () => {
		const files = keyedFiles();
		const { list, failures } = buildWinelist(catalogues.a, files, pack, opts());
		expect(failures).toEqual([]);
		expect(list.past).toBeUndefined();
		expect(list.entries).toHaveLength(3577);
	});
});
