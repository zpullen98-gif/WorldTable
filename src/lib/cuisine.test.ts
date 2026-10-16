import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { AMERICAN_RE, DASH_RE, IZE_OK, IZE_RE, NUMERAL_RE } from '../../tools/derive/cuisine-contract.mjs';
import {
	CZ_NEW_CAP,
	CZ_RUN_CAP,
	askOrder,
	cardGrade,
	cardRepertoire,
	cardsForMisses,
	cardsInScope,
	chapterCounts,
	chapterLine,
	chaptersForScope,
	cuisineToday,
	czLog,
	czSlug,
	dateWords,
	dealCards,
	gradeMatch,
	gradeSteps,
	learntCount,
	matchOrder,
	matchesInScope,
	mcOptions,
	minutesWords,
	nextEntry,
	nextUnread,
	pairUp,
	parseScope,
	placeStep,
	questionsInScope,
	recordable,
	removeStep,
	requeue,
	roundGrade,
	scopeName,
	scopeString,
	stepsInScope,
	stepsPool,
	teachingOrder,
	todayLine,
	unpair,
	type CzHead,
	type CzIndex,
	type CzTuple
} from './cuisine';
import { READ_KEY, readRead, setRead, writeRead, type ReadStorage } from './cuisine-read';
import { DAY_MS, type CookEntry, type Grade } from './repertoire';

/** A rand that walks a fixed list, so every shuffle is the same on every run. */
function seq(...xs: number[]) {
	let i = 0;
	return () => xs[i++ % xs.length];
}

const NOON = new Date(2026, 9, 12, 12, 0, 0).getTime();
const at = (days: number, hours = 0) => NOON - days * DAY_MS + hours * 3_600_000;
const e = (id: string, when: number, grade?: Grade): CookEntry => ({ slug: czSlug(id), at: when, grade });

/** A small index: two chapters, three entries across two levels, cards and questions. */
const heads: CzHead[] = [
	{ id: 'cz-aaaaaaa1', slug: 'hollandaise', chapter: 'mother-sauces', title: 'Hollandaise', say: 'HOL-un-dayz', level: 1, kind: 'emulsion', summary: 's' },
	{ id: 'cz-aaaaaaa2', slug: 'bearnaise', chapter: 'mother-sauces', title: 'Béarnaise', say: 'bair-NAYZ', level: 2, kind: 'emulsion', summary: 's' },
	{ id: 'cz-aaaaaaa3', slug: 'the-holy-trinity', chapter: 'creole-cajun', title: 'The holy trinity', say: 'x', level: 1, kind: 'ingredient', summary: 's' }
];
const cards: CzTuple[] = [
	['c1', 'cz-aaaaaaa1', 1],
	['c2', 'cz-aaaaaaa1', 1],
	['c3', 'cz-aaaaaaa2', 2],
	['c4', 'cz-aaaaaaa2', 2],
	['c5', 'cz-aaaaaaa3', 1],
	['c6', 'cz-aaaaaaa3', 1]
];
const questions: CzTuple[] = [
	['q1', 'cz-aaaaaaa1', 1],
	['q2', 'cz-aaaaaaa2', 2],
	['q3', 'cz-aaaaaaa3', 1]
];
const index: CzIndex = {
	version: 1,
	complete: false,
	draft: false,
	levels: { 1: 'Commis', 2: 'Chef de Partie', 3: 'Sous Chef', 4: 'Chef' },
	chapters: [
		{ key: 'foundations', title: 'Foundations', intro: 'i', file: null, entries: 0, cards: 0, questions: 0, steps: 0, matches: 0 },
		{ key: 'mother-sauces', title: 'The mother sauces', intro: 'i', file: 'ch-mother-sauces.json', entries: 2, cards: 4, questions: 2, steps: 1, matches: 1 },
		{ key: 'creole-cajun', title: 'Creole and Cajun', intro: 'i', file: 'ch-creole-cajun.json', entries: 1, cards: 2, questions: 1, steps: 1, matches: 0 }
	],
	entries: heads,
	cards,
	questions,
	steps: [
		{ id: 's1', chapter: 'mother-sauces', entry: 'cz-aaaaaaa1', title: 'Build a hollandaise' },
		{ id: 's2', chapter: 'creole-cajun', entry: null, title: 'Build a gumbo' }
	],
	matches: [{ id: 'm1', chapter: 'mother-sauces', title: 'Small sauce to mother', pairs: 5, generated: 'tree' }],
	tree: null,
	ladder: null,
	byTechnique: {},
	byDish: {}
};

