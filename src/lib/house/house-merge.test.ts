import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { HOUSE_LISTS, MARK_FIELDS, emptyHouse, houseRows } from './house-schema';
import type { House, HouseDish, Mark, Note } from './house-schema';
import { KEPT_CAP } from './house-normalise';
import { lastTouch, listOfKind, mergeHouse, mergeItem, mergeKept, pickMark, sameJson } from './house-merge';
import type { Listed } from './house-merge';

/**
 * The merge is the one place a kept line can be lost in silence, so what is
 * under test is the rule and its edges: pickMark pinned against the Table's
 * own words, kept unioned and never replaced, the plain fields riding with
 * the newer stamp and the marks never riding with them, tombstones that
 * drop an item on both sides but never one a person touched after the
 * delete, and the whole thing symmetric and idempotent on the fixture.
 *
 * No dash is spelled in this file: the gate regex is built from escapes.
 */

const here = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const FIXTURE_PATH = here('./fixtures/house-min.json');
const MERGE_PATH = here('./house-merge.ts');
const SYNC_PATH = here('./house-sync.ts');
const STATE_PATH = here('../persistence/state.ts');

const DASH = new RegExp(['\\u2014', '\\u2013', '&' + 'mdash;', '&#' + '8212;', '&#' + 'x2014;', ' ' + '-- '].join('|'));

const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as House;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

const mark = <T = string>(value: T, by: 'maitre' | 'person', ts: number): Mark<T> => ({ value, by, ts });
const note = (q: string, ts: number, a = 'an answer'): Note => ({ q, a, ts });

/** The fixture's dish with every mark kept, as a fresh copy. */
const chicken = () => clone(fixture.dishes[0]);

/** Every list sorted by id, so two merges that differ in list order only compare equal. */
function sorted(h: House): House {
	const out = clone(h) as unknown as Record<string, unknown>;
	for (const l of HOUSE_LISTS) {
		out[l] = [...(houseRows(h, l) as Array<{ id: string }>)].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
	}
	return out as unknown as House;
}

/** The body of a function in a source file, whitespace folded, so two copies compare as words. */
function bodyOf(src: string, name: string): string {
	const m = src.match(new RegExp('function ' + name + '[^{]*\\{([\\s\\S]*?)\\n\\}'));
	expect(m, `${name} not found`).not.toBeNull();
	return (m as RegExpMatchArray)[1].replace(/\s+/g, ' ').trim();
}

describe('the two files', () => {
	it('carry no dash in any spelling, no carriage return, and nothing outside ASCII', () => {
		for (const p of [MERGE_PATH, SYNC_PATH, here('./house-merge.test.ts'), here('./house-sync.test.ts')]) {
			const text = readFileSync(p, 'utf8');
			expect(text, p).not.toMatch(DASH);
			expect(text.includes('\r'), `${p} carries a carriage return`).toBe(false);
		}
		for (const p of [MERGE_PATH, SYNC_PATH]) {
			expect(/[^\x00-\x7f]/.test(readFileSync(p, 'utf8')), `${p} must be pure ASCII`).toBe(false);
		}
	});

	it('import nothing from outside src/lib/house', () => {
		for (const p of [MERGE_PATH, SYNC_PATH]) {
			const src = readFileSync(p, 'utf8');
			const froms = [...src.matchAll(/from '([^']+)'/g)].map((m) => m[1]);
			expect(froms.length).toBeGreaterThan(0);
			for (const f of froms) expect(f, `${p} imports ${f}`).toMatch(/^\.\/house-/);
		}
	});
});

