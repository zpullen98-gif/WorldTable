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
	defaultTestScope,
	dueCount,
	firstUnmetLevel,
	flipRecordable,
	levelProgress,
	levelsFromSearch,
	liveLevels,
	liveSections,
	mcFor,
	outstandingMisses,
	owedCount,
	pickSession,
	sayRound,
	scopeFromSearch,
	scopeQuery,
	sectionProgress,
	sectionsFromSearch,
	slipping,
	teachingOrder,
	termsInText,
	whyWrong
} from './floor-deck';
import { seeded, foldText } from './floor-deck-core.mjs';
import type { CookEntry } from './repertoire';
import type { DeckCard, DeckLevel, DeckTraps, FloorDeck } from './types';
import shippedDeck from './data/floor-deck.json';
import shippedTraps from './data/floor-deck.traps.json';

/**
 * The deck's engine, on a fixture deck and then on whatever has shipped.
 *
 * Time is built with the local Date constructor throughout, because every rule
 * here that mentions a day means the reader's day.
 */
const LEVEL_NAMES = ['Commis', 'Chef de Partie', 'Sous Chef', 'Chef'];
const at = (day: number, hour = 12) => new Date(2026, 8, day, hour, 0, 0).getTime();

/**
 * A deck of numbered cards, in the shape the build emits: section order, then
 * authored order, whatever the levels. `levelOf` places each card; by default
 * every card is level 1, which is the deck as it behaved before levels.
 */
function fixture(shape: Record<string, number>, levelOf: (section: string, i: number) => DeckLevel = () => 1): FloorDeck {
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
				level: levelOf(section, i),
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
		levels: LEVEL_NAMES.map((name, i) => ({
			level: (i + 1) as DeckLevel,
			name,
			blurb: '',
			count: cards.filter((c) => c.level === i + 1).length
		})),
		cards
	};
}

const entry = (slug: string, when: number, grade: CookEntry['grade']): CookEntry => ({ slug, at: when, grade });
const ids = (cards: readonly DeckCard[]) => cards.map((c) => c.id);

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
		const test = buildTest(deck, traps, [], at(1), seeded(1), { section: 'cuts' });
		expect(test.filter((q) => q.kind === 'mc')).toHaveLength(TEST_MC);
		const match = test.filter((q) => q.kind === 'match');
		expect(match).toHaveLength(1);
		expect(match[0].kind === 'match' && match[0].cards).toHaveLength(MATCH_SIZE);
	});
	it('a middling section gives up multiple choice to keep the match set, and a small one is all multiple choice', () => {
		const ten = buildTest(fixture({ cuts: 10 }), {}, [], at(1), seeded(1), { section: 'cuts' });
		expect(ten.filter((q) => q.kind === 'mc')).toHaveLength(6);
		expect(ten.filter((q) => q.kind === 'match')).toHaveLength(1);
		const six = buildTest(fixture({ cuts: 6, fish: 6 }), {}, [], at(1), seeded(1), { section: 'cuts' });
		expect(six.every((q) => q.kind === 'mc')).toBe(true);
		expect(six).toHaveLength(6);
	});
	it('never asks a card twice', () => {
		const test = buildTest(fixture({ cuts: 22 }), {}, [], at(1), seeded(3), { section: 'cuts' });
		const asked = test.flatMap((q) => (q.kind === 'mc' ? [q.card.id] : q.cards.map((c) => c.id)));
		expect(new Set(asked).size).toBe(asked.length);
	});
	it('asks what was missed first', () => {
		const deck = fixture({ cuts: 22 });
		const test = buildTest(deck, {}, [entry('fd_0017', at(1), 'missed')], at(2), seeded(5), { section: 'cuts' });
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
	const card = (id: string, term: string, aliases?: string[]): DeckCard => ({ id, term, aliases, section: 's', level: 1, gist: `gist ${id}`, guest: 'g', why: 'w' });
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
		// built here, not with teachingOrder(), which pickSession itself uses:
		// level 1 in section order, then level 2, each in the file's order
		const sectionAt = new Map(deck.sections.map((s, i) => [s.key, i]));
		const expected = ([1, 2, 3, 4] as const).flatMap((l) =>
			deck.cards
				.map((c, i) => ({ c, i }))
				.filter(({ c }) => c.level === l)
				.sort((a, b) => sectionAt.get(a.c.section)! - sectionAt.get(b.c.section)! || a.i - b.i)
				.map(({ c }) => c.id)
		);
		expect(ids(session)).toEqual(expected.slice(0, session.length));
		// and the file order would not have passed: guided order is being tested
		expect(ids(deck.cards.slice(0, session.length))).not.toEqual(ids(session));
	});

	it('the first sitting is all Commis, and the landing opens there', () => {
		const session = pickSession(deck, [], at(1));
		expect(session.every((c) => c.level === 1)).toBe(true);
		expect(firstUnmetLevel(deck, [])).toBe(1);
	});

	it('every level fields a full written test', () => {
		for (const l of liveLevels(deck)) {
			const test = buildTest(deck, traps, [], at(1), seeded(l.level), { level: l.level });
			expect(test.filter((q) => q.kind === 'mc'), `${l.name}`).toHaveLength(TEST_MC);
			expect(test.filter((q) => q.kind === 'match'), `${l.name}`).toHaveLength(1);
			const asked = test.flatMap((q) => (q.kind === 'mc' ? [q.card] : q.cards));
			expect(asked.every((c) => c.level === l.level)).toBe(true);
		}
	});
});

