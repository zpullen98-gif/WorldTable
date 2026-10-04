import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { houseRows, optionalList, HOUSE_LISTS, HOUSE_FORMAT, HOUSE_SCHEMA_VERSION, ID_PREFIXES, KEYS, LIST_MAX, OPTIONAL_KEYS, MARK_FIELDS, PROSE_MAX, isMark } from './house-schema';
import type { House, HouseList, Mark } from './house-schema';
import { FORBIDDEN_KEY, KEPT_CAP, MARK_KINDS, forbiddenKeys, markKind, normaliseHouse, normaliseMark } from './house-normalise';

/**
 * The normaliser is the House's one door: a pack, a desk read and a hand
 * edit all pass it before anything is written. What is under test is what
 * comes out: the fixture unchanged (so every key the schema names is
 * carried), every key the schema does not name gone at every depth, the
 * caps, the marks brought to the wings' shape or dropped, the ids minted
 * right with their references following, and the client's key sweep copied
 * to the character (held against the client's own source).
 *
 * The em dash is never spelled out in this file: the gate regex is built
 * from escapes, so the suite's own dash sweep finds nothing here.
 */

const here = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const FIXTURE_PATH = here('./fixtures/house-min.json');
const MODULE_PATH = here('./house-normalise.ts');
const TEST_PATH = here('./house-normalise.test.ts');
const CLIENT_PATH = here('../../../static/shared/oot-maitre.js');

/** Every dash spelling the publish gate counts, plus the en dash, built from escapes. */
const DASH = new RegExp(['\\u2014', '\\u2013', '&' + 'mdash;', '&#' + '8212;', '&#' + 'x2014;', ' ' + '-- '].join('|'));

const ID_SHAPE = /^[a-z]-[0-9a-z]{8}$/;

type Raw = Record<string, unknown>;

/** A fresh copy of the fixture, as a plain record a test can mutate. */
const fixture = (): Raw => JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as Raw;
const dish = (h: Raw, i: number): Raw => (h.dishes as Raw[])[i];
const wine = (h: Raw, i: number): Raw => (h.wines as Raw[])[i];
const cocktail = (h: Raw, i: number): Raw => (h.cocktails as Raw[])[i];

/** A seeded random source, so a minted id is the same on every run. */
function seeded(seed: number): () => number {
	let s = seed >>> 0;
	return () => {
		s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
		return s / 4294967296;
	};
}

/** Every key at every depth. */
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

/** The client's function, read out of its source and made callable, so the copy here is proved to behave as the original. */
function clientFunction(name: string, args: string[], values: unknown[]): (...a: unknown[]) => unknown {
	const src = readFileSync(CLIENT_PATH, 'utf8');
	const start = src.indexOf('function ' + name + '(');
	expect(start, `oot-maitre.js must still declare ${name}`).toBeGreaterThan(0);
	const end = src.indexOf('\n  }\n', start);
	const text = src.slice(start, end + 4);
	return new Function(...args, text + '; return ' + name + ';')(...values) as (...a: unknown[]) => unknown;
}

describe('the client rule, copied', () => {
	it('is the very regex and the very walk the client refuses keys with', () => {
		const src = readFileSync(CLIENT_PATH, 'utf8');
		const line = src.match(/var FORBIDDEN_KEY = (\/.*?\/[gimsuy]*);/);
		expect(line).not.toBeNull();
		const theirs = new Function('return ' + (line as RegExpMatchArray)[1])() as RegExp;
		expect(FORBIDDEN_KEY.source).toBe(theirs.source);
		expect(FORBIDDEN_KEY.flags).toBe(theirs.flags);
		const theirWalk = clientFunction('forbiddenKeys', ['FORBIDDEN_KEY'], [theirs]);
		const samples: unknown[] = [
			fixture(),
			{ allergens: [], a: { contains: 1, deep: [{ glutenFree: true }, 'x', null] }, nutmeg: 0, notes: '' },
			['a', { Safe: 1 }, [{ suitableFor: [] }]],
			null,
			'string',
			{ removed: { 'd-peanut01': 1 } }
		];
		for (const s of samples) expect(forbiddenKeys(s, 'house', [])).toEqual(theirWalk(s, 'house', []));
		expect(forbiddenKeys(samples[1], 'x', [])).toEqual(['x.allergens', 'x.a.contains', 'x.a.deep[0].glutenFree', 'x.nutmeg']);
	});
});