describe('the record', () => {
	it('names every Cuisine slug cuisine:<id> and scopes the log by the ids, never by the prefix', () => {
		expect(czSlug('cz-r7icuvh8')).toBe('cuisine:cz-r7icuvh8');
		const log = [e('c1', at(1)), e('retired', at(1)), { slug: 'kitchen:x', at: at(1) }, { slug: 'fd_0001', at: at(1) }];
		expect(czLog(log, ['c1', 'c2']).map((x) => x.slug)).toEqual(['cuisine:c1']);
	});

	it('records a card Got it as met and Again as missed, a round right as close and wrong as missed', () => {
		expect(cardGrade(true)).toBe('met');
		expect(cardGrade(false)).toBe('missed');
		expect(roundGrade(true)).toBe('close');
		expect(roundGrade(false)).toBe('missed');
	});

	it('writes only the first grade of a local day, from any screen', () => {
		expect(recordable([], 'c1', NOON)).toBe(true);
		expect(recordable([e('c1', at(0, -3), 'met')], 'c1', NOON)).toBe(false);
		expect(recordable([e('c1', at(1), 'missed')], 'c1', NOON)).toBe(true);
		expect(recordable([e('c2', at(0), 'met')], 'c1', NOON)).toBe(true);
	});
});

describe('cards', () => {
	it('keeps teaching order: level first, then the index order inside a level', () => {
		expect(teachingOrder(cards).map((c) => c[0])).toEqual(['c1', 'c2', 'c5', 'c6', 'c3', 'c4']);
	});

	it('climbs one rung a local day on the term ladder', () => {
		const twice = [e('c1', at(0, -2), 'met'), e('c1', at(0, -1), 'met')];
		expect(cardRepertoire(twice, ['c1'], NOON)[0].rung).toBe(1);
		const apart = [e('c1', at(3), 'met'), e('c1', at(1), 'met')];
		expect(cardRepertoire(apart, ['c1'], NOON)[0].rung).toBe(2);
		expect(cardRepertoire(apart, ['c1'], NOON)[0].intervalDays).toBe(6);
	});

	it('deals due (most overdue first), then new in teaching order, then the rest soonest first', () => {
		const log = [
			// c3: rung 1 (2 days), last 10 days ago: 5 intervals overdue
			e('c3', at(10), 'met'),
			// c1: rung 1, last 3 days ago: 1.5 intervals overdue
			e('c1', at(3), 'met'),
			// c5: seen yesterday, not due (fresh), due in a day
			e('c5', at(1), 'met'),
			// c2: rung 2 (6 days) seen 2 days ago, holding, due in 4 days
			e('c2', at(9), 'met'),
			e('c2', at(2), 'met')
		];
		const d = dealCards(cards, log, NOON);
		expect(d.due).toEqual(['c3', 'c1']);
		expect(d.fresh).toEqual(['c6', 'c4']);
		expect(d.rest).toEqual(['c5', 'c2']);
		expect(d.refs).toEqual(['c3', 'c1', 'c6', 'c4', 'c5', 'c2']);
	});

	it('cuts a run to the cap, and to a new-card limit when asked', () => {
		const many: CzTuple[] = Array.from({ length: 30 }, (_, i) => [`k${i}`, 'cz-aaaaaaa1', 1]);
		expect(dealCards(many, [], NOON).refs).toHaveLength(CZ_RUN_CAP);
		expect(dealCards(many, [], NOON, { length: 0 }).refs).toHaveLength(30);
		expect(dealCards(many, [], NOON, { newCap: 3 }).refs).toEqual(['k0', 'k1', 'k2']);
	});

	it('sends an Again card round once more, never twice', () => {
		expect(requeue(['a', 'b'], 'a', false)).toEqual(['a', 'b', 'a']);
		expect(requeue(['a', 'b', 'a'], 'a', false)).toEqual(['a', 'b', 'a']);
		expect(requeue(['a', 'b'], 'a', true)).toEqual(['a', 'b']);
	});

	it('counts a card learnt by the one met rule: graded met or close, never only missed', () => {
		expect(learntCount(['c1', 'c2', 'c3'], [e('c1', at(1), 'met'), e('c2', at(1), 'missed'), e('c3', at(2), 'missed'), e('c3', at(1), 'close')])).toBe(2);
	});
});

