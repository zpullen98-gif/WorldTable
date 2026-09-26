import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { stripInvisible, foldName, hashText } from './desk-text';

/**
 * The hygiene the whole desk leans on, and the fixtures every later layer
 * reads. The fixtures are pinned here because a well-meaning tidy of a text
 * file is invisible in a diff: the dinner menu carries three zero-width
 * joiners ON PURPOSE, and the day they are cleaned out of the fixture is the
 * day the paste path stops being tested against the thing that broke it.
 */

const fixture = (name: string) =>
	readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8');

describe('stripInvisible', () => {
	it('removes every character that carries no ink', () => {
		for (const c of ['\u200B', '\u200C', '\u200D', '\u2060', '\uFEFF', '\u00AD']) {
			expect(stripInvisible(`Bouil${c}labaisse`)).toBe('Bouillabaisse');
		}
	});

	it('removes one sitting alone on its own line, and leaves the line', () => {
		// Commander's shape: a joiner where a blank line should be. The line
		// stays, empty, so the block structure around it is unchanged.
		expect(stripInvisible('Tasting Menu\n\u200D\n$90 per Person')).toBe('Tasting Menu\n\n$90 per Person');
	});

	it('folds the odd spaces to an ordinary one', () => {
		for (const s of ['\u00A0', '\u2002', '\u2003', '\u202F', '\u3000', '\u1680', '\u205F']) {
			expect(stripInvisible(`Tortilla${s}7`)).toBe('Tortilla 7');
		}
	});

	it('leaves tabs and newlines exactly where they were', () => {
		// menu-link.ts writes a tab between two table cells so a price stays on
		// its dish's line; folding it would put "$9" alone on the next line.
		const text = 'Sopa de Lima\t$9\nPan con Tomate\t$7\n\nMAINS';
		expect(stripInvisible(text)).toBe(text);
	});

	it('repairs nothing: not a spelling, not a digit', () => {
		expect(stripInvisible('sticky tamari chili glazeover Louisiana field pea')).toContain('glazeover');
		expect(stripInvisible('withlemon grilled artichokes')).toContain('withlemon');
		expect(stripInvisible('Soup of the day 9.S')).toBe('Soup of the day 9.S');
	});

	it('returns the text unchanged when there is nothing to do', () => {
		expect(stripInvisible('Crème Brûlée 8.50')).toBe('Crème Brûlée 8.50');
		expect(stripInvisible('')).toBe('');
	});
});

describe('foldName', () => {
	it('folds accents, case, punctuation and spacing to one key', () => {
		expect(foldName('Crème Brûlée')).toBe('creme brulee');
		expect(foldName('CREME  BRULEE')).toBe('creme brulee');
		expect(foldName(' crème-brûlée! ')).toBe('creme brulee');
	});

	it('keeps digits, so a French 75 is not a French', () => {
		expect(foldName('French 75')).toBe('french 75');
		expect(foldName('Penfolds Bin 389')).toBe('penfolds bin 389');
	});

	it('does not fold two different dishes together', () => {
		expect(foldName('Soup du Jour')).not.toBe(foldName('Soup of the Day'));
		expect(foldName("Commander's Creole Gumbo")).toBe('commander s creole gumbo');
	});

	it('is empty for nothing at all', () => {
		expect(foldName('')).toBe('');
		expect(foldName('   ')).toBe('');
		expect(foldName(undefined as never)).toBe('');
	});
});

describe('hashText', () => {
	it('is eight hex characters, and the same for the same text', () => {
		const h = hashText('STARTERS\nSoup 9');
		expect(h).toMatch(/^[0-9a-f]{8}$/);
		expect(hashText('STARTERS\nSoup 9')).toBe(h);
	});

	it('reads the same menu as the same menu by any door', () => {
		// The link reader tabs its cells, the paste keeps the page's indentation,
		// a photograph has neither, and one of them carries a joiner.
		const pasted = '  STARTERS\n  Soup\u200D of the day   9\n\n';
		const linked = 'STARTERS\nSoup of the day\t9';
		expect(hashText(pasted)).toBe(hashText(linked));
	});

	it('changes when the words change', () => {
		expect(hashText('Soup 9')).not.toBe(hashText('Soup 8'));
		expect(hashText('Soup 9')).not.toBe(hashText('Stew 9'));
		expect(hashText('')).not.toBe(hashText('Soup 9'));
	});
});

describe("the Commander's fixtures, as the plan describes them", () => {
	const dinner = fixture('commanders-dinner.txt');
	const drinks = fixture('commanders-drinks.txt');
	const codex = fixture('codex-pdf-list.txt');

	it('the dinner menu carries three U+200D on purpose, and stripInvisible takes exactly those out', () => {
		expect((dinner.match(/\u200D/g) ?? []).length).toBe(3);
		const clean = stripInvisible(dinner);
		expect(clean).not.toContain('\u200D');
		expect(clean.length).toBe(dinner.length - 3);
	});

	it('the dinner menu keeps the shapes the reader has to survive, unrepaired', () => {
		expect(dinner).toContain('$90 per Person + Optional Wine Pairing ($40)');
		expect(dinner).toContain('~le Coup du Milieu~');
		expect(dinner).toContain('~Finished tableside with a splash of aged Sherry');
		expect(dinner).toContain('* Must be ordered 20 minutes in advance');
		expect(dinner).toContain('CHEF MEG"S THREE COURSE OFFERINGS');
		expect(dinner).toContain('Kiss the Crab');
		expect(dinner).toContain('Zacapa No. 23 Solera');
		// The venue's own typography, which is not this app's to correct.
		expect(dinner).toContain('glazeover');
		expect(dinner).toContain('withlemon');
	});

	it('the drinks menu carries the cocktail and the by-the-glass wine the plan names', () => {
		expect(drinks).toContain('Holy Trinity\n15\ntrinity infused gin | benedictine | lime');
		expect(drinks).toContain('Ployez-Jacquemart\n45.00 / 22.50\n5 oz / 2.5 oz\n2010\nExtra-Brut, Champagne, France');
		expect(drinks).toContain('OUR WINE PROGRAM\nWINE BY GLASS');
	});

	it('the codex list carries bins as list indexes, NV on its own line, four-digit prices and the named bottles', () => {
		expect(codex).toMatch(/^\d{3}  \S/m);
		expect(codex).toMatch(/^NV$/m);
		expect(codex).toMatch(/^\d{4}$/m);
		expect(codex).toContain('Ch. Margaux 2015');
		expect(codex).toContain('Penfolds Bin 389 Shiraz 2018');
		expect(codex).toContain('Domaine Leflaive');
		expect(codex).toMatch(/^\d{3}  Leflaive /m);
		// No four-digit price that reads as a vintage: the reader's rule is that
		// 19xx and 20xx are years, and a fixture that put a price in that range
		// would be testing the wrong thing.
		for (const line of codex.split('\n')) {
			if (/^\d{4}$/.test(line)) expect(line).not.toMatch(/^(?:19|20)\d\d$/);
		}
	});

	it('none of the three fixtures carries a house em dash', () => {
		// The menus are the venue's text and may print what they like; these
		// three happen not to, and a dash that appears here later was typed by
		// us, not by Commander's.
		for (const text of [dinner, drinks, codex]) expect(text).not.toContain('\u2014');
	});
});