describe('the fixture through the door', () => {
	it('comes out unchanged, with an empty report, so every key the schema names is carried', () => {
		const raw = fixture();
		const { house, report } = normaliseHouse(raw);
		expect(report).toEqual([]);
		expect(house).toEqual(raw);
		expect(house).not.toBe(raw);
	});

	it('is idempotent', () => {
		const once = normaliseHouse(fixture()).house;
		const twice = normaliseHouse(once).house;
		expect(twice).toEqual(once);
	});

	it('keeps the fixture dash-free: the normaliser never writes a dash of its own', () => {
		expect(JSON.stringify(normaliseHouse(fixture()).house)).not.toMatch(DASH);
	});
});

describe('keys outside the shape', () => {
	it('drops a forbidden key at every depth, allergens above all, and reports each as it came in', () => {
		const raw = fixture();
		raw.allergens = ['milk'];
		raw.contains = 'everything';
		dish(raw, 0).allergens = ['egg'];
		dish(raw, 0).allergensCheckedAt = 1;
		(dish(raw, 0).parts as Raw).value = { ...((dish(raw, 0).parts as Raw).value as Raw), allergens: 'none' };
		((dish(raw, 0).pairing as Raw).value as Raw).nutFree = true;
		(dish(raw, 0).kept as Raw[])[0].safeFor = 'all';
		wine(raw, 0).vegan = true;
		(wine(raw, 0).firstPickIds as Raw).suitable = [];
		cocktail(raw, 1).contains = [];
		(raw.tastings as Raw[])[0].allergens = [];
		(raw.lexicon as Raw[])[0].allergens = [];
		const { house, report } = normaliseHouse(raw);
		for (const k of keysDeep(house)) expect(k).not.toMatch(FORBIDDEN_KEY);
		expect(house).toEqual(fixture());
		const forbidden = report.filter((r) => r.code === 'forbidden').map((r) => r.path).sort();
		expect(forbidden).toEqual(
			[
				'house.allergens', 'house.contains', 'house.dishes[0].allergens', 'house.dishes[0].allergensCheckedAt',
				'house.dishes[0].parts.value.allergens', 'house.dishes[0].pairing.value.nutFree', 'house.dishes[0].kept[0].safeFor',
				'house.wines[0].vegan', 'house.wines[0].firstPickIds.suitable', 'house.cocktails[1].contains',
				'house.tastings[0].allergens', 'house.lexicon[0].allergens'
			].sort()
		);
		for (const r of report) expect(r.said).toMatch(/came in/);
	});

	it('drops any other key the shape does not name, at every depth', () => {
		const raw = fixture();
		raw.extra = 1;
		raw.recipeSlug = 'x';
		dish(raw, 0).recipeSlug = 'lantern-roast-chicken';
		dish(raw, 0).maitre = {};
		(dish(raw, 0).lines as Raw).value = { ...((dish(raw, 0).lines as Raw).value as Raw), s60: 'a fourth line' };
		(dish(raw, 0).say as Raw).extra = 'x';
		((raw.tastings as Raw[])[0].courses as Raw[])[0].wine = 'w';
		(raw.meals as Raw[])[0].extra = 1;
		(raw.sources as Raw[])[0].extra = 1;
		(raw.pack as Raw).extra = 1;
		(raw.askAtLineup as Raw[])[0].extra = 1;
		((raw.disputes as Raw[])[0].a as Raw).extra = 1;
		const { house, report } = normaliseHouse(raw);
		expect(report).toEqual([]);
		expect(house).toEqual(fixture());
	});

	it('drops a tombstone whose id matches the client rule and names it, because a tombstone is a key', () => {
		const raw = fixture();
		raw.removed = { 'd-peanut01': 1790000000000, 'd-aaaaaaaa': 5 };
		const { house, report } = normaliseHouse(raw);
		expect(house.removed).toEqual({ 'd-aaaaaaaa': 5 });
		const dropped = report.filter((r) => r.code === 'forbidden' && /dropped/.test(r.said));
		expect(dropped.map((r) => r.path)).toEqual(['house.removed.d-peanut01']);
		expect(report.filter((r) => /still on the record/.test(r.said))).toEqual([]);
		expect(forbiddenKeys(house, 'house', [])).toEqual([]);
	});

	it('mints afresh an item id that matches the client rule, with its references following', () => {
		const raw = fixture();
		const old = dish(raw, 0).id as string;
		dish(raw, 0).id = 'd-nutloaf1';
		for (const t of raw.tastings as Raw[]) for (const c of t.courses as Raw[]) c.dishIds = (c.dishIds as string[]).map((id) => (id === old ? 'd-nutloaf1' : id));
		const { house, report } = normaliseHouse(raw, { rand: seeded(5) });
		const fresh = house.dishes[0].id;
		expect(fresh).not.toBe('d-nutloaf1');
		expect(fresh).not.toMatch(FORBIDDEN_KEY);
		expect(report.find((r) => r.code === 'id' && r.path === 'house.dishes[0].id')?.said).toMatch(/refused as a key/);
		const refs = house.tastings.flatMap((t) => t.courses.flatMap((c) => c.dishIds));
		expect(refs).not.toContain('d-nutloaf1');
		expect(refs.filter((id) => id === fresh).length).toBeGreaterThan(0);
	});
});

