import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { KEYS, LINE_CAPS, PRINCIPLES } from './house-schema';
import type { House, Mark, Pairing } from './house-schema';
import { normaliseHouse } from './house-normalise';
import { DASH, DASH_SOURCE, hasDash, lineProblems, stripDashes, wordCount } from './house-lines';
import { ALLERGEN_TALK, ALLERGEN_WORD, FATAL_CODES, NEVER_FATAL, QUOTE_WORDS, onPage, validateHouse } from './house-validate';
import type { Problem, ProblemCode } from './house-validate';

/**
 * The validator names what is wrong with a House and says which of it stops
 * a pack. What is under test: the fixture passes with nothing to say; each
 * of the ten codes is provoked by one mutation and caught at the right path;
 * the three advisory codes are never fatal, whatever list is handed in; the
 * price rule is the client's (12 is not on a page that prints only 12.50);
 * and the two rules copied from the client (the dash, the price) are held
 * against the client's source. house-lines.ts is tested here too, since the
 * validator is its first reader.
 *
 * The em dash is never spelled out in this file: every dash a test plants
 * is written as an escape, and the gate regex is built the same way.
 */

const here = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const FIXTURE_PATH = here('./fixtures/house-min.json');
const CLIENT_PATH = here('../../../static/shared/oot-maitre.js');
const FILES = ['./house-lines.ts', './house-validate.ts', './house-validate.test.ts'].map(here);

/** Every dash spelling the publish gate counts, plus the en dash, built from escapes. */
const GATE = new RegExp(['\\u2014', '\\u2013', '&' + 'mdash;', '&#' + '8212;', '&#' + 'x2014;', ' ' + '-- '].join('|'));
/** A character by its code, so no dash, curly quote or accent is ever spelled in this file. */
const c = (n: number): string => String.fromCharCode(n);
const EM = c(0x2014);
const EN = c(0x2013);
/** The three entities, built from pieces so the gate does not count this file. */
const MDASH = '&' + 'mdash;';
const NUMERIC = '&#' + '8212;';
const HEX = '&#' + 'x2014;';

/** A fresh, normalised copy of the fixture a test can mutate. */
const fixture = (): House => normaliseHouse(JSON.parse(readFileSync(FIXTURE_PATH, 'utf8'))).house;

/** The page the fixture's prices were read from, as a test writes it: every printed figure standing on its own. */
const PAGE = [
	'The Lantern Room, dinner',
	'Beetroot and Apple Salad 11',
	'Lantern Roast Chicken 24',
	'The Harbour Supper, two courses 45',
	'By the glass: Quay Lane Harbour White 2024, 9 / 38, 125 ml or 175 ml',
	'The Lantern Collins 12',
	'Verjus and Tonic 7'
].join('\n');

const codes = (problems: Problem[], code: ProblemCode) => problems.filter((p) => p.code === code);
const paths = (problems: Problem[], code: ProblemCode) => codes(problems, code).map((p) => p.path);

/** A mark of hers, for a test that needs one. */
const hers = <T>(value: T): Mark<T> => ({ value, by: 'maitre', ts: 1790700000000 });

/** The client's function, read out of its source and made callable, so the copy here is proved to behave as the original. */
function clientFunction(name: string, args: string[], values: unknown[], also = ''): (...a: unknown[]) => unknown {
	const src = readFileSync(CLIENT_PATH, 'utf8');
	const start = src.indexOf('function ' + name + '(');
	expect(start, `oot-maitre.js must still declare ${name}`).toBeGreaterThan(0);
	const end = src.indexOf('\n  }\n', start);
	const text = src.slice(start, end + 4);
	return new Function(...args, also + '\n' + text + '; return ' + name + ';')(...values) as (...a: unknown[]) => unknown;
}

function clientDash(): RegExp {
	const src = readFileSync(CLIENT_PATH, 'utf8');
	const line = src.match(/var DASH_RE = (new RegExp\(.*\));/);
	expect(line, 'oot-maitre.js must still build DASH_RE from pieces').not.toBeNull();
	return new Function('return ' + (line as RegExpMatchArray)[1])() as RegExp;
}

