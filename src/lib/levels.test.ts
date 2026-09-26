import { describe, it, expect } from 'vitest';
import {
	LEVEL_TEST,
	MET,
	NEVER_GRADED,
	PALATE_RUNG,
	UNTOUCHED,
	allLevels,
	buildLevelTest,
	firstUnmetLevel,
	gradeLevelAnswer,
	levelFromSearch,
	levelHref,
	levelProgress,
	statOf,
	subsectionProgress,
	todayFromLevel,
	type Joins,
	type Logs
} from './levels';
import { metSlugs, type CookEntry } from './repertoire';
import { sectionProgress } from './floor-deck';
import { seeded } from './floor-deck-core.mjs';
import type { DrillCard } from './drill';
import type { LexTerm } from './lexicon-quiz';
import type { DeckLevel, DeckTraps, FloorDeck, LevelsData } from './types';
import shippedLevels from './data/levels.json';
import shippedDeck from './data/floor-deck.json';
import shippedTraps from './data/floor-deck.traps.json';
import { DECK_LEVELS } from '../../tools/derive/floor-deck.mjs';
import { LEVELS_COMPLETE, MINIMUMS, SUBSECTIONS } from '../../tools/derive/levels.mjs';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 8, 26, 12);

const DATA: LevelsData = {
	version: 1,
	levels: [
		{ level: 1, name: 'Commis', blurb: 'one' },
		{ level: 2, name: 'Chef de Partie', blurb: 'two' },
		{ level: 3, name: 'Sous Chef', blurb: 'three' },
		{ level: 4, name: 'Chef', blurb: 'four' }
	],
	subsections: [
		{ key: 'dishes', title: 'Dishes', counted: true },
		{ key: 'techniques', title: 'Techniques', counted: true },
		{ key: 'lexicon', title: 'The Lexicon', counted: true },
		{ key: 'deck', title: 'The Floor Deck', counted: true },
		{ key: 'palate', title: 'The Palate', counted: true },
		{ key: 'safety', title: 'Food Safety', counted: false },
		{ key: 'service', title: 'Service', counted: true }
	],
	items: {
		dishes: { '1': ['d1', 'd2'], '2': ['d3'], '3': ['d4'], '4': ['d5'] },
		techniques: { '1': ['t1'], '2': ['t2'], '3': [], '4': [] },
		lexicon: { '1': ['l1', 'l2', 'l3', 'l4'], '2': ['l5'], '3': [], '4': [] },
		deck: { '1': ['fd_0001', 'fd_0002'], '2': ['fd_0003'], '3': [], '4': [] },
		palate: { '1': ['flat', 'salty'], '2': ['sour'], '3': [], '4': [] },
		safety: { '1': ['clause:X'], '2': [], '3': [], '4': [] },
		service: { '1': ['m1'], '2': ['m2'], '3': [], '4': [] }
	},
	moduleTerms: { m1: ['s1', 's2'], m2: ['s3'] },
	techniqueStandards: ['t1'],
	tastes: ['salt', 'sweet'],
	safety: { 'clause:X': { label: 'X', anchor: 'safety', kind: 'clause' } },
	counts: {
		'1': { dishes: 2, techniques: 1, lexicon: 4, deck: 2, palate: 2, safety: 1, service: 2 },
		'2': { dishes: 1, techniques: 1, lexicon: 1, deck: 1, palate: 1, safety: 0, service: 1 },
		'3': { dishes: 1, techniques: 0, lexicon: 0, deck: 0, palate: 0, safety: 0, service: 0 },
		'4': { dishes: 1, techniques: 0, lexicon: 0, deck: 0, palate: 0, safety: 0, service: 0 }
	}
};

const JOINS: Joins = {
	techniqueRecipes: new Map([
		['t1', ['r1', 'r2']],
		['t2', ['d3']]
	])
};

const EMPTY: Logs = { cooked: [], drill: [], calibration: [] };
const at = (daysAgo: number) => NOW - daysAgo * DAY;
const logs = (partial: Partial<Logs>): Logs => ({ ...EMPTY, ...partial });

/** Everything at level 1 met: two dishes, the technique (graded met on r1),
 *  the four terms, both cards, both faults and both tastes at rung 1, both
 *  service terms. */