describe('the empty and the broken', () => {
	it('makes a House of the right shape out of nothing, with every list present and every required string empty', () => {
		for (const raw of [undefined, null, 3, 'house', [], {}]) {
			const { house, report } = normaliseHouse(raw, { rand: seeded(1) });
			expect(house.format).toBe(HOUSE_FORMAT);
			expect(house.version).toBe(HOUSE_SCHEMA_VERSION);
			expect(house.id).toMatch(/^h-[0-9a-z]{8}$/);
			expect(house.name).toBe('');
			expect(house.address).toBe('');
			expect(house.menusReadOn).toBe('');
			expect(house.createdAt).toBe('');
			expect(house.lastWrite).toBe(0);
			expect(house.began).toBe('hand');
			for (const l of HOUSE_LISTS) {
				if (optionalList(l)) expect(l in house, l + ' is optional and absent when empty').toBe(false);
				else expect(house[l]).toEqual([]);
			}
			expect(house.meals).toEqual([]);
			expect(house.sources).toEqual([]);
			expect(house.removed).toEqual({});
			expect(house.build).toEqual({});
			expect(house.history).toBeUndefined();
			expect(house.pack).toBeUndefined();
			expect(Object.keys(house).sort()).toEqual(KEYS.House.filter((k) => k !== 'history' && k !== 'pack' && k !== 'videos' && k !== 'components').sort());
			expect(report).toEqual([{ path: 'house.id', code: 'id', said: 'no id; minted ' + house.id }]);
		}
	});

	it('forces the format, the version, the began and the kinds whatever came in', () => {
		const raw = fixture();
		raw.format = 'oot-menu-desk';
		raw.version = 7;
		raw.began = 'elsewhere';
		dish(raw, 0).kind = 'wine';
		wine(raw, 0).kind = 'cocktail';
		cocktail(raw, 0).kind = 'dish';
		const { house } = normaliseHouse(raw);
		expect(house.format).toBe(HOUSE_FORMAT);
		expect(house.version).toBe(HOUSE_SCHEMA_VERSION);
		expect(house.began).toBe('hand');
		expect(house.dishes[0].kind).toBe('dish');
		expect(house.wines[0].kind).toBe('wine');
		expect(house.cocktails[0].kind).toBe('cocktail');
	});

	it('fills a required string with the empty string and a list with the empty list when the value is not one', () => {
		const raw = fixture();
		dish(raw, 1).name = 7;
		dish(raw, 1).description = null;
		dish(raw, 1).ingredients = 'chicken';
		dish(raw, 1).meals = { Dinner: true };
		dish(raw, 1).serviceNote = undefined;
		dish(raw, 1).signature = 'yes';
		dish(raw, 1).prices = [{ meal: 'Dinner', printed: 11 }, 'nonsense', null];
		wine(raw, 0).pours = [1, '', '  ', '125 ml'];
		cocktail(raw, 1).zeroProof = 1;
		(raw.tastings as Raw[])[0].includesDrinks = 'no';
		(raw.tastings as Raw[])[0].courses = [{ label: 'x' }, 'course'];
		const { house } = normaliseHouse(raw);
		const d = house.dishes[1];
		expect(d.name).toBe('');
		expect(d.description).toBe('');
		expect(d.ingredients).toEqual([]);
		expect(d.meals).toEqual([]);
		expect(d.serviceNote).toBe('');
		expect(d.signature).toBe(false);
		expect(d.prices).toEqual([{ meal: 'Dinner', printed: '11' }]);
		expect(house.wines[0].pours).toEqual(['125 ml']);
		expect(house.cocktails[1].zeroProof).toBe(false);
		expect(house.tastings[0].includesDrinks).toBe(false);
		expect(house.tastings[0].courses).toEqual([
			{ n: 1, label: 'x', dishIds: [], pourId: '', pourText: '' },
			{ n: 2, label: '', dishIds: [], pourId: '', pourText: '' }
		]);
	});

	it('keeps a price a string as printed, and takes the digits of a number a hand edit wrote', () => {
		const raw = fixture();
		dish(raw, 0).price = 24;
		wine(raw, 0).glass = 9.5;
		wine(raw, 0).bottle = 'MP';
		(raw.tastings as Raw[])[0].price = 45;
		cocktail(raw, 0).price = Number.NaN;
		const { house } = normaliseHouse(raw);
		expect(house.dishes[0].price).toBe('24');
		expect(house.wines[0].glass).toBe('9.5');
		expect(house.wines[0].bottle).toBe('MP');
		expect(house.tastings[0].price).toBe('45');
		expect(house.cocktails[0].price).toBe('');
		for (const item of [...house.dishes, ...house.wines, ...house.cocktails]) expect(typeof item.price).toBe('string');
	});

	it('splits grapes given as one string on the commas and keeps a list as a list', () => {
		const raw = fixture();
		wine(raw, 0).grapes = 'Grenache, Syrah , Mourvedre,,';
		expect(normaliseHouse(raw).house.wines[0].grapes).toEqual(['Grenache', ' Syrah ', ' Mourvedre']);
		wine(raw, 0).grapes = ['Bacchus', '', 3];
		expect(normaliseHouse(raw).house.wines[0].grapes).toEqual(['Bacchus']);
	});

	it('keeps removed as id to number, build as step to number, and a pack stamp only as a record', () => {
		const raw = fixture();
		raw.removed = { 'd-aaaaaaaa': 5, 'd-bbbbbbbb': 'no', 'd-cccccccc': Number.POSITIVE_INFINITY, '': 1 };
		raw.build = { card: 1, bogus: 2, menus: 'x', scenarios: 3 };
		raw.pack = 'house-min';
		const { house } = normaliseHouse(raw);
		expect(house.removed).toEqual({ 'd-aaaaaaaa': 5 });
		expect(house.build).toEqual({ card: 1, scenarios: 3 });
		expect(house.pack).toBeUndefined();
		raw.pack = { id: 'p', builtBy: 'b', builtAt: 'a', version: '1', extra: 1 };
		expect(normaliseHouse(raw).house.pack).toEqual({ id: 'p', builtBy: 'b', builtAt: 'a', version: 0 });
	});

	it('reads askAtLineup and disputes with their optional fields only when they carry something', () => {
		const raw = fixture();
		const ask = (raw.askAtLineup as Raw[])[0];
		ask.askWhom = 'the dog';
		ask.answer = '';
		ask.answeredOn = '2026-10-03';
		delete ask.blocksField;
		const dispute = (raw.disputes as Raw[])[0];
		dispute.itemId = '';
		dispute.resolution = 'the list is right';
		const { house } = normaliseHouse(raw);
		expect(house.askAtLineup[0].askWhom).toBe('manager');
		expect(house.askAtLineup[0].answer).toBeUndefined();
		expect(house.askAtLineup[0].answeredOn).toBe('2026-10-03');
		expect(house.askAtLineup[0].blocksField).toBeUndefined();
		expect(house.disputes[0].itemId).toBeUndefined();
		expect(house.disputes[0].resolution).toBe('the list is right');
	});
});

