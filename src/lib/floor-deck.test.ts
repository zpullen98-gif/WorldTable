import { describe, it, expect } from 'vitest';
import {
	FLIP_GRADES,
	MATCH_SIZE,
	NEW_QUOTA,
	SAY_DISH_LINES_MAX,
	SESSION_LENGTH,
	TEST_MC,
	buildTest,
	cardsInScope,
	dueCount,
	flipRecordable,
	liveSections,
	mcFor,
	outstandingMisses,
	pickSession,
	sayRound,
	sectionProgress,
	sectionsFromSearch,
	slipping,
	termsInText,
	whyWrong
} from './floor-deck';
import { seeded, foldText } from './floor-deck-core.mjs';
import type { CookEntry } from './repertoire';
import type { DeckCard, DeckTraps, FloorDeck } from './types';
import shippedDeck from './data/floor-deck.json';
import shippedTraps from './data/floor-deck.traps.json';

/**
 * The deck's engine, on a fixture deck and then on whatever has shipped.
 *
 * Time is built with the local Date constructor throughout, because every rule
 * here that mentions a day means the reader's day.
 */
const at = (day: number, hour = 12) => new Date(2026, 8, day, hour, 0, 0).getTime();

function fixture(shape: Record<string, number>): FloorDeck {
	const cards: DeckCard[] = [];
	let n = 0;
	for (const [section, count] of Object.entries(shape)) {
		for (let i = 0; i < count; i++) {
			n++;
			const id = `fd_${String(n).padStart(4, '0')}`;
			cards.push({
				id,
				term: `Term ${n}`,
				section,
				gist: `What card number ${n} of the ${section} section is, said plainly`,
				guest: `This is what a server says about card number ${n}.`,
				why: `Card ${n} is called Term ${n} for a reason that mentions Term ${n} by name.`,
				prompt: `Card ${n} is called __ __ for a reason.`
			});
		}
	}
	return {
		version: 1,
		frame: { madeWith: 'Classically made with', confirm: 'Recipes vary. Confirm with the kitchen.' },
		sections: [...Object.entries(shape).map(([key, count]) => ({ key, title: key.toUpperCase(), blurb: '', count })), { key: 'planned', title: 'PLANNED', blurb: '', count: 0 }],
		cards
	};
}

const entry = (slug: string, when: number, grade: CookEntry['grade']): CookEntry => ({ slug, at: when, grade });
const ids = (cards: DeckCard[]) => cards.map((c) => c.id);