function level1Met(): Logs {
	return {
		cooked: [
			{ slug: 'd1', at: at(1) },
			{ slug: 'd2', at: at(1), fault: 'flat' },
			{ slug: 'r1', at: at(1), grade: 'met', fault: 'salty' }
		],
		drill: ['l1', 'l2', 'l3', 'l4', 'fd_0001', 'fd_0002', 's1', 's2'].map((slug) => ({ slug, at: at(1), grade: 'met' as const })),
		calibration: [
			{ slug: 'cal-salt-1', at: at(1), grade: 'met' },
			{ slug: 'cal-sweet-1', at: at(1), grade: 'met' }
		]
	};
}

const DECK: FloorDeck = {
	version: 1,
	frame: { madeWith: 'Classically made with', confirm: 'Recipes vary.' },
	sections: [{ key: 'methods', title: 'Cooking Methods', blurb: 'b', count: 3 }],
	levels: [
		{ level: 1, name: 'Commis', blurb: 'b', count: 2 },
		{ level: 2, name: 'Chef de Partie', blurb: 'b', count: 1 },
		{ level: 3, name: 'Sous Chef', blurb: 'b', count: 0 },
		{ level: 4, name: 'Chef', blurb: 'b', count: 0 }
	],
	cards: [
		{ id: 'fd_0001', term: 'Boiled', section: 'methods', level: 1, gist: 'cooked in water', guest: 'g', why: 'w' },
		{ id: 'fd_0002', term: 'Braised', section: 'methods', level: 1, gist: 'cooked low in liquid', guest: 'g', why: 'w' },
		{ id: 'fd_0003', term: 'Confit', section: 'methods', level: 2, gist: 'cooked slowly in fat', guest: 'g', why: 'w' }
	]
};

const NAMES = { dish: (slug: string) => `Dish ${slug}` };

describe('statOf: the word and the figure', () => {
	it('is Untouched at zero, Met at all, and never 0% or 100%', () => {
		expect(statOf(0, 10)).toBe(UNTOUCHED);
		expect(statOf(0, 0)).toBe(UNTOUCHED);
		expect(statOf(10, 10)).toBe(MET);
		expect(statOf(1, 200)).toBe('1% met');
		expect(statOf(199, 200)).toBe('99% met');
		expect(statOf(5, 10)).toBe('50% met');
	});
	it('takes a share for a mean, clamped the same way', () => {
		expect(statOf(3, 10, 0.004)).toBe('1% met');
		expect(statOf(3, 10, 0.996)).toBe('99% met');
	});
});

describe('metSlugs: one rule for "met on the ladder"', () => {
	it('counts met, close and ungraded, never a miss alone', () => {
		const log: CookEntry[] = [
			{ slug: 'a', at: 1, grade: 'met' },
			{ slug: 'b', at: 1, grade: 'close' },
			{ slug: 'c', at: 1 },
			{ slug: 'd', at: 1, grade: 'missed' },
			{ slug: 'e', at: 1, grade: 'missed' },
			{ slug: 'e', at: 2, grade: 'met' }
		];
		expect([...metSlugs(log)].sort()).toEqual(['a', 'b', 'c', 'e']);
	});
	it('moves the deck onto it: a card only ever missed is not seen', () => {
		const missedOnly: CookEntry[] = [{ slug: 'fd_0001', at: at(1), grade: 'missed' }];
		expect(sectionProgress(DECK, missedOnly, 1)[0].seen).toBe(0);
		const met: CookEntry[] = [{ slug: 'fd_0001', at: at(1), grade: 'close' }];
		expect(sectionProgress(DECK, met, 1)[0].seen).toBe(1);
	});
});