describe('the caps', () => {
	it('cuts every prose field at PROSE_MAX, inside a mark too', () => {
		const raw = fixture();
		const long = 'x'.repeat(PROSE_MAX + 100);
		raw.name = long;
		dish(raw, 0).description = long;
		(dish(raw, 0).say as Raw).value = long;
		((dish(raw, 0).lines as Raw).value as Raw).s45 = long;
		(dish(raw, 0).kept as Raw[])[0].a = long;
		(raw.lexicon as Raw[])[0].term = long;
		const { house } = normaliseHouse(raw);
		expect(house.name).toHaveLength(PROSE_MAX);
		expect(house.dishes[0].description).toHaveLength(PROSE_MAX);
		expect(house.dishes[0].say?.value).toHaveLength(PROSE_MAX);
		expect(house.dishes[0].lines?.value.s45).toHaveLength(PROSE_MAX);
		expect(house.dishes[0].kept?.[0].a).toHaveLength(PROSE_MAX);
		expect(house.lexicon[0].term).toHaveLength(PROSE_MAX);
		for (const s of keysDeep(house)) expect(s.length).toBeLessThanOrEqual(PROSE_MAX);
	});

	it('cuts every list at LIST_MAX', () => {
		const raw = fixture();
		dish(raw, 0).ingredients = new Array(LIST_MAX + 5).fill('salt');
		raw.mustKnows = new Array(LIST_MAX + 5).fill(null).map((_, i) => ({ id: 'k-' + String(i).padStart(8, '0'), title: 't', ts: 1 }));
		const { house } = normaliseHouse(raw, { rand: seeded(3) });
		expect(house.dishes[0].ingredients).toHaveLength(LIST_MAX);
		expect(house.mustKnows).toHaveLength(LIST_MAX);
	});

	it('keeps the newest KEPT_CAP notes, sorted by stamp, and drops a note that is not one', () => {
		const raw = fixture();
		const notes: unknown[] = [];
		for (let i = KEPT_CAP + 20; i >= 1; i--) notes.push({ q: 'q' + i, a: 'a' + i, ts: i });
		notes.push({ q: 'no answer', ts: 1 }, 'note', null, { q: 'q', a: 'a', ts: 'soon', model: 'm' });
		dish(raw, 0).kept = notes;
		const { house } = normaliseHouse(raw);
		const kept = house.dishes[0].kept ?? [];
		expect(kept).toHaveLength(KEPT_CAP);
		expect(kept[0]).toEqual({ q: 'q21', a: 'a21', ts: 21 });
		expect(kept[kept.length - 1]).toEqual({ q: 'q' + (KEPT_CAP + 20), a: 'a' + (KEPT_CAP + 20), ts: KEPT_CAP + 20 });
		for (let i = 1; i < kept.length; i++) expect(kept[i].ts).toBeGreaterThanOrEqual(kept[i - 1].ts);
		dish(raw, 0).kept = [{ q: 'q', a: 'a', ts: 'soon', model: 'm' }, { q: 'late', a: 'a', ts: 5, model: 7 }];
		expect(normaliseHouse(raw).house.dishes[0].kept).toEqual([{ q: 'q', a: 'a', ts: 0, model: 'm' }, { q: 'late', a: 'a', ts: 5 }]);
	});
});

