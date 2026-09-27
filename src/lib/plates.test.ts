import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { OPTION_COUNT, PLATE_QUIZ_LENGTH, displayName, factOf, plateIndexes, plateQuiz } from './plates';
import type { Plate, PlatesData } from './types';

/** A deterministic generator: the quiz must be a function of its rand. */
function seeded(seed: number) {
	let s = seed >>> 0;
	return () => {
		s = (s * 1664525 + 1013904223) >>> 0;
		return s / 4294967296;
	};
}

const fixture: Plate = {
	slug: 'test-cuts',
	title: 'Test Cuts',
	tagline: null,
	kind: 'cuts',
	kindTitle: 'The cuts',
	regionLine: null,
	corners: [],
	image: { src: 'plates/test-cuts.webp', thumb: 'plates/test-cuts.thumb.webp', width: 10, height: 10 },
	groups: [
		{ title: 'Chuck', note: null, items: [{ name: 'Chuck Roast', sub: null, facts: [['Cook', 'Braised']], links: { deck: 'fd_0001' } }, { name: 'Flat Iron Steak', sub: null, facts: [['Cook', 'Grilled']] }] },
		{ title: 'Rib', note: null, items: [{ name: 'Ribeye', sub: null, facts: [['Cook', 'Grilled']], links: { lexicon: 'ribeye' } }, { name: 'Prime Rib', sub: null, facts: [['Cook', 'Roasted']] }] },
		{ title: 'Brisket', note: null, items: [{ name: 'Brisket', sub: null, facts: [['Cook', 'Smoked, Braised']] }] },
		{ title: 'Round', note: null, items: [{ name: 'Eye of Round', sub: null, facts: [['Cook', 'Roasted']] }, { name: 'Top Round', sub: 'London Broil', facts: [['Cook', 'Marinated']] }] },
		{ title: 'Shank', note: null, items: [{ name: 'Shank Cross Cut', sub: null, facts: [['Cook', 'Braised']] }] }
	],
	panels: [],
	footer: null,
	corrections: [],
	count: 8,
	deckSections: ['cuts'],
	lexiconCategories: ['Beef Cuts & Grades']
};

describe('plateQuiz', () => {
	it('asks up to eight questions, every item once, with four options that hold the answer', () => {
		const qs = plateQuiz(fixture, seeded(7));
		expect(qs.length).toBeGreaterThan(0);
		expect(qs.length).toBeLessThanOrEqual(PLATE_QUIZ_LENGTH);
		const about = qs.map((q) => q.about);
		expect(new Set(about).size).toBe(about.length);
		for (const q of qs) {
			expect(q.options).toHaveLength(OPTION_COUNT);
			expect(new Set(q.options).size).toBe(OPTION_COUNT);
			expect(q.options).toContain(q.answer);
		}
	});

	it('mixes the three shapes on a cut chart', () => {
		const kinds = new Set(plateQuiz(fixture, seeded(3)).map((q) => q.kind));
		expect(kinds.has('group')).toBe(true);
		expect(kinds.has('fact')).toBe(true);
	});

	it('never puts the answer in a fixed slot', () => {
		const slots = new Set<number>();
		for (let seed = 1; seed < 40; seed++) {
			for (const q of plateQuiz(fixture, seeded(seed))) slots.add(q.options.indexOf(q.answer));
		}
		expect(slots.size).toBe(OPTION_COUNT);
	});

	it('is a function of its rand', () => {
		expect(plateQuiz(fixture, seeded(11))).toEqual(plateQuiz(fixture, seeded(11)));
	});

	it('skips a shape the plate cannot field', () => {
		const flat: Plate = { ...fixture, groups: [{ title: '', note: null, items: fixture.groups.flatMap((g) => g.items) }] };
		for (const q of plateQuiz(flat, seeded(5))) expect(q.kind).not.toBe('group');
	});

	it('displayName carries the sub, and factOf reads a fact', () => {
		const it = fixture.groups[3].items[1];
		expect(displayName(it)).toBe('Top Round (London Broil)');
		expect(factOf(it, 'Cook')).toBe('Marinated');
		expect(factOf(it, 'Season')).toBeNull();
	});
});

describe('plateIndexes', () => {
	it('joins sections, categories, cards and terms to their plates', () => {
		const data: PlatesData = { version: 1, kinds: [{ key: 'cuts', title: 'The cuts', blurb: '' }], plates: [fixture] };
		const ix = plateIndexes(data);
		expect(ix.bySlug.get('test-cuts')?.title).toBe('Test Cuts');
		expect(ix.bySection.get('cuts')?.[0].slug).toBe('test-cuts');
		expect(ix.byCategory.get('Beef Cuts & Grades')?.[0].slug).toBe('test-cuts');
		expect(ix.byCard.get('fd_0001')?.slug).toBe('test-cuts');
		expect(ix.byLexicon.get('ribeye')?.slug).toBe('test-cuts');
	});
});

/* The shipped file, when it exists: the wall is twenty plates in the order
   the build fixes, every one with a picture entry and at least six items,
   and every link a real card or term. */
describe('the emitted plates', () => {
	const file = join(__dirname, 'data', 'plates.json');
	let data: PlatesData | null = null;
	try {
		data = JSON.parse(readFileSync(file, 'utf8'));
	} catch {
		data = null;
	}
	const deck = JSON.parse(readFileSync(join(__dirname, 'data', 'floor-deck.index.json'), 'utf8')) as { cards: Array<{ id: string }> };
	const lexicon = JSON.parse(readFileSync(join(__dirname, 'data', 'lexicon.json'), 'utf8')) as Array<{ slug: string }>;

	it.skipIf(!data)('holds twenty plates, each with a picture, six items or more, and links that resolve', () => {
		const ids = new Set(deck.cards.map((c) => c.id));
		const slugs = new Set(lexicon.map((e) => e.slug));
		expect(data!.plates).toHaveLength(20);
		for (const p of data!.plates) {
			expect(p.image.width).toBeGreaterThan(0);
			expect(p.count).toBeGreaterThanOrEqual(6);
			expect(p.count).toBe(p.groups.reduce((n, g) => n + g.items.length, 0));
			for (const g of p.groups) {
				for (const it of g.items) {
					if (it.links?.deck) expect(ids.has(it.links.deck), `${p.slug}: ${it.name} links card ${it.links.deck}`).toBe(true);
					if (it.links?.lexicon) expect(slugs.has(it.links.lexicon), `${p.slug}: ${it.name} links term ${it.links.lexicon}`).toBe(true);
				}
			}
			for (const c of p.corrections) expect(c.should).toMatch(/[.!?]$/);
		}
	});

	it.skipIf(!data)('every plate can field a quiz', () => {
		for (const p of data!.plates) {
			const qs = plateQuiz(p, seeded(1));
			expect(qs.length, p.slug).toBeGreaterThanOrEqual(4);
		}
	});
});
