/**
 * A tasting as the menu prints it: the subtitle under its name and the
 * pairing supplement, and on each course the choice of, the lines printed
 * under its dishes and the words printed over its pour. All five are
 * optional and written only when they say something, so a tasting from an
 * edition before them reads unchanged. The normaliser, the validator's
 * 'tasting' code and its caps, the merge, the pack round trip, the edition
 * refresh and the tasting flash cards (one per course, in printed order).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { KEYS, OPTIONAL_KEYS, TASTING_WORDS, tastingShortName } from './house-schema';
import type { House, Tasting } from './house-schema';
import { FORBIDDEN_KEY, normaliseHouse } from './house-normalise';
import { FATAL_CODES, validateHouse } from './house-validate';
import { mergeHouse, sameJson } from './house-merge';
import { buildPack, readPack, refreshEdition } from './house-pack';
import { buildFlashcards } from './house-drills';

const fixture: House = JSON.parse(readFileSync(fileURLToPath(new URL('./fixtures/house-min.json', import.meta.url)), 'utf8'));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
const NOW = 1790800000000;

function seeded(seed = 1): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const words = (n: number) => Array.from({ length: n }, (_, i) => 'word' + i).join(' ');
const problemsAt = (h: House, code: string) => validateHouse(h).problems.filter((p) => p.code === code).map((p) => p.path);

/** The fixture's tasting as a printed menu: a subtitle, a supplement, a drink course, a choice of and the pour labels. */
function printed(): House {
	const h = clone(fixture);
	const t = h.tastings[0];
	t.line = 'Celebrating the harbour! Price includes every course.';
	t.supplement = 'Add the Wine Pairing, three pours $30.00';
	t.courses = [
		{ n: 1, label: 'Welcome Drink', dishIds: [], pourId: 'b-collins1', pourText: 'The Lantern Collins', printed: ['Gin, lemon, soda'] },
		{ n: 2, label: 'First Course', dishIds: ['d-beetrt01', 'd-chicken1'], pourId: 'w-lantern1', pourText: 'Quay Lane Harbour White 2024 [4oz]', choice: true, pourLabel: 'Paired with' },
		{ n: 3, label: 'Second Course', dishIds: ['d-chicken1'], pourId: 'w-lantern1', pourText: '', printed: ['Salt Crust, Lemon, Thyme'], pourLabel: 'Suggested Pairing' }
	];
	return h;
}

describe('the keys', () => {
	it('list the five fields, mark them optional, and name none the client refuses', () => {
		expect(KEYS.Tasting).toEqual(['id', 'name', 'price', 'meal', 'includesDrinks', 'courses', 'note', 'line', 'supplement', 'ts']);
		expect(KEYS.TastingCourse).toEqual(['n', 'label', 'dishIds', 'pourId', 'pourText', 'choice', 'printed', 'pourLabel']);
		expect(OPTIONAL_KEYS.Tasting).toEqual(['line', 'supplement']);
		expect(OPTIONAL_KEYS.TastingCourse).toEqual(['choice', 'printed', 'pourLabel']);
		expect(TASTING_WORDS).toEqual({ line: 40, supplement: 20, printed: 40, pourLabel: 4 });
		for (const k of [...KEYS.Tasting, ...KEYS.TastingCourse]) expect(k).not.toMatch(FORBIDDEN_KEY);
		expect(FATAL_CODES).toContain('tasting');
	});
});

