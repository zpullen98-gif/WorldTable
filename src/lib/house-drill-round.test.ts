import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
	ALL_KINDS,
	KIND_CHIPS,
	MODE_LABELS,
	PAIR_KINDS,
	QUIZ_MODES,
	ROUND_LENGTH,
	dealRound,
	explainAnswer,
	modeFromSearch,
	poolSize,
	shuffleCards,
	stillNeeded
} from './house-drill-round';
import { DRILL_KINDS, buildFlashcards, drillableCounts, readyKinds, type Rand } from './house/house-drills';
import type { House } from './house/house-schema';

/**
 * The round helper over the one dealer: a round of ten, the whole pool, no
 * repeat of a record for a kind while another is to be had, a kind that
 * cannot deal said in words from drillableCounts, the explanation from kept
 * marks and plain fields only, and the mode seed. The fixture is the widened
 * kept house the e2e seeds too, so the two suites drill the same records.
 */

const here = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const drillHouse = () => JSON.parse(readFileSync(here('./house/fixtures/house-drill.json'), 'utf8')) as House;
const minHouse = () => JSON.parse(readFileSync(here('./house/fixtures/house-min.json'), 'utf8')) as House;

const DASH = new RegExp(['\\u2014', '\\u2013', '&' + 'mdash;', ' ' + '-- '].join('|'));

function seeded(seed: number): Rand {
	let s = seed >>> 0;
	return () => {
		s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
		return s / 4294967296;
	};
}

describe('the fixture', () => {
	it('is the minimal house widened past every floor, with one dish hers and unkept', () => {
		const h = drillHouse();
		expect(h.id).toBe(minHouse().id);
		expect(readyKinds(h)).toEqual([...DRILL_KINDS]);
		const eel = h.dishes.find((d) => d.id === 'd-unkept01')!;
		expect(eel.lines?.by).toBe('maitre');
		expect(JSON.stringify(h)).not.toMatch(/allerg/i);
		expect(JSON.stringify(h)).not.toMatch(DASH);
	});
});

describe('modeFromSearch', () => {
	it('reads ?mode= and falls back to the dishes', () => {
		expect(QUIZ_MODES).toEqual(['dish', 'drill', 'cards', 'pair', 'say', 'guest']);
		expect(modeFromSearch('?mode=drill')).toBe('drill');
		expect(modeFromSearch('?mode=cards')).toBe('cards');
		expect(modeFromSearch('?mode=pair')).toBe('pair');
		expect(modeFromSearch('?mode=say')).toBe('say');
		expect(modeFromSearch('?mode=guest')).toBe('guest');
		expect(modeFromSearch('?mode=level')).toBe('dish');
		expect(modeFromSearch('')).toBe('dish');
		for (const m of QUIZ_MODES) expect(MODE_LABELS[m]).not.toMatch(DASH);
	});
});

describe('dealRound', () => {
	it('deals ten over every kind, each a real question, none repeating a record for its kind', () => {
		const h = drillHouse();
		const round = dealRound(h, ALL_KINDS, ROUND_LENGTH, seeded(7));
		expect(round).toHaveLength(10);
		const keys = round.map((q) => q.kind + '|' + q.itemId);
		expect(new Set(keys).size).toBe(10);
		for (const q of round) {
			expect(q.options).toHaveLength(4);
			expect(q.options).toContain(q.answer);
		}
	});

	it('deals the whole pool when the length is null, and never the unkept dish', () => {
		const h = drillHouse();
		const kinds = ['lineToDish', 'sauceOf'] as const;
		const round = dealRound(h, kinds, null, seeded(3));
		expect(round).toHaveLength(poolSize(h, kinds));
		expect(poolSize(h, kinds)).toBe(drillableCounts(h).lineToDish + drillableCounts(h).sauceOf);
		expect(round.some((q) => q.itemId === 'd-unkept01')).toBe(false);
		expect(round.some((q) => q.options.includes('Smoked Eel Toast'))).toBe(true);
	});

	it('narrows to the chosen kinds, drops a kind that cannot deal, and is empty over a house under the floors', () => {
		const h = drillHouse();
		const round = dealRound(h, PAIR_KINDS, ROUND_LENGTH, seeded(11));
		expect(round.length).toBeGreaterThan(0);
		for (const q of round) expect(PAIR_KINDS).toContain(q.kind);
		expect(PAIR_KINDS).toEqual(['firstPickFor', 'zeroProofFor']);
		// The first pick's options are house wines and its answer the kept pairing's wine.
		const first = round.find((q) => q.kind === 'firstPickFor')!;
		const wines = h.wines.map((w) => w.name);
		for (const o of first.options) expect(wines).toContain(o);
		const dish = h.dishes.find((d) => d.id === first.itemId)!;
		expect(h.wines.find((w) => w.id === (dish.pairing!.value as { wineId: string }).wineId)!.name).toBe(first.answer);
		expect(dealRound(minHouse(), ALL_KINDS, ROUND_LENGTH, seeded(1))).toEqual([]);
	});

	it('replays to the character from one seed', () => {
		const h = drillHouse();
		expect(dealRound(h, ALL_KINDS, 10, seeded(99))).toEqual(dealRound(h, ALL_KINDS, 10, seeded(99)));
	});
});