/**
 * Four brigade levels that guide and never lock. The fixture interleaves the
 * levels inside each section, so an engine that walked the file's own order
 * would visibly fail every one of these.
 */
describe('levels', () => {
	const alternating = (_: string, i: number): DeckLevel => (i % 2 ? 2 : 1);
	const deck = fixture({ a: 8, b: 8 }, alternating);
	const byLevel = (l: DeckLevel, d = deck) => d.cards.filter((c) => c.level === l);

	it('a new reader meets every Commis card, section by section, before any level-two card', () => {
		const session = pickSession(deck, [], at(1));
		expect(session).toHaveLength(16);
		const first = session.slice(0, 8);
		expect(first.every((c) => c.level === 1)).toBe(true);
		expect(first.map((c) => c.section)).toEqual(['a', 'a', 'a', 'a', 'b', 'b', 'b', 'b']);
		// and spills into level two inside the same sitting, in the same order
		expect(ids(session.slice(8))).toEqual(ids(byLevel(2)));
		expect(ids(session)).toEqual(ids(teachingOrder(deck.cards)));
	});

	it('teaching order is stable: within a level the file order stands', () => {
		expect(ids(teachingOrder(deck.cards).filter((c) => c.level === 1))).toEqual(ids(byLevel(1)));
	});

	it('a level scope and a section scope intersect', () => {
		const both = cardsInScope(deck, new Set(['a']), new Set<DeckLevel>([2]));
		expect(both).toHaveLength(4);
		expect(both.every((c) => c.section === 'a' && c.level === 2)).toBe(true);
		const session = pickSession(deck, [], at(1), { scope: new Set(['b']), levels: new Set<DeckLevel>([1]) });
		expect(ids(session)).toEqual(ids(byLevel(1).filter((c) => c.section === 'b')));
	});

	it('what is owed reaches down from a level scope: yesterday\'s Commis miss leads a level-two sitting', () => {
		const missed = byLevel(1)[2];
		const flipped = byLevel(1)[5];
		const log = [entry(missed.id, at(1), 'missed'), entry(flipped.id, at(1), 'close')];
		const session = pickSession(deck, log, at(4), { levels: new Set<DeckLevel>([2]) });
		expect(session[0].id).toBe(missed.id);
		expect(ids(session)).toContain(flipped.id); // due on the two-day rung
		// the new cards stay inside the chosen level
		const fresh = session.filter((c) => !log.some((e) => e.slug === c.id));
		expect(fresh.every((c) => c.level === 2)).toBe(true);
		expect(fresh.length).toBeGreaterThan(0);
	});

	it('reaching down still keeps to the section filter', () => {
		const lowA = byLevel(1).find((c) => c.section === 'a')!;
		const lowB = byLevel(1).find((c) => c.section === 'b')!;
		const log = [entry(lowA.id, at(1), 'missed'), entry(lowB.id, at(1), 'missed')];
		const session = pickSession(deck, log, at(2), { scope: new Set(['b']), levels: new Set<DeckLevel>([2]) });
		expect(session.every((c) => c.section === 'b')).toBe(true);
		expect(session[0].id).toBe(lowB.id);
		expect(ids(session)).not.toContain(lowA.id);
	});

	it('"only what I missed" under a level scope reaches down too, never up', () => {
		const three = fixture({ a: 9 }, (_, i) => ((i % 3) + 1) as DeckLevel);
		const one = three.cards.find((c) => c.level === 1)!;
		const top = three.cards.find((c) => c.level === 3)!;
		const log = [entry(one.id, at(1), 'missed'), entry(top.id, at(1), 'missed')];
		const misses = pickSession(three, log, at(2), { focus: 'misses', levels: new Set<DeckLevel>([2]) });
		expect(ids(misses)).toEqual([one.id]);
	});

	it('the landing counts what is owed by the sitting\'s own rule', () => {
		const lowA = byLevel(1).find((c) => c.section === 'a')!;
		const highA = byLevel(2).find((c) => c.section === 'a')!;
		const log = [entry(lowA.id, at(1), 'missed'), entry(highA.id, at(1), 'missed')];
		expect(dueCount(deck, log, at(2))).toBe(2);
		expect(owedCount(deck, log, at(2))).toBe(2);
		expect(owedCount(deck, log, at(2), { levels: new Set<DeckLevel>([2]) })).toBe(2);
		expect(owedCount(deck, log, at(2), { levels: new Set<DeckLevel>([1]) })).toBe(1);
		expect(owedCount(deck, log, at(2), { scope: new Set(['b']), levels: new Set<DeckLevel>([2]) })).toBe(0);
		// and the count is what the sitting leads with
		const session = pickSession(deck, log, at(2), { levels: new Set<DeckLevel>([1]) });
		expect(ids(session.slice(0, 1))).toEqual([lowA.id]);
		expect(ids(session)).not.toContain(highA.id);
	});

	it('say-it-back keeps to the chosen level', () => {
		const wide = fixture({ a: 16, b: 16 }, alternating);
		const round = sayRound(wide, [], at(1), seeded(7), { levels: new Set<DeckLevel>([2]) });
		expect(round.length).toBeGreaterThan(0);
		expect(round.every((q) => q.card.level === 2)).toBe(true);
	});

	it('teaching order cannot be reordered by a caller', () => {
		expect(Object.isFrozen(teachingOrder(deck.cards))).toBe(true);
		expect(Object.isFrozen(cardsInScope(deck, null))).toBe(true);
	});

	it('but never up: a level-two miss stays out of a Commis sitting', () => {
		const missed = byLevel(2)[0];
		const session = pickSession(deck, [entry(missed.id, at(1), 'missed')], at(2), { levels: new Set<DeckLevel>([1]) });
		expect(session.every((c) => c.level === 1)).toBe(true);
	});

	it('once a level has been seen, the top-up stays inside it', () => {
		const small = fixture({ a: 6 }, alternating);
		const log = small.cards.map((c) => entry(c.id, at(1), 'met'));
		const session = pickSession(small, log, at(2), { levels: new Set<DeckLevel>([2]) });
		expect(session.length).toBeGreaterThan(0);
		expect(session.every((c) => c.level === 2)).toBe(true);
	});

	it('a section scope with no level scope behaves as it always did', () => {
		const missed = byLevel(2)[0]; // section a
		const session = pickSession(deck, [entry(missed.id, at(1), 'missed')], at(2), { scope: new Set(['b']) });
		expect(session.every((c) => c.section === 'b')).toBe(true);
	});

	it('a flip-only reader reaches every card with the levels mixed: thirty simulated days', () => {
		const mixed = (_: string, i: number): DeckLevel => ((i % 4) + 1) as DeckLevel;
		const big = fixture({ a: 24, b: 25, c: 14, d: 22, e: 22, f: 30, g: 16 }, mixed);
		for (const followLanding of [false, true]) {
			const log: CookEntry[] = [];
			let sawAll = 0;
			for (let day = 1; day <= 30; day++) {
				// the landing's default: the first level with an unmet card, or all
				const level = followLanding ? firstUnmetLevel(big, log) : null;
				const levels = level ? new Set<DeckLevel>([level]) : null;
				const session = pickSession(big, log, at(day, 9), { levels });
				expect(new Set(ids(session)).size).toBe(session.length);
				for (const c of session) if (flipRecordable(log, c.id, at(day, 9))) log.push(entry(c.id, at(day, 9), FLIP_GRADES.had));
				if (!sawAll && new Set(log.map((e) => e.slug)).size === big.cards.length) sawAll = day;
			}
			expect(sawAll, `a flip-only reader stalled (following the landing: ${followLanding})`).toBeGreaterThan(0);
			// a level change can end a day early, at most once per level
			expect(sawAll).toBeLessThanOrEqual(Math.ceil(big.cards.length / NEW_QUOTA) + (followLanding ? 4 : 1));
		}
	});

	it('progress by level, and by section at a level, is facts', () => {
		const log = [entry(byLevel(1)[0].id, at(1), 'close'), entry(byLevel(2)[5].id, at(1), 'missed')];
		expect(levelProgress(deck, log).map(({ level, name, seen, total }) => ({ level, name, seen, total }))).toEqual([
			{ level: 1, name: 'Commis', seen: 1, total: 8 },
			{ level: 2, name: 'Chef de Partie', seen: 1, total: 8 }
		]);
		expect(sectionProgress(deck, log, 2)).toEqual([
			{ key: 'a', title: 'A', seen: 0, total: 4 },
			{ key: 'b', title: 'B', seen: 1, total: 4 }
		]);
		// a section with nothing at a level is listed at zero, not dropped
		const lopsided = fixture({ a: 4, b: 4 }, (s) => (s === 'a' ? 1 : 2));
		expect(sectionProgress(lopsided, [], 1).map((p) => p.total)).toEqual([4, 0]);
	});

	it('the first unmet level is derived from the log: one, then two, then none', () => {
		expect(firstUnmetLevel(deck, [])).toBe(1);
		const l1 = byLevel(1).map((c) => entry(c.id, at(1), 'close'));
		expect(firstUnmetLevel(deck, l1)).toBe(2);
		const all = deck.cards.map((c) => entry(c.id, at(1), 'close'));
		expect(firstUnmetLevel(deck, all)).toBeNull();
	});

	it('a level test asks that level across its sections, and nothing else', () => {
		const wide = fixture({ a: 16, b: 16 }, alternating);
		const test = buildTest(wide, {}, [], at(1), seeded(4), { level: 2 });
		const asked = test.flatMap((q) => (q.kind === 'mc' ? [q.card] : q.cards));
		expect(asked).toHaveLength(TEST_MC + MATCH_SIZE);
		expect(asked.every((c) => c.level === 2)).toBe(true);
		expect(new Set(asked.map((c) => c.section))).toEqual(new Set(['a', 'b']));
	});

	it('a section test asks that section at every level', () => {
		const wide = fixture({ a: 16, b: 16 }, alternating);
		const test = buildTest(wide, {}, [], at(1), seeded(4), { section: 'a' });
		const asked = test.flatMap((q) => (q.kind === 'mc' ? [q.card] : q.cards));
		expect(asked.every((c) => c.section === 'a')).toBe(true);
		expect(new Set(asked.map((c) => c.level))).toEqual(new Set([1, 2]));
	});

	it('the test offered first: a level in the URL, else a section, else the first unmet level', () => {
		expect(defaultTestScope('?level=2,1', deck, [])).toEqual({ level: 1 });
		expect(defaultTestScope('?level=4', deck, [])).toEqual({ level: 1 }); // no card at four here
		expect(defaultTestScope('?section=b,a', deck, [])).toEqual({ section: 'b' });
		expect(defaultTestScope('?level=2&section=b', deck, [])).toEqual({ level: 2 });
		expect(defaultTestScope('', deck, byLevel(1).map((c) => entry(c.id, at(1), 'met')))).toEqual({ level: 2 });
		expect(defaultTestScope('', deck, deck.cards.map((c) => entry(c.id, at(1), 'met')))).toEqual({ level: 1 });
	});
});

