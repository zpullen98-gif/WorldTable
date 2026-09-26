import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
	LIMITS,
	LEVELS,
	CARD_KEYS,
	checkCard,
	checkDeck,
	checkLevels,
	assertNoDeckVerdict,
	genericWords,
	temperatureProblems,
	sayProblems
} from '../../tools/derive/floor-deck-contract.mjs';
import { DECK_SECTIONS, DECK_LEVELS, DECK_GZ_CEILING } from '../../tools/derive/floor-deck.mjs';
import { MATCH_SIZE, TEST_MC } from './floor-deck';
import { slugify } from '../../tools/slugify.mjs';
import {
	DECK_ID_RE,
	MAX_TRAPS_PER_QUESTION,
	OPTIONS_PER_QUESTION,
	foldText,
	seeded,
	shuffled,
	wrongAnswersFor
} from './floor-deck-core.mjs';
import floorDeck from './data/floor-deck.json';
import deckTraps from './data/floor-deck.traps.json';
import deckIndex from './data/floor-deck.index.json';
import lexicon from './data/lexicon.json';
import drills from './data/drills.json';

import type { FloorDeck, DeckTraps, DeckIndex } from './types';

/**
 * The Floor Deck's contract, proved able to fail.
 *
 * Every rule below is exercised by a fixture that breaks exactly that rule,
 * beside a control that breaks none. A gate nobody has seen fail is a gate
 * nobody knows works: this repo has shipped two of those (the prompt clip
 * regex written as /s+S*$/, and an anchor gate that only checked the keys
 * that were present), and both looked fine for as long as nothing tested them.
 */

/* Loose on purpose: a fixture is a card with one thing wrong with it, and the
   contract is what is being asked whether it is a card. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Card = { id: string; term: string; [key: string]: any };

const GOOD: Card = {
	id: 'fd_0001',
	term: 'Hanger Steak',
	level: 2,
	say: 'HANG-er',
	aliases: ['Onglet'],
	gist: 'A loose-grained beef cut from beside the diaphragm, rich, mineral and tender',
	guest:
		'It is a rich, beefy cut from the underside of the animal, tender when it is cooked medium rare and sliced across the grain.',
	why: 'The muscle supports the diaphragm and does little work, so it stays tender, while its coarse, open grain holds a marinade and carries a deep mineral flavor. There is one per animal. Cooked past medium it tightens and turns livery, so kitchens sear it hard and rest it.',
	madeWith: ['beef'],
	note: 'Best at medium rare; past medium it tightens and the mineral edge turns livery.',
	origin: 'Called onglet in France, where it is the classic bistro steak',
	notThis: 'It is not skirt, which is the diaphragm muscle itself and is thinner and chewier.',
	line: 'Grilled hanger steak, chimichurri, fries',
	traps: [
		{
			says: 'A lean, mild cut from the hind leg that is best braised for hours',
			why: 'It is neither lean nor a leg cut, and long braising would waste its tenderness.'
		}
	]
};

const NAMES = ['Flank', 'Skirt', 'Bavette', 'Brisket', 'Oxtail'];
const ORDINAL = ['second', 'third', 'fourth', 'fifth', 'sixth'];

/** Six clean cards in one section: the smallest deck the contract accepts. */
function goodDeck() {
	const cards: Card[] = [
		structuredClone(GOOD),
		...NAMES.map((term, i) => ({
			id: `fd_000${i + 2}`,
			term,
			level: 1,
			gist: `The ${ORDINAL[i]} fixture beef cut, described at the length an option has to be`,
			guest: `This is the ${ORDINAL[i]} fixture cut, and a server could say this sentence at a table without reading it from a card.`,
			why: `The ${ORDINAL[i]} fixture exists so the section reaches its minimum. It carries enough prose to clear the floor on the why field, which is set high on purpose, because a card that cannot say why is only a label.`,
			madeWith: ['beef'],
			origin: 'A fixture, from nowhere in particular at all'
		}))
	];
	const sections = [
		{
			key: 'cuts',
			title: 'Meat Cuts',
			blurb: 'A fixture section, with a blurb long enough to pass the floor the contract sets on every blurb.',
			madeWith: 'required' as const,
			cards
		}
	];
	const ledger = {
		next: 7,
		cards: cards.map((c) => ({ id: c.id as string, term: c.term as string }))
	};
	return { sections, ledger, cards };
}

