import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
	DRILL_FLOOR,
	DRILL_FLOORS,
	DRILL_KINDS,
	DRILL_LABELS,
	FLASHCARD_KINDS,
	LINE_LABELS,
	OPTION_COUNT,
	buildFlashcards,
	cocktailGlass,
	cocktailSpec,
	dealQuestion,
	drillableCounts,
	firstPickFor,
	lineToDish,
	mixUp,
	readyKinds,
	sauceOf,
	sayIt,
	sidesOf,
	termToGuest,
	wineGoesWith,
	wineGrapes,
	zeroProofFor,
	gradeSaid,
	gradeScenario,
	sayable,
	roleable,
	numberWords,
	CAP_NAMES,
	GRADE_MET,
	GRADE_CLOSE
} from './house-drills';
import type { DrillKind, DrillQuestion, Flashcard, Rand } from './house-drills';
import { HOUSE_LISTS, ID_PREFIXES, KEYS, houseRows } from './house-schema';
import type { FormulaParts, House, HouseCocktail, HouseDish, HouseWine, LexiconTerm, Lines, Mark, MixUp, Pairing, Principle } from './house-schema';

/**
 * The drills are pure generators over a House, so what is under test is the
 * contract a screen leans on: a kept mark reaches a question and an unkept
 * one never does; a kind deals four distinct options with the answer among
 * them or returns null by the floor rule; a stem never carries its answer;
 * every draw comes from the source handed in, so a seed replays a round to
 * the character; and the flashcards come from kept marks alone.
 *
 * The fixture (one dish with every mark kept, one wine, two cocktails, two
 * terms, one mix-up) is under every floor on purpose: it pins the null side.
 * A widened copy (six dishes, five wines, five cocktails, five terms, four
 * mix-ups, every new mark kept) pins the dealing side. The em dash is never
 * spelled out in this file: the gate regex is built from escapes.
 */

const here = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const FIXTURE_PATH = here('./fixtures/house-min.json');
const MODULE_PATH = here('./house-drills.ts');
const TEST_PATH = here('./house-drills.test.ts');

/** The client's rule, copied literally; house-schema.test.ts proves the copy is current. */
const FORBIDDEN_KEY = /allerg|contain|free|safe|suitab|vegan|nut/i;

/** Every dash spelling the publish gate counts, plus the en dash, built from escapes. */
const DASH = new RegExp(['\\u2014', '\\u2013', '&' + 'mdash;', '&#' + '8212;', '&#' + 'x2014;', ' ' + '-- '].join('|'));

const fixture = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as House;
const HOUSE_ID = fixture.id;
const TS = 1790672400000;

/** A seeded random source, so a round is the same on every run. */
function seeded(seed: number): Rand {
	let s = seed >>> 0;
	return () => {
		s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
		return s / 4294967296;
	};
}

/** The test's own fold, independent of the module's: lower case, whitespace collapsed. */
const fold = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const kept = <T>(value: T): Mark<T> => ({ value, by: 'person', ts: TS });
const hers = <T>(value: T): Mark<T> => ({ value, by: 'maitre', ts: TS });

/* ---- builders for the widened house ----------------------------------- */

function dish(id: string, name: string, more: Partial<HouseDish> = {}): HouseDish {
	return {
		id, house: HOUSE_ID, kind: 'dish', name, section: 'Mains', meals: ['Dinner'], price: '22',
		prices: [{ meal: 'Dinner', printed: '22' }], description: '', ingredients: [], marks: [],
		signature: false, serviceNote: '', ts: TS, ...more
	};
}

function wine(id: string, name: string, grapes: string[], more: Partial<HouseWine> = {}): HouseWine {
	return {
		id, house: HOUSE_ID, kind: 'wine', name, section: 'By the glass', meals: ['Dinner'], price: '10',
		prices: [{ meal: 'Dinner', printed: '10' }], producer: '', wine: name, vintage: '', region: '', grapes,
		style: '', glass: '10', bottle: '40', pours: [], serviceNote: '', ts: TS, ...more
	};
}

function cocktail(id: string, name: string, glass: string, spec: string[], more: Partial<HouseCocktail> = {}): HouseCocktail {
	return {
		id, house: HOUSE_ID, kind: 'cocktail', name, section: 'Cocktails', meals: ['Dinner'], price: '12',
		prices: [{ meal: 'Dinner', printed: '12' }], spec, method: '', glass, garnish: '', note: '', family: '',
		spirit: '', zeroProof: false, serviceNote: '', ts: TS, ...more
	};
}

function term(id: string, word: string, say: string, toGuest: string): LexiconTerm {
	return { id, term: word, say: kept(say), toGuest: kept(toGuest), itemIds: [], ts: TS };
}

function mixup(id: string, aId: string, bId: string, difference: string, ask: string): MixUp {
	return { id, aId, bId, difference: kept(difference), ask: kept(ask), ts: TS };
}

/** A full set of kept marks for a new dish: parts, lines, pairing and say, none naming the dish. */
function dishMarks(wineId: string, zeroProofId: string, sauce: string, sides: string, s10: string, s20: string, say: string): Partial<HouseDish> {
	return {
		parts: kept({ main: 'the main thing', technique: 'the way it is cooked', sauce, sides, taste: 'how it tastes' }),
		lines: kept({ s10, s20, s45: s20 + ' And a little more, for the table that wants the whole story.' }),
		pairing: kept({
			wineId, why: 'because it fits', sayIt: 'I would pour this with it', whyThisWine: 'the acid', palate: 'bright',
			principles: ['acid' as Principle], secondId: '', secondWhy: '', stepUp: '', serve: 'chilled', avoid: 'anything heavy',
			zeroProofId, zeroProofWhy: 'the same edge without the alcohol'
		}),
		say: kept(say)
	};
}