describe('house-lines: the dash', () => {
	it('is the client DASH_RE, piece for piece, source and flags', () => {
		const theirs = clientDash();
		expect(DASH.source).toBe(theirs.source);
		expect(DASH.flags).toBe(theirs.flags);
		expect(DASH_SOURCE).toBe(theirs.source);
		expect(DASH_SOURCE.split('|')).toHaveLength(5);
	});

	it('hasDash sees every spelling, the en dash too, and nothing in a hyphen', () => {
		expect(hasDash('a ' + EM + ' b')).toBe(true);
		expect(hasDash('a' + EM + 'b')).toBe(true);
		expect(hasDash('a ' + EN + ' b')).toBe(true);
		expect(hasDash('a ' + MDASH + ' b')).toBe(true);
		expect(hasDash('a ' + MDASH.toUpperCase() + ' b')).toBe(true);
		expect(hasDash('a ' + NUMERIC + ' b')).toBe(true);
		expect(hasDash('a ' + HEX + ' b')).toBe(true);
		expect(hasDash('a ' + '-' + '- b')).toBe(true);
		expect(hasDash('corn-fed chicken')).toBe(false);
		expect(hasDash('a--b')).toBe(false);
		expect(hasDash('9 / 38')).toBe(false);
		expect(hasDash('')).toBe(false);
		for (let i = 0; i < 3; i++) expect(hasDash('a ' + EM + ' b')).toBe(true);
	});

	it('stripDashes is the client stripDashes to the character, on every case', () => {
		const theirs = clientFunction('stripDashes', ['DASH_RE'], [clientDash()]);
		const cases = [
			'Half a chicken ' + EM + ' roasted over embers.',
			'Three things ' + EM + ' leeks, potatoes, gravy.',
			'A dash at the end ' + EM,
			EM + ' a dash at the start',
			'Two ' + EM + ' dashes ' + EM + ' here, with, commas.',
			'An entity ' + MDASH + ' here and a ' + NUMERIC + ' there and ' + HEX + ' too',
			'A spaced ' + '-' + '- double hyphen, and, a, list',
			'No dash at all',
			'',
			'line one ' + EM + '\nline two'
		];
		for (const c of cases) expect(stripDashes(c), JSON.stringify(c)).toBe(theirs(c));
		expect(stripDashes('Three things ' + EM + ' leeks, potatoes, gravy.')).toBe('Three things: leeks, potatoes, gravy.');
		expect(stripDashes('Half a chicken ' + EM + ' roasted.')).toBe('Half a chicken, roasted.');
		expect(hasDash(stripDashes('Two ' + EM + ' dashes ' + EM + ' here'))).toBe(false);
	});
});