describe('a sitting', () => {
	const deck = fixture({ cuts: 8, fish: 30 });

	it('walks a new reader forward in teaching order, and spills into the next section', () => {
		const session = pickSession(deck, [], at(1));
		expect(session).toHaveLength(SESSION_LENGTH);
		expect(ids(session)).toEqual(deck.cards.slice(0, 20).map((c) => c.id));
		expect(session.slice(0, 8).every((c) => c.section === 'cuts')).toBe(true);
		expect(session[8].section).toBe('fish');
	});

	it('never shows a section that has no written card', () => {
		expect(liveSections(deck).map((s) => s.key)).toEqual(['cuts', 'fish']);
	});

	it('keeps room for new cards while any are unseen, however much is due', () => {
		// 20 cards flipped three days ago: all due on the two-day rung
		const log = deck.cards.slice(0, 20).map((c) => entry(c.id, at(1), 'close'));
		const session = pickSession(deck, log, at(4));
		const fresh = session.filter((c) => !log.some((e) => e.slug === c.id));
		expect(fresh).toHaveLength(NEW_QUOTA);
		expect(session).toHaveLength(SESSION_LENGTH);
		// what is owed leads, the new cards follow, in deck order
		expect(ids(session.slice(SESSION_LENGTH - NEW_QUOTA))).toEqual(deck.cards.slice(20, 20 + NEW_QUOTA).map((c) => c.id));
	});

	it('gives the new cards the whole sitting when little is owed', () => {
		const log = [entry('fd_0001', at(1), 'close')];
		const session = pickSession(deck, log, at(4));
		expect(session[0].id).toBe('fd_0001');
		expect(session.filter((c) => c.id !== 'fd_0001')).toHaveLength(SESSION_LENGTH - 1);
	});

	it('once everything has been seen, it is what is owed and then what comes due soonest, never a repeat', () => {
		const small = fixture({ cuts: 6 });
		const log = [
			...small.cards.map((c, i) => entry(c.id, at(1 + i), 'met')),
			entry('fd_0003', at(9), 'missed')
		];
		const session = pickSession(small, log, at(10));
		expect(session[0].id).toBe('fd_0003');
		expect(new Set(ids(session)).size).toBe(session.length);
		expect(session).toHaveLength(6); // a small scope is a short sitting, not a padded one
	});

	it('honours a scope, and ignores the rest of the shared log', () => {
		const log = [entry('drill-firing-order', at(1), 'met'), entry('comte', at(1), 'missed')];
		const session = pickSession(deck, log, at(2), { scope: new Set(['fish']) });
		expect(session.every((c) => c.section === 'fish')).toBe(true);
		expect(cardsInScope(deck, new Set(['cuts']))).toHaveLength(8);
	});

	it('"study these now" is only what is owed from a miss', () => {
		const log = [entry('fd_0002', at(1), 'missed'), entry('fd_0005', at(2), 'missed'), entry('fd_0006', at(2), 'met')];
		expect(ids(pickSession(deck, log, at(2, 13), { focus: 'misses' }))).toEqual(['fd_0005', 'fd_0002']);
	});

	it('a flip-only reader reaches every card: thirty simulated days', () => {
		const big = fixture({ a: 24, b: 25, c: 14, d: 22, e: 22, f: 30, g: 16 });
		const log: CookEntry[] = [];
		let sawAll = 0;
		for (let day = 1; day <= 30; day++) {
			const session = pickSession(big, log, at(day, 9));
			expect(session.length).toBeLessThanOrEqual(SESSION_LENGTH);
			expect(new Set(ids(session)).size).toBe(session.length);
			for (const c of session) if (flipRecordable(log, c.id, at(day, 9))) log.push(entry(c.id, at(day, 9), FLIP_GRADES.had));
			if (!sawAll && new Set(log.map((e) => e.slug)).size === big.cards.length) sawAll = day;
		}
		expect(sawAll, 'a flip-only reader stalled before the end of the deck').toBeGreaterThan(0);
		expect(sawAll).toBeLessThanOrEqual(Math.ceil(big.cards.length / NEW_QUOTA) + 1);
	});

	it('a Lineup is the same picker over the venue log, with its own quota', () => {
		const room = [entry('fd_0004', at(1), 'missed'), entry('fd_0001', at(1), 'met')];
		const lineup = pickSession(deck, room, at(2), { length: 8, newQuota: 4 });
		expect(lineup).toHaveLength(8);
		expect(lineup[0].id).toBe('fd_0004');
	});
});

describe('what is owed from a miss', () => {
	it('is not cleared by a right answer the same day: that is reading it back', () => {
		expect(outstandingMisses([entry('a', at(1, 19), 'missed'), entry('a', at(1, 20), 'met')])).toEqual(['a']);
	});
	it('is cleared by a right answer on a later day, even an hour past midnight', () => {
		expect(outstandingMisses([entry('a', at(1, 23), 'missed'), entry('a', at(2, 1), 'close')])).toEqual([]);
	});
	it('a later miss makes it owed again, and the most recent miss leads', () => {
		const log = [entry('a', at(1), 'missed'), entry('a', at(2), 'met'), entry('a', at(5), 'missed'), entry('b', at(6), 'missed')];
		expect(outstandingMisses(log)).toEqual(['b', 'a']);
	});
	it('counts toward what the tile says is due, once', () => {
		const deck = fixture({ cuts: 6 });
		const log = [entry('fd_0001', at(1), 'missed'), entry('fd_0002', at(1), 'close')];
		expect(dueCount(deck, log, at(1, 13))).toBe(1); // the miss; the flip is fresh
		expect(dueCount(deck, log, at(5))).toBe(2);
	});
});