/** The fixture with every list widened past the floor, every new mark kept. */
function widened(): House {
	const h = clone(fixture);
	h.wines.push(
		wine('w-redhil01', 'Red Hill Estate 2022', ['Pinot Noir'], { goesWith: kept('The lamb, the mushroom pie, anything off the hearth.'), say: kept('Red Hill, as it sounds; the estate on the ridge.') }),
		wine('w-oldmil01', 'Old Mill Rose 2023', ['Grenache', 'Cinsault'], { goesWith: kept('The sea bass and the beetroot salad.'), say: kept('Old Mill, as it reads, with the ROZ ay said the French way.') }),
		wine('w-chalkp01', 'Chalk Pit Sparkling', ['Chardonnay', 'Pinot Meunier'], { goesWith: kept('The tart, or on its own before the meal.'), say: kept('Chalk Pit, as it reads.') }),
		wine('w-hearth01', 'Hearth Red 2021', ['Syrah'], { goesWith: kept('The lamb shoulder and the chicken on a cold night.'), say: kept('As it reads: the red named for the fire.') })
	);
	h.cocktails.push(
		cocktail('b-sour0001', 'The Quay Sour', 'Coupe', ['50 ml whisky', '25 ml lemon', '15 ml sugar', 'a drop of bitters'], { say: kept('The Quay Sour, KEE like the harbour wall.') }),
		cocktail('b-negro001', 'Harbour Negroni', 'Rocks', ['30 ml gin', '30 ml bitter red', '30 ml sweet vermouth'], { say: kept('neh GROH nee, the harbour one.') }),
		cocktail('b-spritz01', 'Lamp Store Spritz', 'Wine glass', ['60 ml bitter orange', '90 ml sparkling', 'top soda'], { say: kept('As it reads, the spritz named for the old shop.') })
	);
	h.dishes.push(
		dish('d-lambsh01', 'Lamb Shoulder', dishMarks('w-hearth01', 'b-verjus01', 'Anchovy and rosemary jus', 'White beans and greens', 'Slow roast shoulder with anchovy, rosemary and white beans.', 'A shoulder roasted for six hours until it falls from the bone, with a jus of anchovy and rosemary, white beans and greens from the garden.', 'LAM shoulder, the b silent.')),
		dish('d-seabas01', 'Sea Bass', dishMarks('w-oldmil01', 'b-verjus01', 'Brown butter and capers', 'Fennel and new potatoes', 'A whole fish roasted in the oven with brown butter, capers and fennel.', 'A whole fish from the day boat, roasted in the oven and finished with brown butter and capers, with shaved fennel and new potatoes beside it.', 'As it reads: the fish from the day boat.')),
		dish('d-mushrm01', 'Mushroom Pie', dishMarks('w-redhil01', 'b-verjus01', 'Thyme cream', 'Buttered greens', 'A pie of field mushrooms in thyme cream under a pastry lid.', 'Field mushrooms cooked down with thyme and cream, baked under a pastry lid in its own dish, with buttered greens beside it.', 'As it reads, the pie under the lid.')),
		dish('d-lemont01', 'Lemon Tart', dishMarks('w-chalkp01', 'b-verjus01', 'Creme fraiche', 'A few raspberries', 'A sharp set custard in sweet pastry with creme fraiche.', 'A sharp set custard in thin sweet pastry, baked until the top just catches, with creme fraiche and a few raspberries.', 'As it reads, the sharp one at the end.'))
	);
	h.lexicon.push(
		term('x-sabayo01', 'Sabayon', 'sa ba YON', 'A warm whipped sauce, light as foam, served over the tart.'),
		term('x-confit01', 'Confit', 'kon FEE', 'Cooked slowly in fat until it falls apart.'),
		term('x-jus00001', 'Jus', 'ZHOO', 'The pan gravy, reduced until it coats a spoon.')
	);
	h.mixUps.push(
		mixup('m-lambsea1', 'd-lambsh01', 'd-seabas01', 'One is from the hearth and takes six hours; the other is from the oven and takes twenty minutes.', 'Are you in a hurry tonight?'),
		mixup('m-redred01', 'w-redhil01', 'w-hearth01', 'One is light and from the ridge; the other is dark and named for the fire.', 'Something light, or something with weight?'),
		mixup('m-sournegr', 'b-sour0001', 'b-negro001', 'One is sharp and shaken; the other is bitter and stirred.', 'Sharp or bitter?')
	);
	return h;
}

/** Every id on the house, by list, so an itemId can be checked against the list its kind reads. */
function idsOf(house: House): Map<string, string> {
	const out = new Map<string, string>();
	for (const list of HOUSE_LISTS) for (const row of houseRows(house, list) as Array<{ id: string }>) out.set(row.id, list);
	return out;
}

/** What a well-formed question must satisfy, whatever the kind. */
function expectWellFormed(q: DrillQuestion, kind: DrillKind, house: House) {
	expect(q.kind).toBe(kind);
	expect(Object.keys(q).sort()).toEqual(['answer', 'itemId', 'kind', 'options', 'stem']);
	expect(q.stem.trim().length).toBeGreaterThan(0);
	expect(q.options).toHaveLength(OPTION_COUNT);
	expect(new Set(q.options.map(fold)).size).toBe(OPTION_COUNT);
	for (const o of q.options) expect(o.trim().length).toBeGreaterThan(0);
	expect(q.options).toContain(q.answer);
	expect(fold(q.stem).includes(fold(q.answer)), `${kind}: the stem "${q.stem}" carries its answer "${q.answer}"`).toBe(false);
	expect(idsOf(house).has(q.itemId), `${kind}: ${q.itemId} is not on the house`).toBe(true);
	expect(q.stem).not.toMatch(DASH);
	for (const o of q.options) expect(o).not.toMatch(DASH);
}

