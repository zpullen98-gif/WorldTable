import { describe, it, expect } from 'vitest';
import {
	PRODUCER_QUIZ_MIN,
	askFrom,
	buildDeck,
	dishKinds,
	drillableDishes,
	producerKinds,
	quizSubjects,
	storyProducers,
	withoutArticle,
	type QuestionKind
} from './menu-quiz';
import type { MenuDish } from './persistence/state';
import type { Producer } from './producers';

/** A seeded generator, so a draw is repeatable and a test never flickers. */
function seeded(seed = 1) {
	let s = seed;
	return () => {
		s = (s * 16807) % 2147483647;
		return (s - 1) / 2147483646;
	};
}

const dish = (id: string, patch: Partial<MenuDish> = {}): MenuDish => ({
	id,
	name: `Dish ${id}`,
	section: 'Mains',
	description: '',
	ingredients: [],
	allergens: [],
	price: '',
	ts: 1,
	...patch
});

const pr = (id: string, patch: Partial<Producer> = {}): Producer => ({
	id,
	name: `Producer ${id}`,
	place: `Town ${id}`,
	kind: 'farm',
	supplies: `the ${id} greens`,
	story: `The story of ${id}.`,
	dishIds: [],
	ts: 1,
	...patch
});

/** Every slot the right answer lands in across thirty draws. */
function targetSlots(kind: QuestionKind): Set<number> {
	const slots = new Set<number>();
	for (let seed = 1; seed <= 30; seed++) {
		slots.add(kind.options(seeded(seed)).findIndex((o) => o.id === kind.target.id));
	}
	return slots;
}

const menu = [
	dish('a', { description: 'Braised cheek', price: '28' }),
	dish('b', { ingredients: ['beef', 'wine'] }),
	dish('c', { price: '12' }),
	dish('d', { price: '12' }),
	dish('e', { section: 'Starters' })
];

describe('the dish questions, moved from the page unchanged', () => {
	it('asks description, ingredients, a unique price, and nothing of a bare dish', () => {
		expect(dishKinds(menu[0], menu).map((k) => k.kindLabel)).toEqual([
			'Which dish does the menu describe?',
			'Which dish sells at this price?'
		]);
		expect(dishKinds(menu[1], menu).map((k) => k.prompt)).toEqual(['beef · wine']);
		// a shared price is two right answers, so no question
		expect(dishKinds(menu[2], menu)).toEqual([]);
		expect(dishKinds(menu[4], menu)).toEqual([]);
		expect(drillableDishes(menu).map((d) => d.id)).toEqual(['a', 'b']);
	});

	it('asks an allergen only when every dish is checked and it is unique', () => {
		const checked = menu.map((d) => ({ ...d, allergensCheckedAt: 1, allergens: d.id === 'a' ? ['Milk'] : [] }));
		expect(dishKinds(checked[0], checked).map((k) => k.prompt)).toContain('Milk');
		const oneUnchecked = checked.map((d) => (d.id === 'e' ? { ...d, allergensCheckedAt: undefined } : d));
		expect(dishKinds(oneUnchecked[0], oneUnchecked).map((k) => k.prompt)).not.toContain('Milk');
		// two checked dishes carrying it: two right answers, so neither is asked
		const shared = checked.map((d) => (d.id === 'b' ? { ...d, allergens: ['Milk'] } : d));
		expect(dishKinds(shared[0], shared).map((k) => k.prompt)).not.toContain('Milk');
		expect(dishKinds(shared[1], shared).map((k) => k.prompt)).not.toContain('Milk');
	});

	it('offers four distinct dishes including the right one', () => {
		const kind = dishKinds(menu[0], menu)[0];
		for (let seed = 1; seed < 30; seed++) {
			const opts = kind.options(seeded(seed));
			expect(opts).toHaveLength(4);
			expect(new Set(opts.map((o) => o.id)).size).toBe(4);
			expect(opts.map((o) => o.id)).toContain('a');
		}
	});

	it('does not always put the right answer in the same place', () => {
		// The options are built target-first, so an unshuffled list would put
		// the answer first every time and the round would teach the position.
		expect(targetSlots(dishKinds(menu[0], menu)[0]).size).toBeGreaterThan(1);
	});

	it('never asks the same subject twice running while another exists', () => {
		const subjects = quizSubjects(menu, []);
		let last = '';
		const rand = seeded(7);
		for (let i = 0; i < 40; i++) {
			const next = askFrom(subjects, last, rand)!;
			expect(next.subjectId).not.toBe(last);
			last = next.subjectId;
		}
	});

	it('asks nothing of an empty pool', () => {
		expect(askFrom([], '', seeded())).toBeNull();
	});
});