describe('a flip', () => {
	it('never promotes: every button records close or missed', () => {
		expect(Object.values(FLIP_GRADES)).not.toContain('met');
	});
	it('is written once per card per local day, the first judgment standing', () => {
		const log = [entry('fd_0001', at(3, 9), 'close')];
		expect(flipRecordable(log, 'fd_0001', at(3, 22))).toBe(false);
		expect(flipRecordable(log, 'fd_0001', at(4, 1))).toBe(true);
		expect(flipRecordable(log, 'fd_0002', at(3, 22))).toBe(true);
	});
});

describe('progress is facts, not a score', () => {
	const deck = fixture({ cuts: 6, fish: 6 });
	it('says how much of each section has been seen', () => {
		const log = [entry('fd_0001', at(1), 'close'), entry('fd_0001', at(3), 'close'), entry('fd_0008', at(1), 'missed')];
		expect(sectionProgress(deck, log)).toEqual([
			{ key: 'cuts', title: 'CUTS', seen: 1, total: 6 },
			{ key: 'fish', title: 'FISH', seen: 1, total: 6 }
		]);
	});
	it('names the terms that keep slipping', () => {
		const log = [1, 3, 5].map((d) => entry('fd_0004', at(d), 'missed'));
		expect(ids(slipping(deck, [...log, entry('fd_0002', at(1), 'missed')], at(6)))).toEqual(['fd_0004']);
	});
});

describe('the written test', () => {
	const traps: DeckTraps = { fd_0001: [{ says: 'A plausible and entirely false description of card one', why: 'It is false because it is a fixture.' }] };

	it('is ten multiple choice and one set of four to match, in a section big enough', () => {
		const deck = fixture({ cuts: 22 });
		const test = buildTest(deck, traps, [], at(1), seeded(1), 'cuts');
		expect(test.filter((q) => q.kind === 'mc')).toHaveLength(TEST_MC);
		const match = test.filter((q) => q.kind === 'match');
		expect(match).toHaveLength(1);
		expect(match[0].kind === 'match' && match[0].cards).toHaveLength(MATCH_SIZE);
	});
	it('a middling section gives up multiple choice to keep the match set, and a small one is all multiple choice', () => {
		const ten = buildTest(fixture({ cuts: 10 }), {}, [], at(1), seeded(1), 'cuts');
		expect(ten.filter((q) => q.kind === 'mc')).toHaveLength(6);
		expect(ten.filter((q) => q.kind === 'match')).toHaveLength(1);
		const six = buildTest(fixture({ cuts: 6, fish: 6 }), {}, [], at(1), seeded(1), 'cuts');
		expect(six.every((q) => q.kind === 'mc')).toBe(true);
		expect(six).toHaveLength(6);
	});
	it('never asks a card twice', () => {
		const test = buildTest(fixture({ cuts: 22 }), {}, [], at(1), seeded(3), 'cuts');
		const asked = test.flatMap((q) => (q.kind === 'mc' ? [q.card.id] : q.cards.map((c) => c.id)));
		expect(new Set(asked).size).toBe(asked.length);
	});
	it('asks what was missed first', () => {
		const deck = fixture({ cuts: 22 });
		const test = buildTest(deck, {}, [entry('fd_0017', at(1), 'missed')], at(2), seeded(5), 'cuts');
		expect(test[0].kind === 'mc' && test[0].card.id).toBe('fd_0017');
	});
	it('one right answer, four distinct options, its own traps and nobody else\'s', () => {
		const deck = fixture({ cuts: 12 });
		for (let seed = 1; seed <= 50; seed++) {
			for (const card of deck.cards) {
				const q = mcFor(card, deck.cards, traps[card.id], seeded(seed))!;
				expect(q.options).toHaveLength(4);
				expect(q.options.filter((o) => o.correct)).toHaveLength(1);
				expect(new Set(q.options.map((o) => foldText(o.text))).size).toBe(4);
				const trapped = q.options.filter((o) => o.from === 'trap');
				expect(trapped.length).toBe(card.id === 'fd_0001' ? 1 : 0);
			}
		}
	});
	it('puts the right answer in every slot about as often', () => {
		const deck = fixture({ cuts: 12 });
		const slot = [0, 0, 0, 0];
		const rand = seeded(9);
		for (let i = 0; i < 2000; i++) slot[mcFor(deck.cards[i % 12], deck.cards, undefined, rand)!.options.findIndex((o) => o.correct)]++;
		for (const n of slot) {
			expect(n / 2000).toBeGreaterThan(0.2);
			expect(n / 2000).toBeLessThan(0.3);
		}
	});
	it('says why a wrong answer is wrong: the trap\'s own reason, or whose description it was', () => {
		const deck = fixture({ cuts: 6 });
		expect(whyWrong({ from: 'trap', why: 'Because.' }, deck.cards)).toBe('Because.');
		expect(whyWrong({ from: 'kin', id: 'fd_0003' }, deck.cards)).toBe('That is Term 3.');
		expect(whyWrong({ from: 'kin', id: 'fd_9999' }, deck.cards)).toBe('That describes something else.');
	});
});

