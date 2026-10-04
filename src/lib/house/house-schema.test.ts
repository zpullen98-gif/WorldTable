import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
	BUILD_STEPS,
	COCKTAIL_MARKS,
	COCKTAIL_PARTS,
	DISH_MARKS,
	DISH_PARTS,
	HOUSE_DB,
	HOUSE_FORMAT,
	HOUSE_INDEX_KEY,
	HOUSE_LISTS,
	HOUSE_MAX_BYTES,
	HOUSE_SCHEMA_VERSION,
	HOUSE_STORE,
	ID_PREFIXES,
	ITEM_KINDS,
	KEYS,
	LINE_CAPS,
	LIST_MAX,
	MARK_FIELDS,
	OPTIONAL_KEYS,
	OPTIONAL_LISTS,
	optionalList,
	houseRows,
	PRINCIPLES,
	PROSE_MAX,
	WINE_MARKS,
	WINE_PARTS,
	emptyHouse,
	isMark,
	isNote,
	mintId
} from './house-schema';
import type { House, HouseList, Lines, Mark } from './house-schema';

/**
 * The House schema is data three apps and a pack file will carry, so what is
 * under test is the shape: every key of every interface walked against the
 * client's FORBIDDEN_KEY (copied here literally AND read back out of the
 * client, so a change there fails here), the fixture parsed and walked list
 * by list, mark by mark and id by id, the word caps on the timed lines, and
 * the id mint. The fixture is also the port check's input, so it is pinned
 * dash-free and allergen-free here before any port exists.
 *
 * The em dash is never spelled out in this file: the gate regex is built from
 * escapes, so the suite's own dash sweep finds nothing here.
 */

const here = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const FIXTURE_PATH = here('./fixtures/house-min.json');
const SCHEMA_PATH = here('./house-schema.ts');
const TEST_PATH = here('./house-schema.test.ts');
const CLIENT_PATH = here('../../../static/shared/oot-maitre.js');

/** The client's rule, copied literally from static/shared/oot-maitre.js. The test below proves the copy is current. */
const FORBIDDEN_KEY = /allerg|contain|free|safe|suitab|vegan|nut/i;

/** Every dash spelling the publish gate counts, plus the en dash, built from escapes. */
const DASH = new RegExp(['\\u2014', '\\u2013', '&' + 'mdash;', '&#' + '8212;', '&#' + 'x2014;', ' ' + '-- '].join('|'));

/** The client's ALLERGEN_TALK and the words a fixture must never carry. */
const ALLERGEN_WORD = /allerg|intoleran|gluten|vegan|peanut|shellfish|dairy|lactose|\bnuts?\b/i;

const ID_SHAPE = /^[a-z]-[0-9a-z]{8}$/;

const fixtureText = readFileSync(FIXTURE_PATH, 'utf8');
const fixture = JSON.parse(fixtureText) as House;

/** Every key at every depth, so a forbidden key cannot hide inside a mark's value. */
function keysDeep(v: unknown, out: string[] = []): string[] {
	if (Array.isArray(v)) v.forEach((x) => keysDeep(x, out));
	else if (v && typeof v === 'object') {
		for (const [k, x] of Object.entries(v)) {
			out.push(k);
			keysDeep(x, out);
		}
	}
	return out;
}

const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

/** The keys an object may carry, and the keys it must. */
function expectKeys(obj: object, allowed: readonly string[], required: readonly string[], label: string) {
	const keys = Object.keys(obj);
	for (const k of keys) expect(allowed, `${label}: ${k} is not a key of the shape`).toContain(k);
	for (const k of required) expect(keys, `${label}: ${k} is missing`).toContain(k);
}

const notMarks = (all: readonly string[], marks: readonly string[]) => all.filter((k) => !marks.includes(k) && k !== 'kept');

/** One list of the fixture as plain rows, so a walk over MARK_FIELDS can read any field by name. */
type Row = Record<string, unknown> & { id: string };
const rows = (list: HouseList): Row[] => fixture[list] as unknown as Row[];

/** A seeded random source, so a collision test is the same on every run. */
function seeded(seed: number): () => number {
	let s = seed >>> 0;
	return () => {
		s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
		return s / 4294967296;
	};
}