describe('pickMark', () => {
	it('is the Table\'s rule, word for word', () => {
		const theirs = bodyOf(readFileSync(STATE_PATH, 'utf8'), 'pickMark');
		const ours = bodyOf(readFileSync(MERGE_PATH, 'utf8'), 'pickMark');
		expect(ours).toBe(theirs);
	});

	it('takes the one side that exists', () => {
		const m = mark('x', 'maitre', 5);
		expect(pickMark(undefined, m)).toBe(m);
		expect(pickMark(m, undefined)).toBe(m);
		expect(pickMark(undefined, undefined)).toBeUndefined();
	});

	it('lets a person\'s mark beat hers whatever the stamps', () => {
		const kept = mark('kept', 'person', 1);
		const hers = mark('hers', 'maitre', 999);
		expect(pickMark(kept, hers)).toBe(kept);
		expect(pickMark(hers, kept)).toBe(kept);
	});

	it('then takes the newer, and mine on a tie', () => {
		const older = mark('a', 'person', 1);
		const newer = mark('b', 'person', 2);
		expect(pickMark(older, newer)).toBe(newer);
		expect(pickMark(newer, older)).toBe(newer);
		const mine = mark('mine', 'maitre', 7);
		const theirs = mark('theirs', 'maitre', 7);
		expect(pickMark(mine, theirs)).toBe(mine);
		expect(pickMark(theirs, mine)).toBe(theirs);
	});
});

describe('mergeKept', () => {
	it('unions on ts|q, keeps mine on the same key, and sorts by stamp then question', () => {
		const a = [note('b', 2), note('a', 1, 'mine')];
		const b = [note('a', 1, 'theirs'), note('c', 2), note('d', 3)];
		const out = mergeKept(a, b);
		expect(out.map((n) => n.q)).toEqual(['a', 'b', 'c', 'd']);
		expect(out[0].a).toBe('mine');
		expect(mergeKept(b, a).map((n) => n.q)).toEqual(['a', 'b', 'c', 'd']);
		expect(mergeKept(out, b)).toEqual(out);
		expect(mergeKept(undefined, undefined)).toEqual([]);
		expect(mergeKept(a, undefined)).toHaveLength(2);
	});

	it('drops what is not a note and keeps the newest KEPT_CAP', () => {
		expect(mergeKept([{ q: 'x' }, null, 'y', note('ok', 1)], undefined)).toEqual([note('ok', 1)]);
		expect(KEPT_CAP).toBe(500);
		const many = Array.from({ length: KEPT_CAP + 10 }, (_, i) => note('q' + i, i + 1));
		const out = mergeKept(many, []);
		expect(out).toHaveLength(KEPT_CAP);
		expect(out[0].ts).toBe(11);
		expect(out[out.length - 1].ts).toBe(KEPT_CAP + 10);
	});
});

describe('mergeItem', () => {
	it('takes the plain fields whole from the newer ts, and mine on a tie', () => {
		const mine = chicken();
		const theirs = { ...chicken(), description: 'their words', price: '26', ts: mine.ts + 1 };
		const out = mergeItem(mine, theirs);
		expect(out.description).toBe('their words');
		expect(out.price).toBe('26');
		expect(out.ts).toBe(mine.ts + 1);
		const tie = mergeItem(mine, { ...chicken(), description: 'their words' });
		expect(tie.description).toBe(mine.description);
		expect(mergeItem(theirs, mine).description).toBe('their words');
	});

	it('settles every mark on its own stamps, never with the item winner', () => {
		const mine = chicken();
		const theirs = chicken();
		theirs.ts = mine.ts + 1;
		theirs.description = 'edited later on another tablet';
		theirs.say = mark('her later guess', 'maitre', mine.say!.ts + 1000);
		theirs.why = mark('a newer kept why', 'person', mine.why!.ts + 1);
		delete theirs.pairs;
		const out = mergeItem(mine, theirs);
		expect(out.description).toBe('edited later on another tablet');
		expect(out.say).toEqual(mine.say);
		expect(out.why).toEqual(theirs.why);
		expect(out.pairs).toEqual(mine.pairs);
		expect(out.lines).toEqual(mine.lines);
	});

	it('unions kept and leaves an empty mark field absent, not undefined', () => {
		const mine = chicken();
		const theirs = chicken();
		theirs.kept = [note('another question', 1790672400001)];
		const out = mergeItem(mine, theirs);
		expect(out.kept!.map((n) => n.q)).toEqual([mine.kept![0].q, 'another question']);
		const plainA = clone(fixture.dishes[1]);
		const plainB = { ...clone(fixture.dishes[1]), ts: plainA.ts + 1 };
		const merged = mergeItem(plainA, plainB);
		for (const f of MARK_FIELDS.dishes) expect(f in merged, f).toBe(false);
		expect('kept' in merged).toBe(false);
	});

	it('carries a service note by presence: an empty newer side never blanks a written one', () => {
		const mine = { id: 'd-1', ts: 10, name: 'A', serviceNote: 'Confirm the stock at lineup.' } as unknown as Listed;
		const theirs = { id: 'd-1', ts: 20, name: 'A renamed', serviceNote: '' } as unknown as Listed;
		const out = mergeItem(mine, theirs) as unknown as Record<string, unknown>;
		expect(out.name).toBe('A renamed');
		expect(out.serviceNote).toBe('Confirm the stock at lineup.');
		const back = mergeItem(theirs, mine) as unknown as Record<string, unknown>;
		expect(back.serviceNote).toBe('Confirm the stock at lineup.');
		const both = mergeItem(mine, { ...theirs, serviceNote: 'Theirs, newer.' } as unknown as Listed) as unknown as Record<string, unknown>;
		expect(both.serviceNote).toBe('Theirs, newer.');
	});

	it('finds the marks by shape on a record without a kind, or takes them by name', () => {
		const a = clone(fixture.lexicon[0]);
		const b = clone(fixture.lexicon[0]);
		b.ts = a.ts + 1;
		b.term = 'Verjus (edited)';
		b.say = mark('hers, newer', 'maitre', a.say!.ts + 1);
		const out = mergeItem(a, b);
		expect(out.term).toBe('Verjus (edited)');
		expect(out.say).toEqual(a.say);
		const named = mergeItem(a, b, ['toGuest']);
		expect(named.say).toEqual(b.say);
		expect(named.toGuest).toEqual(a.toGuest);
	});
});