const CTX = { madeWith: 'required' as const, generic: new Set<string>() };
const card = (patch: Partial<Card>, drop: string[] = []) => {
	const c: Card = { ...structuredClone(GOOD), ...patch };
	for (const k of drop) delete c[k];
	return c;
};
const fails = (c: Card, re: RegExp, ctx = CTX) => {
	const problems = checkCard(c, ctx);
	expect(problems.join('\n'), `expected a problem matching ${re}`).toMatch(re);
};

describe('the control', () => {
	it('a good card has no problems', () => {
		expect(checkCard(GOOD, CTX)).toEqual([]);
	});
	it('a good deck has no problems', () => {
		const { sections, ledger } = goodDeck();
		expect(checkDeck(sections, ledger, { lexiconSlugs: new Set() })).toEqual([]);
	});
	it('a planned card is its id and its name and nothing else', () => {
		expect(checkCard({ id: 'fd_0009', term: 'Tomahawk', planned: true }, CTX)).toEqual([]);
		fails({ id: 'fd_0009', term: 'Tomahawk', planned: true, gist: 'x' }, /planned card carries only/);
	});
});

describe('one card: shape', () => {
	it('refuses an unknown key', () => fails(card({ notes: 'x' }), /unknown key/));
	it('refuses a verdict key by name, as well as as an unknown key', () => {
		fails(card({ allergens: ['milk'] }), /would carry a verdict/);
	});
	it('holds every field to a floor and a ceiling', () => {
		fails(card({ gist: 'Too short' }), /gist is 9 characters/);
		fails(card({ gist: 'x'.repeat(LIMITS.gist[1] + 1) }), new RegExp(`gist is ${LIMITS.gist[1] + 1} characters`));
		fails(card({ why: 'Short.' }), /why is 6 characters/);
		fails(card({}, ['guest']), /guest is required/);
	});
	it('holds the whole card to a floor and a ceiling too', () => {
		fails(card({}, ['note', 'notThis', 'line', 'aliases']), /CONTEXT|card's prose is|^$/);
		const thin = card({ why: GOOD.why as string }, ['note', 'notThis', 'line']);
		thin.guest = 'It is a rich beef cut that a server can describe in one short line.';
		thin.why = 'x'.repeat(160) + '.';
		expect(checkCard(thin, CTX).join('\n')).toMatch(/the card's prose is \d+ characters/);
	});
	it('needs at least one line of context', () => {
		fails(card({}, ['origin', 'notThis']), /CONTEXT is empty/);
	});
	it('a sentence ends in a stop and a label does not', () => {
		fails(card({ guest: (GOOD.guest as string).slice(0, -1) }), /guest is a sentence and must end in a stop/);
		fails(card({ gist: GOOD.gist + '.' }), /gist is a label, not a sentence/);
	});
});

describe('one card: its level', () => {
	it('is required on a written card', () => fails(card({}, ['level']), /level is required/));
	it('is one of the four integer keys', () => {
		for (const bad of [0, 5, 1.5]) fails(card({ level: bad }), /it is the integer key 1, 2, 3, 4/);
	});
	it('is never a string, not even the right digit, and never a name', () => {
		fails(card({ level: '1' }), /never a string or a level's name/);
		fails(card({ level: 'Commis' }), /never a string or a level's name/);
	});
	it('a planned card carries none: it is decided when the card is written', () => {
		fails({ id: 'fd_0009', term: 'Tomahawk', planned: true, level: 1 }, /planned card carries only/);
	});
	it('is written under the term', () => {
		expect(CARD_KEYS.indexOf('level')).toBe(CARD_KEYS.indexOf('term') + 1);
	});
});

describe('the levels themselves', () => {
	const good = () => structuredClone(DECK_LEVELS) as Array<{ level: number; name: string; blurb: string }>;
	it('the shipped four pass', () => expect(checkLevels(DECK_LEVELS)).toEqual([]));
	it('are exactly the four keys, in order', () => {
		expect(checkLevels(good().slice(0, 3)).join()).toMatch(/they are exactly \[1,2,3,4\]/);
		const swapped = good();
		[swapped[0], swapped[1]] = [swapped[1], swapped[0]];
		expect(checkLevels(swapped).join()).toMatch(/in that order/);
	});
	it('no two share a name, folded', () => {
		const l = good();
		l[3].name = 'sous chef';
		expect(checkLevels(l).join()).toMatch(/is another level's name/);
	});
	it('a name holds no digit, because the result screen holds no figure', () => {
		const l = good();
		l[0].name = 'Level 1';
		expect(checkLevels(l).join()).toMatch(/holds a digit/);
	});
	it('a blurb is held to the section blurb limits and the prose rules', () => {
		const short = good();
		short[1].blurb = 'Too short to say anything.';
		expect(checkLevels(short).join()).toMatch(/the blurb is 60 to 160 characters/);
		const dashed = good();
		dashed[2].blurb = dashed[2].blurb.replace(':', ' —');
		expect(checkLevels(dashed).join()).toMatch(/a dash/);
	});
});

describe('one card: the guest line is said aloud', () => {
	it('no brackets, semicolons or colons', () => {
		fails(card({ guest: 'It is a rich cut (the butcher kept it) and it is tender when it is sliced across the grain.' }), /no brackets, semicolons or colons/);
	});
	it('two sentences at most', () => {
		fails(card({ guest: 'It is rich. It is beefy. It is tender when it is cooked medium rare and sliced across the grain.' }), /two sentences at most/);
	});
	it('no temperatures at the table', () => {
		fails(card({ guest: 'It is a rich beef cut that the kitchen cooks to 54 C (129 F) and slices across the grain for you.' }), /no temperatures at the table/);
	});
});

describe('one card: the prose rules', () => {
	const why = GOOD.why as string;
	it('no dash of either length', () => {
		fails(card({ why: why.replace(', so it', ' — so it') }), /a dash/);
		fails(card({ why: why.replace('There is one', 'There are 1–2') }), /a dash/);
	});
	it('no token sanitation bans, by substring', () => {
		fails(card({ why: why.replace('sear it hard', 'sear it once thawed') }), /banned token "thaw"/);
	});
	it('no verdict language, in any field', () => {
		fails(card({ note: 'This cut contains no gluten, so it is a good choice for many guests.' }), /verdict language "contains"/);
		fails(card({ note: 'A good choice for a vegetarian guest who is asking about the menu.' }), /verdict language "vegetarian"/);
		fails(card({ note: 'It is safe for guests who avoid dairy, and servers should say so clearly.' }), /verdict language "is safe"/);
		fails(card({ note: 'Servers can call it safe for guests who avoid dairy, and should say so clearly.' }), /verdict language "safe for"/);
	});
	it('American spelling', () => {
		fails(card({ why: why.replace('flavor', 'flavour') }), /British spelling "flavour"/);
	});
	it('temperatures in the house form, with the arithmetic checked', () => {
		expect(temperatureProblems('Held at 82 C (180 F) until it naps the spoon.')).toEqual([]);
		expect(temperatureProblems('Poached at 71 to 82 C (160 to 180 F).')).toEqual([]);
		expect(temperatureProblems('Held at 82 C (120 F).').join()).toMatch(/82 C is 180 F, not 120 F/);
		expect(temperatureProblems('Cook it to 60C and rest it.').join()).toMatch(/bare temperature/);
		expect(temperatureProblems('Cook it to 140°F.').join()).toMatch(/degree sign/);
		expect(temperatureProblems('Poached at 71 to 82 C (180 F).').join()).toMatch(/range on one side/);
	});
});

describe('one card: pronunciation', () => {
	it('accepts a respelling with one stressed syllable a word', () => {
		expect(sayProblems('gwan-CHAH-leh')).toEqual([]);
		expect(sayProblems('bree-OHSH')).toEqual([]);
		expect(sayProblems('zhoo')).toEqual([]);
		expect(sayProblems("n-DOO-yah")).toEqual([]);
	});
	it('refuses two stresses in a word, none at all, and mixed case', () => {
		expect(sayProblems('HANG-ER').join()).toMatch(/more than one stressed/);
		expect(sayProblems('gwan-chah-leh').join()).toMatch(/no stressed syllable/);
		expect(sayProblems('Gwan-CHAH-leh').join()).toMatch(/all lowercase or ALL CAPITALS/);
		expect(sayProblems('gwan·CHAH').join()).toMatch(/letters, apostrophes and hyphens only/);
	});
	it('is required where a plain keyboard cannot type the term', () => {
		fails(card({ term: 'Pâté' }, ['say', 'line']), /say is required/);
	});
});

describe('one card: service facts cannot carry a verdict', () => {
	it('madeWith is ingredient nouns', () => {
		fails(card({ madeWith: ['Beef'] }), /an ingredient noun in lowercase/);
		fails(card({ madeWith: ['beef, salt and pepper together'] }), /an ingredient noun in lowercase/);
	});
	it('and an ingredient may not be a claim', () => {
		fails(card({ madeWith: ['dairy-free butter'] }), /turns an ingredient into a verdict/);
		fails(card({ madeWith: ['no nuts'] }), /turns an ingredient into a verdict/);
		fails(card({ madeWith: ['vegan cheese'] }), /turns an ingredient into a verdict/);
	});
	it('is required where the section says so, and optional where it does not', () => {
		fails(card({}, ['madeWith']), /madeWith is required in this section/);
		expect(checkCard(card({}, ['madeWith']), { ...CTX, madeWith: 'optional' })).toEqual([]);
	});
	it('accepts the three hedges', () => {
		expect(checkCard(card({ madeWith: ['beef', 'often garlic', 'sometimes soy sauce', 'traditionally red wine'] }), CTX)).toEqual([]);
	});
});

describe('one card: nothing under the term may name the term', () => {
	it('the gist', () => fails(card({ gist: 'The hanger is a loose-grained beef cut from beside the diaphragm' }), /gist names its own term/));
	it('an alias counts', () => fails(card({ gist: 'The onglet of the French bistro, loose-grained, rich and mineral' }), /gist names its own term/));
	it('a trap', () => {
		fails(card({ traps: [{ says: 'A steak cut from the hind leg that is best braised for hours', why: (GOOD.traps as Array<{ why: string }>)[0].why }] }), /says names the term/);
	});
	it('a one-word alias is a name; a multi-word alias is ordinary words and bans nothing', () => {
		// what the pilot came back with: "Beef Short Ribs" must not ban "beef"
		const c = card({
			term: 'Short Rib',
			aliases: ['Beef Short Ribs', 'Flanken'],
			gist: 'Blocks of fatty beef on stubby bones from low on the chest, braised soft',
			line: 'Braised short rib, horseradish, potato'
		}, ['say']);
		expect(checkCard(c, CTX)).toEqual([]);
		fails({ ...c, gist: 'The flanken of Korean barbecue, sawn thin across the bones and grilled' }, /gist names its own term/);
		fails({ ...c, gist: 'Blocks of fatty beef on a short bone from low on the chest, braised' }, /gist names its own term/);
	});
	it('but a head noun three cards share identifies nothing', () => {
		const generic = genericWords(['Hanger Steak', 'Flank Steak', 'Skirt Steak']);
		expect(generic.has('steak')).toBe(true);
		expect(generic.has('hanger')).toBe(false);
		const c = card({ gist: 'A loose-grained steak from beside the diaphragm, rich and mineral' });
		expect(checkCard(c, { ...CTX, generic })).toEqual([]);
	});
	it('unless that head noun is the whole name', () => {
		const generic = genericWords(['Truffle', 'Truffle Oil', 'Chocolate Truffle']);
		expect(generic.has('truffle')).toBe(true);
		const c = card(
			{ term: 'Truffle', gist: 'The truffle is an underground fungus prized for its heavy, musky aroma' },
			['aliases', 'line', 'say']
		);
		expect(checkCard(c, { ...CTX, generic }).join('\n')).toMatch(/gist names its own term \(truffle\)/);
	});
	it('the dish line is the opposite: it has to carry the term', () => {
		fails(card({ line: 'Grilled beef, chimichurri, fries' }), /dish line has to carry the term/);
		expect(checkCard(card({ line: 'Onglet, shallots, red wine' }), CTX)).toEqual([]);
		// a menu writes the plural, and that is the term as written
		expect(checkCard(card({ line: 'Grilled hanger steaks, chimichurri' }), CTX)).toEqual([]);
	});
});

describe('one card: traps', () => {
	const trap = (GOOD.traps as Array<{ says: string; why: string }>)[0];
	it('a trap is false, so it cannot be the gist', () => {
		fails(card({ traps: [{ says: GOOD.gist as string, why: trap.why }] }), /IS the gist/);
	});
	it('nor the gist with a word moved', () => {
		fails(card({ traps: [{ says: 'A loose-grained beef cut from beside the diaphragm, rich, tender and mineral', why: trap.why }] }), /differs from the gist by almost nothing/);
	});
	it('sits in the same length band as the gist, so length is no tell', () => {
		fails(card({ traps: [{ says: 'A lean leg cut', why: trap.why }] }), /the same band as gist/);
	});
	it('says why it is wrong, in a sentence', () => {
		fails(card({ traps: [{ says: trap.says, why: trap.why.slice(0, -1) }] }), /why is a sentence/);
	});
	it('is exactly { says, why }', () => {
		fails(card({ traps: [{ says: trap.says, why: trap.why, source: 'packet' }] }), /exactly \{ says, why \}/);
	});
	it('never appears on the card it belongs to', () => {
		fails(card({ note: `Some say it is ${trap.says.toLowerCase()}, which is wrong.` }), /traps never appear on a card/);
	});
	it('at most three', () => {
		fails(card({ traps: [trap, trap, trap, trap] }), /at most 3/);
	});
});

describe('one card: references', () => {
	it('confusedWith needs the words to go with it', () => {
		fails(card({ confusedWith: ['fd_0003'] }, ['notThis']), /confusedWith without notThis/);
	});
	it('a reference is a card id, not itself, not twice, not in both lists', () => {
		fails(card({ seeAlso: ['skirt'] }), /is not a card id/);
		fails(card({ seeAlso: ['fd_0001'] }), /names the card itself/);
		fails(card({ seeAlso: ['fd_0002', 'fd_0002'] }), /repeats an id/);
		fails(card({ seeAlso: ['fd_0003'], confusedWith: ['fd_0003'] }), /seeAlso and confusedWith at once/);
	});
});

describe('the deck: identity is the ledger', () => {
	const broken = (mutate: (d: ReturnType<typeof goodDeck>) => void, re: RegExp, opts = {}) => {
		const d = goodDeck();
		mutate(d);
		expect(checkDeck(d.sections, d.ledger, { lexiconSlugs: new Set(['flank-skirt-and-hanger']), ...opts }).join('\n')).toMatch(re);
	};
	it('an id is minted, never typed', () => {
		broken((d) => (d.cards[1].id = 'NEW'), /is not a minted id/);
		broken((d) => (d.cards[1].id = 'fd_0042'), /has no ledger row/);
	});
	it('an id cannot move to another term', () => {
		broken((d) => (d.cards[1].term = 'Flat Iron'), /the ledger knows fd_0002 as "Flank"/);
	});
	it('a swap shows as two renames', () => {
		const d = goodDeck();
		[d.cards[1].id, d.cards[2].id] = [d.cards[2].id, d.cards[1].id];
		const problems = checkDeck(d.sections, d.ledger, {});
		expect(problems.filter((p) => /the ledger knows/.test(p))).toHaveLength(2);
	});
	it('a card cannot be deleted out from under a reader', () => {
		broken((d) => d.cards.pop(), /fd_0006 "Oxtail" is not in any section/);
	});
	it('a retired id is never reused', () => {
		broken((d) => ((d.ledger.cards[1] as Record<string, unknown>).retired = '2026-09-19 merged into flank'), /was retired .* and may never be reused/);
	});
	it('an id appears once', () => {
		broken((d) => (d.cards[2].id = 'fd_0002'), /id fd_0002 is already "Flank"/);
	});
	it('a ledger row at or past next is a forged id', () => {
		broken((d) => (d.ledger.next = 3), /is at or past next/);
	});
	it('a missing ledger is fatal, never an empty default', () => {
		expect(checkDeck(goodDeck().sections, null as never, {}).join()).toMatch(/BUILD INPUT MISSING/);
	});

	it('a reference resolves to a live card', () => {
		broken((d) => (d.cards[0].seeAlso = ['fd_0099']), /seeAlso names fd_0099, which is not a live card/);
	});
	it('a Lexicon link resolves to a Lexicon entry', () => {
		broken((d) => (d.cards[0].lexiconSlug = 'hanger-steak'), /"hanger-steak" is not a Lexicon entry/);
		const d = goodDeck();
		d.cards[0].lexiconSlug = 'flank-skirt-and-hanger';
		expect(checkDeck(d.sections, d.ledger, { lexiconSlugs: new Set(['flank-skirt-and-hanger']) })).toEqual([]);
	});
	it('a trap may not be TRUE of another card', () => {
		broken((d) => {
			(d.cards[0].traps as Array<{ says: string }>)[0].says = d.cards[1].gist as string;
		}, /so it is TRUE of something on the deck/);
	});
	it('no two cards share a gist or a guest line', () => {
		broken((d) => (d.cards[2].gist = d.cards[1].gist), /gist is word for word the gist of fd_0002/);
	});
	it('no two cards share a name, and an alias is not another card', () => {
		broken((d) => (d.cards[0].aliases = ['Skirt']), /the alias "Skirt" is the term of fd_0003/);
	});
	it('a section that emits any card emits at least six', () => {
		broken((d) => {
			d.cards.pop();
			d.ledger.cards.pop();
			d.ledger.next = 6;
		}, /emits 5 card\(s\); a section that emits any emits at least 6/);
	});
	it('the section has a ceiling on its MEAN, because writers land near the ceiling', () => {
		const was = LIMITS.sectionMean;
		LIMITS.sectionMean = 300;
		try {
			const d = goodDeck();
			expect(checkDeck(d.sections, d.ledger, {}).join()).toMatch(/the ceiling on the mean is 300/);
		} finally {
			LIMITS.sectionMean = was;
		}
	});
	it('a finished deck holds no planned card', () => {
		broken((d) => {
			d.cards.push({ id: 'fd_0007', term: 'Tomahawk', planned: true });
			d.ledger.cards.push({ id: 'fd_0007', term: 'Tomahawk' });
			d.ledger.next = 8;
		}, /DECK_COMPLETE is true and 1 card\(s\) are still planned: Tomahawk/, { complete: true });
	});
	it('a finished deck holds a full written test at every level', () => {
		// the fixture is six cards: every level is under fourteen
		broken(() => {}, /level 3 holds 0 written card\(s\); every level holds at least 14/, { complete: true });
		const d = goodDeck();
		expect(checkDeck(d.sections, d.ledger, {}).join()).not.toMatch(/every level holds/);
	});
	it('the level floor is one full test, by the engine\'s own numbers', () => {
		expect(LIMITS.levelMin).toBe(TEST_MC + MATCH_SIZE);
	});
	it('every packet term keeps a card', () => {
		broken(() => {}, /the packet term "Short Rib" has no card/, { packetTerms: ['Hanger Steak', 'Short Rib'] });
	});
	it('a known packet error stays in the test as a trap', () => {
		broken(() => {}, /no trap carries it/, { packetErrors: { fd_0001: /very tender/i } });
		const d = goodDeck();
		expect(checkDeck(d.sections, d.ledger, { packetErrors: { fd_0001: /hind leg/i } })).toEqual([]);
	});
});

describe('nothing emitted can carry a verdict key', () => {
	it('at any depth', () => {
		expect(assertNoDeckVerdict({ cards: [{ id: 'fd_0001', facts: { contains: ['milk'] } }] }).join()).toMatch(/cards\[0\]\.facts\.contains/);
		expect(assertNoDeckVerdict({ cards: [{ id: 'fd_0001', recipe: 'steak-frites' }] })).toEqual([]);
		expect(assertNoDeckVerdict({ cards: [{ id: 'fd_0001', recipes: ['steak-frites'] }] }).join()).toMatch(/recipes/);
	});
});

describe('the shared core', () => {
	const deck = goodDeck().cards.map((c) => ({
		id: c.id as string,
		gist: c.gist as string,
		section: 'cuts',
		confusedWith: c.id === 'fd_0001' ? ['fd_0003'] : undefined
	}));
	const traps = GOOD.traps as Array<{ says: string; why: string }>;

	it('an id can never be a slug, so it can never collide with one in the shared drill log', () => {
		expect(DECK_ID_RE.test('fd_0001')).toBe(true);
		expect(slugify('fd_0001')).not.toBe('fd_0001');
		const taken = new Set([
			...(lexicon as Array<{ slug: string }>).map((e) => e.slug),
			...(drills as { cards: Array<{ slug: string }> }).cards.map((c) => c.slug),
			'drill-firing-order'
		]);
		for (const s of taken) expect(DECK_ID_RE.test(s), s).toBe(false);
	});
	it('fields three distinct wrong answers, never the key, its own traps first', () => {
		const rand = seeded(7);
		for (let i = 0; i < 200; i++) {
			const wrong = wrongAnswersFor(deck[0], deck, traps, rand);
			expect(wrong).toHaveLength(OPTIONS_PER_QUESTION - 1);
			const texts = wrong!.map((w) => foldText(w.text));
			expect(new Set(texts).size).toBe(texts.length);
			expect(texts).not.toContain(foldText(deck[0].gist));
			expect(wrong![0].from).toBe('trap');
			expect(wrong!.filter((w) => w.from === 'trap').length).toBeLessThanOrEqual(MAX_TRAPS_PER_QUESTION);
			// the card it is confused with is the first kin asked for
			expect(wrong!.find((w) => w.from === 'kin')!.id).toBe('fd_0003');
		}
	});
	it('never offers more than two traps, however many a card has', () => {
		const many = [0, 1, 2].map((i) => ({ says: `${traps[0].says} ${i}`, why: traps[0].why }));
		const wrong = wrongAnswersFor(deck[0], deck, many, seeded(3))!;
		expect(wrong.filter((w) => w.from === 'trap')).toHaveLength(MAX_TRAPS_PER_QUESTION);
	});
	it('returns null rather than looping when three cannot be fielded', () => {
		expect(wrongAnswersFor(deck[0], deck.slice(0, 2), undefined, seeded(1))).toBeNull();
	});
	it('shuffles without the bias of sort(() => Math.random() - 0.5)', () => {
		const rand = seeded(11);
		const first = [0, 0, 0, 0];
		for (let i = 0; i < 4000; i++) first[shuffled([0, 1, 2, 3], rand)[0]]++;
		for (const n of first) expect(n / 4000).toBeGreaterThan(0.22);
		for (const n of first) expect(n / 4000).toBeLessThan(0.28);
	});
});

describe('what shipped', () => {
	const deck = floorDeck as unknown as FloorDeck;
	const traps = deckTraps as unknown as DeckTraps;
	const index = deckIndex as unknown as DeckIndex;

	it('declares every section once, in teaching order, whether or not it is written yet', () => {
		expect(deck.sections.map((s) => s.key)).toEqual(DECK_SECTIONS.map((s) => s.key));
		for (const s of deck.sections) expect(s.count).toBe(deck.cards.filter((c) => c.section === s.key).length);
	});
	it('a card has no traps field, and no card text repeats a trap', () => {
		for (const c of deck.cards) {
			expect(Object.keys(c)).not.toContain('traps');
			const prose = foldText([c.gist, c.guest, c.why, c.note, c.origin, c.pairs, c.notThis, c.line].join(' '));
			for (const t of traps[c.id] ?? []) expect(prose.includes(foldText(t.says)), `${c.id} shows a trap`).toBe(false);
		}
	});
	it('every trap belongs to a live card', () => {
		const ids = new Set(deck.cards.map((c) => c.id));
		for (const id of Object.keys(traps)) expect(ids.has(id), id).toBe(true);
	});
	it('the Lexicon map holds in both directions', () => {
		const slugs = new Set((lexicon as Array<{ slug: string }>).map((e) => e.slug));
		for (const c of deck.cards) {
			if (c.lexiconSlug) expect(index.byLexicon[c.lexiconSlug]).toContain(c.id);
		}
		for (const [slug, ids] of Object.entries(index.byLexicon)) {
			expect(slugs.has(slug), slug).toBe(true);
			for (const id of ids) expect(deck.cards.find((c) => c.id === id)?.lexiconSlug).toBe(slug);
		}
		expect(index.cards.map((c) => c.id)).toEqual(deck.cards.map((c) => c.id));
	});
	it('declares all four levels in key order, with counts that are the cards\'', () => {
		expect(deck.levels.map((l) => l.level)).toEqual(LEVELS);
		expect(deck.levels.map((l) => l.name)).toEqual(DECK_LEVELS.map((l) => l.name));
		for (const l of deck.levels) {
			expect(l.count).toBe(deck.cards.filter((c) => c.level === l.level).length);
			expect(l.count, `level ${l.level}`).toBeGreaterThanOrEqual(LIMITS.levelMin);
		}
		for (const c of deck.cards) expect(LEVELS, `${c.id} level`).toContain(c.level);
	});
	it('the index carries each card\'s level and every level\'s name', () => {
		expect(index.levels).toEqual(Object.fromEntries(DECK_LEVELS.map((l) => [String(l.level), l.name])));
		expect(index.cards.map((c) => c.level)).toEqual(deck.cards.map((c) => c.level));
	});
	/* The engine sorts by level (teachingOrder). The FILE stays in section
	   order, then authored order, because level-first gzipped about 4 KB
	   worse. This pins that decision: the emitted cards are each section's
	   authored cards, sections in DECK_SECTIONS order. */
	it('emits the cards section by section in authored order, never level-first', () => {
		const authored = DECK_SECTIONS.flatMap((s) => s.cards.filter((c) => c.planned !== true).map((c) => c.id));
		expect(deck.cards.map((c) => c.id)).toEqual(authored);
	});
	/* A pin, so the ceiling moves only in a commit that says why. It moved once,
	   128,000 to 140,000, with the owner's 2.65 to 2.70 MB cap decision. */
	it('stays under the ceiling the precache cap was raised for', () => {
		expect(DECK_GZ_CEILING).toBeLessThanOrEqual(140_000);
	});
});

/**
 * One contract, two consumers. A validator that carried its own copy of a rule
 * would let a draft pass that the build then refuses, or the reverse, and the
 * atlas pipeline's validator was kept honest only by discipline. This is kept
 * honest by source inspection, like the rest of this repo's build pins.
 */
describe('the build and the authoring tools enforce the same contract', () => {
	const src = (f: string) => readFileSync(f, 'utf8');
	it('the build gate calls checkDeck from the contract module', () => {
		const deck = src('tools/derive/floor-deck.mjs');
		expect(deck).toMatch(/import \{[^}]*\bcheckDeck\b[^}]*\} from '\.\/floor-deck-contract\.mjs'/);
		expect(src('tools/build-data.mjs')).toMatch(/import \{ gateFloorDeck, buildFloorDeck \} from '\.\/derive\/floor-deck\.mjs'/);
	});
	it('the validator and the merger call it too, and define no rule of their own', () => {
		for (const f of ['tools/deck/validate.mjs', 'tools/deck/merge.mjs']) {
			const text = src(f);
			expect(text, f).toMatch(/import \{ checkDeck(, \w+)* \} from '\.\.\/derive\/floor-deck-contract\.mjs'/);
			expect(text, `${f} restates a limit`).not.toMatch(/LIMITS|VERDICT_RE|BANNED/);
		}
		/* The recipe-link rule ran in the build alone, and two merged sections
		   failed build:data on it. The validator runs it now, from the contract,
		   and does not restate it. */
		expect(src('tools/deck/validate.mjs')).toMatch(/import \{ checkDeck, recipeProblems \} from/);
		expect(src('tools/derive/floor-deck.mjs')).toMatch(/recipeProblems\(c, recipeName\)/);
		expect(src('tools/deck/validate.mjs')).not.toMatch(/shares no word/);
	});
	it('the brief prints the contract numbers rather than its own', () => {
		expect(src('tools/deck/brief.mjs')).toMatch(/import \{ LIMITS, AIMS, BANNED/);
		expect(src('tools/deck/author-section.workflow.js')).not.toMatch(/minLength: \d|maxLength: \d/);
	});
	it('the ledger has one writer, and it is not the build', () => {
		// a CALL, not the word: the module's header explains why it has none
		expect(src('tools/derive/floor-deck.mjs')).not.toMatch(/writeFileSync\(/);
		expect(src('tools/derive/floor-deck-contract.mjs')).not.toMatch(/writeFileSync\(/);
		expect(src('tools/deck/lib.mjs')).toMatch(/writeFileSync\(LEDGER_PATH/);
	});
});

/**
 * Traps are for the written test. The way that stays true is that nothing else
 * loads them, so the routes and components are scanned for the loader's name,
 * the same way navigation.test.ts scans the MODES literal.
 */
describe('only the written test loads the traps', () => {
	const walk = (dir: string): string[] =>
		readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
			e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name).replace(/\\/g, '/')]
		);
	it('no other route or component names loadDeckTraps', () => {
		const users = [...walk('src/routes'), ...walk('src/lib/components')]
			.filter((f) => /\.(svelte|ts)$/.test(f))
			.filter((f) => readFileSync(f, 'utf8').includes('loadDeckTraps'));
		// Two callers, both tests: the deck's own written test, and the level
		// test, which asks the deck's written test at its level before the
		// service and Lexicon questions (src/lib/levels.ts buildLevelTest). A
		// card still never shows a trap: neither route renders one.
		for (const f of users) expect(f, `${f} loads the traps`).toMatch(/src\/routes\/(service\/deck\/test|level\/\[n\]\/test)\//);
	});
});