describe('the constants', () => {
	it('say what the plan says', () => {
		expect(HOUSE_FORMAT).toBe('oot-house');
		expect(HOUSE_SCHEMA_VERSION).toBe(1);
		expect(HOUSE_INDEX_KEY).toBe('oot-houses-v1');
		expect(HOUSE_DB).toBe('oot-house');
		expect(HOUSE_STORE).toBe('houses');
		expect(HOUSE_MAX_BYTES).toBe(8 * 1024 * 1024);
		expect(LINE_CAPS).toEqual({ s10: 25, s20: 50, s45: 110 });
		expect(PROSE_MAX).toBe(4000);
		expect(LIST_MAX).toBe(10000);
		expect(PRINCIPLES).toEqual(['acid', 'fat', 'weight', 'sweet', 'heat', 'tannin', 'salt', 'bridge', 'method']);
		expect(BUILD_STEPS).toEqual(['card', 'menus', 'filed', 'formula', 'pairings', 'wines', 'lexicon', 'scenarios']);
		expect(ITEM_KINDS).toEqual(['dish', 'wine', 'cocktail']);
	});

	it('give the three kinds the same five parts under different labels', () => {
		for (const parts of [DISH_PARTS, COCKTAIL_PARTS, WINE_PARTS]) {
			expect(Object.keys(parts)).toEqual([...KEYS.FormulaParts]);
			for (const label of Object.values(parts)) expect(label).not.toMatch(DASH);
		}
		expect(WINE_PARTS).toEqual({
			main: 'grape and region',
			technique: 'how it is made',
			sauce: 'the profile',
			sides: 'what it goes with',
			taste: 'how it tastes'
		});
	});

	it('list the eleven lists, the marks per kind with parts and lines on wines too, and one prefix per list', () => {
		expect(HOUSE_LISTS).toEqual(['tastings', 'dishes', 'wines', 'cocktails', 'lexicon', 'scenarios', 'mixUps', 'mustKnows', 'askAtLineup', 'disputes', 'videos']);
		expect(OPTIONAL_LISTS).toEqual(['videos']);
		expect(MARK_FIELDS.videos).toEqual([]);
		for (const marks of [DISH_MARKS, WINE_MARKS, COCKTAIL_MARKS]) {
			for (const m of ['say', 'guest', 'why', 'pairs', 'origin', 'parts', 'lines']) expect(marks).toContain(m);
		}
		expect(DISH_MARKS).toContain('pairing');
		expect(WINE_MARKS).toEqual(expect.arrayContaining(['profile', 'goesWith', 'firstPickIds', 'serve', 'parts', 'lines']));
		expect(COCKTAIL_MARKS).toContain('upsells');
		expect(Object.keys(MARK_FIELDS).sort()).toEqual([...HOUSE_LISTS, 'house'].sort());
		expect(Object.keys(ID_PREFIXES).sort()).toEqual([...HOUSE_LISTS, 'house'].sort());
		const prefixes = Object.values(ID_PREFIXES);
		expect(new Set(prefixes).size).toBe(prefixes.length);
		for (const p of prefixes) expect(p).toMatch(/^[a-z]-$/);
		expect(ID_PREFIXES).toMatchObject({ house: 'h-', dishes: 'd-', wines: 'w-', cocktails: 'b-', tastings: 't-', lexicon: 'x-', scenarios: 's-', mixUps: 'm-', mustKnows: 'k-', videos: 'v-' });
	});
});