describe('subsectionProgress: what each subsection counts', () => {
	it('dishes: cooked, whatever the grade', () => {
		const p = subsectionProgress(DATA, 1, 'dishes', logs({ cooked: [{ slug: 'd1', at: at(1), grade: 'missed' }] }), JOINS);
		expect(p.met).toBe(1);
		expect(p.total).toBe(2);
		expect(p.label).toBe('50% met');
	});
	it('techniques: met on a recipe when a standard exists, any cook when none does', () => {
		const close = logs({ cooked: [{ slug: 'r1', at: at(1), grade: 'close' }] });
		expect(subsectionProgress(DATA, 1, 'techniques', close, JOINS).met).toBe(0);
		const met = logs({ cooked: [{ slug: 'r2', at: at(1), grade: 'met' }] });
		expect(subsectionProgress(DATA, 1, 'techniques', met, JOINS).met).toBe(1);
		const noStandard = logs({ cooked: [{ slug: 'd3', at: at(1), grade: 'missed' }] });
		expect(subsectionProgress(DATA, 2, 'techniques', noStandard, JOINS).met).toBe(1);
	});
	it('lexicon and service: met on the ladder, a miss alone is not met', () => {
		const l = logs({ drill: [{ slug: 'l1', at: at(1), grade: 'close' }, { slug: 'l2', at: at(1), grade: 'missed' }] });
		const p = subsectionProgress(DATA, 1, 'lexicon', l, JOINS);
		expect(p.met).toBe(1);
		expect(p.metSet.has('l1')).toBe(true);
		const s = subsectionProgress(DATA, 1, 'service', logs({ drill: [{ slug: 's2', at: at(1), grade: 'met' }] }), JOINS);
		expect(s.units).toEqual(['s1', 's2']);
		expect(s.total).toBe(2);
		expect(s.met).toBe(1);
	});
	it('palate: a fault named on a plate, a taste cleared to the rung the level names', () => {
		const p1 = subsectionProgress(
			DATA,
			1,
			'palate',
			logs({ cooked: [{ slug: 'x', at: at(1), fault: 'flat' }], calibration: [{ slug: 'cal-salt-1', at: at(1), grade: 'met' }] }),
			JOINS
		);
		expect(p1.total).toBe(4);
		expect(p1.met).toBe(2);
		const p4 = subsectionProgress(DATA, 4, 'palate', logs({ calibration: [{ slug: 'cal-salt-3', at: at(1), grade: 'met' }] }), JOINS);
		expect(PALATE_RUNG[4]).toBe(5);
		expect(p4.met).toBe(0);
	});
	it('safety: listed, never graded', () => {
		const p = subsectionProgress(DATA, 1, 'safety', level1Met(), JOINS);
		expect(p.counted).toBe(false);
		expect(p.total).toBe(1);
		expect(p.met).toBe(0);
		expect(p.label).toBe(NEVER_GRADED);
	});
});

describe('levelProgress: the mean of the subsections, not the pooled sum', () => {
	it('lets a small subsection count as much as a large one', () => {
		const l = logs({
			cooked: [{ slug: 'd1', at: at(1) }],
			drill: [{ slug: 'fd_0001', at: at(1), grade: 'met' }, { slug: 'fd_0002', at: at(1), grade: 'met' }]
		});
		const p = levelProgress(DATA, 1, l, JOINS);
		// dishes 1/2, techniques 0/1, lexicon 0/4, deck 2/2, palate 0/4, service 0/2 -> mean 0.25; pooled would be 3/15
		expect(p.share).toBeCloseTo(0.25, 5);
		expect(p.label).toBe('25% met');
		expect(p.met).toBe(3);
		expect(p.total).toBe(15);
	});
	it('is Untouched with nothing met and Met with everything counted met', () => {
		expect(levelProgress(DATA, 1, EMPTY, JOINS).label).toBe(UNTOUCHED);
		expect(levelProgress(DATA, 1, level1Met(), JOINS).label).toBe(MET);
	});
	it('firstUnmetLevel is the lowest not met, and IV once everything is', () => {
		expect(firstUnmetLevel(allLevels(DATA, EMPTY, JOINS))).toBe(1);
		expect(firstUnmetLevel(allLevels(DATA, level1Met(), JOINS))).toBe(2);
		const rows = allLevels(DATA, EMPTY, JOINS).map((r) => ({ ...r, label: MET }));
		expect(firstUnmetLevel(rows)).toBe(4);
	});
});