describe('the normaliser', () => {
	it('leaves a tasting from before the fields with exactly the keys it went in with', () => {
		const { house, report } = normaliseHouse(clone(fixture), { rand: seeded() });
		expect(report).toEqual([]);
		expect(JSON.stringify(house.tastings)).toBe(JSON.stringify(fixture.tastings));
		for (const c of house.tastings[0].courses) for (const k of OPTIONAL_KEYS.TastingCourse) expect(k in c).toBe(false);
		for (const k of OPTIONAL_KEYS.Tasting) expect(k in house.tastings[0]).toBe(false);
	});

	it('keeps every field that says something, in the schema\'s key order', () => {
		const { house } = normaliseHouse(printed(), { rand: seeded() });
		const t = house.tastings[0];
		expect(Object.keys(t)).toEqual(['id', 'name', 'price', 'meal', 'includesDrinks', 'courses', 'note', 'line', 'supplement', 'ts']);
		expect(t.line).toBe('Celebrating the harbour! Price includes every course.');
		expect(t.supplement).toBe('Add the Wine Pairing, three pours $30.00');
		expect(Object.keys(t.courses[0])).toEqual(['n', 'label', 'dishIds', 'pourId', 'pourText', 'printed']);
		expect(Object.keys(t.courses[1])).toEqual(['n', 'label', 'dishIds', 'pourId', 'pourText', 'choice', 'pourLabel']);
		expect(Object.keys(t.courses[2])).toEqual(['n', 'label', 'dishIds', 'pourId', 'pourText', 'printed', 'pourLabel']);
		expect(t.courses[1].choice).toBe(true);
		expect(t.courses[2].printed).toEqual(['Salt Crust, Lemon, Thyme']);
		expect(t.courses[2].pourLabel).toBe('Suggested Pairing');
	});

	it('drops what says nothing: a blank subtitle, a choice that is not true, blank printed lines, a blank label', () => {
		const h = printed();
		const t = h.tastings[0] as unknown as Record<string, unknown>;
		t.line = '   ';
		t.supplement = '';
		const c = h.tastings[0].courses[1] as unknown as Record<string, unknown>;
		c.choice = 'yes';
		c.printed = ['', '  ', 7, 'Kept'];
		c.pourLabel = ' ';
		const { house } = normaliseHouse(h, { rand: seeded() });
		const out = house.tastings[0];
		expect('line' in out).toBe(false);
		expect('supplement' in out).toBe(false);
		expect('choice' in out.courses[1]).toBe(false);
		expect(out.courses[1].printed).toEqual(['Kept']);
		expect('pourLabel' in out.courses[1]).toBe(false);
	});

	it('follows a re-minted dish id into a choice of, the printed lines untouched', () => {
		const h = printed();
		h.dishes[1].id = 'bad id:chicken';
		h.tastings[0].courses[1].dishIds = ['d-beetrt01', 'bad id:chicken'];
		h.tastings[0].courses[2].dishIds = ['bad id:chicken'];
		const { house } = normaliseHouse(h, { rand: seeded(5) });
		const id = house.dishes[1].id;
		expect(id).toMatch(/^d-/);
		expect(house.tastings[0].courses[1].dishIds).toEqual(['d-beetrt01', id]);
		expect(house.tastings[0].courses[2].dishIds).toEqual([id]);
		expect(house.tastings[0].courses[2].printed).toEqual(['Salt Crust, Lemon, Thyme']);
	});
});

describe('the validator', () => {
	it('finds nothing in a well printed tasting', () => {
		const { house } = normaliseHouse(printed(), { rand: seeded() });
		expect(validateHouse(house)).toEqual({ problems: [], fatalCount: 0 });
	});

	it('names a choice of fewer than two dishes, a label over no pour and printed lines over nothing, each fatal', () => {
		const h = printed();
		h.tastings[0].courses[1].dishIds = ['d-beetrt01'];
		h.tastings[0].courses.push({ n: 4, label: 'Fourth Course', dishIds: [], pourId: '', pourText: '', pourLabel: 'Paired with', printed: ['A line under nothing'] });
		const { problems, fatalCount } = validateHouse(h);
		const at = problems.filter((p) => p.code === 'tasting').map((p) => p.path);
		expect(at).toEqual(['house.tastings[0].courses[1].choice', 'house.tastings[0].courses[3].pourLabel', 'house.tastings[0].courses[3].printed']);
		expect(problems.filter((p) => p.code === 'tasting').every((p) => p.fatal)).toBe(true);
		expect(fatalCount).toBe(3);
	});

	it('holds the subtitle, the supplement, each printed line and each pour label to their caps', () => {
		const h = printed();
		h.tastings[0].line = words(TASTING_WORDS.line + 1);
		h.tastings[0].supplement = words(TASTING_WORDS.supplement + 1);
		h.tastings[0].courses[0].printed = ['short', words(TASTING_WORDS.printed + 1)];
		h.tastings[0].courses[1].pourLabel = words(TASTING_WORDS.pourLabel + 1);
		expect(problemsAt(h, 'word-cap')).toEqual([
			'house.tastings[0].line',
			'house.tastings[0].supplement',
			'house.tastings[0].courses[0].printed[1]',
			'house.tastings[0].courses[1].pourLabel'
		]);
		h.tastings[0].line = words(TASTING_WORDS.line);
		h.tastings[0].supplement = words(TASTING_WORDS.supplement);
		h.tastings[0].courses[0].printed = [words(TASTING_WORDS.printed)];
		h.tastings[0].courses[1].pourLabel = words(TASTING_WORDS.pourLabel);
		expect(problemsAt(h, 'word-cap')).toEqual([]);
	});

	it('refuses a dash in a printed line or a label like any string the house owns, and still checks the refs', () => {
		const h = printed();
		h.tastings[0].courses[0].printed = ['Oatmeal' + String.fromCharCode(0x2013) + 'pecan'];
		h.tastings[0].courses[2].dishIds = ['d-nowhere1'];
		expect(problemsAt(h, 'dash')).toEqual(['house.tastings[0].courses[0].printed[0]']);
		expect(problemsAt(h, 'ref')).toEqual(['house.tastings[0].courses[2].dishIds[0]']);
	});
});