describe('KEYS against the client', () => {
	it('copies the very regex the client refuses keys with', () => {
		const src = readFileSync(CLIENT_PATH, 'utf8');
		const line = src.match(/var FORBIDDEN_KEY = (\/.*?\/[gimsuy]*);/);
		expect(line, 'oot-maitre.js must still declare FORBIDDEN_KEY as a literal').not.toBeNull();
		const theirs = new Function('return ' + (line as RegExpMatchArray)[1])() as RegExp;
		expect(FORBIDDEN_KEY.source).toBe(theirs.source);
		expect(FORBIDDEN_KEY.flags).toBe(theirs.flags);
	});

	it('names every interface, and no key of any of them matches the client rule', () => {
		expect(Object.keys(KEYS).sort()).toEqual(
			[
				'Mark', 'Note', 'FormulaParts', 'Lines', 'Pairing', 'MealPrice', 'ItemBase', 'HouseDish', 'HouseWine', 'HouseCocktail',
				'PairingBottles', 'BottlePick', 'TastingCourse', 'Tasting', 'LexiconTerm', 'Scenario', 'MixUp', 'MustKnow', 'AskAtLineup', 'DisputeSide', 'Dispute',
				'HouseMeal', 'HouseSource', 'HouseVideo', 'PackStamp', 'House', 'HouseIndex', 'HouseStub'
			].sort()
		);
		let walked = 0;
		for (const [shape, keys] of Object.entries(KEYS)) {
			expect(keys.length, shape).toBeGreaterThan(0);
			expect(new Set(keys).size, `${shape} lists a key twice`).toBe(keys.length);
			for (const k of keys) {
				walked++;
				expect(k, `${shape}.${k} would be refused by the client`).not.toMatch(FORBIDDEN_KEY);
			}
		}
		expect(walked).toBeGreaterThan(100);
	});

	it('keeps the mark and note shapes the wings keep', () => {
		expect(KEYS.Mark).toEqual(['value', 'by', 'ts', 'model']);
		expect(KEYS.Note).toEqual(['q', 'a', 'ts', 'model']);
		expect(KEYS.Lines).toEqual(['s10', 's20', 's45']);
		expect(Object.keys(LINE_CAPS)).toEqual([...KEYS.Lines]);
	});

	it('lists the marks and the lists as keys of their shapes', () => {
		for (const m of DISH_MARKS) expect(KEYS.HouseDish).toContain(m);
		for (const m of WINE_MARKS) expect(KEYS.HouseWine).toContain(m);
		for (const m of COCKTAIL_MARKS) expect(KEYS.HouseCocktail).toContain(m);
		for (const l of HOUSE_LISTS) expect(KEYS.House).toContain(l);
		for (const m of MARK_FIELDS.house) expect(KEYS.House).toContain(m);
		for (const k of KEYS.ItemBase) {
			expect(KEYS.HouseDish).toContain(k);
			expect(KEYS.HouseWine).toContain(k);
			expect(KEYS.HouseCocktail).toContain(k);
		}
	});
});

describe('the three files', () => {
	it('carry no dash in any spelling and no carriage return', () => {
		for (const p of [SCHEMA_PATH, FIXTURE_PATH, TEST_PATH]) {
			const text = readFileSync(p, 'utf8');
			expect(text, p).not.toMatch(DASH);
			expect(text.includes('\r'), `${p} carries a carriage return`).toBe(false);
		}
	});

	it('keep every regex literal in the schema ASCII, for the port', () => {
		const src = readFileSync(SCHEMA_PATH, 'utf8');
		expect(/[^\x00-\x7f]/.test(src), 'the schema must be pure ASCII').toBe(false);
	});
});