const GENERATORS: Record<DrillKind, (house: House, rand: Rand) => DrillQuestion | null> = {
	lineToDish, sauceOf, sidesOf, firstPickFor, zeroProofFor, termToGuest, sayIt, mixUp, wineGrapes, wineGoesWith, cocktailGlass, cocktailSpec
};

afterEach(() => {
	vi.restoreAllMocks();
});

describe('the constants', () => {
	it('name twelve kinds, four options, a floor of four for every kind, and a label and a line label free of dashes', () => {
		expect(DRILL_KINDS).toEqual(['lineToDish', 'sauceOf', 'sidesOf', 'firstPickFor', 'zeroProofFor', 'termToGuest', 'sayIt', 'mixUp', 'wineGrapes', 'wineGoesWith', 'cocktailGlass', 'cocktailSpec']);
		expect(OPTION_COUNT).toBe(4);
		expect(DRILL_FLOOR).toBe(4);
		expect(Object.keys(DRILL_FLOORS).sort()).toEqual([...DRILL_KINDS].sort());
		for (const kind of DRILL_KINDS) expect(DRILL_FLOORS[kind]).toBe(DRILL_FLOOR);
		expect(Object.keys(DRILL_LABELS).sort()).toEqual([...DRILL_KINDS].sort());
		for (const label of Object.values(DRILL_LABELS)) {
			expect(label).not.toMatch(DASH);
			expect(label.trim().length).toBeGreaterThan(0);
		}
		expect(Object.keys(LINE_LABELS)).toEqual([...KEYS.Lines]);
		for (const label of Object.values(LINE_LABELS)) expect(label).not.toMatch(/[0-9]/);
		expect(FLASHCARD_KINDS).toEqual(['part', 'line', 'term', 'mixUp', 'pairing', 'component']);
		expect(Object.keys(GENERATORS).sort()).toEqual([...DRILL_KINDS].sort());
	});

	it('name no key the client would refuse, on a question, a card, a kind or a count', () => {
		const q = lineToDish(widened(), seeded(1)) as DrillQuestion;
		const card = buildFlashcards(fixture)[0] as Flashcard;
		const keys = [...Object.keys(q), ...Object.keys(card), ...DRILL_KINDS, ...FLASHCARD_KINDS, ...Object.keys(drillableCounts(fixture)), ...Object.keys(LINE_LABELS)];
		for (const k of keys) expect(k).not.toMatch(FORBIDDEN_KEY);
	});
});