describe('todayFromLevel: one item, in order', () => {
	const today = (l: Logs) => todayFromLevel(DATA, allLevels(DATA, l, JOINS), l, NAMES, NOW);

	it('leads with the coldest dish past its re-cook, and counts what is owed', () => {
		const t = today(logs({ cooked: [{ slug: 'd1', at: at(40) }, { slug: 'zz', at: at(30) }] }));
		expect(t.line).toBe('Cook Dish d1 again. Last made 6 weeks ago.');
		expect(t.href).toBe('/recipe/d1');
		expect(t.sub).toBe('Today deals from Level I. 2 reviews are owed across everything touched.');
	});
	it('then the next uncooked course dish at the level', () => {
		const t = today(EMPTY);
		expect(t.line).toBe('Cook Dish d1, the next dish at Level I.');
		expect(t.sub).toBe('Today deals from Level I.');
		expect(t.level).toBe(1);
	});
	it('then the deck, the Lexicon and service, in that order', () => {
		const dishes: CookEntry[] = [{ slug: 'd1', at: at(1) }, { slug: 'd2', at: at(1) }];
		expect(today(logs({ cooked: dishes })).line).toBe('Flip the Floor Deck at Level I: 2 cards to meet.');
		const cards = ['fd_0001', 'fd_0002'].map((slug) => ({ slug, at: at(1), grade: 'met' as const }));
		expect(today(logs({ cooked: dishes, drill: cards })).line).toBe('Meet 4 terms of the Lexicon at Level I.');
		const terms = ['l1', 'l2', 'l3', 'l4'].map((slug) => ({ slug, at: at(1), grade: 'close' as const }));
		expect(today(logs({ cooked: dishes, drill: [...cards, ...terms] })).line).toBe('Meet 2 service terms at Level I.');
	});
	it('says when a level is met and what the next begins with', () => {
		const t = today(level1Met());
		expect(t.line).toBe('Level I is met. Level II begins with Dish d3.');
		expect(t.href).toBe('/recipe/d3');
		expect(t.sub).toBe('Today deals from Level II.');
		// once the new level has been touched the milestone line is gone
		const touched = logs({ ...level1Met(), drill: [...level1Met().drill, { slug: 'l5', at: at(1), grade: 'close' }] });
		expect(today(touched).line).toBe('Cook Dish d3, the next dish at Level II.');
	});
	it('says when every level is met', () => {
		const base = level1Met();
		const l = logs({ ...base, cooked: [...base.cooked, { slug: 'd3', at: at(1) }, { slug: 'd4', at: at(1) }, { slug: 'd5', at: at(1) }] });
		const rows = allLevels(DATA, l, JOINS).map((r) => ({ ...r, label: MET }));
		const t = todayFromLevel(DATA, rows, l, NAMES, NOW);
		expect(t.line).toBe('Every level is met. Cook what has gone cold when it comes due.');
		expect(t.href).toBeNull();
		expect(t.level).toBe(4);
	});
});

describe('the level test', () => {
	const drills: DrillCard[] = Array.from({ length: 8 }, (_, i) => ({
		slug: `s${i + 1}`,
		term: `Term ${i + 1}`,
		category: 'Wine & Beverage',
		moduleId: i < 6 ? 'm1' : 'm2',
		prompt: `prompt ${i + 1}`,
		field: 'all'
	}));
	const lexicon: LexTerm[] = Array.from({ length: 12 }, (_, i) => ({ slug: `l${i + 1}`, term: `L ${i + 1}`, category: 'Spice Atlas', definition: `def ${i + 1}` }));
	const data: LevelsData = {
		...DATA,
		items: {
			...DATA.items,
			service: { '1': ['m1'], '2': ['m2'], '3': [], '4': [] },
			lexicon: { '1': lexicon.slice(0, 10).map((e) => e.slug), '2': ['l11', 'l12'], '3': [], '4': [] }
		},
		moduleTerms: { m1: drills.slice(0, 6).map((c) => c.slug), m2: drills.slice(6).map((c) => c.slug) }
	};
	const deck = shippedDeck as unknown as FloorDeck;
	const traps = shippedTraps as unknown as DeckTraps;

	it('asks the deck at the level, then six service and eight Lexicon questions, every slug once', () => {
		const t = buildLevelTest(data, 1, deck, traps, drills, lexicon, EMPTY, NOW, seeded(1));
		expect(t.counts.deck).toBeGreaterThanOrEqual(11);
		expect(t.counts.service).toBe(LEVEL_TEST.service);
		expect(t.counts.lexicon).toBe(LEVEL_TEST.lexicon);
		const m1 = new Set(data.moduleTerms.m1);
		const level1 = new Set(data.items.lexicon['1']);
		const asked: string[] = [];
		for (const q of t.questions) {
			if (q.kind === 'service') {
				expect(m1.has(q.q.target.slug)).toBe(true);
				expect(q.q.options.length).toBe(4);
				asked.push(q.q.target.slug);
			}
			if (q.kind === 'lexicon') {
				expect(level1.has(q.q.target.slug)).toBe(true);
				expect(q.q.options.length).toBe(4);
				asked.push(q.q.target.slug);
			}
			if (q.kind === 'deck' && q.q.kind === 'mc') expect(q.q.card.level).toBe(1 as DeckLevel);
		}
		expect(new Set(asked).size).toBe(asked.length);
	});
	it('leads with what is owed and never pads a short subsection', () => {
		const owed = logs({ drill: [{ slug: 's4', at: at(30), grade: 'met' }] });
		const t = buildLevelTest(data, 1, deck, traps, drills, lexicon, owed, NOW, seeded(2));
		const first = t.questions.find((q) => q.kind === 'service');
		expect(first && first.kind === 'service' ? first.q.target.slug : null).toBe('s4');
		const short = buildLevelTest(data, 2, deck, traps, drills, lexicon, EMPTY, NOW, seeded(3));
		expect(short.counts.lexicon).toBe(2);
		expect(short.counts.service).toBe(2);
	});
	it('grades by the engine that asked', () => {
		expect(gradeLevelAnswer('deck', true)).toBe('met');
		expect(gradeLevelAnswer('service', true)).toBe('met');
		expect(gradeLevelAnswer('lexicon', true)).toBe('close');
		expect(gradeLevelAnswer('lexicon', false)).toBe('missed');
		expect(gradeLevelAnswer('deck', false)).toBe('missed');
	});
});