describe('the fixture', () => {
	it('parses, is a House of this format and version, and is well under the cap', () => {
		expect(fixture.format).toBe(HOUSE_FORMAT);
		expect(fixture.version).toBe(HOUSE_SCHEMA_VERSION);
		expect(Buffer.byteLength(fixtureText)).toBeLessThan(HOUSE_MAX_BYTES);
		expect(Object.keys(fixture).sort()).toEqual([...KEYS.House].sort());
	});

	it('carries no allergen word and no forbidden key, anywhere', () => {
		expect(fixtureText).not.toMatch(ALLERGEN_WORD);
		for (const k of keysDeep(fixture)) expect(k).not.toMatch(FORBIDDEN_KEY);
	});

	it('has every list, with what the brief asked for in each', () => {
		for (const l of HOUSE_LISTS) expect(Array.isArray(fixture[l]), l).toBe(true);
		expect(fixture.tastings).toHaveLength(1);
		expect(fixture.tastings[0].courses).toHaveLength(2);
		expect(fixture.dishes).toHaveLength(2);
		expect(fixture.wines).toHaveLength(1);
		expect(fixture.cocktails).toHaveLength(2);
		expect(fixture.lexicon).toHaveLength(2);
		expect(fixture.scenarios).toHaveLength(1);
		expect(fixture.mixUps).toHaveLength(1);
		expect(fixture.mustKnows).toHaveLength(1);
		expect(fixture.askAtLineup).toHaveLength(1);
		expect(fixture.disputes).toHaveLength(1);
		expect(fixture.removed).toEqual({});
		expect(Object.keys(fixture.build).sort()).toEqual([...BUILD_STEPS].sort());
		for (const step of BUILD_STEPS) expect(Number.isFinite(fixture.build[step])).toBe(true);
		expect(fixture.began).toBe('pack');
		expect(fixture.pack).toBeDefined();
	});

	it('keeps the card and every nested shape within its keys', () => {
		for (const m of fixture.meals) expectKeys(m, KEYS.HouseMeal, KEYS.HouseMeal, 'meal');
		for (const s of fixture.sources) expectKeys(s, KEYS.HouseSource, KEYS.HouseSource, 'source');
		expectKeys(fixture.pack!, KEYS.PackStamp, KEYS.PackStamp, 'pack');
		expect(isMark(fixture.history)).toBe(true);
		for (const t of fixture.tastings) {
			expectKeys(t, KEYS.Tasting, KEYS.Tasting, t.id);
			for (const c of t.courses) expectKeys(c, KEYS.TastingCourse, KEYS.TastingCourse, `${t.id} course ${c.n}`);
		}
		for (const d of fixture.dishes) expectKeys(d, KEYS.HouseDish, notMarks(KEYS.HouseDish, DISH_MARKS), d.id);
		for (const w of fixture.wines) expectKeys(w, KEYS.HouseWine, notMarks(KEYS.HouseWine, [...WINE_MARKS, ...OPTIONAL_KEYS.HouseWine]), w.id);
		for (const c of fixture.cocktails) expectKeys(c, KEYS.HouseCocktail, notMarks(KEYS.HouseCocktail, COCKTAIL_MARKS), c.id);
		for (const x of fixture.lexicon) expectKeys(x, KEYS.LexiconTerm, notMarks(KEYS.LexiconTerm, MARK_FIELDS.lexicon), x.id);
		for (const s of fixture.scenarios) expectKeys(s, KEYS.Scenario, notMarks(KEYS.Scenario, MARK_FIELDS.scenarios), s.id);
		for (const m of fixture.mixUps) expectKeys(m, KEYS.MixUp, notMarks(KEYS.MixUp, MARK_FIELDS.mixUps), m.id);
		for (const k of fixture.mustKnows) expectKeys(k, KEYS.MustKnow, notMarks(KEYS.MustKnow, MARK_FIELDS.mustKnows), k.id);
		for (const a of fixture.askAtLineup) expectKeys(a, KEYS.AskAtLineup, ['id', 'question', 'askWhom', 'itemIds', 'ts'], a.id);
		for (const u of fixture.disputes) {
			expectKeys(u, KEYS.Dispute, ['id', 'field', 'a', 'b', 'ts'], u.id);
			expectKeys(u.a, KEYS.DisputeSide, KEYS.DisputeSide, `${u.id}.a`);
			expectKeys(u.b, KEYS.DisputeSide, KEYS.DisputeSide, `${u.id}.b`);
		}
	});

	it('has one dish with every mark kept, one with nothing but the plain fields, and the two cocktails the brief asked for', () => {
		const [full, plain] = fixture.dishes;
		expect(Object.keys(full).sort()).toEqual([...KEYS.HouseDish].sort());
		expect(Object.keys(plain).sort()).toEqual(notMarks(KEYS.HouseDish, DISH_MARKS).sort());
		expect(full.signature).toBe(true);
		expect(full.kept).toHaveLength(1);
		for (const n of full.kept!) expect(isNote(n)).toBe(true);
		const [wine] = fixture.wines;
		for (const m of ['profile', 'goesWith', 'firstPickIds', 'serve', 'parts', 'lines'] as const) expect(isMark(wine[m]), m).toBe(true);
		const [withSpec, zero] = fixture.cocktails;
		expect(withSpec.spec.length).toBeGreaterThan(0);
		expect(withSpec.zeroProof).toBe(false);
		expect(isMark(withSpec.lines)).toBe(true);
		expect(zero.zeroProof).toBe(true);
		expect(zero.spec).toEqual([]);
		expect(zero.lines).toBeUndefined();
		expect(Object.keys(zero).sort()).toEqual(notMarks(KEYS.HouseCocktail, COCKTAIL_MARKS).sort());
	});

	it('kinds match their lists and every price is a string as printed', () => {
		for (const kind of ITEM_KINDS) {
			const list = { dish: fixture.dishes, wine: fixture.wines, cocktail: fixture.cocktails }[kind];
			for (const item of list) {
				expect(item.kind).toBe(kind);
				expect(item.house).toBe(fixture.id);
				expect(typeof item.price).toBe('string');
				expect(item.prices.length).toBeGreaterThan(0);
				for (const p of item.prices) expectKeys(p, KEYS.MealPrice, KEYS.MealPrice, `${item.id} price`);
				for (const p of item.prices) expect(typeof p.printed).toBe('string');
				expect(typeof item.serviceNote).toBe('string');
				expect(Number.isFinite(item.ts)).toBe(true);
			}
		}
		for (const w of fixture.wines) {
			expect(typeof w.glass).toBe('string');
			expect(typeof w.bottle).toBe('string');
		}
		for (const t of fixture.tastings) expect(typeof t.price).toBe('string');
	});

	it('every mark is a mark, kept by a person, and every parts and lines value has the five and the three', () => {
		let seen = 0;
		const check = (owner: string, field: string, v: unknown) => {
			if (v === undefined) return;
			seen++;
			expect(isMark(v), `${owner}.${field}`).toBe(true);
			expect((v as Mark<unknown>).by, `${owner}.${field} is not kept`).toBe('person');
			if (field === 'parts') expect(Object.keys((v as Mark<object>).value).sort()).toEqual([...KEYS.FormulaParts].sort());
			if (field === 'lines') expect(Object.keys((v as Mark<object>).value).sort()).toEqual([...KEYS.Lines].sort());
			if (field === 'pairing') {
				const p = (v as Mark<Record<string, unknown>>).value;
				expect(Object.keys(p).sort()).toEqual(KEYS.Pairing.filter((k) => !(OPTIONAL_KEYS.Pairing as readonly string[]).includes(k)).sort());
				for (const pr of p.principles as string[]) expect(PRINCIPLES).toContain(pr);
			}
		};
		for (const field of MARK_FIELDS.house) check('house', field, fixture[field]);
		for (const list of HOUSE_LISTS) {
			const fields: readonly string[] = MARK_FIELDS[list];
			for (const item of rows(list)) {
				for (const field of fields) check(item.id, field, item[field]);
			}
		}
		expect(seen).toBeGreaterThan(30);
	});

	it('keeps every timed line under its cap and never empty', () => {
		let lines = 0;
		for (const list of ['dishes', 'wines', 'cocktails'] as const) {
			for (const item of fixture[list]) {
				const mark = item.lines as Mark<Lines> | undefined;
				if (!mark) continue;
				lines++;
				for (const key of KEYS.Lines) {
					const n = wordCount(mark.value[key]);
					expect(n, `${item.id} ${key}`).toBeGreaterThan(0);
					expect(n, `${item.id} ${key} over ${LINE_CAPS[key]} words`).toBeLessThanOrEqual(LINE_CAPS[key]);
				}
			}
		}
		expect(lines).toBe(3);
		for (const s of keysDeep(fixture)) expect(s.length).toBeLessThanOrEqual(PROSE_MAX);
	});

	it('mints every id with the right prefix, eight base36 characters, no pipe or colon, no repeat', () => {
		const all = new Map<string, string>();
		const take = (id: string, where: string) => {
			expect(id, where).toMatch(ID_SHAPE);
			expect(id.includes('|') || id.includes(':'), `${where}: ${id}`).toBe(false);
			expect(all.has(id), `${id} is minted twice (${all.get(id)} and ${where})`).toBe(false);
			all.set(id, where);
		};
		take(fixture.id, 'house');
		expect(fixture.id.startsWith(ID_PREFIXES.house)).toBe(true);
		for (const list of HOUSE_LISTS) {
			for (const item of rows(list)) {
				take(item.id, list);
				expect(item.id.startsWith(ID_PREFIXES[list]), `${list}: ${item.id}`).toBe(true);
			}
		}
		expect(all.size).toBe(1 + HOUSE_LISTS.reduce((n, l) => n + houseRows(fixture, l).length, 0));
	});

	it('refers only to its own items', () => {
		const ids = (list: HouseList) => new Set((fixture[list] as Array<{ id: string }>).map((i) => i.id));
		const dishes = ids('dishes');
		const wines = ids('wines');
		const cocktails = ids('cocktails');
		const items = new Set([...dishes, ...wines, ...cocktails]);
		const pours = new Set([...wines, ...cocktails]);
		const zeroProof = new Set(fixture.cocktails.filter((c) => c.zeroProof).map((c) => c.id));
		for (const d of fixture.dishes) {
			const p = d.pairing?.value;
			if (!p) continue;
			expect(wines.has(p.wineId)).toBe(true);
			expect(p.secondId === '' || wines.has(p.secondId)).toBe(true);
			expect(p.zeroProofId === '' || zeroProof.has(p.zeroProofId)).toBe(true);
		}
		for (const w of fixture.wines) for (const id of w.firstPickIds?.value ?? []) expect(dishes.has(id)).toBe(true);
		for (const c of fixture.cocktails) for (const id of c.upsells?.value ?? []) expect(cocktails.has(id)).toBe(true);
		for (const t of fixture.tastings) {
			for (const c of t.courses) {
				for (const id of c.dishIds) expect(dishes.has(id)).toBe(true);
				expect(c.pourId === '' || pours.has(c.pourId)).toBe(true);
			}
		}
		for (const x of fixture.lexicon) for (const id of x.itemIds) expect(items.has(id)).toBe(true);
		for (const s of fixture.scenarios) for (const id of s.itemIds) expect(items.has(id)).toBe(true);
		for (const m of fixture.mixUps) {
			expect(items.has(m.aId)).toBe(true);
			expect(items.has(m.bId)).toBe(true);
			expect(m.aId).not.toBe(m.bId);
		}
		for (const a of fixture.askAtLineup) for (const id of a.itemIds) expect(items.has(id)).toBe(true);
		for (const u of fixture.disputes) expect(u.itemId === undefined || items.has(u.itemId)).toBe(true);
	});
});