describe('finding deck words on a menu', () => {
	const card = (id: string, term: string, aliases?: string[]): DeckCard => ({ id, term, aliases, section: 's', gist: `gist ${id}`, guest: 'g', why: 'w' });
	const cards = [card('fd_0001', 'Rib'), card('fd_0002', 'Short Rib'), card('fd_0003', 'Ribeye'), card('fd_0004', 'Pâté'), card('fd_0005', 'Hanger Steak', ['Onglet'])];

	it('matches whole words, longest name first, accents folded', () => {
		expect(termsInText('Braised short rib, pate, pickles', cards).map((c) => c.term)).toEqual(['Short Rib', 'Pâté']);
	});
	it('does not find rib inside ribeye', () => {
		expect(termsInText('Grilled ribeye', cards).map((c) => c.term)).toEqual(['Ribeye']);
	});
	it('matches an alias', () => {
		expect(termsInText('Onglet, shallots, red wine', cards).map((c) => c.term)).toEqual(['Hanger Steak']);
	});
	/* A menu serves "chanterelles" and "oysters". The exact-name match found
	   neither, so say-it-back could not see a card on the house's own menu. */
	it('matches a plain plural, and still keeps whole words', () => {
		const more = [...cards, card('fd_0006', 'Chanterelle'), card('fd_0007', 'Oyster Mushroom'), card('fd_0008', 'Peach')];
		expect(termsInText('Pan-roasted chanterelles, brown butter', more).map((c) => c.term)).toEqual(['Chanterelle']);
		expect(termsInText('Roasted oyster mushrooms and short ribs', more).map((c) => c.term)).toEqual(['Oyster Mushroom', 'Short Rib']);
		expect(termsInText('Grilled peaches, burrata', more).map((c) => c.term)).toEqual(['Peach']);
		// a plural is -s or -es on the whole word, never a longer word
		expect(termsInText('Grilled ribeyes', more).map((c) => c.term)).toEqual(['Ribeye']);
		expect(termsInText('Spare ribbons', more)).toEqual([]);
	});
});