describe('normaliseMark', () => {
	it('knows which fields carry a list, the parts, the lines or the pairing, and that the rest is prose', () => {
		expect(MARK_KINDS).toEqual({ ingredientsNamed: 'list', firstPickIds: 'list', upsells: 'list', parts: 'parts', lines: 'lines', pairing: 'pairing', card: 'card', compare: 'compare' });
		for (const f of ['say', 'guest', 'why', 'pairs', 'origin', 'profile', 'goesWith', 'serve', 'toGuest', 'you', 'principle', 'difference', 'ask', 'body', 'history']) {
			expect(markKind(f)).toBe('text');
		}
		const kinds = ['text', 'list', 'parts', 'lines', 'pairing', 'card', 'compare'];
		for (const list of HOUSE_LISTS) for (const f of MARK_FIELDS[list]) expect(kinds, `${list}.${f}`).toContain(markKind(f));
		for (const f of MARK_FIELDS.house) expect(markKind(f)).toBe('text');
	});

	it('drops a mark whose value is empty, blank, missing or of the wrong kind', () => {
		expect(normaliseMark({ value: '', by: 'person', ts: 1 })).toBeUndefined();
		expect(normaliseMark({ value: '   \n', by: 'person', ts: 1 })).toBeUndefined();
		expect(normaliseMark({ by: 'person', ts: 1 })).toBeUndefined();
		expect(normaliseMark({ value: ['a'], by: 'person', ts: 1 }, 'text')).toBeUndefined();
		expect(normaliseMark({ value: 'a', by: 'person', ts: 1 }, 'list')).toBeUndefined();
		expect(normaliseMark({ value: ['', '  '], by: 'person', ts: 1 }, 'list')).toBeUndefined();
		expect(normaliseMark({ value: { main: '', taste: ' ' }, by: 'person', ts: 1 }, 'parts')).toBeUndefined();
		expect(normaliseMark({ value: 'five parts', by: 'person', ts: 1 }, 'parts')).toBeUndefined();
		expect(normaliseMark({ value: {}, by: 'person', ts: 1 }, 'lines')).toBeUndefined();
		expect(normaliseMark({ value: { principles: [] }, by: 'person', ts: 1 }, 'pairing')).toBeUndefined();
		expect(normaliseMark('a mark', 'text')).toBeUndefined();
		expect(normaliseMark(null)).toBeUndefined();
		expect(normaliseMark(['value'])).toBeUndefined();
	});

	it('forces by to person or maitre, ts to a number, and keeps model only as a string', () => {
		expect(normaliseMark({ value: 'x', by: 'person', ts: 1 })).toEqual({ value: 'x', by: 'person', ts: 1 });
		expect(normaliseMark({ value: 'x', by: 'maitre', ts: 1 })).toEqual({ value: 'x', by: 'maitre', ts: 1 });
		expect(normaliseMark({ value: 'x', by: 'chef', ts: 1 })).toEqual({ value: 'x', by: 'maitre', ts: 1 });
		expect(normaliseMark({ value: 'x', ts: 1 })).toEqual({ value: 'x', by: 'maitre', ts: 1 });
		expect(normaliseMark({ value: 'x', by: 'person', ts: '123' })).toEqual({ value: 'x', by: 'person', ts: 123 });
		expect(normaliseMark({ value: 'x', by: 'person', ts: 'soon' })).toEqual({ value: 'x', by: 'person', ts: 0 });
		expect(normaliseMark({ value: 'x', by: 'person' })).toEqual({ value: 'x', by: 'person', ts: 0 });
		expect(normaliseMark({ value: 'x', by: 'person', ts: Number.NaN })).toEqual({ value: 'x', by: 'person', ts: 0 });
		expect(normaliseMark({ value: 'x', by: 'person', ts: 1, model: 'claude' })).toEqual({ value: 'x', by: 'person', ts: 1, model: 'claude' });
		expect(normaliseMark({ value: 'x', by: 'person', ts: 1, model: 3 })).toEqual({ value: 'x', by: 'person', ts: 1 });
		for (const m of [normaliseMark({ value: 'x', by: 'nobody', ts: '7' })]) expect(isMark(m)).toBe(true);
	});

	it('brings a list, the parts, the lines and the pairing to their shape, filling what is missing and dropping what is not named', () => {
		expect(normaliseMark({ value: ['a', '', 3, 'b'], by: 'person', ts: 1 }, 'list')).toEqual({ value: ['a', 'b'], by: 'person', ts: 1 });
		expect(normaliseMark({ value: { main: 'gin', allergens: 'none', extra: 1 }, by: 'person', ts: 1 }, 'parts')).toEqual({
			value: { main: 'gin', technique: '', sauce: '', sides: '', taste: '' },
			by: 'person',
			ts: 1
		});
		expect(normaliseMark({ value: { s20: 'twenty', s60: 'sixty' }, by: 'person', ts: 1 }, 'lines')).toEqual({
			value: { s10: '', s20: 'twenty', s45: '' },
			by: 'person',
			ts: 1
		});
		const pairing = normaliseMark({ value: { wineId: 'w-lantern1', principles: ['acid', 'umami', ''], nutFree: true }, by: 'person', ts: 1 }, 'pairing');
		expect(pairing).toEqual({
			value: {
				wineId: 'w-lantern1', why: '', sayIt: '', whyThisWine: '', palate: '', principles: ['acid', 'umami'],
				secondId: '', secondWhy: '', stepUp: '', serve: '', avoid: '', zeroProofId: '', zeroProofWhy: ''
			},
			by: 'person',
			ts: 1
		});
		expect(Object.keys((pairing as Mark<object>).value).sort()).toEqual(KEYS.Pairing.filter((k) => !(OPTIONAL_KEYS.Pairing as readonly string[]).includes(k)).sort());
	});

	it('is the door every mark on the house passes', () => {
		const raw = fixture();
		(dish(raw, 0).say as Raw).value = '';
		(dish(raw, 0).why as Raw).by = 'chef';
		(wine(raw, 0).profile as Raw).ts = '5';
		(wine(raw, 0).firstPickIds as Raw).value = [];
		(raw.history as Raw).value = ' ';
		((raw.mixUps as Raw[])[0].ask as Raw).value = 3;
		const { house } = normaliseHouse(raw);
		expect(house.dishes[0].say).toBeUndefined();
		expect(house.dishes[0].why?.by).toBe('maitre');
		expect(house.wines[0].profile?.ts).toBe(5);
		expect(house.wines[0].firstPickIds).toBeUndefined();
		expect(house.history).toBeUndefined();
		expect(house.mixUps[0].ask).toBeUndefined();
		expect(isMark(house.mixUps[0].difference)).toBe(true);
	});
});