describe('house-lines: the words', () => {
	it('counts runs of letters, digits and apostrophes, a hyphenated word once', () => {
		expect(wordCount('')).toBe(0);
		expect(wordCount('   ')).toBe(0);
		expect(wordCount('one')).toBe(1);
		expect(wordCount('corn-fed chicken')).toBe(2);
		expect(wordCount("it's the chef's")).toBe(3);
		expect(wordCount('it' + c(0x2019) + 's')).toBe(1);
		expect(wordCount('nine by the glass, thirty eight the bottle.')).toBe(8);
		expect(wordCount('12.50 a glass')).toBe(4);
		expect(wordCount('Pr' + c(0xe4) + 'lat and M' + c(0xe2) + 'con-Ig' + c(0xe9))).toBe(3);
		expect(wordCount('a ' + EM + ' b')).toBe(2);
		expect(wordCount('one\ntwo\tthree')).toBe(3);
		expect(wordCount('...!!!')).toBe(0);
	});

	it('finds the fixture lines at the counts the brief asked for', () => {
		const h = fixture();
		const counts = (lines: Mark<{ s10: string; s20: string; s45: string }> | undefined) =>
			lines ? [wordCount(lines.value.s10), wordCount(lines.value.s20), wordCount(lines.value.s45)] : [];
		expect(counts(h.dishes[0].lines)).toEqual([15, 37, 90]);
		expect(counts(h.wines[0].lines)).toEqual([14, 36, 98]);
		expect(counts(h.cocktails[0].lines)).toEqual([13, 40, 85]);
	});

	it('lineProblems names each line over its cap with its count, and nothing for lines under', () => {
		const over = (n: number) => new Array(n).fill('word').join(' ');
		expect(lineProblems({ s10: over(25), s20: over(50), s45: over(110) })).toEqual([]);
		expect(lineProblems({ s10: over(26), s20: over(50), s45: over(111) })).toEqual([
			{ field: 's10', words: 26, cap: 25 },
			{ field: 's45', words: 111, cap: 110 }
		]);
		expect(lineProblems({ s10: over(3) }, { s10: 2, s20: 2, s45: 2 })).toEqual([{ field: 's10', words: 3, cap: 2 }]);
		expect(lineProblems(undefined)).toEqual([]);
		expect(lineProblems(null)).toEqual([]);
		expect(lineProblems({})).toEqual([]);
		expect(Object.keys(LINE_CAPS)).toEqual([...KEYS.Lines]);
	});
});

describe('the price rule', () => {
	it('onPage is the client onPage to the character', () => {
		const theirs = clientFunction('onPage', [], [], 'function isDigit(c) { return c >= "0" && c <= "9"; }');
		const cases: Array<[string, string]> = [
			['Bread 12.50', '12'], ['Bread 12.50', '12.50'], ['Bread 12', '12'], ['Bread 12', '12.50'], ['Bread,12', '12'],
			['9.50 a glass', '50'], ['15 oz', '5 oz'], ['5 oz 45.00', '5 oz'], ['', '9'], ['anything', ''], ['1,200', '200'], ['12 / 38', '38'],
			['a 12 b 12.50', '12'], ['12.50 and 12', '12']
		];
		for (const [hay, needle] of cases) expect(onPage(hay, needle), `${hay} / ${needle}`).toBe(theirs(hay, needle));
		expect(onPage('Bread 12.50', '12')).toBe(false);
		expect(onPage('Bread 12', '12.50')).toBe(false);
		expect(onPage('12.50 and 12', '12')).toBe(true);
	});
});

describe('the fixture', () => {
	it('validates with nothing to say, with or without the page', () => {
		const h = fixture();
		expect(validateHouse(h)).toEqual({ problems: [], fatalCount: 0 });
		expect(validateHouse(h, { sourceText: PAGE })).toEqual({ problems: [], fatalCount: 0 });
		expect(validateHouse(h, { sourceText: PAGE, fatal: FATAL_CODES })).toEqual({ problems: [], fatalCount: 0 });
	});

	it('names the fatal codes the plan names, and the three that never are', () => {
		expect(FATAL_CODES).toEqual(['forbidden', 'dash', 'word-cap', 'ref', 'principles', 'price', 'allergen-talk', 'tier', 'video']);
		expect(NEVER_FATAL).toEqual(['service-note', 'proper-noun', 'quote']);
		expect(ALLERGEN_TALK.source).toBe('allerg|intoleran');
		expect(ALLERGEN_TALK.flags).toBe('i');
		expect(ALLERGEN_WORD.source).toBe('allerg|gluten|dairy|nut|shellfish|egg|soy|sesame|peanut|fish|celery|mustard|lupin|sulph');
		expect(QUOTE_WORDS).toBe(8);
		const src = readFileSync(CLIENT_PATH, 'utf8');
		const line = src.match(/var ALLERGEN_TALK = (\/.*?\/[gimsuy]*);/);
		expect(line).not.toBeNull();
		const theirs = new Function('return ' + (line as RegExpMatchArray)[1])() as RegExp;
		expect(ALLERGEN_TALK.source).toBe(theirs.source);
		expect(ALLERGEN_TALK.flags).toBe(theirs.flags);
	});
});