describe('In Cuisine today', () => {
	it('deals due at or below the level, then new at the level only', () => {
		const log = [e('c1', at(5), 'met')]; // a Commis card, due
		const t = cuisineToday(cards, log, NOON, 2);
		expect(t.refs).toEqual(['c1', 'c3', 'c4']);
		expect([t.due, t.fresh, t.total]).toEqual([1, 2, 3]);
		// a Chef de Partie card due is never dealt at Commis
		const up = cuisineToday(cards, [e('c3', at(5), 'met')], NOON, 1);
		expect(up.refs).toEqual(['c1', 'c2', 'c5', 'c6']);
	});

	it('takes at most ten new and twenty in all', () => {
		const many: CzTuple[] = Array.from({ length: 40 }, (_, i) => [`k${i}`, 'cz-aaaaaaa1', 1]);
		const fresh = cuisineToday(many, [], NOON, 1);
		expect(fresh.fresh).toBe(CZ_NEW_CAP);
		const owed = many.slice(0, 25).map(([id]) => e(id, at(9), 'met'));
		const t = cuisineToday(many, owed, NOON, 1);
		expect(t.due).toBe(CZ_RUN_CAP);
		expect(t.fresh).toBe(0);
		expect(t.total).toBe(CZ_RUN_CAP);
	});

	it('says the line with the level named, never numbered', () => {
		expect(todayLine({ refs: ['a'], due: 1, fresh: 2, total: 3 }, 'Commis')).toBe('1 due and 2 new at Commis.');
		expect(todayLine({ refs: [], due: 0, fresh: 0, total: 0 }, 'Chef')).toMatch(/^Nothing due at Chef today/);
		expect(todayLine({ refs: ['a'], due: 0, fresh: 1, total: 1 }, 'Sous Chef')).toBe('1 new card at Sous Chef.');
		expect(todayLine({ refs: ['a', 'b'], due: 2, fresh: 0, total: 2 }, 'Sous Chef')).toBe('2 cards due at Sous Chef.');
	});
});

describe('scopes', () => {
	it('reads and writes every form, and refuses the rest', () => {
		for (const s of ['all', 'lv:1', 'lv:4', 'ch:mother-sauces', 'e:cz-aaaaaaa1']) expect(scopeString(parseScope(s)!)).toBe(s);
		expect(parseScope('lv:5')).toBeNull();
		expect(parseScope('lv:x')).toBeNull();
		expect(parseScope('nonsense')).toBeNull();
		expect(parseScope('')).toBeNull();
	});

	it('names a scope in words', () => {
		const name = (n: number) => ['', 'Commis', 'Chef de Partie', 'Sous Chef', 'Chef'][n];
		expect(scopeName({ kind: 'level', level: 2 }, index, name)).toBe('Chef de Partie');
		expect(scopeName({ kind: 'chapter', key: 'creole-cajun' }, index, name)).toBe('Creole and Cajun');
		expect(scopeName({ kind: 'entry', id: 'cz-aaaaaaa2' }, index, name)).toBe('Béarnaise');
		expect(scopeName({ kind: 'all' }, index, name)).toBe('Every level');
	});

	it('draws the cards, questions, steps and matches each scope holds', () => {
		expect(cardsInScope(index, { kind: 'level', level: 1 }).map((c) => c[0])).toEqual(['c1', 'c2', 'c5', 'c6']);
		expect(cardsInScope(index, { kind: 'chapter', key: 'mother-sauces' }).map((c) => c[0])).toEqual(['c1', 'c2', 'c3', 'c4']);
		expect(cardsInScope(index, { kind: 'entry', id: 'cz-aaaaaaa3' }).map((c) => c[0])).toEqual(['c5', 'c6']);
		expect(cardsInScope(index, { kind: 'all' })).toHaveLength(6);
		expect(questionsInScope(index, { kind: 'level', level: 2 }).map((q) => q[0])).toEqual(['q2']);
		expect(stepsInScope(index, { kind: 'level', level: 1 }).map((s) => s.id)).toEqual(['s1']);
		expect(stepsInScope(index, { kind: 'chapter', key: 'creole-cajun' }).map((s) => s.id)).toEqual(['s2']);
		expect(stepsInScope(index, { kind: 'all' })).toHaveLength(2);
		expect(matchesInScope(index, { kind: 'entry', id: 'cz-aaaaaaa1' }).map((m) => m.id)).toEqual(['m1']);
		expect(matchesInScope(index, { kind: 'entry', id: 'cz-aaaaaaa3' })).toEqual([]);
		expect(chaptersForScope(index, { kind: 'all' })).toEqual(['mother-sauces', 'creole-cajun']);
		expect(chaptersForScope(index, { kind: 'entry', id: 'cz-aaaaaaa3' })).toEqual(['creole-cajun']);
	});
});