describe('emptyHouse', () => {
	it('has the card blank, every list empty and the stamps from now', () => {
		const now = Date.parse('2026-10-03T09:00:00.000Z');
		const h = emptyHouse('h-abcdefgh', 'My house', 'hand', now);
		expect(h.format).toBe(HOUSE_FORMAT);
		expect(h.version).toBe(HOUSE_SCHEMA_VERSION);
		expect(h.id).toBe('h-abcdefgh');
		expect(h.name).toBe('My house');
		expect(h.began).toBe('hand');
		expect(h.createdAt).toBe('2026-10-03T09:00:00.000Z');
		expect(h.lastWrite).toBe(now);
		for (const l of HOUSE_LISTS) {
			if (optionalList(l)) expect(l in h, l).toBe(false);
			else expect(h[l]).toEqual([]);
		}
		expect(h.removed).toEqual({});
		expect(h.build).toEqual({});
		expect(h.meals).toEqual([]);
		expect(h.sources).toEqual([]);
		expect(h.history).toBeUndefined();
		expect(h.pack).toBeUndefined();
		const optional = ['history', 'pack', ...OPTIONAL_KEYS.House];
		expect(Object.keys(h).sort()).toEqual(KEYS.House.filter((k) => !optional.includes(k)).sort());
		for (const k of keysDeep(h)) expect(k).not.toMatch(FORBIDDEN_KEY);
	});
});

