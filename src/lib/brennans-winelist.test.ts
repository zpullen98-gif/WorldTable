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
 * they hold before and after an edition (they have no ledger, so the pack's
 * past wines are told to the builder and the gate and left out of both); the
 * past cases run on the real ledger with the shipped pack's bottles as the
 * paste of 28 November prints them. Since the cut of 28 November 2026 the
 * shipped pack is that list's, so the cases that rebuild the list of 3 October
 * undo those moves, each named (octPack).
 *
 * The second reading of that review: every rule the ledger and the gate
 * gained is broken here once, alone, and must be named (a rule taken out
 * of the tools must fail a case), and a carry never joins two wines that
 * print no bin.
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
const { catalogueFile, carry, ledgerProblems, leftAt, readCatalogues, sameWine } = await tool('carry-winelist.mjs');
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
/* The stub cases have no ledger, so no past group: a wine the pack files as past (the engine's isPast) is
   told to the builder and the gate, which leave it out, as the tools themselves are told. */
const STUB = { isPast };
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
		const one = buildWinelist(catalogue, stubFiles(), pack, STUB);
		expect(one.failures).toEqual([]);
		const text = winelistText(one.list);
		expect(winelistText(buildWinelist(catalogue, stubFiles(), pack, STUB).list)).toBe(text);
		expect(Buffer.byteLength(text)).toBeLessThan(MAX_BYTES);
		const list = JSON.parse(text);
		expect(list.format).toBe('oot-winelist');
		expect(list.entries).toHaveLength(catalogue.entries.length);
		expect(list.sections).toHaveLength(36);
		expect(list.entries[0].slice(0, 9)).toEqual([1, 'By the Glass', '', catalogue.entries[0].name, 'NV', catalogue.entries[0].price, '750ml', 'p-1', 'g']);
		expect(winelistProblems(text, catalogue, page, pack, noDash, STUB)).toEqual([]);
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
		const f = buildWinelist(catalogue, files, p, STUB).failures;
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
		const { list, failures } = buildWinelist(catalogue, stubFiles(), p, STUB);
		expect(failures).toEqual([]);
		const mine = Object.keys(list.cards).map(Number).filter((n) => list.cards[n] === 'w-testbot1');
		expect(mine).toEqual(twins);
		expect(winelistProblems(winelistText(list), catalogue, page, p, noDash, STUB)).toEqual([]);
		expect(winelistProblems(winelistText(list), catalogue, page, pack, noDash, STUB)).toContain(`cards: entry ${twins[0]} names w-testbot1, which is no wine in the pack`);
	});

	it('reads a place to its section by the longest prefix', () => {
		const s = ['France ~ Burgundy ~ White', 'Champagne'];
		expect(sectionOfPlace('France ~ Burgundy ~ White ~ Meursault', s)).toBe('France ~ Burgundy ~ White');
		expect(sectionOfPlace('Champagne', s)).toBe('Champagne');
		expect(sectionOfPlace('Champagnes', s)).toBe('');
	});
});