describe('the two files', () => {
	it('carry no dash in any spelling and no carriage return, and the module is pure ASCII', () => {
		for (const p of [MODULE_PATH, TEST_PATH]) {
			const text = readFileSync(p, 'utf8');
			expect(text, p).not.toMatch(DASH);
			expect(text.includes('\r'), `${p} carries a carriage return`).toBe(false);
		}
		expect(/[^\x00-\x7f]/.test(readFileSync(MODULE_PATH, 'utf8')), 'the module must be pure ASCII').toBe(false);
	});

	it('keep the module portable: imports from the house directory only, no Math.random, no DOM, no Node', () => {
		const src = readFileSync(MODULE_PATH, 'utf8');
		const specifiers = [...src.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
		expect(specifiers.length).toBeGreaterThan(0);
		for (const s of specifiers) expect(s).toMatch(/^\.\/house-/);
		/* The header may name the thing it never does; a call is what is refused. */
		expect(src).not.toMatch(/Math\.random\s*\(/);
		for (const word of ['window', 'document', 'localStorage', 'process.', 'require(', 'node:']) expect(src.includes(word), word).toBe(false);
	});
});

describe('the fixture, under every floor', () => {
	it('counts the drillable items per kind, reading kept marks and leaving out a stem that names its answer', () => {
		expect(drillableCounts(fixture)).toEqual({
			lineToDish: 1,
			sauceOf: 1,
			sidesOf: 1,
			firstPickFor: 1,
			zeroProofFor: 1,
			termToGuest: 1,
			/* the chicken, the wine and the Verjus term; the Collins and Salt baked say their own names */
			sayIt: 3,
			mixUp: 1,
			wineGrapes: 1,
			wineGoesWith: 1,
			cocktailGlass: 2,
			cocktailSpec: 1
		});
		expect(readyKinds(fixture)).toEqual([]);
	});

	it('deals nothing of any kind, by the floor rule', () => {
		const rand = seeded(7);
		for (const kind of DRILL_KINDS) {
			expect(GENERATORS[kind](fixture, rand), kind).toBeNull();
			expect(dealQuestion(fixture, kind, rand), kind).toBeNull();
		}
	});
});

describe('the widened house', () => {
	it('is drillable in every kind, and every generator deals a well-formed question', () => {
		const house = widened();
		const counts = drillableCounts(house);
		for (const kind of DRILL_KINDS) expect(counts[kind], kind).toBeGreaterThanOrEqual(DRILL_FLOORS[kind]);
		expect(readyKinds(house)).toEqual([...DRILL_KINDS]);
		for (const kind of DRILL_KINDS) {
			const q = GENERATORS[kind](house, seeded(3));
			expect(q, kind).not.toBeNull();
			expectWellFormed(q as DrillQuestion, kind, house);
		}
	});

	it('deals or returns null exactly as readyKinds says, on the fixture, the widened house and one in between', () => {
		const between = widened();
		between.wines = between.wines.slice(0, 2);
		between.mixUps = between.mixUps.slice(0, 3);
		for (const house of [fixture, widened(), between]) {
			const ready = readyKinds(house);
			for (const kind of DRILL_KINDS) {
				const q = dealQuestion(house, kind, seeded(11));
				expect(q !== null, `${kind} on a house with ${ready.length} ready kinds`).toBe(ready.includes(kind));
				if (q) expectWellFormed(q, kind, house);
			}
		}
		expect(readyKinds(between)).not.toContain('firstPickFor');
		expect(readyKinds(between)).not.toContain('wineGrapes');
		expect(readyKinds(between)).not.toContain('mixUp');
		expect(readyKinds(between)).toContain('lineToDish');
	});

	it('never lets a stem carry its answer, over two hundred seeds and every kind', () => {
		const house = widened();
		for (let seed = 1; seed <= 200; seed++) {
			for (const kind of DRILL_KINDS) {
				const q = dealQuestion(house, kind, seeded(seed));
				expect(q, `${kind} at seed ${seed}`).not.toBeNull();
				expectWellFormed(q as DrillQuestion, kind, house);
			}
		}
	});

	it('asks what each kind says it asks, and points at the record it is about', () => {
		const house = widened();
		const q = (kind: DrillKind, seed: number) => dealQuestion(house, kind, seeded(seed)) as DrillQuestion;
		const names = (rows: ReadonlyArray<{ name: string }>) => rows.map((r) => r.name);
		for (let seed = 1; seed <= 12; seed++) {
			const line = q('lineToDish', seed);
			const dish = house.dishes.find((d) => d.id === line.itemId) as HouseDish;
			expect([dish.lines?.value.s10, dish.lines?.value.s20]).toContain(line.stem);
			expect(line.answer).toBe(dish.name);
			for (const o of line.options) expect(names(house.dishes)).toContain(o);

			const sauce = q('sauceOf', seed);
			expect(sauce.stem).toBe((house.dishes.find((d) => d.id === sauce.itemId) as HouseDish).parts?.value.sauce);
			const sides = q('sidesOf', seed);
			expect(sides.stem).toBe((house.dishes.find((d) => d.id === sides.itemId) as HouseDish).parts?.value.sides);

			const pick = q('firstPickFor', seed);
			const paired = house.dishes.find((d) => d.id === pick.itemId) as HouseDish;
			expect(pick.stem).toBe(paired.name);
			expect(pick.answer).toBe(house.wines.find((w) => w.id === paired.pairing?.value.wineId)?.name);
			for (const o of pick.options) expect(names(house.wines)).toContain(o);

			const zero = q('zeroProofFor', seed);
			expect(zero.answer).toBe('Verjus and Tonic');
			for (const o of zero.options) expect(names(house.cocktails)).toContain(o);

			const guest = q('termToGuest', seed);
			const t = house.lexicon.find((x) => x.id === guest.itemId) as LexiconTerm;
			expect(guest.stem).toBe(t.toGuest?.value);
			expect(guest.answer).toBe(t.term);

			const said = q('sayIt', seed);
			expect(said.itemId).toMatch(/^[xdwb]-/);

			const pair = q('mixUp', seed);
			expect(pair.answer).toMatch(/ or /);
			expect(pair.itemId).toMatch(/^m-/);

			const grapes = q('wineGrapes', seed);
			const w = house.wines.find((x) => x.id === grapes.itemId) as HouseWine;
			expect(grapes.stem).toBe(w.name);
			expect(grapes.answer).toBe(w.grapes.join(', '));

			const goes = q('wineGoesWith', seed);
			expect(goes.stem).toBe((house.wines.find((x) => x.id === goes.itemId) as HouseWine).goesWith?.value);

			const glass = q('cocktailGlass', seed);
			const b = house.cocktails.find((x) => x.id === glass.itemId) as HouseCocktail;
			expect(glass.stem).toBe(b.name);
			expect(glass.answer).toBe(b.glass);

			const spec = q('cocktailSpec', seed);
			const c = house.cocktails.find((x) => x.id === spec.itemId) as HouseCocktail;
			expect(spec.stem).toBe(c.spec.join(', '));
			expect(spec.answer).toBe(c.name);
		}
	});

	it('leaves out a record whose stem would carry its answer, and the Collins says its own name', () => {
		const house = widened();
		const collins = house.cocktails.find((b) => b.id === 'b-collins1') as HouseCocktail;
		expect(collins.say?.by).toBe('person');
		for (let seed = 1; seed <= 60; seed++) {
			const q = sayIt(house, seeded(seed)) as DrillQuestion;
			expect(q.itemId).not.toBe('b-collins1');
			expect(q.itemId).not.toBe('x-saltbak1');
		}
		const before = drillableCounts(house).wineGrapes;
		(house.wines.find((w) => w.id === 'w-hearth01') as HouseWine).name = 'Hearth Syrah 2021';
		expect(drillableCounts(house).wineGrapes).toBe(before - 1);
	});
});

describe('kept marks only', () => {
	it('counts a mark she wrote and nobody kept as nothing, in every kind that reads one', () => {
		const house = widened();
		const before = drillableCounts(house);
		for (const d of house.dishes) {
			if (d.lines) d.lines = hers(d.lines.value);
			if (d.parts) d.parts = hers(d.parts.value);
			if (d.pairing) d.pairing = hers(d.pairing.value);
			if (d.say) d.say = hers(d.say.value);
		}
		for (const w of house.wines) {
			if (w.goesWith) w.goesWith = hers(w.goesWith.value);
			if (w.say) w.say = hers(w.say.value);
		}
		for (const b of house.cocktails) if (b.say) b.say = hers(b.say.value);
		for (const t of house.lexicon) {
			if (t.say) t.say = hers(t.say.value);
			if (t.toGuest) t.toGuest = hers(t.toGuest.value);
		}
		for (const m of house.mixUps) if (m.difference) m.difference = hers(m.difference.value);
		const after = drillableCounts(house);
		for (const kind of ['lineToDish', 'sauceOf', 'sidesOf', 'firstPickFor', 'zeroProofFor', 'termToGuest', 'sayIt', 'mixUp', 'wineGoesWith'] as const) {
			expect(before[kind], kind).toBeGreaterThanOrEqual(DRILL_FLOOR);
			expect(after[kind], kind).toBe(0);
			expect(GENERATORS[kind](house, seeded(5)), kind).toBeNull();
		}
		/* The three kinds over the menu's own words still deal: a name, the grapes, the glass and the spec are not marks. */
		for (const kind of ['wineGrapes', 'cocktailGlass', 'cocktailSpec'] as const) expect(after[kind], kind).toBe(before[kind]);
	});

	it('refuses a mark with the wrong shape as it refuses an unkept one', () => {
		const house = widened();
		const d = house.dishes.find((x) => x.id === 'd-lambsh01') as HouseDish;
		(d as unknown as Record<string, unknown>).lines = { value: d.lines?.value, by: 'someone', ts: TS };
		(d as unknown as Record<string, unknown>).parts = { value: d.parts?.value, by: 'person', ts: 'today' };
		const counts = drillableCounts(house);
		expect(counts.lineToDish).toBe(4);
		expect(counts.sauceOf).toBe(4);
	});
});

describe('the random source', () => {
	it('replays the same round from the same seed, and shuffles the options with the source handed in', () => {
		const house = widened();
		for (const kind of DRILL_KINDS) {
			expect(dealQuestion(house, kind, seeded(42))).toEqual(dealQuestion(house, kind, seeded(42)));
		}
		const positions = new Set<number>();
		const stems = new Set<string>();
		for (let seed = 1; seed <= 40; seed++) {
			const q = lineToDish(house, seeded(seed)) as DrillQuestion;
			positions.add(q.options.indexOf(q.answer));
			stems.add(q.stem);
		}
		expect(positions.size).toBe(OPTION_COUNT);
		expect(stems.size).toBeGreaterThan(1);
	});

	it('never reaches for Math.random, even when the source handed in is poor', () => {
		vi.spyOn(Math, 'random').mockImplementation(() => {
			throw new Error('Math.random was called');
		});
		const house = widened();
		for (const rand of [() => 0, () => 1, () => -1, () => Number.NaN, seeded(9)]) {
			for (const kind of DRILL_KINDS) {
				const q = dealQuestion(house, kind, rand);
				expect(q, kind).not.toBeNull();
				expectWellFormed(q as DrillQuestion, kind, house);
			}
		}
		expect(buildFlashcards(house).length).toBeGreaterThan(0);
	});
});

describe('the flashcards', () => {
	it('come from the fixture\'s kept marks: fifteen parts, nine lines, three term cards, two mix-up cards, two pairing cards, one component card', () => {
		const cards = buildFlashcards(fixture);
		const by = (kind: string) => cards.filter((c) => c.kind === kind);
		expect(by('part')).toHaveLength(15);
		expect(by('line')).toHaveLength(9);
		expect(by('term')).toHaveLength(3);
		expect(by('mixUp')).toHaveLength(2);
		expect(by('pairing')).toHaveLength(2);
		expect(by('component')).toHaveLength(1);
		expect(cards).toHaveLength(32);
		const ids = idsOf(fixture);
		for (const c of cards) {
			expect(Object.keys(c).sort()).toEqual(['back', 'front', 'itemId', 'kind']);
			expect(FLASHCARD_KINDS).toContain(c.kind);
			expect(c.front.trim().length).toBeGreaterThan(0);
			expect(c.back.trim().length).toBeGreaterThan(0);
			expect(c.front).not.toMatch(DASH);
			expect(c.back).not.toMatch(DASH);
			expect(ids.has(c.itemId), c.itemId).toBe(true);
		}
		expect(cards.find((c) => c.kind === 'part' && c.itemId === 'd-chicken1')?.front).toBe('Lantern Roast Chicken: main ingredient');
		expect(cards.find((c) => c.kind === 'part' && c.itemId === 'w-lantern1')?.front).toBe('Quay Lane Harbour White 2024: grape and region');
		expect(cards.find((c) => c.kind === 'line' && c.itemId === 'b-collins1')?.front).toBe('The Lantern Collins in ten seconds');
		expect(cards.filter((c) => c.kind === 'term').map((c) => c.front)).toEqual(['Verjus: how to say it', 'Verjus: what to tell a guest', 'Salt baked: how to say it']);
		expect(cards.filter((c) => c.kind === 'mixUp').map((c) => c.front)).toEqual(['Lantern Roast Chicken or Beetroot and Apple Salad', 'Lantern Roast Chicken or Beetroot and Apple Salad: what do you ask?']);
		const pairing = cards.filter((c) => c.kind === 'pairing');
		expect(pairing.map((c) => c.front)).toEqual(['Lantern Roast Chicken: the first pick', 'Lantern Roast Chicken: without alcohol']);
		/* One card per component with a kept card, under the component's own id; the component with no card makes none. */
		expect(by('component')).toEqual([{ kind: 'component', front: 'What does the salt crust do?', back: expect.stringContaining('own steam'), itemId: 'c-saltcrs1' }]);
		expect(pairing[0].back).toBe('Quay Lane Harbour White 2024. With the chicken I would pour the Harbour White. It is dry and bright, and it loves the smoke.');
		expect(pairing[1].back).toBe('Verjus and Tonic. Verjus has the same sharp edge as the wine and none of the alcohol.');
	});

	it('make nothing from a mark she wrote and nobody kept, and nothing from a pairing that resolves to no house item', () => {
		const house = clone(fixture);
		const chicken = house.dishes[0];
		chicken.parts = hers(chicken.parts?.value as FormulaParts);
		chicken.lines = hers(chicken.lines?.value as Lines);
		chicken.pairing = hers(chicken.pairing?.value as Pairing);
		house.lexicon[0].toGuest = hers(house.lexicon[0].toGuest?.value as string);
		house.mixUps[0].ask = hers(house.mixUps[0].ask?.value as string);
		const cards = buildFlashcards(house);
		expect(cards.filter((c) => c.itemId === 'd-chicken1')).toHaveLength(0);
		expect(cards.filter((c) => c.kind === 'term').map((c) => c.front)).toEqual(['Verjus: how to say it', 'Salt baked: how to say it']);
		expect(cards.filter((c) => c.kind === 'mixUp')).toHaveLength(1);
		expect(cards).toHaveLength(32 - 5 - 3 - 2 - 1 - 1);
		const unkept = clone(fixture);
		unkept.components![0].card = hers(unkept.components![0].card!.value);
		expect(buildFlashcards(unkept).filter((c) => c.kind === 'component')).toHaveLength(0);

		const dangling = clone(fixture);
		const p = dangling.dishes[0].pairing as Mark<Pairing>;
		p.value.wineId = 'w-nowhere1';
		p.value.zeroProofId = 'd-chicken1';
		expect(buildFlashcards(dangling).filter((c) => c.kind === 'pairing')).toHaveLength(0);
		expect(drillableCounts(dangling).firstPickFor).toBe(0);
		expect(drillableCounts(dangling).zeroProofFor).toBe(0);
	});

	it('grow with the widened house and carry every item id with its list\'s prefix', () => {
		const house = widened();
		const cards = buildFlashcards(house);
		expect(cards.length).toBeGreaterThan(31);
		const ids = idsOf(house);
		for (const c of cards) {
			const list = ids.get(c.itemId) as keyof typeof ID_PREFIXES;
			expect(list).toBeDefined();
			expect(c.itemId.startsWith(ID_PREFIXES[list])).toBe(true);
		}
	});
});

/* -------------------------------------------------------------------------
 * Say it back and Guest at the table, graded offline
 * ---------------------------------------------------------------------- */

const DRILL_FIXTURE = JSON.parse(readFileSync(here('./fixtures/house-drill.json'), 'utf8')) as House;
const E_GRAVE = String.fromCharCode(0xe8);
const I_CIRC = String.fromCharCode(0xee);
const CURLY = String.fromCharCode(0x2019);

describe('gradeSaid', () => {
	it('meets a good answer: every part named, within the cap, the name said', () => {
		const said = 'The Lantern Roast Chicken is half a corn fed chicken roasted over the embers, with a rosemary gravy, leeks and crushed potatoes; smoky skin and a lift of lemon.';
		const g = gradeSaid(fixture, 'd-chicken1', 's20', said);
		expect(g).not.toBeNull();
		if (!g) return;
		expect(g.verdict).toBe('met');
		expect(g.coverage).toBe(1);
		expect(g.cap).toBe(50);
		expect(g.over).toBe(0);
		expect(g.nameSaid).toBe(true);
		expect(g.kind).toBe('dish');
		expect(g.name).toBe('Lantern Roast Chicken');
		expect(g.keptLine).toBe(fixture.dishes[0].lines?.value.s20);
		expect(g.parts.map((p) => p.key)).toEqual(['main', 'technique', 'sauce', 'sides', 'taste']);
		expect(g.parts.map((p) => p.label)).toEqual(Object.values(DISH_PARTS_LABELS));
		expect(g.parts.every((p) => p.hit && p.matched.length > 0)).toBe(true);
		expect(g.notes).toEqual(['Every part is there, within the cap.']);
	});

	it('the kept line said back word for word meets, every length, every sayable item', () => {
		for (const house of [fixture, DRILL_FIXTURE]) {
			for (const item of sayable(house)) {
				const all = [...house.dishes, ...house.wines, ...house.cocktails];
				const lines = all.find((i) => i.id === item.id)?.lines?.value as Lines;
				for (const len of item.lengths) {
					const g = gradeSaid(house, item.id, len, lines[len]);
					expect(g?.verdict, item.id + ' ' + len).toBe('met');
					expect(g?.coverage, item.id + ' ' + len).toBe(1);
				}
			}
		}
	});

	it('demands only the parts the kept line of that length carries, and shows the rest', () => {
		const h = clone(fixture);
		(h.dishes[0].lines as Mark<Lines>).value.s10 = 'Half a corn fed chicken over the embers.';
		const g = gradeSaid(h, 'd-chicken1', 's10', 'Half a corn fed chicken over the embers.');
		expect(g?.verdict).toBe('met');
		expect(g?.parts.filter((p) => p.inLine).map((p) => p.key)).toEqual(['main', 'technique']);
		expect(g?.parts.find((p) => p.key === 'sauce')?.hit).toBe(false);
		expect(g?.notes).toEqual(['Say the name: Lantern Roast Chicken.', 'Every part is there, within the cap.']);
	});

	it('calls a thin answer close and a thinner one missed, and says what to name', () => {
		const close = gradeSaid(fixture, 'd-chicken1', 's20', 'Chicken with potatoes and gravy.');
		expect(close?.verdict).toBe('close');
		expect(close?.coverage).toBe(0.6);
		expect(close?.nameSaid).toBe(false);
		expect(close?.notes).toEqual([
			'Name the technique: Roasted over embers, rested, carved at the pass',
			'Say how it tastes: Smoky skin, sweet leek, a sharp lift from the lemon',
			'Say the name: Lantern Roast Chicken.',
			'There is room for more: the cap is fifty words and you used five.'
		]);
		const missed = gradeSaid(fixture, 'd-chicken1', 's20', 'It is a nice plate of food.');
		expect(missed?.verdict).toBe('missed');
		expect(missed?.coverage).toBe(0);
		expect(missed?.notes[0]).toBe('Name the main ingredient: Half a corn fed chicken');
		expect(missed?.notes).toContain('Name the sauce and key flavours: Rosemary gravy from the roasting juices');
		expect(missed?.notes).toContain('Name the accompaniments: Leeks and crushed potatoes');
	});

	it('says how far over the cap, in words, and an over cap answer is never met', () => {
		const long = fixture.dishes[0].lines?.value.s20 || '';
		const g = gradeSaid(fixture, 'd-chicken1', 's10', long);
		expect(g).not.toBeNull();
		if (!g) return;
		expect(g.cap).toBe(25);
		expect(g.over).toBe(g.words - 25);
		expect(g.over).toBeGreaterThan(0);
		expect(g.verdict).toBe('close');
		const cap = numberWords(g.over);
		expect(g.notes).toContain(cap.charAt(0).toUpperCase() + cap.slice(1) + ' words over the ten second cap.');
		const one = gradeSaid(fixture, 'd-chicken1', 's10', 'Lantern Roast Chicken: half a corn fed chicken roasted over embers, rosemary gravy, leeks and crushed potatoes, smoky skin and a sharp lemon lift, carved, really.');
		expect(one?.words).toBe(26);
		expect(one?.notes).toContain('One word over the ten second cap.');
	});

	it('never grades her unkept line, a missing item, a blank length or an item with no lines', () => {
		expect(gradeSaid(DRILL_FIXTURE, 'd-unkept01', 's20', 'Smoked eel on toast with horseradish cream.')).toBeNull();
		const hersOnly = clone(fixture);
		(hersOnly.dishes[0].lines as Mark<Lines>).by = 'maitre';
		expect(gradeSaid(hersOnly, 'd-chicken1', 's20', 'Half a corn fed chicken.')).toBeNull();
		expect(gradeSaid(fixture, 'd-nowhere1', 's20', 'Anything.')).toBeNull();
		expect(gradeSaid(fixture, 'd-beetrt01', 's20', 'Beetroot.')).toBeNull();
		const blank = clone(fixture);
		(blank.dishes[0].lines as Mark<Lines>).value.s45 = '';
		expect(gradeSaid(blank, 'd-chicken1', 's45', 'Half a corn fed chicken.')).toBeNull();
		expect(gradeSaid(fixture, 'd-chicken1', 's99' as 's10', 'Half a corn fed chicken.')).toBeNull();
	});

	it('reads only kept parts: with hers unkept, the kept line\'s clauses stand in', () => {
		const h = clone(fixture);
		(h.dishes[0].parts as Mark<FormulaParts>).by = 'maitre';
		const g = gradeSaid(h, 'd-chicken1', 's10', fixture.dishes[0].lines?.value.s10 || '');
		expect(g?.parts.every((p) => /^c[0-9]+$/.test(p.key))).toBe(true);
		expect(g?.verdict).toBe('met');
		const thin = gradeSaid(h, 'd-chicken1', 's10', 'A chicken.');
		expect(thin?.verdict).not.toBe('met');
		expect(thin?.notes.some((n) => n.startsWith('You left out: '))).toBe(true);
		expect(JSON.stringify(thin)).not.toContain('Rosemary gravy from the roasting juices');
	});

	it('folds case and accents and strips a light suffix, so glazed meets glaze and creme fraiche meets the printed spelling', () => {
		const h = clone(fixture);
		const parts = (h.dishes[0].parts as Mark<FormulaParts>).value;
		parts.sauce = 'Brown sugar glaze';
		parts.sides = 'Sweetened cr' + E_GRAVE + 'me fra' + I_CIRC + 'che';
		parts.main = 'Brennan' + CURLY + 's chicken';
		const g = gradeSaid(h, 'd-chicken1', 's20', 'CHICKEN, GLAZED with sugar, creme fraiche, roasting over embers, smoky.');
		const by = Object.fromEntries((g?.parts || []).map((p) => [p.key, p]));
		expect(by.sauce.hit).toBe(true);
		expect(by.sauce.matched).toContain('glaz');
		expect(by.sides.hit).toBe(true);
		expect(by.sides.terms).toContain('fraich');
		expect(by.main.terms).toEqual(['brennan', 'chicken']);
		expect(g?.verdict).toBe('met');
	});

	it('grades a wine and a cocktail by their own labels, and leaves a part with no terms out of the share', () => {
		const wine = gradeSaid(fixture, 'w-lantern1', 's10', 'Bacchus from the chalk, cool fermented in steel, green apple, the roast chicken, crisp.');
		expect(wine?.kind).toBe('wine');
		expect(wine?.verdict).toBe('met');
		const thin = gradeSaid(fixture, 'b-collins1', 's10', 'Gin and soda.');
		expect(thin?.kind).toBe('cocktail');
		expect(thin?.notes).toContain('Name the glass and garnish: A highball with a rosemary sprig');
		expect(thin?.notes.some((n) => n.startsWith('Name the the'))).toBe(false);
		const h = clone(DRILL_FIXTURE);
		const lamb = gradeSaid(h, 'd-lambsh01', 's20', 'Lamb with an anchovy jus and white beans.');
		const graded = (lamb?.parts || []).filter((p) => p.terms.length && p.inLine);
		expect(graded.map((p) => p.key)).toEqual(['sauce', 'sides']);
		expect(lamb?.coverage).toBe(1);
	});

	it('an empty answer is missed and says so; a note never speaks of allergens and carries no dash', () => {
		const g = gradeSaid(fixture, 'd-chicken1', 's20', '   ');
		expect(g?.verdict).toBe('missed');
		expect(g?.words).toBe(0);
		expect(g?.notes).toEqual(['Nothing was said yet. Say the line aloud, or type it, then grade it.']);
		for (const said of ['', 'Chicken.', 'Half a corn fed chicken roasted over embers.', fixture.dishes[0].lines?.value.s45 || '']) {
			for (const len of ['s10', 's20', 's45'] as const) {
				const out = gradeSaid(fixture, 'd-chicken1', len, said);
				for (const n of out?.notes || []) {
					expect(n).not.toMatch(/allerg|contain|gluten|dairy|nut/i);
					expect(n).not.toMatch(DASH);
				}
			}
		}
	});

	it('is pure: the same words give the same grade', () => {
		const said = 'Half a chicken with leeks.';
		expect(gradeSaid(fixture, 'd-chicken1', 's20', said)).toEqual(gradeSaid(clone(fixture), 'd-chicken1', 's20', said));
	});
});

const DISH_PARTS_LABELS = { main: 'main ingredient', technique: 'technique', sauce: 'sauce and key flavours', sides: 'accompaniments', taste: 'how it tastes' };

describe('gradeScenario', () => {
	const kept = fixture.scenarios[0].you?.value || '';

	it('meets the kept answer, names the items it names, and returns the card', () => {
		const g = gradeScenario(fixture, 's-hurry001', kept);
		expect(g).not.toBeNull();
		if (!g) return;
		expect(g.verdict).toBe('met');
		expect(g.coverage).toBe(1);
		expect(g.title).toBe('A table in a hurry');
		expect(g.guest).toBe(fixture.scenarios[0].guest);
		expect(g.keptYou).toBe(kept);
		expect(g.principle).toBe(fixture.scenarios[0].principle?.value);
		expect(g.matched).toEqual(g.terms);
		expect(g.items.map((i) => i.id)).toEqual(['d-beetrt01', 'd-chicken1']);
		expect(g.items.find((i) => i.id === 'd-beetrt01')?.named).toBe(true);
		expect(g.itemsNamed).toContain('Beetroot and Apple Salad');
		expect(g.notes).toEqual(['That answers the guest the way you kept it.']);
	});

	it('a paraphrase that keeps the substance meets; a thin one is missed with the clauses and the principle', () => {
		const para = gradeScenario(fixture, 's-hurry001', 'The beetroot salad comes plated cold, and the chicken is twenty minutes off the embers. Order both now and I will let the pass know.');
		expect(para?.verdict).toBe('met');
		const thin = gradeScenario(fixture, 's-hurry001', 'Let me check with the kitchen.');
		expect(thin?.verdict).toBe('missed');
		expect(thin?.notes).toContain('You left out: The beetroot salad is plated cold and the chicken comes off the embers in twenty minutes');
		expect(thin?.notes).toContain('Name the Beetroot and Apple Salad.');
		expect(thin?.notes[thin.notes.length - 1]).toBe('The principle: ' + fixture.scenarios[0].principle?.value);
		const half = gradeScenario(fixture, 's-hurry001', 'Order both now and I will tell the pass.');
		expect(half?.verdict).toBe('close');
		expect(half?.coverage).toBe(0.5);
	});

	it('returns null with no kept answer or no such scenario, and an empty answer is missed', () => {
		const h = clone(fixture);
		(h.scenarios[0].you as Mark).by = 'maitre';
		expect(gradeScenario(h, 's-hurry001', kept)).toBeNull();
		delete h.scenarios[0].you;
		expect(gradeScenario(h, 's-hurry001', kept)).toBeNull();
		expect(gradeScenario(fixture, 's-nowhere1', kept)).toBeNull();
		const empty = gradeScenario(fixture, 's-hurry001', '');
		expect(empty?.verdict).toBe('missed');
		expect(empty?.notes).toEqual(['Nothing was said yet. Answer the guest aloud, or type it, then grade it.']);
	});
});

describe('sayable and roleable', () => {
	it('list the items with a kept lines mark, by kind, and the scenarios with a kept answer', () => {
		expect(sayable(fixture).map((i) => i.id)).toEqual(['d-chicken1', 'w-lantern1', 'b-collins1']);
		expect(sayable(fixture, 'wine')).toEqual([{ id: 'w-lantern1', kind: 'wine', name: fixture.wines[0].name, section: fixture.wines[0].section, lengths: ['s10', 's20', 's45'] }]);
		expect(sayable(DRILL_FIXTURE, 'dish').map((i) => i.id)).not.toContain('d-unkept01');
		expect(sayable(DRILL_FIXTURE, 'dish').map((i) => i.id)).toEqual(['d-chicken1', 'd-lambsh01', 'd-seabas01', 'd-mushrm01', 'd-lemont01']);
		expect(roleable(fixture)).toEqual([{ id: 's-hurry001', title: 'A table in a hurry', guest: fixture.scenarios[0].guest }]);
		const h = clone(fixture);
		(h.scenarios[0].you as Mark).by = 'maitre';
		expect(roleable(h)).toEqual([]);
		for (const item of sayable(fixture)) for (const len of item.lengths) expect(gradeSaid(fixture, item.id, len, 'x')).not.toBeNull();
	});
});

describe('the words a grade says', () => {
	it('spell numbers the British way with no hyphen, and name each cap', () => {
		expect([0, 1, 12, 20, 45, 99, 100, 104, 110, 1000, 2025].map(numberWords)).toEqual([
			'zero', 'one', 'twelve', 'twenty', 'forty five', 'ninety nine', 'one hundred', 'one hundred and four', 'one hundred and ten', 'one thousand', 'two thousand and twenty five'
		]);
		expect(CAP_NAMES).toEqual({ s10: 'ten second', s20: 'twenty second', s45: 'forty five second' });
		expect(GRADE_MET).toBe(0.8);
		expect(GRADE_CLOSE).toBe(0.5);
	});
});