describe('mintId', () => {
	it('is the prefix and eight base36 characters, never a pipe or a colon', () => {
		for (let i = 0; i < 500; i++) {
			const id = mintId('d-', new Set());
			expect(id).toMatch(/^d-[0-9a-z]{8}$/);
		}
		for (const prefix of Object.values(ID_PREFIXES)) {
			const id = mintId(prefix, new Set());
			expect(id.startsWith(prefix)).toBe(true);
			expect(id).toMatch(ID_SHAPE);
		}
	});

	it('never collides with a taken set, and never repeats itself', () => {
		const taken = new Set<string>();
		for (let i = 0; i < 2000; i++) {
			const id = mintId('w-', taken);
			expect(taken.has(id)).toBe(false);
			taken.add(id);
		}
		expect(taken.size).toBe(2000);
	});

	it('skips the ids the source would have drawn first when they are taken', () => {
		const first = [mintId('b-', new Set(), seeded(7)), mintId('b-', new Set(), seeded(7))];
		expect(first[0]).toBe(first[1]);
		const rand = seeded(7);
		const taken = new Set([first[0]]);
		const second = mintId('b-', new Set(), (() => { const r = seeded(7); for (let i = 0; i < 8; i++) r(); return r; })());
		const minted = mintId('b-', taken, rand);
		expect(minted).not.toBe(first[0]);
		expect(minted).toBe(second);
		expect(taken.has(minted)).toBe(false);
	});

	it('keeps to eight characters whatever the source returns', () => {
		expect(mintId('t-', new Set(), () => 0)).toBe('t-00000000');
		expect(mintId('t-', new Set(), () => 0.999999)).toBe('t-zzzzzzzz');
		expect(mintId('t-', new Set(), () => 1)).toBe('t-00000000');
		expect(mintId('t-', new Set(), () => -1)).toBe('t-00000000');
		expect(mintId('t-', new Set(), () => Number.NaN)).toBe('t-00000000');
	});

	it('says so, rather than spinning, when the source cannot find a free id', () => {
		expect(() => mintId('t-', new Set(['t-00000000']), () => 0)).toThrow(/random source/);
	});
});