describe('each code, provoked by one mutation', () => {
	it('forbidden: a key the client refuses, anywhere', () => {
		const h = fixture();
		(h.dishes[0] as unknown as Record<string, unknown>).allergens = [];
		(h.wines[0].parts as unknown as Record<string, unknown>).glutenFree = true;
		const { problems, fatalCount } = validateHouse(h);
		expect(paths(problems, 'forbidden')).toEqual(['house.dishes[0].allergens', 'house.wines[0].parts.glutenFree']);
		expect(fatalCount).toBe(2);
		for (const p of problems) expect(p.fatal).toBe(true);
	});

	it('dash: any spelling in any string the house owns, by path', () => {
		const h = fixture();
		h.dishes[1].serviceNote = 'Plated cold ' + EM + ' ask first.';
		h.wines[0].lines!.value.s45 = h.wines[0].lines!.value.s45 + ' ' + EN + ' and more';
		h.name = 'The Lantern Room ' + MDASH + ' Harbourside';
		h.scenarios[0].guest = 'Quick ' + '-' + '- please';
		h.dishes[0].pairing!.value.avoid = 'A heavy red ' + NUMERIC + ' the smoke turns it bitter.';
		h.mustKnows[0].body!.value = 'Last orders at ten ' + HEX + ' really.';
		const { problems } = validateHouse(h);
		expect(paths(problems, 'dash').sort()).toEqual(
			[
				'house.dishes[1].serviceNote', 'house.wines[0].lines.value.s45', 'house.name', 'house.scenarios[0].guest',
				'house.dishes[0].pairing.value.avoid', 'house.mustKnows[0].body.value'
			].sort()
		);
		for (const p of codes(problems, 'dash')) expect(p.fatal).toBe(true);
		expect(problems.filter((p) => p.code !== 'dash')).toEqual([]);
	});

	it('word-cap: a timed line over its cap, with the count and the cap', () => {
		const h = fixture();
		h.dishes[0].lines!.value.s10 = new Array(26).fill('word').join(' ');
		h.cocktails[0].lines!.value.s45 = new Array(111).fill('word').join(' ');
		h.wines[0].lines!.value.s20 = new Array(50).fill('word').join(' ');
		const { problems } = validateHouse(h);
		expect(codes(problems, 'word-cap')).toEqual([
			{ path: 'house.dishes[0].lines.value.s10', code: 'word-cap', said: '26 words; the cap on s10 is 25', fatal: true },
			{ path: 'house.cocktails[0].lines.value.s45', code: 'word-cap', said: '111 words; the cap on s45 is 110', fatal: true }
		]);
	});

	it('ref: every id that must point at something in the house, with empty allowed only where the plan allows it', () => {
		const h = fixture();
		const p = h.dishes[0].pairing!.value;
		p.wineId = 'w-nothere1';
		p.secondId = 'd-chicken1';
		p.zeroProofId = 'b-collins1';
		h.wines[0].firstPickIds!.value = ['d-chicken1', 'w-lantern1'];
		h.cocktails[0].upsells!.value = ['b-gone0001'];
		h.tastings[0].courses[0].dishIds = ['d-beetrt01', 'b-collins1'];
		h.tastings[0].courses[1].pourId = 'x-verjus01';
		h.lexicon[0].itemIds = ['t-harbour1'];
		h.scenarios[0].itemIds = ['d-chicken1', ''];
		h.mixUps[0].aId = 'd-beetrt01';
		h.askAtLineup[0].itemIds = ['s-hurry001'];
		h.disputes[0].itemId = 'w-gone0001';
		const { problems } = validateHouse(h);
		expect(paths(problems, 'ref').sort()).toEqual(
			[
				'house.dishes[0].pairing.value.wineId', 'house.dishes[0].pairing.value.secondId', 'house.dishes[0].pairing.value.zeroProofId',
				'house.wines[0].firstPickIds.value[1]', 'house.cocktails[0].upsells.value[0]',
				'house.tastings[0].courses[0].dishIds[1]', 'house.tastings[0].courses[1].pourId',
				'house.lexicon[0].itemIds[0]', 'house.scenarios[0].itemIds[1]', 'house.mixUps[0].bId',
				'house.askAtLineup[0].itemIds[0]', 'house.disputes[0].itemId'
			].sort()
		);
		expect(codes(problems, 'ref').find((x) => x.path === 'house.mixUps[0].bId')?.said).toBe('a mix-up of an item with itself');
		expect(codes(problems, 'ref').find((x) => x.path === 'house.dishes[0].pairing.value.zeroProofId')?.said).toMatch(/zero-proof/);
		for (const x of codes(problems, 'ref')) expect(x.fatal).toBe(true);
	});

	it('ref: an empty wineId is a problem, an empty second, zero-proof or pour is not', () => {
		const h = fixture();
		h.dishes[0].pairing!.value.wineId = '';
		h.dishes[0].pairing!.value.zeroProofId = '';
		h.tastings[0].courses[0].pourId = '';
		delete h.disputes[0].itemId;
		const { problems } = validateHouse(h);
		expect(paths(problems, 'ref')).toEqual(['house.dishes[0].pairing.value.wineId']);
		expect(codes(problems, 'ref')[0].said).toBe('needs a house wine and has none');
	});

	it('principles: a pairing principle outside the nine', () => {
		const h = fixture();
		(h.dishes[0].pairing!.value as Pairing).principles = ['acid', 'umami' as never, 'Fat' as never];
		const { problems } = validateHouse(h);
		expect(codes(problems, 'principles')).toEqual([
			{ path: 'house.dishes[0].pairing.value.principles[1]', code: 'principles', said: 'umami is not one of the nine principles', fatal: true },
			{ path: 'house.dishes[0].pairing.value.principles[2]', code: 'principles', said: 'Fat is not one of the nine principles', fatal: true }
		]);
		for (const pr of PRINCIPLES) {
			h.dishes[0].pairing!.value.principles = [pr];
			expect(codes(validateHouse(h).problems, 'principles')).toEqual([]);
		}
	});

	it('price: a figure absent from the page is caught, in every place a figure sits, and only when a page is given', () => {
		const h = fixture();
		const page = PAGE.replace('Salad 11', 'Salad').replace('9 / 38', '9 / 36').replace('175 ml', '150 ml').replace('two courses 45', 'two courses');
		const { problems } = validateHouse(h, { sourceText: page });
		expect(paths(problems, 'price').sort()).toEqual(
			[
				'house.dishes[1].price', 'house.dishes[1].prices[0].printed',
				'house.wines[0].prices[0].printed', 'house.wines[0].bottle', 'house.wines[0].pours[1]',
				'house.tastings[0].price'
			].sort()
		);
		for (const x of codes(problems, 'price')) expect(x.fatal).toBe(true);
		expect(codes(problems, 'price').find((x) => x.path === 'house.wines[0].pours[1]')?.said).toMatch(/175/);
		expect(validateHouse(h).problems).toEqual([]);
		expect(validateHouse(h, { sourceText: '' }).fatalCount).toBeGreaterThan(5);
	});

	it('price: is not fooled by a different decimal, 12 against 12.50 either way, and folds whitespace', () => {
		const h = fixture();
		const only = (page: string) => paths(validateHouse(h, { sourceText: page }).problems, 'price').filter((p) => p.startsWith('house.cocktails[0]'));
		expect(only(PAGE)).toEqual([]);
		expect(only(PAGE.replace('Collins 12', 'Collins 12.50'))).toEqual(['house.cocktails[0].price', 'house.cocktails[0].prices[0].printed']);
		expect(only(PAGE.replace('Collins 12', 'Collins 112'))).toEqual(['house.cocktails[0].price', 'house.cocktails[0].prices[0].printed']);
		h.cocktails[0].price = '12.50';
		h.cocktails[0].prices[0].printed = '12.50';
		expect(only(PAGE)).toEqual(['house.cocktails[0].price', 'house.cocktails[0].prices[0].printed']);
		expect(only(PAGE.replace('Collins 12', 'Collins 12.50'))).toEqual([]);
		expect(only(PAGE.replace('Collins 12', 'Collins   12.50\n'))).toEqual([]);
		h.cocktails[0].price = '12';
		h.cocktails[0].prices[0].printed = '12';
		h.wines[0].prices[0].printed = '9  /  38';
		expect(paths(validateHouse(h, { sourceText: PAGE }).problems, 'price')).toEqual([]);
	});

	it('allergen-talk: a line of hers that speaks of allergens, and never a line a person kept', () => {
		const h = fixture();
		h.dishes[0].why = hers('Safe for anyone with an allergy to nuts.');
		h.wines[0].lines = hers({ s10: 'A dry white.', s20: 'Fine for an intolerance.', s45: 'Long.' });
		h.cocktails[0].guest = { value: 'No allergens in this one.', by: 'person', ts: 1 };
		h.history = hers('Opened on the quay; allergens listed at the door.');
		const { problems } = validateHouse(h);
		expect(paths(problems, 'allergen-talk').sort()).toEqual(['house.dishes[0].why.value', 'house.wines[0].lines.value.s20', 'house.history.value'].sort());
		for (const x of codes(problems, 'allergen-talk')) expect(x.fatal).toBe(true);
	});

	it('service-note: an allergen word without the word confirm, never fatal, whatever list is given', () => {
		const h = fixture();
		h.dishes[1].serviceNote = 'The dressing carries mustard.';
		h.cocktails[1].serviceNote = 'Egg white in the foam. Confirm at lineup.';
		h.wines[0].serviceNote = 'Fined with egg; CONFIRM with the sommelier.';
		const { problems, fatalCount } = validateHouse(h, { fatal: ['service-note'] });
		expect(codes(problems, 'service-note')).toEqual([
			{ path: 'house.dishes[1].serviceNote', code: 'service-note', said: expect.stringMatching(/confirm/), fatal: false }
		]);
		expect(fatalCount).toBe(0);
		expect(validateHouse(h).fatalCount).toBe(0);
		expect(validateHouse(h, { fatal: [...FATAL_CODES, 'service-note', 'proper-noun', 'quote'] }).fatalCount).toBe(0);
	});

	it('proper-noun: a capitalised word in a line of hers that the house does not know, advisory, never at a sentence start', () => {
		const h = fixture();
		h.dishes[0].guest = hers('Half a chicken done the way they do it in Pondbury, with leeks. Smoky. The Harbour White suits it.');
		h.wines[0].profile = hers('Green apple, like a Bramley, with the chalk of Quay Lane.');
		h.cocktails[0].say = hers('The Lantern Collins, as it reads.');
		h.lexicon[0].toGuest = hers('Sharp like lemon; the French call it Verjus.');
		const { problems, fatalCount } = validateHouse(h, { fatal: [...FATAL_CODES, 'proper-noun'] });
		expect(codes(problems, 'proper-noun')).toEqual([
			{ path: 'house.dishes[0].guest.value', code: 'proper-noun', said: 'the name Pondbury is nowhere in the house; a reader should check it', fatal: false },
			{ path: 'house.wines[0].profile.value', code: 'proper-noun', said: 'the name Bramley is nowhere in the house; a reader should check it', fatal: false },
			{ path: 'house.lexicon[0].toGuest.value', code: 'proper-noun', said: 'the name French is nowhere in the house; a reader should check it', fatal: false }
		]);
		expect(fatalCount).toBe(0);
		h.dishes[0].guest = { value: 'Done the way they do it in Pondbury.', by: 'person', ts: 1 };
		h.wines[0].profile = hers('Green apple. Quay Lane chalk.');
		h.lexicon[0].toGuest = hers('Sharp like lemon.');
		expect(codes(validateHouse(h).problems, 'proper-noun')).toEqual([]);
	});

	it('quote: a quoted span of eight words or more in a line of hers, advisory', () => {
		const h = fixture();
		h.dishes[0].origin = hers('As the old cook said, "a chicken roasted over embers is a chicken you remember" and she was right.');
		h.wines[0].why = hers('They call it "the harbour wine" and leave it there.');
		h.mustKnows[0].body = hers('The sign reads ' + c(0x201c) + 'the kitchen closes at ten and the bar pours until eleven' + c(0x201d) + ' so say so.');
		const { problems, fatalCount } = validateHouse(h, { fatal: [...FATAL_CODES, 'quote'] });
		expect(codes(problems, 'quote')).toEqual([
			{ path: 'house.dishes[0].origin.value', code: 'quote', said: expect.stringMatching(/^a quoted span of 10 words/), fatal: false },
			{ path: 'house.mustKnows[0].body.value', code: 'quote', said: expect.stringMatching(/^a quoted span of 11 words/), fatal: false }
		]);
		expect(fatalCount).toBe(0);
	});
});