describe('multiple choice', () => {
	it('asks missed last time first, then never asked, then the oldest asked', () => {
		const log = [
			e('a', at(5), 'close'),
			e('b', at(2), 'missed'),
			e('c', at(9), 'close'),
			e('d', at(4), 'missed'),
			e('d', at(1), 'close') // d's last answer was right
		];
		const order = askOrder(['a', 'b', 'c', 'd', 'n1', 'n2'], log, seq(0.99, 0.99));
		expect(order[0]).toBe('b');
		expect(order.slice(1, 3).sort()).toEqual(['n1', 'n2']);
		expect(order.slice(3)).toEqual(['c', 'a', 'd']);
	});

	it('offers four options, the answer among them, shuffled', () => {
		const q = { answer: 'Egg yolk', distractors: ['Roux', 'Cream', 'Cornflour'] };
		const opts = mcOptions(q, seq(0.1, 0.5, 0.9));
		expect(opts).toHaveLength(4);
		expect([...opts].sort()).toEqual(['Cornflour', 'Cream', 'Egg yolk', 'Roux']);
		const firsts = new Set<string>();
		for (let k = 0; k < 40; k++) firsts.add(mcOptions(q, seq(k / 40, ((k * 7) % 40) / 40, ((k * 13) % 40) / 40))[0]);
		expect(firsts.size).toBeGreaterThan(1);
	});
});

describe('Order the steps', () => {
	const set = { steps: ['one', 'two', 'three', 'four'], distractor: 'boil it' };

	it('deals every stage and the stray one, never already in order', () => {
		const pool = stepsPool(set, seq(0.99, 0.99, 0.99, 0.99));
		expect([...pool].sort()).toEqual(['boil it', 'four', 'one', 'three', 'two']);
		expect(pool.slice(0, 4)).not.toEqual(set.steps);
		const noStray = stepsPool({ steps: ['a', 'b', 'c', 'd'] }, seq(0.99));
		expect(noStray).not.toEqual(['a', 'b', 'c', 'd']);
	});

	it('places a stage once at the end, never past the number of stages, and takes one back', () => {
		let placed = placeStep([], 2, 4);
		placed = placeStep(placed, 0, 4);
		expect(placeStep(placed, 2, 4)).toEqual([2, 0]);
		placed = [2, 0, 1, 3];
		expect(placeStep(placed, 4, 4)).toEqual([2, 0, 1, 3]);
		expect(removeStep([2, 0, 1, 3], 1)).toEqual([2, 1, 3]);
	});

	it('grades exact and names the places that are wrong', () => {
		const pool = ['three', 'one', 'boil it', 'four', 'two'];
		expect(gradeSteps(set, pool, [1, 4, 0, 3])).toEqual({ right: true, wrong: [], intruder: false });
		expect(gradeSteps(set, pool, [1, 0, 4, 3])).toEqual({ right: false, wrong: [1, 2], intruder: false });
		const stray = gradeSteps(set, pool, [1, 4, 2, 3]);
		expect(stray.right).toBe(false);
		expect(stray.intruder).toBe(true);
		expect(stray.wrong).toEqual([2]);
	});
});