describe('isMark and isNote', () => {
	it('take the wings\' shape with a string, a list or an object as the value', () => {
		expect(isMark({ value: 'x', by: 'maitre', ts: 1 })).toBe(true);
		expect(isMark({ value: 'x', by: 'person', ts: 1, model: 'claude' })).toBe(true);
		expect(isMark({ value: ['a', 'b'], by: 'person', ts: 1 })).toBe(true);
		expect(isMark({ value: { s10: '', s20: '', s45: '' }, by: 'person', ts: 1 })).toBe(true);
	});

	it('refuse anything else', () => {
		expect(isMark(undefined)).toBe(false);
		expect(isMark(null)).toBe(false);
		expect(isMark('x')).toBe(false);
		expect(isMark([])).toBe(false);
		expect(isMark({ value: 'x', by: 'chef', ts: 1 })).toBe(false);
		expect(isMark({ value: 'x', ts: 1 })).toBe(false);
		expect(isMark({ value: 'x', by: 'person' })).toBe(false);
		expect(isMark({ value: 'x', by: 'person', ts: Number.NaN })).toBe(false);
		expect(isMark({ value: 'x', by: 'person', ts: '1' })).toBe(false);
		expect(isMark({ by: 'person', ts: 1 })).toBe(false);
		expect(isMark({ value: 3, by: 'person', ts: 1 })).toBe(false);
		expect(isMark({ value: null, by: 'person', ts: 1 })).toBe(false);
		expect(isMark({ value: ['a', 3], by: 'person', ts: 1 })).toBe(false);
		expect(isMark({ value: 'x', by: 'person', ts: 1, model: 3 })).toBe(false);
	});

	it('know a kept note', () => {
		expect(isNote({ q: 'q', a: 'a', ts: 1 })).toBe(true);
		expect(isNote({ q: 'q', a: 'a', ts: 1, model: 'm' })).toBe(true);
		expect(isNote({ q: 'q', a: 'a' })).toBe(false);
		expect(isNote({ q: 'q', ts: 1 })).toBe(false);
		expect(isNote({ q: 'q', a: 'a', ts: 1, model: 1 })).toBe(false);
		expect(isNote(null)).toBe(false);
		expect(isNote([])).toBe(false);
	});
});