describe('levels in the URL', () => {
	const deck = fixture({ a: 8, b: 8 }, (_, i) => ((i % 4) + 1) as DeckLevel);
	const known: DeckLevel[] = [1, 2, 3, 4];

	it('keeps the exact integer keys and drops the rest', () => {
		expect(levelsFromSearch('?level=1,3', known)).toEqual(new Set([1, 3]));
		expect(levelsFromSearch('?level=1,9', known)).toEqual(new Set([1]));
		expect(levelsFromSearch('?level=4', [1, 2])).toBeNull();
	});
	it('a name is not a level: names are copy, and a saved link must not change meaning', () => {
		expect(levelsFromSearch('?level=commis', known)).toBeNull();
		expect(levelsFromSearch('?level=Chef', known)).toBeNull();
		expect(levelsFromSearch('?level=01', known)).toBeNull();
		expect(levelsFromSearch('?level=1.0', known)).toBeNull();
	});
	it('means every level when it is absent or empty', () => {
		expect(levelsFromSearch('', known)).toBeNull();
		expect(levelsFromSearch('?level=', known)).toBeNull();
	});
	it('writes a scope back as the query that reads as it', () => {
		expect(scopeQuery(null, null)).toBe('');
		expect(scopeQuery(1, [])).toBe('?level=1');
		expect(scopeQuery(null, ['a', 'b'])).toBe('?section=a,b');
		expect(scopeQuery(new Set<DeckLevel>([3, 1]), ['b'])).toBe('?level=1,3&section=b');
	});
	it('round-trips through scopeFromSearch', () => {
		const cases: Array<[Set<DeckLevel> | null, Set<string> | null]> = [
			[null, null],
			[new Set<DeckLevel>([1]), null],
			[null, new Set(['b', 'a'])],
			[new Set<DeckLevel>([2, 4]), new Set(['a'])]
		];
		for (const [levels, scope] of cases) {
			expect(scopeFromSearch(scopeQuery(levels, scope), deck)).toEqual({ scope, levels });
		}
	});
});