describe('ids', () => {
	it('keeps an id with the right prefix and re-mints one with the wrong prefix, reporting it, with every reference following', () => {
		const raw = fixture();
		wine(raw, 0).id = 'k-lantern1';
		((dish(raw, 0).pairing as Raw).value as Raw).wineId = 'k-lantern1';
		((raw.tastings as Raw[])[0].courses as Raw[])[0].pourId = 'k-lantern1';
		(raw.disputes as Raw[])[0].itemId = 'k-lantern1';
		const { house, report } = normaliseHouse(raw, { rand: seeded(11) });
		const fresh = house.wines[0].id;
		expect(fresh).toMatch(/^w-[0-9a-z]{8}$/);
		expect(fresh).not.toBe('k-lantern1');
		expect(report).toEqual([{ path: 'house.wines[0].id', code: 'id', said: 'the id k-lantern1 does not start with w-; minted ' + fresh }]);
		expect(house.dishes[0].pairing?.value.wineId).toBe(fresh);
		expect(house.tastings[0].courses[0].pourId).toBe(fresh);
		expect(house.disputes[0].itemId).toBe(fresh);
		expect(house.dishes[0].id).toBe('d-chicken1');
	});

	it('re-mints a missing id, one with a pipe or a colon, and a duplicate, and lets the first holder keep the duplicate', () => {
		const raw = fixture();
		delete dish(raw, 1).id;
		cocktail(raw, 1).id = 'b-ver|us01';
		(raw.lexicon as Raw[])[0].itemIds = ['b-ver|us01'];
		((dish(raw, 0).pairing as Raw).value as Raw).zeroProofId = 'b-ver|us01';
		(cocktail(raw, 0).upsells as Raw).value = ['b-ver|us01'];
		(raw.lexicon as Raw[])[1].id = 'x-verjus01';
		(raw.scenarios as Raw[])[0].id = 's-a:b';
		const { house, report } = normaliseHouse(raw, { rand: seeded(5) });
		expect(report.map((r) => r.path)).toEqual(['house.dishes[1].id', 'house.cocktails[1].id', 'house.lexicon[1].id', 'house.scenarios[0].id']);
		expect(report[0].said).toMatch(/^no id; minted d-/);
		expect(report[1].said).toMatch(/carries a pipe or a colon; minted b-/);
		expect(report[2].said).toMatch(/already taken in this house; minted x-/);
		expect(report[3].said).toMatch(/carries a pipe or a colon; minted s-/);
		expect(house.lexicon[0].id).toBe('x-verjus01');
		expect(house.lexicon[1].id).not.toBe('x-verjus01');
		expect(house.lexicon[0].itemIds).toEqual([house.cocktails[1].id]);
		expect(house.dishes[0].pairing?.value.zeroProofId).toBe(house.cocktails[1].id);
		expect(house.cocktails[0].upsells?.value).toEqual([house.cocktails[1].id]);
		const all = [house.id, ...HOUSE_LISTS.flatMap((l: HouseList) => (houseRows(house, l) as Array<{ id: string }>).map((i) => i.id))];
		expect(new Set(all).size).toBe(all.length);
		for (const id of all) {
			expect(id).toMatch(ID_SHAPE);
			expect(id.includes('|') || id.includes(':')).toBe(false);
		}
		for (const l of HOUSE_LISTS) for (const i of houseRows(house, l) as Array<{ id: string }>) expect(i.id.startsWith(ID_PREFIXES[l])).toBe(true);
	});

	it('re-mints a house id with the wrong prefix and stamps every item with the house it sits in', () => {
		const raw = fixture();
		raw.id = 'd-lantern0';
		dish(raw, 0).house = 'h-elsewhere';
		delete wine(raw, 0).house;
		const { house, report } = normaliseHouse(raw, { rand: seeded(9) });
		expect(house.id).toMatch(/^h-[0-9a-z]{8}$/);
		expect(report[0]).toEqual({ path: 'house.id', code: 'id', said: 'the id d-lantern0 does not start with h-; minted ' + house.id });
		for (const item of [...house.dishes, ...house.wines, ...house.cocktails]) expect(item.house).toBe(house.id);
	});

	it('mints the same ids under the same seed, and never one the client would refuse as a key', () => {
		const raw = fixture();
		delete dish(raw, 0).id;
		const a = normaliseHouse(raw, { rand: seeded(2) }).house.dishes[0].id;
		const b = normaliseHouse(raw, { rand: seeded(2) }).house.dishes[0].id;
		expect(a).toBe(b);
		for (let seed = 0; seed < 50; seed++) {
			const { house } = normaliseHouse({ dishes: [{}, {}, {}] }, { rand: seeded(seed) });
			for (const d of house.dishes) expect(d.id).not.toMatch(FORBIDDEN_KEY);
		}
	});
});

describe('the files', () => {
	it('carry no dash in any spelling and no carriage return, and the module is pure ASCII for the port', () => {
		for (const p of [MODULE_PATH, TEST_PATH]) {
			const text = readFileSync(p, 'utf8');
			expect(text, p).not.toMatch(DASH);
			expect(text.includes('\r'), `${p} carries a carriage return`).toBe(false);
		}
		expect(/[^\x00-\x7f]/.test(readFileSync(MODULE_PATH, 'utf8')), 'the module must be pure ASCII').toBe(false);
	});

	it('imports nothing from outside src/lib/house, and no Svelte, DOM or Node', () => {
		const src = readFileSync(MODULE_PATH, 'utf8');
		const imports = [...src.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]);
		expect(imports.length).toBeGreaterThan(0);
		for (const i of imports) expect(i).toMatch(/^\.\/house-/);
		expect(src).not.toMatch(/\b(window|document|localStorage|indexedDB|process|require)\b/);
	});
});

describe('the type', () => {
	it('is a House, so a caller reads it without a cast', () => {
		const typed: House = normaliseHouse(fixture()).house;
		expect(typed.format).toBe('oot-house');
	});
});