describe('what counts as fatal', () => {
	it('is the list given, FATAL_CODES by default, with the advisory three never in it', () => {
		const h = fixture();
		h.dishes[1].serviceNote = 'Peanuts in the dressing.';
		h.dishes[0].why = hers('An allergy line.');
		h.name = 'A ' + EM + ' B';
		const all = validateHouse(h);
		expect(all.problems.map((p) => [p.code, p.fatal])).toEqual([['dash', true], ['allergen-talk', true], ['service-note', false]]);
		expect(all.fatalCount).toBe(2);
		const onlyDash = validateHouse(h, { fatal: ['dash'] });
		expect(onlyDash.problems.map((p) => [p.code, p.fatal])).toEqual([['dash', true], ['allergen-talk', false], ['service-note', false]]);
		expect(onlyDash.fatalCount).toBe(1);
		const none = validateHouse(h, { fatal: [] });
		expect(none.fatalCount).toBe(0);
		expect(none.problems).toHaveLength(3);
	});

	it('changes nothing on the house it reads', () => {
		const h = fixture();
		h.dishes[0].why = hers('An allergy line.');
		const before = JSON.stringify(h);
		validateHouse(h, { sourceText: '' });
		expect(JSON.stringify(h)).toBe(before);
	});

	it('does not throw on a house a hand left short of its lists', () => {
		const bare = { format: 'oot-house', id: 'h-aaaaaaaa', dishes: [{ id: 'd-aaaaaaaa', pairing: { value: 'not an object', by: 'maitre', ts: 1 } }] } as unknown as House;
		expect(() => validateHouse(bare, { sourceText: 'x' })).not.toThrow();
	});
});

describe('the files', () => {
	it('carry no dash in any spelling and no carriage return, and the modules are pure ASCII for the port', () => {
		for (const p of FILES) {
			const text = readFileSync(p, 'utf8');
			expect(text, p).not.toMatch(GATE);
			expect(text.includes('\r'), `${p} carries a carriage return`).toBe(false);
		}
		for (const p of FILES.slice(0, 2)) expect(/[^\x00-\x7f]/.test(readFileSync(p, 'utf8')), `${p} must be pure ASCII`).toBe(false);
	});

	it('import nothing from outside src/lib/house, and no Svelte, DOM or Node', () => {
		for (const p of FILES.slice(0, 2)) {
			const src = readFileSync(p, 'utf8');
			const imports = [...src.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]);
			expect(imports.length, p).toBeGreaterThan(0);
			for (const i of imports) expect(i, p).toMatch(/^\.\/house-/);
			expect(src, p).not.toMatch(/\b(window|document|localStorage|indexedDB|process|require)\b/);
		}
	});
});