describe('Family matching', () => {
	const set = {
		pairs: [
			['Mornay', 'Béchamel'],
			['Suprême', 'Velouté'],
			['Bordelaise', 'Espagnole'],
			['Béarnaise', 'Hollandaise', 'cz-aaaaaaa2']
		] as Array<[string, string] | [string, string, string]>
	};

	it('shuffles the right column, never leaving it as dealt', () => {
		const order = matchOrder(4, seq(0.99, 0.99, 0.99));
		expect([...order].sort()).toEqual([0, 1, 2, 3]);
		expect(order).not.toEqual([0, 1, 2, 3]);
	});

	it('pairs left then right, undoes a pair either item was in, and unpairs by a tap on either side', () => {
		let links = pairUp([], 0, 1);
		links = pairUp(links, 2, 1); // the right item 1 moves to the left item 2
		expect(links).toEqual([[2, 1]]);
		links = pairUp(links, 2, 3); // the left item 2 takes a new partner
		expect(links).toEqual([[2, 3]]);
		links = pairUp(links, 0, 0);
		expect(unpair(links, 'left', 2)).toEqual([[0, 0]]);
		expect(unpair(links, 'right', 0)).toEqual([[2, 3]]);
	});

	it('grades every row', () => {
		expect(gradeMatch(set, [[0, 0], [1, 1], [2, 2], [3, 3]])).toEqual({ right: true, wrong: [] });
		expect(gradeMatch(set, [[0, 1], [1, 0], [2, 2], [3, 3]])).toEqual({ right: false, wrong: [0, 1] });
		expect(gradeMatch(set, [[0, 0]])).toEqual({ right: false, wrong: [1, 2, 3] });
	});
});

describe('reading and the results', () => {
	it('finds the next unread entry at a level, and the next entry in order', () => {
		expect(nextUnread(heads, new Set(), 1)?.slug).toBe('hollandaise');
		expect(nextUnread(heads, new Set(['cz-aaaaaaa1']), 1)?.slug).toBe('the-holy-trinity');
		expect(nextUnread(heads, new Set(['cz-aaaaaaa1', 'cz-aaaaaaa3']), 1)).toBeNull();
		expect(nextUnread(heads, new Set(), 3)).toBeNull();
		expect(nextEntry(heads, 'cz-aaaaaaa1')?.slug).toBe('bearnaise');
		expect(nextEntry(heads, 'cz-aaaaaaa3')).toBeNull();
	});

	it('counts a chapter door: entries, read, cards learnt; a chapter with nothing written counts nothing', () => {
		const c = chapterCounts(index, 'mother-sauces', new Set(['cz-aaaaaaa2']), [e('c1', at(1), 'met'), e('c3', at(1), 'close')]);
		expect(c).toEqual({ entries: 2, read: 1, cards: 4, learnt: 2 });
		expect(chapterLine(c)).toBe('2 entries · 1 read · 2 cards learnt');
		expect(chapterLine(chapterCounts(index, 'foundations', new Set(), []))).toBe('0 entries · 0 read · 0 cards learnt');
		expect(chapterLine({ entries: 1, read: 0, cards: 3, learnt: 1 })).toBe('1 entry · 0 read · 1 card learnt');
	});

	it('gathers the cards a round missed, once each, cut to a run', () => {
		const ofEntry = (id: string) => (id === 'cz-aaaaaaa1' ? ['c1', 'c2'] : id === 'cz-aaaaaaa2' ? ['c3', 'c4'] : []);
		expect(cardsForMisses([{ teaches: 'c2' }, { entries: ['cz-aaaaaaa1'] }, { entries: ['cz-aaaaaaa2', 'cz-zzzzzzzz'] }], ofEntry)).toEqual(['c2', 'c1', 'c3', 'c4']);
		const many = Array.from({ length: 30 }, (_, i) => ({ teaches: `t${i}` }));
		expect(cardsForMisses(many, ofEntry)).toHaveLength(CZ_RUN_CAP);
	});

	it('says minutes and dates as a reader does', () => {
		expect(minutesWords([3, 5])).toBe('3 to 5 minutes');
		expect(minutesWords(40)).toBe('40 minutes');
		expect(minutesWords(1)).toBe('1 minute');
		expect(dateWords('2026-09-26')).toBe('26 September 2026');
		expect(dateWords('soon')).toBe('soon');
	});
});