describe('levelFromSearch and levelHref', () => {
	it('takes exact integers only', () => {
		expect(levelFromSearch('?level=2')).toBe(2);
		expect(levelFromSearch('?level=commis')).toBeNull();
		expect(levelFromSearch('?level=5')).toBeNull();
		expect(levelFromSearch('')).toBeNull();
		expect(levelHref(3)).toBe('/level/3');
	});
});

describe('the shipped file', () => {
	const data = shippedLevels as unknown as LevelsData;

	it('names the levels as the deck does, with blurbs and no digit or dash', () => {
		expect(data.levels.map((l) => [l.level, l.name])).toEqual(DECK_LEVELS.map((l) => [l.level, l.name]));
		for (const l of data.levels) {
			expect(l.blurb.length).toBeGreaterThanOrEqual(60);
			expect(l.blurb.length).toBeLessThanOrEqual(160);
			expect(l.blurb).not.toMatch(/\d/);
			expect(l.blurb).not.toMatch(/[–—]| -- /);
		}
	});
	it('lists the seven subsections in order, Food Safety uncounted', () => {
		expect(data.subsections.map((s) => s.key)).toEqual(SUBSECTIONS.map((s) => s.key));
		expect(data.subsections.find((s) => s.key === 'safety')?.counted).toBe(false);
	});
	it('copies the deck exactly as the index has it', () => {
		const deck = shippedDeck as unknown as FloorDeck;
		for (const l of [1, 2, 3, 4] as DeckLevel[]) {
			const ours = [...(data.items.deck[String(l)] ?? [])].sort();
			const theirs = deck.cards.filter((c) => c.level === l).map((c) => c.id).sort();
			expect(ours).toEqual(theirs);
		}
	});
	it('prerenders counts that match the items, service in terms', () => {
		for (const l of ['1', '2', '3', '4']) {
			for (const s of data.subsections) {
				const slugs = data.items[s.key][l] ?? [];
				const n = s.key === 'service' ? slugs.reduce((k, m) => k + (data.moduleTerms[m]?.length ?? 0), 0) : slugs.length;
				expect(data.counts[l][s.key], `${s.key} at ${l}`).toBe(n);
			}
		}
	});
	it('holds every level to its minimums once complete', () => {
		if (!LEVELS_COMPLETE) return;
		for (const l of ['1', '2', '3', '4']) {
			for (const [key, min] of Object.entries(MINIMUMS)) {
				expect(data.counts[l][key as keyof typeof data.counts[string]], `${key} at level ${l}`).toBeGreaterThanOrEqual(min);
			}
		}
	});
	it('places every slug once across the levels of a subsection', () => {
		for (const s of data.subsections) {
			const all = ['1', '2', '3', '4'].flatMap((l) => data.items[s.key][l] ?? []);
			expect(new Set(all).size).toBe(all.length);
		}
	});
});