describe('stillNeeded', () => {
	it('is empty for a kind that deals and names the floor and the count for one that cannot', () => {
		const h = drillHouse();
		for (const k of DRILL_KINDS) expect(stillNeeded(h, k)).toBe('');
		const m = minHouse();
		expect(stillNeeded(m, 'lineToDish')).toBe('Line to dish needs 4 dishes with a kept ten or twenty second line; 1 so far.');
		expect(stillNeeded(m, 'mixUp')).toBe('Mix-ups needs 4 mix-ups with a kept difference; 1 so far.');
		for (const k of DRILL_KINDS) {
			expect(stillNeeded(m, k)).not.toBe('');
			expect(stillNeeded(m, k)).not.toMatch(DASH);
			expect(KIND_CHIPS[k]).not.toMatch(DASH);
		}
	});

	it('names the field when the floor is met but four options are not', () => {
		const h = drillHouse();
		// Five dishes carry a kept sauce, but every dish named the same would leave one option.
		for (const d of h.dishes) d.name = 'The Same Plate';
		expect(stillNeeded(h, 'sauceOf')).toBe('Sauce needs four dish names to choose from; the house has fewer than 4.');
	});
});

describe('explainAnswer', () => {
	it('reads the kept parts, the kept pairing, a term, a mix-up, a wine and a drink, and never an unkept mark', () => {
		const h = drillHouse();
		const q = (kind: (typeof DRILL_KINDS)[number], itemId: string, answer = '') => ({ kind, stem: '', options: [], answer, itemId });
		expect(explainAnswer(h, q('lineToDish', 'd-chicken1'))).toContain('Half a corn fed chicken.');
		expect(explainAnswer(h, q('sauceOf', 'd-chicken1'))).toContain('Smoky skin');
		expect(explainAnswer(h, q('firstPickFor', 'd-chicken1'))).toContain('With the chicken I would pour the Harbour White.');
		expect(explainAnswer(h, q('zeroProofFor', 'd-chicken1'))).toBe('Verjus has the same sharp edge as the wine and none of the alcohol.');
		expect(explainAnswer(h, q('termToGuest', 'x-verjus01'))).toBe('Said: vair ZHOO');
		expect(explainAnswer(h, q('sayIt', 'x-verjus01'))).toBe('The juice of unripe grapes, sharp like lemon, with no alcohol in it.');
		expect(explainAnswer(h, q('sayIt', 'd-chicken1'))).toContain('Half a chicken roasted over the embers');
		expect(explainAnswer(h, q('mixUp', 'm-chkbeet1'))).toBe('Ask: Are you starting with it, or is this your main?');
		expect(explainAnswer(h, q('wineGrapes', 'w-lantern1'))).toContain('Green apple, cut grass, a saline finish.');
		expect(explainAnswer(h, q('wineGoesWith', 'w-redhil01'))).toBe('The ridge.');
		expect(explainAnswer(h, q('cocktailGlass', 'b-collins1'))).toBe('Build over cubed ice, stir, top with soda. Garnish: Rosemary sprig.');
		expect(explainAnswer(h, q('cocktailSpec', 'b-sour0001'))).toBe('Shake hard, double strain.');
		// Hers, unkept: the eel's parts reach nothing, and a dish with no description says nothing.
		expect(explainAnswer(h, q('lineToDish', 'd-unkept01'))).toBe('');
		expect(explainAnswer(h, q('lineToDish', 'd-nobody'))).toBe('');
	});
});

describe('shuffleCards', () => {
	it('is the same deck in another order, from the source handed in', () => {
		const cards = buildFlashcards(drillHouse());
		const a = shuffleCards(cards, seeded(5));
		expect(a).toHaveLength(cards.length);
		expect([...a].sort((x, y) => x.front.localeCompare(y.front))).toEqual([...cards].sort((x, y) => x.front.localeCompare(y.front)));
		expect(shuffleCards(cards, seeded(5))).toEqual(a);
		expect(cards.some((c) => c.itemId === 'd-unkept01')).toBe(false);
	});
});

