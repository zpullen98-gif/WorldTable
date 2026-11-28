/**
 * The Brennan's pack, proved the way the site proves it: tools/house/check-pack.mjs
 * reads static/shared/packs/brennans-new-orleans.v1.oothouse.json through the
 * SHIPPED engine, validates it with no fatal code (every price verbatim on the
 * guide or on a committed page snapshot), holds every mark to a person, every id
 * to its prefix, every reference to an item, every drink to two or three upsells,
 * every wine to its timed lines, every child's plate to no pairing, every drill
 * stem to one record, every upsell to a drink poured where the guest sits, the edition
 * rule (one stamp, Date.parse of house.pack.builtAt, on every mark, kept note and
 * record), the coaching notes of the 22:00 edition (a description and the fixed
 * questions on every dish, drink and wine, docs/study-menus-design.md section 5),
 * no thin line, and no dash and no British spelling in the house's own American English. The
 * pack is rebuilt by the chain (parse-guide, check-parse, build-brennans,
 * validate-pack, keep-all --owner-reviewed) and never patched; this test spawns
 * the gate, reads the counts it prints and spot-checks the file.
 */
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const PACK = join(ROOT, 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json');
/* The edition is the builder's fixed stamp, read from tools/house/engine.mjs, so a fresh edition
   moves this test with it; the counts below are read from the pack the gate proves. */
const EDITION = (/export const EDITION_BUILT_AT = '([^']+)'/.exec(readFileSync(join(ROOT, 'tools', 'house', 'engine.mjs'), 'utf8')) || [])[1] || '';
const ABOUT_Q = 'Tell me about it.';
/* The 31 lineup asks about the Thanksgiving Day menu, answered as moot once the day had passed (overrides, op answer). */
const TG_ASKS = [
	'a-hn2hni1w', 'a-qeg7qs5g', 'a-dqkbri73', 'a-utpmxbes', 'a-on4kimai', 'a-9ezlldr9', 'a-gqf255d8',
	'a-htz9pr2x', 'a-l88qk2h8', 'a-x43d52t7', 'a-4deo1y7d', 'a-3zbz8oa9', 'a-dv7jnbjq', 'a-n8pn26on',
	'a-lwjqhlpa', 'a-y31pa9ej', 'a-vh81q0th', 'a-k67atc4d', 'a-yvcfuxxp', 'a-xbp284dj', 'a-frxielwb',
	'a-d1gd4ecm', 'a-m1chwhwr', 'a-soooj19p', 'a-slrub78b', 'a-q0h51gla', 'a-epjw576x', 'a-peqco2cp',
	'a-hjd6lkfm', 'a-nw3a38tw', 'a-5sqed13r'
];
/* The 40 lineup asks the wine list of 28 November 2026 answered or left moot (overrides, op answer): the glass prices and vintages it
   prints, the bins it moved, and the bottles and the pour it no longer prints; those that still ask something were filed again under new ids. */
const LIST_ASKS = [
	'a-n16yrred', 'a-fju9quzl', 'a-cmufw20a', 'a-mx451xy8', 'a-u7sljdyh', 'a-90xn7s71', 'a-gxp2ydig',
	'a-6i0bemab', 'a-fufbth1x', 'a-kqkzu4sg', 'a-0o7bjncn', 'a-2gw55p7r', 'a-j92pv8mw', 'a-djqe3aza',
	'a-qyqdwgpe', 'a-btet43a5', 'a-quj77k6z', 'a-l1hnpo9z', 'a-3a4ose59', 'a-wxwfw7vm', 'a-i6fy7uts',
	'a-fe8q3nwl', 'a-kdis6n03', 'a-sjcs33ot', 'a-x327hjp9', 'a-4takjb4p', 'a-wmuydw3o', 'a-e2edt1un',
	'a-tqsn143t', 'a-rork8pib', 'a-k7z1i3m8', 'a-097t483s', 'a-c9e5bdw9', 'a-3x055ugp', 'a-budl2ugf',
	'a-xt841756', 'a-v20zvibm', 'a-jx2fnu73', 'a-qnq2koz9', 'a-o9ed0ut7'
];
const COACH = ['How do I sell it?', 'What do guests ask?', 'What should I watch for?'];
const POUR_Q = 'How do I pour it?';
const WATCH_CLOSE = 'Allergens: read the service note and confirm at lineup.';