describe('I have read this (cuisine-read.ts)', () => {
	class MapStorage implements ReadStorage {
		m = new Map<string, string>();
		getItem(k: string) {
			return this.m.get(k) ?? null;
		}
		setItem(k: string, v: string) {
			this.m.set(k, v);
		}
	}
	const throwing: ReadStorage = {
		getItem() {
			throw new Error('blocked');
		},
		setItem() {
			throw new Error('blocked');
		}
	};

	it('keeps one per-device slot of entry ids, sorted, and reads back what it wrote', () => {
		const s = new MapStorage();
		let read = setRead(s, new Set(), 'cz-aaaaaaa2', true);
		read = setRead(s, read, 'cz-aaaaaaa1', true);
		expect(s.m.get(READ_KEY)).toBe('["cz-aaaaaaa1","cz-aaaaaaa2"]');
		expect([...readRead(s)]).toEqual(['cz-aaaaaaa1', 'cz-aaaaaaa2']);
		read = setRead(s, read, 'cz-aaaaaaa1', false);
		expect([...readRead(s)]).toEqual(['cz-aaaaaaa2']);
		expect(READ_KEY).toBe('oot-cuisine-read-table-v1');
	});

	it('reads nothing from a missing, malformed or blocked slot, and keeps the mark for the visit when a write fails', () => {
		const s = new MapStorage();
		expect(readRead(s).size).toBe(0);
		s.m.set(READ_KEY, 'not json');
		expect(readRead(s).size).toBe(0);
		s.m.set(READ_KEY, '["cz-aaaaaaa1", 7, "<script>", "cz-aaaaaaa2"]');
		expect([...readRead(s)]).toEqual(['cz-aaaaaaa1', 'cz-aaaaaaa2']);
		expect(readRead(throwing).size).toBe(0);
		expect(readRead(null).size).toBe(0);
		expect(writeRead(throwing, new Set(['cz-aaaaaaa1']))).toBe(false);
		expect([...setRead(throwing, new Set(), 'cz-aaaaaaa1', true)]).toEqual(['cz-aaaaaaa1']);
	});
});

describe('the shipped seed reads through the engines', () => {
	const shipped = JSON.parse(readFileSync(join('src/lib/data/cuisine/index.json'), 'utf8')) as CzIndex;

	it('deals a fresh device its first Commis cards, and asks the seed questions', () => {
		const t = cuisineToday(shipped.cards, [], NOON, 1);
		expect(t.due).toBe(0);
		expect(t.fresh).toBe(Math.min(CZ_NEW_CAP, shipped.cards.filter((c) => c[2] === 1).length));
		expect(questionsInScope(shipped, { kind: 'all' }).length).toBe(shipped.questions.length);
		for (const c of shipped.chapters) if (!c.file) expect(cardsInScope(shipped, { kind: 'chapter', key: c.key })).toEqual([]);
	});

	it('names every dish Cuisine links, for a reader whose house is not Brennan\'s', () => {
		for (const id of Object.keys(shipped.byDish)) expect(shipped.dishes?.[id], id).toBeTruthy();
	});
});

describe('the screens are written as the content is', () => {
	const files = [
		'src/routes/cuisine/+page.svelte',
		'src/routes/cuisine/+page.ts',
		'src/lib/cuisine.ts',
		'src/lib/cuisine-read.ts',
		'src/lib/stores/cuisine.svelte.ts',
		'src/lib/quick-quiz.ts',
		...readdirSync('src/lib/components/cuisine').map((f) => join('src/lib/components/cuisine', f))
	];
	it.each(files)('%s: no dash, no American spelling, no level by its number', (f) => {
		/* The style block is CSS (its custom properties are double hyphens and
		   its colour property is spelt as CSS spells it); an HTML comment's own
		   delimiters are syntax. Everything else, words and code, is held. */
		const text = readFileSync(f, 'utf8')
			.replace(/<style[\s\S]*?<\/style>/g, '')
			.replace(/<!--|-->/g, '');
		const lines = text.split('\n');
		const bad: string[] = [];
		lines.forEach((l, i) => {
			if (DASH_RE.test(l)) bad.push(`${i + 1} dash: ${l.trim()}`);
			if (AMERICAN_RE.test(l)) bad.push(`${i + 1} American: ${l.trim()}`);
			if (NUMERAL_RE.test(l)) bad.push(`${i + 1} numeral: ${l.trim()}`);
			for (const w of l.match(IZE_RE) ?? []) if (!IZE_OK.has(w.toLowerCase())) bad.push(`${i + 1} -ize: ${w}`);
		});
		expect(bad).toEqual([]);
	});
});