describe('the producer questions and their gates', () => {
	const four = () => [
		pr('p1', { dishIds: ['a'] }),
		pr('p2'),
		pr('p3'),
		pr('p4')
	];

	it('asks nothing at all below four producers', () => {
		const three = four().slice(0, 3);
		// Pins the floor's VALUE. For the multiple-choice shapes the floor is
		// also implied by their own gates (see producerKinds); the flashcards are
		// where storyProducers' guard is the only thing standing.
		expect(PRODUCER_QUIZ_MIN).toBe(4);
		for (const p of three) expect(producerKinds(p, three, menu)).toEqual([]);
		expect(storyProducers(three)).toEqual([]);
		expect(quizSubjects(menu, three).every((s) => s.id.startsWith('dish:'))).toBe(true);
		expect(buildDeck(menu, three, seeded()).every((c) => c.kind === 'dish')).toBe(true);
	});

	it('asks whose supplies are on a dish, answered by producer names', () => {
		const list = four();
		const whose = producerKinds(list[0], list, menu).find((k) => k.kindLabel === 'Who supplies it?')!;
		// its own article, one leading article dropped from what was typed, and
		// it reads for a plural: "Whose heirloom tomatoes is on" did not
		expect(whose.prompt).toBe('Who supplies the p1 greens on Dish a?');
		expect(whose.target).toEqual({ id: 'p1', name: 'Producer p1' });
		const opts = whose.options(seeded(3));
		expect(opts.map((o) => o.name).sort()).toEqual(['Producer p1', 'Producer p2', 'Producer p3', 'Producer p4']);
		// not tied to any dish: no "whose" question for it
		expect(producerKinds(list[1], list, menu).some((k) => k.kindLabel === 'Who supplies it?')).toBe(false);
	});

	it('drops one leading article from what they supply, and only one', () => {
		expect(withoutArticle('the Green Hill and the Thomasville Tomme')).toBe('Green Hill and the Thomasville Tomme');
		expect(withoutArticle('An heirloom grits')).toBe('heirloom grits');
		expect(withoutArticle('Theodore’s butter')).toBe('Theodore’s butter');
		const list = [pr('p1', { dishIds: ['a'], supplies: '' }), pr('p2'), pr('p3'), pr('p4')];
		expect(producerKinds(list[0], list, menu).find((k) => k.kindLabel === 'Who supplies it?')?.prompt).toBe(
			'Who supplies Dish a?'
		);
	});

	it('skips a dish that is no longer on the menu', () => {
		const list = [pr('p1', { dishIds: ['gone'] }), pr('p2'), pr('p3'), pr('p4')];
		expect(producerKinds(list[0], list, menu).some((k) => k.kindLabel === 'Who supplies it?')).toBe(false);
	});

	it('never offers a second producer on the same dish as a wrong answer', () => {
		const list = [pr('p1', { dishIds: ['a'] }), pr('p2', { dishIds: ['a'] }), pr('p3'), pr('p4'), pr('p5')];
		const whose = producerKinds(list[0], list, menu).find((k) => k.kindLabel === 'Who supplies it?')!;
		for (let seed = 1; seed < 20; seed++) {
			expect(whose.options(seeded(seed)).map((o) => o.id)).not.toContain('p2');
		}
		// and with only four producers that leaves two wrong answers: no question
		const tight = list.slice(0, 4);
		expect(producerKinds(tight[0], tight, menu).some((k) => k.kindLabel === 'Who supplies it?')).toBe(false);
	});

	it('asks where a producer is, with three other distinct places', () => {
		const list = four();
		const where = producerKinds(list[1], list, menu).find((k) => k.kindLabel === 'Where is the producer?')!;
		expect(where.prompt).toBe('Where is Producer p2?');
		expect(where.target.name).toBe('Town p2');
		const opts = where.options(seeded(5));
		expect(opts.map((o) => o.name).sort()).toEqual(['Town p1', 'Town p2', 'Town p3', 'Town p4']);
	});

	it('asks no "where" of a place two producers share', () => {
		const list = [pr('p1', { place: 'Thomasville, Georgia' }), pr('p2', { place: ' thomasville, georgia' }), pr('p3'), pr('p4'), pr('p5')];
		const where = (p: Producer) => producerKinds(p, list, menu).some((k) => k.kindLabel === 'Where is the producer?');
		expect(where(list[0])).toBe(false);
		expect(where(list[1])).toBe(false);
		// the others still have three distinct places beside theirs
		expect(where(list[2])).toBe(true);
	});

	it('asks no "where" with fewer than four distinct places, or with no place', () => {
		const list = [pr('p1'), pr('p2'), pr('p3', { place: 'Town p2' }), pr('p4', { place: '' })];
		for (const p of list) {
			expect(producerKinds(p, list, menu).some((k) => k.kindLabel === 'Where is the producer?')).toBe(false);
		}
	});

	it('asks no "where" at exactly three distinct places, the boundary', () => {
		// p1's place is its own, with only two others beside it: one short.
		const list = [pr('p1'), pr('p2'), pr('p3'), pr('p4', { place: 'Town p3' })];
		for (const p of list) {
			expect(producerKinds(p, list, menu).some((k) => k.kindLabel === 'Where is the producer?')).toBe(false);
		}
	});

	it('never asks where a producer with no place is, even beside three places', () => {
		const list = [pr('p1'), pr('p2'), pr('p3'), pr('p4', { place: '' }), pr('p5', { place: 'Town p5' })];
		expect(producerKinds(list[3], list, menu).some((k) => k.kindLabel === 'Where is the producer?')).toBe(false);
		// the gate that refused it is the empty place, not the count
		expect(producerKinds(list[0], list, menu).some((k) => k.kindLabel === 'Where is the producer?')).toBe(true);
	});

	it('treats two records under one name as one producer', () => {
		const list = [
			pr('p1', { dishIds: ['a'] }),
			pr('p1b', { name: ' producer P1 ', place: 'Elsewhere' }),
			pr('p2'),
			pr('p3'),
			pr('p4')
		];
		const kinds = producerKinds(list[0], list, menu);
		const whose = kinds.find((k) => k.kindLabel === 'Who supplies it?')!;
		for (let seed = 1; seed < 20; seed++) {
			expect(whose.options(seeded(seed)).map((o) => o.id)).not.toContain('p1b');
		}
		// both places would be right, so neither is asked where it is
		expect(kinds.some((k) => k.kindLabel === 'Where is the producer?')).toBe(false);
		expect(producerKinds(list[1], list, menu).some((k) => k.kindLabel === 'Where is the producer?')).toBe(false);
	});

	it('does not always put the right producer or place in the same slot', () => {
		const list = four();
		const kinds = producerKinds(list[0], list, menu);
		expect(targetSlots(kinds.find((k) => k.kindLabel === 'Who supplies it?')!).size).toBeGreaterThan(1);
		expect(targetSlots(kinds.find((k) => k.kindLabel === 'Where is the producer?')!).size).toBeGreaterThan(1);
	});

	it('makes a story flashcard only for a producer with a story', () => {
		const list = [pr('p1'), pr('p2', { story: '' }), pr('p3', { story: '   ' }), pr('p4')];
		expect(storyProducers(list).map((p) => p.id)).toEqual(['p1', 'p4']);
		const deck = buildDeck(menu, list, seeded(2));
		expect(deck).toHaveLength(menu.length + 2);
		expect(
			deck.flatMap((c) => (c.kind === 'producer' ? [c.producer.id] : [])).sort()
		).toEqual(['p1', 'p4']);
	});

	it('adds an askable producer to the pool as one more subject, and leaves the dish gates alone', () => {
		const list = four();
		const subjects = quizSubjects(menu, list);
		expect(subjects.filter((s) => s.id.startsWith('producer:'))).toHaveLength(4);
		expect(subjects.filter((s) => s.id.startsWith('dish:')).map((s) => s.id)).toEqual(['dish:a', 'dish:b']);
		expect(drillableDishes(menu).map((d) => d.id)).toEqual(['a', 'b']);
	});
});