interface Row {
	id: string;
	name: string;
	section: string;
	price: string;
	ts: number;
	zeroProof?: boolean;
	pairing?: unknown;
	pairs?: unknown;
	upsells?: { value: string[]; by: string };
	meals?: string[];
	glass?: string;
	parts?: { value: Record<string, string> };
	say?: { value: string };
	term?: string;
	itemIds?: string[];
	kept?: Array<{ q: string; a: string; ts: number }>;
	lines?: { value: Record<string, string> };
}

function house(): Record<string, Row[]> & { pack: unknown } {
	return JSON.parse(readFileSync(PACK, 'utf8')).house;
}

describe("the Brennan's pack", () => {
	it('is shipped and passes tools/house/check-pack.mjs through the shipped engine', () => {
		expect(existsSync(PACK)).toBe(true);
		const r = spawnSync(process.execPath, [join(ROOT, 'tools', 'house', 'check-pack.mjs'), '--require-sale'], { cwd: ROOT, encoding: 'utf8' });
		expect(r.status, r.stdout + r.stderr).toBe(0);
		const h = house() as unknown as Record<string, Row[]>;
		const notes = (q: string) => (['dishes', 'cocktails', 'wines'] as const).reduce((n, l) => n + h[l].filter((row) => (row.kept || []).some((k) => k.q === q)).length, 0);
		const kept = (['dishes', 'cocktails', 'wines'] as const).reduce((n, l) => n + h[l].reduce((m, row) => m + (row.kept || []).length, 0), 0);
		const timed = h.wines.filter((w) => w.lines).length;
		expect(r.stdout).toMatch(/\d+ marks all by person/);
		expect(r.stdout).toContain(`notes ${[ABOUT_Q, ...COACH, POUR_Q].map(notes).join('/')} under the five fixed questions, ${kept} kept notes in all; 0 thin lines`);
		/* The Thanksgiving edition of 22 November files the sixteen dishes of the Thanksgiving Day menu (70 to 86); none of their pairings takes a coffee. */
		expect(r.stdout).toContain('86 dishes, 32 cocktails (6 spirit-free, 10 pairings on a coffee)');
		/* The five-star card edition of 2 November gave all 271 wines a sale and the November edition's four new glass wines carry one too (275), as do the two new pours of the Dinner Pairing Wines sheet of 22 November (277) and the sixteen bottle cards written for the wine list of 28 November (293), so the gate runs with --require-sale and a wine without one fails it. */
		const withSale = h.wines.filter((w) => typeof w.lines?.value.sale === 'string' && w.lines.value.sale.trim()).length;
		expect(withSale).toBe(h.wines.length);
		expect(r.stdout).toContain(`${h.wines.length} wines (${timed} with timed lines, 293 with a sale, required)`);
		expect(r.stdout).toContain('0 banned lines');
		expect(timed).toBe(h.wines.length);
		expect(r.stdout).toContain(`${h.lexicon.length} terms, ${h.scenarios.length} scenarios, ${h.mixUps.length} mix-ups, ${h.mustKnows.length} must-knows`);
		expect(r.stdout).toContain(`${h.askAtLineup.length} to ask`);
		expect(r.stdout).toContain(`edition ${EDITION}`);
		expect(r.stdout).toContain('0 fatal');
	}, 60_000); /* check-pack proves the 3.6 MB pack through the shipped engine: well past the 5 s default on a busy machine */

	it('carries the edition stamp on the pack and on every record', () => {
		const h = house();
		const stamp = Date.parse(EDITION);
		expect(h.pack).toEqual({ id: 'brennans-new-orleans', builtBy: 'claude-code', builtAt: EDITION, version: 1 });
		for (const list of ['tastings', 'dishes', 'wines', 'cocktails', 'lexicon', 'scenarios', 'mixUps', 'mustKnows', 'askAtLineup', 'disputes']) {
			for (const row of h[list]) expect(row.ts, `${list} ${row.id}`).toBe(stamp);
		}
	});

	it('gives every drink two or three kept upsells, and a spirit-free drink only spirit-free ones', () => {
		const h = house();
		const byId = new Map(h.cocktails.map((c) => [c.id, c]));
		for (const c of h.cocktails) {
			expect(c.upsells, c.name).toBeTruthy();
			const ups = c.upsells!.value;
			expect(c.upsells!.by).toBe('person');
			expect(ups.length).toBeGreaterThanOrEqual(2);
			expect(ups.length).toBeLessThanOrEqual(3);
			for (const id of ups) {
				const to = byId.get(id);
				expect(to, `${c.name} upsells ${id}`).toBeTruthy();
				if (c.zeroProof) expect(to!.zeroProof, `${c.name} upsells a drink with alcohol`).toBe(true);
			}
		}
	});

	it('gives no two dishes one sauce or sides stem, and no two items or terms one say', () => {
		const h = house();
		const fold = (t: string) => t.trim().toLowerCase().replace(/\s+/g, ' ');
		const clash = (rows: Array<[string, string, string]>) => {
			const seen = new Map<string, string>();
			for (const [answer, stem, where] of rows) {
				const f = fold(stem);
				if (!f || f.includes(fold(answer))) continue;
				const before = seen.get(f);
				expect(before === undefined || before === fold(answer), `${where} shares its stem "${stem}"`).toBe(true);
				seen.set(f, fold(answer));
			}
		};
		for (const part of ['sauce', 'sides']) {
			const rows = h.dishes.map((d): [string, string, string] => [d.name, d.parts?.value[part] ?? '', `${d.name} parts.${part}`]);
			for (const [, stem, where] of rows) expect(/\b(not printed|nothing printed)\b|^ask the (kitchen|bar)\b/i.test(stem), `${where} is filler`).toBe(false);
			clash(rows);
		}
		const items = ([] as Row[]).concat(h.dishes, h.wines, h.cocktails);
		clash(
			items
				.map((r): [string, string, string] => [r.name, r.say?.value ?? '', `${r.name} say`])
				.concat(h.lexicon.map((t): [string, string, string] => [t.term ?? '', t.say?.value ?? '', `term ${t.term} say`]))
		);
		expect(h.cocktails.find((c) => c.name === 'Classic Sazerac')!.glass).toBe('');
	});

	it('upsells only to a drink poured where the guest sits', () => {
		const h = house();
		const seat: Record<string, string> = { 'Breakfast & lunch': 'breakfast', 'Breakfast tasting': 'breakfast', Dinner: 'dinner', 'Dinner tasting': 'dinner', 'Roost Bar & Lounge': 'bar', "Bubbles at Brennan's": 'bar' };
		const seats = (r: Row) => new Set((r.meals ?? []).map((m) => seat[m] ?? m));
		const byId = new Map(h.cocktails.map((c) => [c.id, c]));
		for (const c of h.cocktails) {
			for (const id of c.upsells!.value) {
				const there = seats(byId.get(id)!);
				for (const s of seats(c)) expect(there.has(s), `${c.name} upsells ${byId.get(id)!.name}, not poured at ${s}`).toBe(true);
			}
		}
	});

	it('links a term only to the items it describes', () => {
		const h = house();
		const id = (name: string) => ([] as Row[]).concat(h.dishes, h.cocktails).find((r) => r.name === name)!.id;
		const term = (t: string) => h.lexicon.find((x) => x.term === t)!;
		expect(term('Chicory').itemIds).not.toContain(id('Congregation Single-Origin Coffee'));
		expect(term('Chicory').itemIds).toContain(id('New Orleans-Style Coffee with Chicory'));
		expect(term("Peychaud's").itemIds).toContain(id('Classic Sazerac'));
		expect([...term('Lillet Blanc').itemIds!].sort()).toEqual([id('To Each His Own'), id('Riviera')].sort());
		expect(term('Brabant potatoes').say!.value).toBe('bra-BAHNT');
	});

	it('gives every dish, drink and wine its description and its coaching notes, each once and stamped with the edition', () => {
		const h = house();
		const stamp = Date.parse(EDITION);
		const words = (t: string) => (t.match(/[A-Za-z0-9\u00C0-\u024F'\u2019]+(?:-[A-Za-z0-9\u00C0-\u024F'\u2019]+)*/g) ?? []).length;
		for (const list of ['dishes', 'cocktails', 'wines']) {
			for (const row of h[list]) {
				const kept = row.kept ?? [];
				const of = (q: string) => kept.filter((k) => k.q === q);
				expect(of(ABOUT_Q).length, `${row.name} about`).toBe(1);
				const about = of(ABOUT_Q)[0].a;
				expect(words(about), `${row.name} about length`).toBeGreaterThanOrEqual(120);
				expect(words(about), `${row.name} about length`).toBeLessThanOrEqual(200);
				for (const q of COACH) expect(of(q).length, `${row.name} ${q}`).toBe(1);
				expect(of('What should I watch for?')[0].a.endsWith(WATCH_CLOSE), `${row.name} watch closes`).toBe(true);
				expect(of('What do guests ask?')[0].a.startsWith('Asked: '), `${row.name} asked shape`).toBe(true);
				if (list === 'wines') expect(of(POUR_Q).length, `${row.name} pour`).toBe(1);
				if (list === 'dishes') expect(of(POUR_Q).length, `${row.name} pour`).toBe(0);
				for (const k of kept) {
					expect(k.ts, `${row.name} ${k.q} stamp`).toBe(stamp);
					expect(/[\u2013\u2014]|\s--\s/.test(k.a), `${row.name} ${k.q} dash`).toBe(false);
				}
			}
		}
	});

	it('leaves no timed line under its floor and keeps every wine part short and its own', () => {
		const h = house();
		const words = (t: string) => (t.match(/[A-Za-z0-9\u00C0-\u024F'\u2019]+(?:-[A-Za-z0-9\u00C0-\u024F'\u2019]+)*/g) ?? []).length;
		const floor: Record<string, number> = { s10: 12, s20: 25, s45: 60 };
		const cap: Record<string, number> = { s10: 25, s20: 50, s45: 110 };
		for (const list of ['dishes', 'cocktails', 'wines']) {
			for (const row of h[list]) {
				const lines = row.lines?.value ?? {};
				for (const k of Object.keys(floor)) {
					if (!lines[k]) continue;
					expect(words(lines[k]), `${row.name} ${k}`).toBeGreaterThanOrEqual(floor[k]);
					expect(words(lines[k]), `${row.name} ${k}`).toBeLessThanOrEqual(cap[k]);
				}
			}
		}
		for (const w of h.wines as Array<Row & { profile?: { value: string } }>) {
			for (const [k, v] of Object.entries(w.parts!.value)) expect(words(v), `${w.name} parts.${k}`).toBeLessThanOrEqual(14);
			expect(/\$\d/.test(w.profile!.value), `${w.name} profile carries a price`).toBe(false);
		}
		expect(h.dishes.find((d) => d.name === 'Thick-Cut Bacon')!.lines!.value.s10).toBe('Thick-cut bacon, meaty in the middle and crisp at the edges, a great add to any breakfast.');
	});

	it('retires the summer list with a tombstone for each drink, a millisecond after the edition that last carried it', () => {
		const h = house() as unknown as { cocktails: Row[]; removed: Record<string, number> };
		const summer = ['Dulce de Leche', 'Catalina Island', 'Black Hills', 'Yellowstone', 'Miami Beach', 'Niagara Falls', 'Havana', 'Acapulco'];
		for (const name of summer) expect(h.cocktails.some((c) => c.name === name), name).toBe(false);
		const drinks = Object.keys(h.removed).filter((k) => k.startsWith('b-'));
		expect(drinks.length).toBe(summer.length);
		// The coffee price question was reworded on 19 October and filed under a new id; its old id is
		// tombstoned a millisecond after the 12:30 edition of 18 October, the last that carried it.
		// The Dinner Pairing Wines sheet of 22 November answered nine asks about the dinner tasting's pours (the
		// three November asks whether each was still the pour, and six older ones about the same pours); each is
		// tombstoned a millisecond after the 15:04 edition of 15 November, the last that carried it.
		const answered = Date.parse('2026-11-15T15:04:00.000Z') + 1;
		const later: Record<string, number> = { 'a-yezg582z': Date.parse('2026-10-18T12:30:00.000Z') + 1 };
		for (const id of ['a-i0xmkjmb', 'a-5qm2ecea', 'a-v7ljbixx', 'a-gxqu6dvb', 'a-887mv8rn', 'a-fx9kevzn', 'a-tpo4g6zd', 'a-99urxp3r', 'a-s8h2463w']) later[id] = answered;
		// Thanksgiving Day 2026 passed: the edition of 28 November retired its menu and answered the 31 lineup asks
		// about the day as moot, each tombstoned a millisecond after the 10:24 edition of 22 November, the last that
		// carried them.
		const thanksgiving = Date.parse('2026-11-22T10:24:00.000Z') + 1;
		for (const id of ['t-o18d70db', ...TG_ASKS]) later[id] = thanksgiving;
		// The wine list edition of 28 November answered 40 asks from the Binwise list pasted that day, each tombstoned a
		// millisecond after the 00:01 edition of 28 November, the last that carried them.
		const wineList = Date.parse('2026-11-28T00:01:00.000Z') + 1;
		for (const id of LIST_ASKS) later[id] = wineList;
		for (const id of LIST_ASKS) expect(h.removed[id], id).toBe(wineList);
		for (const k of Object.keys(h.removed)) expect(h.removed[k], k).toBe(later[k] ?? Date.parse('2026-10-03T22:00:00.000Z') + 1);
		for (const name of ['Flamingo', 'Birdcage', 'Spoonbill', 'Personality', 'Oh! What It Seemed to Be']) expect(h.cocktails.some((c) => c.name === name), name).toBe(true);
	});

	it("reads a note's price off the wine list as the price rule does: the figure that closes an entry, never a bin or a vintage", async () => {
		const engine = await import(/* @vite-ignore */ pathToFileURL(join(ROOT, 'tools', 'house', 'engine.mjs')).href);
		const lib = engine.loadEngine((m: string) => {
			throw new Error(m);
		});
		/* One entry as the Binwise paste prints it: the bin, the wine, the vintage, the price, and the line that closes it. */
		const entry = 'Source: a list whose entries print the bottle price in dollars.\n\n18231\nInglenook\n2010\n360\n \n';
		const read: string = engine.dollarReading(entry);
		expect(read).toContain('360 $360');
		expect(read).not.toContain('$18231');
		expect(read).not.toContain('$2010');
		/* The Kokomo by the glass: the list of 28 November 2026 prints 2022 and then 23, and no other page prints that
		   price. The raw pages print the figure bare, so before noteHay took the dollar reading a note could not say $23. */
		const raw = (engine.pageFiles() as string[]).map((f) => readFileSync(f, 'utf8')).join('\n');
		expect(lib.onPage(raw, '$23')).toBe(false);
		const hay: string = engine.noteHay();
		expect(lib.onPage(hay, '$23')).toBe(true);
		/* The bin of the entry below it, 23632, and a vintage, 2022, close no entry: neither is a price a note may quote. */
		expect(lib.onPage(hay, '$23632')).toBe(false);
		expect(lib.onPage(hay, '$2022')).toBe(false);
		/* The note gate itself: a shipped wine's description is refused for a figure that is only a bin, and passes on a printed price. */
		const h = JSON.parse(readFileSync(PACK, 'utf8')).house;
		const one = (price: string) => {
			const w = JSON.parse(JSON.stringify(h.wines.find((x: Row) => (x.kept || []).some((k) => k.q === ABOUT_Q))));
			const note = w.kept.find((k: { q: string }) => k.q === ABOUT_Q);
			note.a = note.a + ' It is ' + price + ' on the list.';
			return (engine.noteProblems({ ...h, wines: [w], dishes: [], cocktails: [] }, hay, lib.onPage) as string[]).filter((x) => x.includes('the price '));
		};
		expect(one('$23')).toEqual([]);
		expect(one('$23632').join('\n')).toContain('the price $23632 is printed nowhere in the guide or the page snapshots');
	}, 60_000);

	it("never pairs a child's plate", () => {
		const kids = house().dishes.filter((d) => d.section.startsWith("Children's"));
		expect(kids.length).toBe(8);
		for (const d of kids) {
			expect(d.pairing).toBeUndefined();
			expect(d.pairs).toBeUndefined();
			expect(d.price).toBe('$25.00');
		}
	});
});