describe('the merge, the pack and the edition', () => {
	it('carries the fields whole with the newer tasting, and a second merge changes nothing', () => {
		const mine = clone(fixture);
		const theirs = printed();
		theirs.tastings[0].ts = fixture.tastings[0].ts + 1000;
		const first = mergeHouse(mine, clone(theirs));
		expect(first.house.tastings[0]).toEqual(theirs.tastings[0]);
		expect(first.counts.updated).toBe(1);
		const again = mergeHouse(first.house, clone(theirs));
		expect(sameJson(again.house, first.house)).toBe(true);
		/* The older side does not strip the fields from the newer one. */
		const back = mergeHouse(clone(theirs), clone(fixture));
		expect(back.house.tastings[0].courses[1].choice).toBe(true);
	});

	it('round trips every field byte for byte through buildPack and readPack', () => {
		const h = normaliseHouse(printed(), { rand: seeded() }).house;
		const read = readPack(JSON.stringify(buildPack(clone(h), 'tools', NOW)), { rand: seeded() });
		expect(read.ok).toBe(true);
		if (!read.ok) return;
		expect(read.report).toEqual([]);
		expect(read.fatalCount).toBe(0);
		expect(JSON.stringify(read.house.tastings)).toBe(JSON.stringify(h.tastings));
	});

	it('a new edition\'s printed tasting, renamed, reaches a device on the old one under the same id', () => {
		const device = clone(fixture);
		const shipped = printed();
		shipped.tastings[0].name = 'The Harbour Supper Menu';
		const { house } = refreshEdition(device, shipped);
		const t = house.tastings[0] as Tasting;
		expect(t.id).toBe(fixture.tastings[0].id);
		expect(t.name).toBe('The Harbour Supper Menu');
		expect(t.line).toBe(shipped.tastings[0].line);
		expect(t.courses.map((c) => c.label)).toEqual(['Welcome Drink', 'First Course', 'Second Course']);
		const again = refreshEdition(house, clone(shipped));
		expect(sameJson(again.house, house)).toBe(true);
	});

	it('a tasting a person edited on the device stays theirs through a newer edition', () => {
		const device = clone(fixture);
		device.tastings[0].note = 'Our own note, written on the floor.';
		device.tastings[0].ts = fixture.tastings[0].ts + 60000;
		const shipped = printed();
		const { house } = refreshEdition(device, shipped);
		expect(house.tastings[0].note).toBe('Our own note, written on the floor.');
	});
});

describe('the tasting flash cards', () => {
	it('deal one card per course in printed order, the drink course alone, the choice of joined by or, each label as printed', () => {
		const cards = buildFlashcards(printed()).filter((c) => c.kind === 'tasting');
		expect(cards).toEqual([
			{ kind: 'tasting', front: 'The Harbour Supper: Welcome Drink', back: 'The Lantern Collins', itemId: 't-harbour1', course: 1 },
			{ kind: 'tasting', front: 'The Harbour Supper: First Course', back: 'Choice of Beetroot and Apple Salad or Lantern Roast Chicken. Paired with Quay Lane Harbour White 2024 [4oz]', itemId: 't-harbour1', course: 2 },
			{ kind: 'tasting', front: 'The Harbour Supper: Second Course', back: 'Lantern Roast Chicken. Suggested Pairing: Quay Lane Harbour White 2024', itemId: 't-harbour1', course: 3 }
		]);
	});

	it('read an older tasting too: the pour text it printed, Paired with when it printed no label', () => {
		const cards = buildFlashcards(fixture).filter((c) => c.kind === 'tasting');
		expect(cards.map((c) => [c.front, c.back])).toEqual([
			['The Harbour Supper: To start', 'Beetroot and Apple Salad. Paired with A glass of the Harbour White'],
			['The Harbour Supper: The main', 'Lantern Roast Chicken']
		]);
	});

	it('make no card for a course with no label or nothing that resolves', () => {
		const h = printed();
		h.tastings[0].courses[0].label = ' ';
		h.tastings[0].courses[2].dishIds = ['d-nowhere1'];
		h.tastings[0].courses[2].pourId = '';
		const cards = buildFlashcards(h).filter((c) => c.kind === 'tasting');
		expect(cards.map((c) => c.course)).toEqual([2]);
	});

	it('name a tasting the short way: the house\'s own name off its end, either apostrophe', () => {
		expect(tastingShortName('Traditional Breakfast at Brennan’s', 'Brennan’s')).toBe('Traditional Breakfast');
		expect(tastingShortName("Traditional Breakfast at Brennan's", 'Brennan’s')).toBe('Traditional Breakfast');
		expect(tastingShortName('Dinner Tasting Menu', 'Brennan’s')).toBe('Dinner Tasting Menu');
		expect(tastingShortName('  At Brennan’s  ', 'Brennan’s')).toBe('At Brennan’s');
		expect(tastingShortName('Supper', '')).toBe('Supper');
	});
});