describe('check-winelist', () => {
	const good = () => JSON.parse(winelistText(buildWinelist(catalogue, stubFiles(), pack, STUB).list));
	const problems = (list: Raw) => winelistProblems(JSON.stringify(list), catalogue, page, pack, noDash, STUB);

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
	   Past bottles, the five re-binned and the Louis Michel at its new vintage. Since the cut of
	   28 November 2026 the shipped pack carries these moves itself, and novPack changes nothing. */
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
	/* The same pack as the paste of 3 October printed its bottles, for the cases that rebuild that list:
	   the moves of the cut undone, each named. The sixteen cards written for the list of 28 November are
	   left out (the older list prints none of them), the seven past bottles are back in the sections
	   they were served from, and the six bottles the newer list re-binned are at their October bins,
	   the Louis Michel at its 2022. */
	const NEW_CARDS = [
		'w-alt43yex', 'w-gnj2jh83', 'w-xxoa9z7b', 'w-0nsk1g4a', 'w-ahjozfd1', 'w-7d8ok78c', 'w-ht606i8l', 'w-vy50ws53',
		'w-saldkh5f', 'w-9vcq7far', 'w-vea2csvj', 'w-4ecs4p1h', 'w-ni8zorwr', 'w-qpuu2m6z', 'w-4m9i8mgh', 'w-ssxlfz3w'
	];
	const OCT_SECTIONS: Record<string, string> = {
		'w-in6wnlqj': 'Champagne bottles', 'w-8j6qflst': 'Large formats', 'w-q8m4sesk': 'Large formats', 'w-iegw2pmn': 'Large formats',
		'w-t2fuz2wj': 'Italy and Spain', 'w-6osv9e9t': 'Other reds', 'w-owg1ibls': 'Dessert and fortified'
	};
	const OCT_BINS: Record<string, string> = { 'w-iawg2ni8': '1628', 'w-zxu9f2du': '32844', 'w-4ubmmj4a': '22762', 'w-uwpmn81x': '2173', 'w-sdqxd93y': '29801', 'w-o5v4lzkc': '22411' };
	const octPack = (): Raw => {
		const p = JSON.parse(JSON.stringify(pack));
		p.house.wines = p.house.wines.filter((w: Raw) => !NEW_CARDS.includes(w.id));
		for (const w of p.house.wines) {
			if (OCT_SECTIONS[w.id]) w.section = OCT_SECTIONS[w.id];
			if (OCT_BINS[w.id]) w.bin = OCT_BINS[w.id];
			if (w.id === 'w-o5v4lzkc') w.vintage = '2022';
		}
		return p;
	};
	/** Stub producer files keyed by the ledger: every key of every catalogue, one stub producer each. */
	function keyedFiles(led: Raw = ledger): Array<{ file: string; data: Raw }> {
		const a: Raw = { producers: {}, entries: {}, places: {} };
		for (const [l, keys] of Object.entries(led.keys) as Array<[string, Raw]>) {
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
	/* The cases that run the whole gate many times over 3,560 rows get a minute, not the default five
	   seconds: a slow machine must not fail a rule that holds. */
	const LONG = 60_000;

	it('the shipped pack is the list of 28 November: sixteen new cards, seven past bottles, six bins and a vintage moved', () => {
		const byId = new Map<string, Raw>(pack.house.wines.map((w: Raw) => [w.id, w]));
		for (const id of NEW_CARDS) expect(byId.get(id)?.list, id).toBe('bottle');
		for (const id of PAST) expect(isPast(byId.get(id)), id).toBe(true);
		for (const id of Object.keys(OCT_SECTIONS)) expect(PAST, id).toContain(id);
		for (const [id, bin] of Object.entries(BINS)) expect(byId.get(id)?.bin, id).toBe(bin);
		expect(byId.get('w-o5v4lzkc')?.vintage).toBe('2023');
		/* And the pack of 3 October made from it holds no card the older list lacks, and none of it past but the two glass wines of 15 November. */
		const oct = octPack().house.wines;
		expect(oct).toHaveLength(pack.house.wines.length - NEW_CARDS.length);
		expect(oct.filter((w: Raw) => w.list === 'bottle' && isPast(w))).toEqual([]);
	});

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
	}, LONG);

	it('holds a carried pair to its vintage, to its size and to a printed bin or its name, each alone', () => {
		const o = { bin: '123', name: 'A Wine', vintage: '2020', size: '750ml' };
		expect(sameWine(o, { ...o })).toBe(true);
		expect(sameWine(o, { ...o, vintage: '2021' })).toBe(false);
		expect(sameWine(o, { ...o, size: '1.5L' })).toBe(false);
		expect(sameWine(o, { ...o, bin: '456' })).toBe(true);
		expect(sameWine(o, { ...o, name: 'Another Wine' })).toBe(true);
		expect(sameWine(o, { ...o, bin: '456', name: 'Another Wine' })).toBe(false);
		/* No bin is no evidence: two entries that print none are one wine only by name. */
		expect(sameWine({ ...o, bin: '' }, { ...o, bin: '' })).toBe(true);
		expect(sameWine({ ...o, bin: '' }, { ...o, bin: '', name: 'Another Wine' })).toBe(false);
		expect(sameWine({ ...o, bin: ' ' }, { ...o, bin: '', name: 'Another Wine' })).toBe(false);
		/* In the ledger itself: a row carried with its bin and its name, read at another vintage and
		   then at another size, is another wine. */
		const n = Number(Object.keys(ledger.keys.b).find((k) => /^a/.test(ledger.keys.b[k]) && catalogues.b.entries[Number(k) - 1].bin && catalogues.b.entries[Number(k) - 1].vintage !== 'NV'));
		const reread = (change: Raw) => ({ ...catalogues, b: { ...catalogues.b, entries: catalogues.b.entries.map((e: Raw) => (e.n === n ? { ...e, ...change } : e)) } });
		expect(ledgerProblems(ledger, reread({}))).toEqual([]);
		expect(ledgerProblems(ledger, reread({ vintage: '1900' })).some((s: string) => s.includes(`entry ${n} `) && s.includes('another wine'))).toBe(true);
		expect(ledgerProblems(ledger, reread({ size: '3L' })).some((s: string) => s.includes(`entry ${n} `) && s.includes('another wine'))).toBe(true);
	}, LONG);

	it('never carries a key between two wines that print no bin; a ruling may, and a wine that comes back takes its key again', () => {
		/* A third paste made up here: the Argyle by the glass (row 2, no bin, 2022, 15 a glass) gives
		   way to another 2022 sparkler at 15 with no bin, and the Cesarini Sforza that left comes back. */
		const c: Raw = JSON.parse(JSON.stringify(catalogues.b));
		c.readOn = '2026-12-31';
		const row = c.entries.find((e: Raw) => e.n === 2);
		expect([row.bin, row.vintage, row.price]).toEqual(['', '2022', 15]);
		expect(ledger.keys.b[2]).toBe('a2');
		row.name = 'Some Other House Brut Anderson Valley US';
		const back = { ...catalogues.a.entries.find((e: Raw) => e.n === 15), n: c.entries.length + 1 };
		expect(ledger.left.a15).toBe('a');
		c.entries.push(back);
		const l: Raw = JSON.parse(JSON.stringify(ledger));
		l.catalogues.c = c.readOn;
		const cats = { ...catalogues, c };
		const r = carry(l, cats, 'b', 'c', []);
		expect(r.failures).toEqual([]);
		expect(r.keys[2]).toBe('c2');
		expect(r.left.a2).toBe('b');
		expect(r.minted.map((m: Raw) => m.key)).toEqual(['c2']);
		expect(r.keys[back.n]).toBe('a15');
		expect(r.left.a15).toBeUndefined();
		expect(r.pairs.find((p: Raw) => p.key === 'a15').kind).toBe('identical, come back');
		const carried = { ...l, keys: { ...l.keys, c: r.keys }, left: r.left, current: 'c' };
		expect(ledgerProblems(carried, cats)).toEqual([]);
		/* The same carry made by hand is refused by the ledger's own check ... */
		const byHand: Raw = { ...carried, keys: { ...carried.keys, c: { ...r.keys, 2: 'a2' } } };
		byHand.left = leftAt(byHand, 'c');
		expect(ledgerProblems(byHand, cats).some((s: string) => s.includes('entry 2 ') && s.includes('carries a2') && s.includes('only a ruling carries that'))).toBe(true);
		/* ... and made by a ruling it stands. */
		const ruled = carry(l, cats, 'b', 'c', [{ catalogue: 'c', from: 'a2', to: 2, why: 'the same pour under a new label' }]);
		expect(ruled.failures).toEqual([]);
		expect(ruled.keys[2]).toBe('a2');
	}, LONG);

	it('holds the ledger rule by rule: one key a row, left as the keys give it, a ruling borne out, a key born on its own row', () => {
		const problems = (change: (l: Raw) => void): string[] => { const l = JSON.parse(JSON.stringify(ledger)); change(l); return ledgerProblems(l, catalogues); };
		expect(problems((l) => { l.keys.b[101] = l.keys.b[100]; }).some((s) => s.includes(`the key ${ledger.keys.b[100]} names rows 100 and 101`))).toBe(true);
		const gone = Object.keys(ledger.left)[0];
		expect(problems((l) => { delete l.left[gone]; })).toEqual([`left: ${gone} was last printed by a and is not in left`]);
		expect(problems((l) => { l.left[l.keys.b[1]] = 'a'; })).toEqual([`left: ${ledger.keys.b[1]} is still printed`]);
		expect(problems((l) => { l.rulings.find((x: Raw) => x.from === 'a276').to = 275; }).some((s) => s.startsWith('ruling a276 onto b 275: the ledger keys that row '))).toBe(true);
		const minted = Number(Object.keys(ledger.keys.b).find((k) => ledger.keys.b[k] === 'b' + k));
		expect(problems((l) => { l.keys.b[minted] = 'b1'; })).toContain(`catalogue b: entry ${minted} carries b1, a key of this catalogue born on another row`);
	}, LONG);

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
	}, LONG);

	/* The list of 28 November as the past cases build it, built once for the rule by rule cases below,
	   and the list of 3 October through the ledger (its rows are what a wrong past row is made from). */
	let builtNov = '';
	let builtOct = '';
	const novText = () => (builtNov ||= winelistText(buildWinelist(nov, keyedFiles(), novPack(), opts()).list));
	const octListText = () => (builtOct ||= winelistText(buildWinelist(catalogues.a, keyedFiles(), octPack(), opts()).list));

	it('holds the list to its ledger: read by the gate, needed for a past, current for a release', () => {
		const p = novPack();
		const built = novText();
		const octText = octListText();
		/* The gate reads the ledger: a ledger that fails its own check fails the list. */
		const badLedger = JSON.parse(JSON.stringify(ledger));
		delete badLedger.left[Object.keys(badLedger.left)[0]];
		expect(winelistProblems(built, nov, novPage, p, noDash, { ledger: badLedger, catalogues, pages, isPast }).some((s: string) => s.startsWith('ledger: left: '))).toBe(true);
		/* A file with a past and no ledger to hold it. */
		expect(winelistProblems(built, nov, novPage, p, noDash)).toContain('the file carries past, which only the ledger can hold; check it with the ledger');
		/* A released list is the current catalogue's: the list of 3 October passes, and is refused as a release. */
		const octProblems = (extra: Raw) => winelistProblems(octText, catalogues.a, pages.a, octPack(), noDash, { ledger, catalogues, pages, isPast, ...extra });
		expect(octProblems({})).toEqual([]);
		expect(octProblems({ release: true })).toEqual([expect.stringContaining("a released list is the ledger's current one, b (2026-11-28)")]);
	}, LONG);

	it('holds every past row: its catalogue entry, its home printing, a bottle that truly left, a producer', () => {
		const p = novPack();
		const good = (): Raw => JSON.parse(novText());
		const oct: Raw = JSON.parse(octListText());
		/* A past row is its own catalogue's entry at its printed price. */
		let l = good();
		l.past[0].entries[5][5] += 1;
		expect(check(l, p).some((s: string) => s.startsWith('past[0] entry ') && s.includes("is not the catalogue's"))).toBe(true);
		l = good();
		l.past[0].entries[5][4] = '1900';
		expect(check(l, p).some((s: string) => s.startsWith('past[0] entry ') && s.includes("bin, name, vintage or size is not the catalogue's"))).toBe(true);
		/* The home printing: the rosé magnum was printed under Large Formats (197) and under Rosé (1445); its row is 1445. */
		l = good();
		const at = l.past[0].entries.findIndex((r: Raw) => r[0] === 1445);
		expect(at).toBeGreaterThan(-1);
		l.past[0].entries[at] = oct.entries[196];
		expect(l.past[0].entries[at][0]).toBe(197);
		expect(check(l, p).some((s: string) => s.startsWith('past[0] entry 197 ') && s.includes('the home printing of its bottle is entry 1445'))).toBe(true);
		/* A bottle the list still prints is no past row: by the bottle, by the key of its printing, and by the count of what left. */
		l = good();
		l.past[0].entries.push(oct.entries[1]);
		const still = check(l, p);
		expect(still.some((s: string) => s.startsWith('past[0] entry 2 ') && s.includes('that bottle is still printed on the list of 2026-11-28'))).toBe(true);
		expect(still).toContain('past[0] entry 2: its printing 2 (a2) is still printed on the list of 2026-11-28');
		expect(still).toContain('past[0]: entry 2 is no bottle that left the list after 2026-10-03');
		/* A past row names a described producer. */
		l = good();
		l.past[0].entries[0][7] = '';
		expect(check(l, p).some((s: string) => s.startsWith('past[0] entry ') && s.includes('no described producer'))).toBe(true);
	}, LONG);

	it('holds the past group and its cards: no group, a wrong page, a group twice, a card on another wine, missing, on no row', () => {
		const p = novPack();
		const good = (): Raw => JSON.parse(novText());
		/* The group: gone altogether, on the wrong page, written twice. */
		let l = good();
		delete l.past;
		expect(check(l, p)).toContain('past: 60 bottle(s) left the list after 2026-10-03 and the file has no group for them');
		l = good();
		l.past[0].source = nov.source;
		expect(check(l, p)).toContain(`past[0]: source ${nov.source}; its catalogue's is ${catalogues.a.source}`);
		l = good();
		l.past.push(JSON.parse(JSON.stringify(l.past[0])));
		const twice = check(l, p);
		expect(twice).toContain('past[1]: a second group for 2026-10-03');
		expect(twice).toContain('past[1]: the groups run newest first');
		/* The past cards: on another wine's row, missing, on no row. */
		l = good();
		const cardN = Object.keys(l.past[0].cards).find((k) => l.past[0].cards[k] === 'w-in6wnlqj')!;
		l.past[0].cards[cardN] = 'w-t2fuz2wj';
		expect(check(l, p).some((s: string) => s.startsWith(`past[0] cards: entry ${cardN} `) && s.endsWith('another wine'))).toBe(true);
		l = good();
		delete l.past[0].cards[cardN];
		expect(check(l, p).some((s: string) => s.includes("(w-in6wnlqj) has no entry in a past group's cards"))).toBe(true);
		l = good();
		l.past[0].cards['3'] = 'w-in6wnlqj';
		expect(check(l, p)).toContain('past[0] cards: 3 is no past row of the group');
	}, LONG);

	it('never writes a bottle the list still prints as past, even where a carry missed it', () => {
		/* A carry that missed, made by hand: an unchanged bottle printed once is keyed afresh and its old key left. */
		const once = (cat: Raw, bin: string) => cat.entries.filter((e: Raw) => e.bin === bin).length === 1;
		const n = Number(Object.keys(ledger.keys.b).find((k) => { const e = catalogues.b.entries[Number(k) - 1]; return /^a/.test(ledger.keys.b[k]) && e.bin && once(catalogues.b, e.bin) && once(catalogues.a, e.bin); }));
		const l: Raw = JSON.parse(JSON.stringify(ledger));
		const old = l.keys.b[n];
		l.keys.b[n] = 'b' + n;
		l.left = leftAt(l, 'b');
		expect(l.left[old]).toBe('a');
		expect(ledgerProblems(l, catalogues)).toEqual([]);
		const p = novPack();
		const { list, failures } = buildWinelist(nov, keyedFiles(l), p, opts({ ledger: l }));
		expect(failures).toEqual([]);
		expect(list.past[0].entries).toHaveLength(60);
		expect(winelistProblems(winelistText(list), nov, novPage, p, noDash, { ledger: l, catalogues, pages, isPast })).toEqual([]);
	}, LONG);

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
		/* A pending row carries no producer, and a pending n is a live entry. */
		const withOne = JSON.parse(JSON.stringify(list));
		withOne.entries[20][7] = 'p-21';
		expect(check(withOne, p)).toContain('entry 21: pending a producer, but written with p-21');
		const stray = JSON.parse(JSON.stringify(list));
		stray.pending.push(99999);
		expect(check(stray, p)).toContain('pending: 99999 is no live entry');
		/* The file that ships never carries a pending row, with or without --release. */
		expect(check(list, p, { shipped: true })).toEqual([expect.stringMatching(/^1 live entry is pending a producer \(21\); a shipped list describes every bottle$/)]);
	}, LONG);

	it('never writes a pending build over the shipped list', () => {
		/* The producer file named here is missing, so the tool could write nothing even without the rule under test. */
		const dir = mkdtempSync(join(tmpdir(), 'oot-winelist-'));
		const r = spawnSync(process.execPath, [join(ROOT, 'tools', 'house', 'build-winelist.mjs'), '--pending', '--producers', join(dir, 'producers-a.json')], { encoding: 'utf8' });
		expect(r.status).toBe(1);
		expect(r.stderr).toContain('--pending never writes the shipped list');
		const dry = spawnSync(process.execPath, [join(ROOT, 'tools', 'house', 'build-winelist.mjs'), '--pending', '--dry', '--producers', join(dir, 'producers-a.json')], { encoding: 'utf8' });
		expect(dry.status).toBe(1);
		expect(dry.stderr).toContain('producers-a.json is missing');
	});

	it('rebuilds the list of 3 October from the ledger as the stub build did before it', () => {
		const files = keyedFiles();
		const { list, failures } = buildWinelist(catalogues.a, files, octPack(), opts());
		expect(failures).toEqual([]);
		expect(list.past).toBeUndefined();
		expect(list.entries).toHaveLength(3577);
	});
});