describe('lastTouch', () => {
	it('is the item\'s stamp, or the latest person\'s mark or kept note on it, and never hers', () => {
		const d = chicken();
		expect(lastTouch(d, MARK_FIELDS.dishes)).toBe(1790672400000);
		d.say = mark('kept later', 'person', 1790700000000);
		expect(lastTouch(d, MARK_FIELDS.dishes)).toBe(1790700000000);
		d.say = mark('hers later still', 'maitre', 1790800000000);
		expect(lastTouch(d, MARK_FIELDS.dishes)).toBe(1790672400000);
		d.kept = [note('q', 1790900000000)];
		expect(lastTouch(d, MARK_FIELDS.dishes)).toBe(1790900000000);
		expect(lastTouch(clone(fixture.dishes[1]), MARK_FIELDS.dishes)).toBe(fixture.dishes[1].ts);
	});
});

describe('mergeHouse', () => {
	it('merged with itself is itself, and counts nothing', () => {
		const { house, counts } = mergeHouse(clone(fixture), clone(fixture));
		expect(house).toEqual(fixture);
		expect(sameJson(house, fixture)).toBe(true);
		expect(counts).toEqual({ added: 0, updated: 0, keptMine: 0, removed: 0 });
	});

	it('adds what theirs has, updates a twin from the newer side, and counts mine kept when theirs was older', () => {
		const mine = clone(fixture);
		const theirs = clone(fixture);
		const extra: HouseDish = { ...clone(fixture.dishes[1]), id: 'd-newdish1', name: 'A New Dish', ts: fixture.dishes[1].ts + 5 };
		theirs.dishes.push(extra);
		theirs.dishes[0].description = 'newer on theirs';
		theirs.dishes[0].ts += 1;
		theirs.wines[0].style = 'older on theirs';
		theirs.wines[0].ts -= 1;
		const { house, counts } = mergeHouse(mine, theirs);
		expect(counts).toEqual({ added: 1, updated: 1, keptMine: 1, removed: 0 });
		expect(house.dishes.map((d) => d.id)).toEqual(['d-chicken1', 'd-beetrt01', 'd-newdish1']);
		expect(house.dishes[0].description).toBe('newer on theirs');
		expect(house.dishes[0].say).toEqual(fixture.dishes[0].say);
		expect(house.wines[0].style).toBe(fixture.wines[0].style);
	});

	it('drops an item on both sides under a tombstone newer than its last touch, and carries the tombstone', () => {
		const t = fixture.dishes[1].ts + 100;
		const mine = clone(fixture);
		const theirs = clone(fixture);
		theirs.dishes.splice(1, 1);
		theirs.removed['d-beetrt01'] = t;
		const a = mergeHouse(mine, theirs);
		expect(a.house.dishes.map((d) => d.id)).toEqual(['d-chicken1']);
		expect(a.house.removed['d-beetrt01']).toBe(t);
		expect(a.counts.removed).toBe(1);
		const b = mergeHouse(theirs, mine);
		expect(b.house.dishes.map((d) => d.id)).toEqual(['d-chicken1']);
		expect(b.counts.removed).toBe(1);
		expect(b.counts.added).toBe(0);
	});

	it('keeps an item edited after the tombstone, and one a person kept a mark on after it', () => {
		const mine = clone(fixture);
		const theirs = clone(fixture);
		theirs.dishes.splice(0, 1);
		theirs.removed['d-chicken1'] = fixture.dishes[0].ts + 10;
		const edited = mergeHouse({ ...mine, dishes: [{ ...mine.dishes[0], ts: fixture.dishes[0].ts + 20 }, mine.dishes[1]] }, theirs);
		expect(edited.house.dishes.map((d) => d.id)).toEqual(['d-chicken1', 'd-beetrt01']);
		expect(edited.counts.removed).toBe(0);
		const stale = clone(fixture);
		stale.dishes[0].ts = 1790589600000;
		for (const f of MARK_FIELDS.dishes) delete (stale.dishes[0] as unknown as Record<string, unknown>)[f];
		delete stale.dishes[0].kept;
		stale.dishes[0].say = mark('kept after the delete', 'person', fixture.dishes[0].ts + 30);
		const kept = mergeHouse(stale, theirs);
		expect(kept.house.dishes[0].id).toBe('d-chicken1');
		expect(kept.house.dishes[0].say!.value).toBe('kept after the delete');
		const hers = clone(stale);
		hers.dishes[0].say = mark('hers after the delete', 'maitre', fixture.dishes[0].ts + 30);
		expect(mergeHouse(hers, theirs).house.dishes.map((d) => d.id)).toEqual(['d-beetrt01']);
	});

	it('takes the card from the newer lastWrite, the history by pickMark, the later menusReadOn, the sources as a union and the build as the max per step', () => {
		const mine = clone(fixture);
		const theirs = clone(fixture);
		theirs.name = 'The Lantern Room, renamed';
		theirs.address = 'elsewhere';
		theirs.lastWrite = mine.lastWrite + 1;
		theirs.history = mark('her newer history', 'maitre', fixture.history!.ts + 1);
		theirs.menusReadOn = '2026-10-01';
		theirs.sources = [
			{ title: 'The dinner menu, printed card', url: '', readOn: '2026-10-01' },
			{ title: 'The site', url: 'https://lanternroom.example/menu', readOn: '2026-10-01' }
		];
		theirs.build.card = fixture.build.card! + 5;
		theirs.build.scenarios = fixture.build.scenarios! - 5;
		const { house } = mergeHouse(mine, theirs);
		expect(house.id).toBe(fixture.id);
		expect(house.name).toBe('The Lantern Room, renamed');
		expect(house.address).toBe('elsewhere');
		expect(house.history).toEqual(fixture.history);
		expect(house.menusReadOn).toBe('2026-10-01');
		expect(house.sources).toHaveLength(3);
		expect(house.sources.find((s) => s.title === 'The dinner menu, printed card')!.readOn).toBe('2026-10-01');
		expect(house.sources.find((s) => s.url === 'https://lanternroom.example/menu')).toBeDefined();
		expect(house.build.card).toBe(fixture.build.card! + 5);
		expect(house.build.scenarios).toBe(fixture.build.scenarios);
		expect(house.lastWrite).toBe(theirs.lastWrite);
		const back = mergeHouse(theirs, mine).house;
		expect(back.name).toBe('The Lantern Room, renamed');
		expect(back.history).toEqual(fixture.history);
		const older = mergeHouse(mine, { ...theirs, lastWrite: mine.lastWrite - 1 }).house;
		expect(older.name).toBe(fixture.name);
	});

	it('re-stamps their items with my id, so a pack of another id joins whole', () => {
		const mine = emptyHouse('h-myhouse1', 'My house', 'hand', 1790000000000);
		const theirs = clone(fixture);
		const { house, counts } = mergeHouse(mine, theirs);
		expect(house.id).toBe('h-myhouse1');
		expect(counts.added).toBe(HOUSE_LISTS.reduce((n, l) => n + houseRows(fixture, l).length, 0));
		for (const l of ['dishes', 'wines', 'cocktails'] as const) for (const item of house[l]) expect(item.house).toBe('h-myhouse1');
		expect(house.name).toBe(fixture.name);
	});

	it('settles askAtLineup and disputes by id on the newer ts', () => {
		const mine = clone(fixture);
		const theirs = clone(fixture);
		theirs.askAtLineup[0].answer = 'Chicken stock, always.';
		theirs.askAtLineup[0].ts += 1;
		theirs.disputes[0].resolution = 'The list is right: nine.';
		theirs.disputes[0].ts -= 1;
		const { house, counts } = mergeHouse(mine, theirs);
		expect(house.askAtLineup[0].answer).toBe('Chicken stock, always.');
		expect(house.disputes[0].resolution).toBeUndefined();
		expect(counts.updated).toBe(1);
		expect(counts.keptMine).toBe(1);
	});

	it('is symmetric up to list order and idempotent', () => {
		const a = clone(fixture);
		const b = clone(fixture);
		b.dishes[0].description = 'b edited this later';
		b.dishes[0].ts += 2;
		b.dishes[0].why = mark('b kept a later why', 'person', fixture.dishes[0].why!.ts + 2);
		b.dishes[1].say = mark('hers on b', 'maitre', 1790700000000);
		b.dishes.push({ ...clone(fixture.dishes[1]), id: 'd-onlyonb1', name: 'Only on B', ts: 1790700000000 });
		a.wines[0].kept = [note('a kept this', 1790700000001)];
		b.wines[0].kept = [note('b kept this', 1790700000002)];
		a.cocktails.splice(1, 1);
		a.removed['b-verjus01'] = 1790700000000;
		b.lexicon[1].say = mark('b kept the saying', 'person', 1790700000003);
		a.mustKnows[0].title = 'a edited the title';
		a.mustKnows[0].ts += 1;
		b.build.lexicon = fixture.build.lexicon! + 9;
		a.lastWrite += 5;
		const ab = mergeHouse(a, b).house;
		const ba = mergeHouse(b, a).house;
		expect(sorted(ba)).toEqual(sorted(ab));
		expect(mergeHouse(ab, b).house).toEqual(ab);
		expect(mergeHouse(ab, a).house).toEqual(ab);
		expect(mergeHouse(ab, ab).house).toEqual(ab);
		expect(ab.dishes[0].description).toBe('b edited this later');
		expect(ab.dishes[0].why!.value).toBe('b kept a later why');
		expect(ab.dishes[0].say).toEqual(fixture.dishes[0].say);
		expect(ab.wines[0].kept!.map((n) => n.q)).toEqual(['a kept this', 'b kept this']);
		expect(ab.cocktails.map((c) => c.id)).toEqual(['b-collins1']);
		expect(ab.lexicon[1].say!.value).toBe('b kept the saying');
		expect(ab.mustKnows[0].title).toBe('a edited the title');
	});
});

describe('sameJson and listOfKind', () => {
	it('compare JSON values deeply, in any key order, with undefined as absent', () => {
		expect(sameJson({ a: 1, b: [1, { c: 'x' }] }, { b: [1, { c: 'x' }], a: 1 })).toBe(true);
		expect(sameJson({ a: 1, b: undefined }, { a: 1 })).toBe(true);
		expect(sameJson({ a: 1 }, { a: 2 })).toBe(false);
		expect(sameJson([1, 2], [2, 1])).toBe(false);
		expect(sameJson(null, undefined)).toBe(false);
		expect(sameJson('x', 'x')).toBe(true);
	});

	it('name the list for a kind and nothing for a stranger', () => {
		expect(listOfKind('dish')).toBe('dishes');
		expect(listOfKind('wine')).toBe('wines');
		expect(listOfKind('cocktail')).toBe('cocktails');
		expect(listOfKind('tasting')).toBeUndefined();
	});
});