describe('say-it-back', () => {
	const deck = fixture({ cuts: 14 });
	deck.cards[0].line = 'Grilled Term 1, chimichurri, fries';
	deck.cards[1].line = 'Term 2 on toast';
	deck.cards[2].line = 'Term 3 with beans';
	deck.cards[3].line = 'Term 4, plain';

	it('asks ten, each with four options and exactly one right', () => {
		const round = sayRound(deck, [], at(1), seeded(2));
		expect(round).toHaveLength(10);
		for (const q of round) {
			expect(q.options).toHaveLength(4);
			expect(q.options.filter((o) => o.correct)).toHaveLength(1);
		}
	});
	it('asks about a dish line at most three times, and the redacted prompt otherwise', () => {
		const round = sayRound(deck, [], at(1), seeded(2));
		expect(round.filter((q) => q.kind === 'line')).toHaveLength(SAY_DISH_LINES_MAX);
		for (const q of round.filter((x) => x.kind === 'prompt')) {
			expect(q.stem).toBe(q.card.prompt);
			expect(q.stem).not.toContain(q.card.term);
			expect(q.options.find((o) => o.correct)!.text).toBe(q.card.term);
		}
	});
	it('prefers the house\'s own menu line to the authored one', () => {
		const round = sayRound(deck, [], at(1), seeded(2), { houseLines: ['Wood-grilled term 1, house pickles'] });
		const q = round.find((x) => x.card.id === 'fd_0001')!;
		expect(q.kind).toBe('line');
		expect(q.stem).toBe('Wood-grilled term 1, house pickles');
		expect(q.options.find((o) => o.correct)!.text).toBe(q.card.gist);
	});
});

describe('the scope in the URL', () => {
	const known = ['cuts', 'fish'];
	it('keeps known sections, folds case, and drops the rest', () => {
		expect(sectionsFromSearch('?section=Cuts,nope', known)).toEqual(new Set(['cuts']));
	});
	it('means every section when it is absent, empty or wholly unknown', () => {
		expect(sectionsFromSearch('', known)).toBeNull();
		expect(sectionsFromSearch('?section=', known)).toBeNull();
		expect(sectionsFromSearch('?section=nope', known)).toBeNull();
	});
});

/**
 * Whatever has shipped. Vacuous while the deck is empty, and from the pilot on
 * it is the check that matters: every real card can be asked, fairly.
 */
describe('against the shipped deck', () => {
	const deck = shippedDeck as unknown as FloorDeck;
	const traps = shippedTraps as unknown as DeckTraps;

	it('every card fields a fair multiple-choice question', () => {
		let asked = 0;
		let longest = 0;
		let shortest = 0;
		const rand = seeded(20260919);
		for (const card of deck.cards) {
			for (let draw = 0; draw < 20; draw++) {
				const q = mcFor(card, deck.cards, traps[card.id], rand);
				expect(q, `${card.id} ${card.term} cannot field four options`).not.toBeNull();
				expect(q!.options.filter((o) => o.correct)).toHaveLength(1);
				expect(new Set(q!.options.map((o) => foldText(o.text))).size).toBe(4);
				for (const o of q!.options.filter((x) => x.from === 'trap')) {
					expect((traps[card.id] ?? []).some((t) => t.says === o.text), `${card.id} was offered another card's trap`).toBe(true);
				}
				const lengths = q!.options.map((o) => o.text.length);
				const key = q!.options.find((o) => o.correct)!.text.length;
				asked++;
				if (key === Math.max(...lengths)) longest += 1 / lengths.filter((n) => n === key).length;
				if (key === Math.min(...lengths)) shortest += 1 / lengths.filter((n) => n === key).length;
			}
		}
		if (deck.cards.length >= 40) {
			expect(longest / asked, 'always picking the longest option').toBeLessThanOrEqual(0.3);
			expect(shortest / asked, 'always picking the shortest option').toBeLessThanOrEqual(0.34);
		}
	});

	it('every say-it-back prompt hides its own term', () => {
		for (const card of deck.cards) {
			const stem = foldText(card.prompt ?? card.why);
			if (!card.prompt) continue;
			for (const word of foldText(card.term).split(' ').filter((w) => w.length >= 4)) {
				expect(` ${stem} `.includes(` ${word} `), `${card.id}: "${word}" survives in its own prompt`).toBe(false);
			}
		}
	});

	it('a whole new reader can start: a first sitting exists and is in teaching order', () => {
		if (!deck.cards.length) return;
		const session = pickSession(deck, [], at(1));
		expect(session.length).toBe(Math.min(SESSION_LENGTH, deck.cards.length));
		expect(ids(session)).toEqual(deck.cards.slice(0, session.length).map((c) => c.id));
	});
});