/* -------------------------------------------------------------------------
 * Adversarial cases: each fails today and names the hole it proves.
 * ---------------------------------------------------------------------- */

describe('adversarial: the whole pool is the whole pool', () => {
	it('deals every drillable record when one kind is large and the rest are small', () => {
		const h = drillHouse();
		// Three hundred wines, each a distinct grape list not named in the wine:
		// wineGrapes grows to three hundred and five while every other kind
		// stays near its floor, so the cycle spends most draws on kinds that
		// are already exhausted.
		const proto = h.wines[0];
		for (let i = 0; i < 300; i++) {
			h.wines.push({ ...proto, id: 'w-big' + String(i).padStart(5, '0'), name: 'Cellar Bottle ' + i, grapes: ['Grape' + i] });
		}
		const n = poolSize(h, ALL_KINDS);
		expect(drillableCounts(h).wineGrapes).toBeGreaterThan(300);
		const round = dealRound(h, ALL_KINDS, null, seeded(5));
		expect(round.length, 'the page promised "The whole pool, ' + n + '"').toBe(n);
	});
});

describe('adversarial: the page promises only what it keeps', () => {
	const pageSrc = readFileSync(here('../routes/menu/quiz/+page.svelte'), 'utf8');
	it('says Again cards come round again only if something reads the verdicts back', () => {
		const promises = /come round again|you missed come round/.test(pageSrc);
		const reads = /readDrilled/.test(pageSrc);
		expect(promises && !reads, 'the copy promises a return no code keeps').toBe(false);
	});
	it('says one answer in the singular', () => {
		expect(pageSrc).not.toMatch(/\{keptHere\} answers kept/);
	});
});

describe('the study view’s doors into the drill page', () => {
	it('reads item, section, deck, scenario and meal, and nothing else', async () => {
		const { studyScopeFromSearch } = await import('./house-drill-round');
		expect(studyScopeFromSearch('?mode=cards&item=d-1q0xk7jv&section=Entr%C3%A9es&deck=weak&scenario=s-1&meal=Dinner&x=1')).toEqual({
			item: 'd-1q0xk7jv',
			section: 'Entrées',
			deck: 'weak',
			scenario: 's-1',
			meal: 'Dinner'
		});
		expect(studyScopeFromSearch('?deck=everything').deck).toBe('');
		expect(studyScopeFromSearch('')).toEqual({ item: '', section: '', deck: '', scenario: '', meal: '' });
	});
	it('deals a section round of section items with options from the whole house', async () => {
		const { readFileSync } = await import('node:fs');
		const { dealSection, ALL_KINDS } = await import('./house-drill-round');
		const pack = JSON.parse(readFileSync('static/shared/packs/brennans-new-orleans.v1.oothouse.json', 'utf8')).house;
		let seed = 7;
		const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
		const round = dealSection(pack, ALL_KINDS, 'Entrées', 10, rand);
		expect(round.length).toBeGreaterThan(0);
		expect(round.length).toBeLessThanOrEqual(10);
		const entrees = new Set(pack.dishes.filter((d: { section: string }) => d.section === 'Entrées').map((d: { id: string }) => d.id));
		for (const q of round) expect(entrees.has(q.itemId)).toBe(true);
		const outside = round.flatMap((q) => q.options).filter((o) => pack.dishes.some((d: { name: string; section: string }) => d.name === o && d.section !== 'Entrées'));
		expect(outside.length).toBeGreaterThan(0);
	});
	it('deals a meal round of items served at that meal, or tagged with none', async () => {
		const { readFileSync } = await import('node:fs');
		const { dealSection, ALL_KINDS } = await import('./house-drill-round');
		const pack = JSON.parse(readFileSync('static/shared/packs/brennans-new-orleans.v1.oothouse.json', 'utf8')).house;
		let seed = 11;
		const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
		const round = dealSection(pack, ALL_KINDS, '', null, rand, 'Dinner');
		expect(round.length).toBeGreaterThan(0);
		const items = [...pack.dishes, ...pack.cocktails, ...pack.wines] as { id: string; meals?: string[] }[];
		for (const q of round) {
			const it = items.find((i) => i.id === q.itemId);
			const meals = it?.meals ?? [];
			expect(!meals.length || meals.includes('Dinner'), q.itemId).toBe(true);
		}
		const hussarde = pack.dishes.find((d: { name: string }) => d.name === 'Eggs Hussarde');
		expect(round.some((q) => q.itemId === hussarde.id)).toBe(false);
	});
});
