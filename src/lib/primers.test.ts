import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LIMITS, PRIMERS_COMPLETE, checkPrimer, citeHref, countValue, namesItem, staleCounts } from '../../tools/derive/primers.mjs';
import type { PrimersData } from './types';

/**
 * The gate for a primer, on fixtures: what it accepts and each thing it
 * refuses. Then the emitted file: every cite is an item placed at that
 * level in that subsection, links resolve under the base, and when the set
 * is complete no level and subsection with items lacks its reader.
 */
const DATA = join(__dirname, 'data');
const read = (name: string) => JSON.parse(readFileSync(join(DATA, name), 'utf8'));

const items = new Map(
	[
		['sweating', 'Sweating aromatics: soft, never browned'],
		['searing', 'Searing'],
		['roux', 'Roux'],
		['blanching', 'Blanching & shocking'],
		['knife-cuts', 'Knife cuts']
	].map(([slug, name]) => [slug, { slug, name }])
);
const para = (s: string, n = 4) => Array.from({ length: n }, () => s).join(' ');
const good = () => ({
	level: 1,
	subsection: 'techniques',
	lede: 'The pan, the pot and the knife: five moves that carry most of the dishes you will cook this year.',
	paragraphs: [
		para('Take sweating aromatics first, because most of the braises and soups at this level open with it, and the standard asks for no color anywhere.'),
		para('Then searing, which is the opposite lesson: a hot pan, a dry surface, and the patience to leave the meat alone until it releases.'),
		para('Roux and blanching come next, one for the sauces of the second semester and one for every green vegetable that must stay green on the plate.'),
		para('Knife cuts run under all of it. A technique with a standard is met when a cook on one of its recipes was graded met against it; read the techniques, then take the next one.')
	],
	cites: ['sweating', 'searing', 'roux', 'blanching', 'knife-cuts'],
	next: 'Chef de Partie asks for the mother sauces and their children, emulsions and the braise, on the same pan you learned to sear in.'
});
const gate = (p: unknown) => checkPrimer(p, { key: '1-techniques', items });

describe('checkPrimer', () => {
	it('accepts a primer that names what it cites and keeps the house rules', () => {
		const r = gate(good());
		expect(r.problems).toEqual([]);
		expect(r.primer.cites).toEqual([
			{ slug: 'sweating', name: 'Sweating aromatics: soft, never browned', href: '/technique/sweating' },
			{ slug: 'searing', name: 'Searing', href: '/technique/searing' },
			{ slug: 'roux', name: 'Roux', href: '/technique/roux' },
			{ slug: 'blanching', name: 'Blanching & shocking', href: '/technique/blanching' },
			{ slug: 'knife-cuts', name: 'Knife cuts', href: '/technique/knife-cuts' }
		]);
	});
	it('refuses a cite that is not an item of this level and subsection', () => {
		const p = good();
		p.cites.push('lamination');
		expect(gate(p).problems.join('\n')).toMatch(/cites "lamination", which is not an item/);
	});
	it('refuses a cite the text never names', () => {
		const p = good();
		p.paragraphs[3] = para('A closing paragraph that names nothing in particular and only points to the doors: read the techniques, then take the next one.');
		expect(gate(p).problems.join('\n')).toMatch(/cites "knife-cuts" but never names "Knife cuts"/);
	});
	it('wants at least four cites, or every item when there are fewer', () => {
		const p = good();
		p.cites = ['sweating'];
		expect(gate(p).problems.join('\n')).toMatch(/1 cites, at least 4 wanted/);
		const two = new Map([...items].slice(0, 2));
		const r = checkPrimer({ ...good(), cites: ['sweating', 'searing'] }, { key: '1-techniques', items: two });
		expect(r.problems).toEqual([]);
	});
	it('refuses a dash, a British spelling, a verdict and a locked or scored level', () => {
		const dash = good();
		dash.paragraphs[0] = para('Sweating first: soft, never browned, 5–6 minutes over a low flame, and no color anywhere is the whole standard.');
		expect(gate(dash).problems.join('\n')).toMatch(/dash/);
		const british = good();
		british.lede = 'The pan, the pot and the knife: the flavour of the first weeks in one line.';
		expect(gate(british).problems.join('\n')).toMatch(/British spelling "flavour"/);
		const verdict = good();
		verdict.next = 'Chef de Partie asks for the mother sauces, and every one of them is gluten-free when made with cornstarch.';
		expect(gate(verdict).problems.join('\n')).toMatch(/verdict language/);
		const lock = good();
		lock.next = 'Chef de Partie unlocks once every technique here is met; score 80 percent on the test to pass.';
		const out = gate(lock).problems.join('\n');
		expect(out).toMatch(/a level guides and never bars/);
		// a knife scores a fat cap, and a cook names the allergen protocol: neither is a verdict or a score
		const knife = good();
		knife.paragraphs[1] = para('Then searing, after scoring the fat cap in a crosshatch so it renders, and the allergen protocol pinned by the pass is read before the first ticket.');
		expect(gate(knife).problems).toEqual([]);
	});
	it('refuses a level by its numeral: a level is named, never numbered', () => {
		const one = good();
		one.next = 'Level II asks for the mother sauces and their children, emulsions and the braise, on the same pan you learned to sear in.';
		expect(gate(one).problems.join('\n')).toMatch(/next: "Level II": levels are named, never numbered/);
		const both = good();
		both.paragraphs[2] = para('Roux and blanching come next, and Levels III and IV take both further, one for the sauces and one for every green vegetable.');
		expect(gate(both).problems.join('\n')).toMatch(/paragraph 3: "Levels III": levels are named, never numbered/);
		for (const n of ['I', 'III', 'IV']) {
			const p = good();
			p.lede = `The pan, the pot and the knife at Level ${n}: five moves that carry most of the dishes you will cook.`;
			expect(gate(p).problems.join('\n')).toMatch(/levels are named, never numbered/);
		}
		// the names pass, and so does a rung of the tasting ladder
		const named = good();
		named.lede = 'At Commis the pan, the pot and the knife: five moves, and the tasting ladder to rung 1 before Sous Chef.';
		expect(gate(named).problems).toEqual([]);
	});
	it('holds the lengths: words across the paragraphs, paragraph count, and every line ending in a stop', () => {
		const short = good();
		short.paragraphs = [para('Sweating, searing, roux, blanching and knife cuts.', 2), para('Read the techniques.', 2), para('Knife cuts matter.', 2)];
		expect(gate(short).problems.join('\n')).toMatch(new RegExp(`words across the paragraphs, wanted ${LIMITS.words[0]}`));
		const many = good();
		many.paragraphs = Array.from({ length: LIMITS.paragraphs[1] + 1 }, () => para('Sweating, searing, roux, blanching and knife cuts, again and again.', 3));
		expect(gate(many).problems.join('\n')).toMatch(/paragraphs, wanted/);
		const open = good();
		open.lede = 'The pan, the pot and the knife';
		expect(gate(open).problems.join('\n')).toMatch(/lede: does not end in a sentence stop/);
	});
	it('refuses a file whose level and subsection disagree with its name, and an unknown key', () => {
		const p = { ...good(), level: 2 };
		expect(gate(p).problems.join('\n')).toMatch(/the file says 2-techniques/);
		const extra = { ...good(), title: 'A title' };
		expect(gate(extra).problems.join('\n')).toMatch(/unknown key "title"/);
	});
});

describe('namesItem and citeHref', () => {
	it('names an item by its whole name, its head before a colon, or a plain plural', () => {
		expect(namesItem('take sweating aromatics first', 'Sweating aromatics: soft, never browned')).toBe(true);
		expect(namesItem('the two faults, flat and salty', 'Flat')).toBe(true);
		expect(namesItem('blanching every green vegetable', 'Blanching & shocking')).toBe(true);
		expect(namesItem('pork chops on the grill', 'Pork Chop')).toBe(true);
		expect(namesItem("the room's vocabulary comes first", 'The Room’s Vocabulary')).toBe(true);
		expect(namesItem('know where your house keeps its allergen protocol', 'Allergen protocol is service-critical and legal-critical')).toBe(true);
		expect(namesItem('nothing here', 'Searing')).toBe(false);
	});
	it('links each subsection where the level page does', () => {
		expect(citeHref('dishes', { slug: 'cacio-e-pepe' })).toBe('/recipe/cacio-e-pepe');
		expect(citeHref('lexicon', { slug: 'chuck' })).toBe('/lexicon#chuck');
		expect(citeHref('deck', { slug: 'fd_0025' })).toBe('/service/deck/study?card=fd_0025');
		expect(citeHref('plates', { slug: 'beef-cuts' })).toBe('/plates/beef-cuts');
		expect(citeHref('palate', { slug: 'flat' })).toBe('/palate');
		expect(citeHref('palate', { slug: 'salt@2' })).toBe('/practise/calibrate');
		expect(citeHref('safety', { slug: 'numeric:dangerZone', kind: 'numeric' })).toBe('/safety#numbers');
		expect(citeHref('service', { slug: 'srv-room' })).toBe('/service/srv-room');
	});
});

describe('the emitted primers', () => {
	const file = join(DATA, 'primers.json');
	const has = existsSync(file);
	it.skipIf(!has)('cite only items placed at their level in their subsection, with links under the base', () => {
		const data = read('primers.json') as PrimersData;
		const levels = read('levels.json') as { items: Record<string, Record<string, string[]>> };
		expect(data.version).toBe(1);
		for (const p of data.primers) {
			const placed = new Set(levels.items[p.subsection]?.[String(p.level)] ?? []);
			for (const c of p.cites) {
				expect(placed.has(c.slug), `${p.level}-${p.subsection} cites ${c.slug}`).toBe(true);
				expect(c.href.startsWith('/')).toBe(true);
				expect(c.name.length).toBeGreaterThan(0);
			}
			expect(p.cites.length).toBeGreaterThanOrEqual(Math.min(LIMITS.citesMin, placed.size));
			const words = p.paragraphs.reduce((a, s) => a + s.trim().split(/\s+/).length, 0);
			expect(words).toBeGreaterThanOrEqual(LIMITS.words[0]);
			expect(words).toBeLessThanOrEqual(LIMITS.words[1]);
			for (const s of [p.lede, p.next, ...p.paragraphs]) {
				expect(s, `${p.level}-${p.subsection}`).not.toMatch(/[–—]/);
				// a level is named, never numbered
				expect(s, `${p.level}-${p.subsection}`).not.toMatch(/\bLevels? (?:I|II|III|IV)\b/);
			}
		}
	});
	it.skipIf(!has)('covers every level and subsection that holds items once the set is complete', () => {
		const data = read('primers.json') as PrimersData;
		const levels = read('levels.json') as { counts: Record<string, Record<string, number>> };
		const keys = new Set(data.primers.map((p) => `${p.level}-${p.subsection}`));
		expect(keys.size).toBe(data.primers.length);
		if (!PRIMERS_COMPLETE) return;
		for (const [level, counts] of Object.entries(levels.counts)) {
			for (const [sub, n] of Object.entries(counts)) {
				if (n > 0) expect(keys.has(`${level}-${sub}`), `${level}-${sub}`).toBe(true);
				else expect(keys.has(`${level}-${sub}`), `${level}-${sub} has nothing to prime`).toBe(false);
			}
		}
	});
});

describe('a count in prose must be true', () => {
	it('reads numbers written out and as figures', () => {
		expect(countValue('Fourteen')).toBe(14);
		expect(countValue('thirty-five')).toBe(35);
		expect(countValue('thirty five')).toBe(35);
		expect(countValue('122')).toBe(122);
		expect(countValue('two')).toBe(2);
	});

	it('names a count of the subsection that matches no true count', () => {
		expect(staleCounts('Fourteen dishes sit here.', 'dishes', new Set([10, 16, 45]))).toEqual(['Fourteen dishes']);
		expect(staleCounts('Sous Chef holds Thirty-five cards.', 'deck', new Set([78, 122, 26, 336]))).toEqual(['Thirty-five cards']);
		expect(staleCounts('Ten dishes sit here.', 'dishes', new Set([10, 16, 45]))).toEqual([]);
	});

	it('leaves subsets alone: a qualifier between, a definite lead, a qualifier after', () => {
		const truth = new Set([10]);
		expect(staleCounts('the five Easy plates and two pastry dishes', 'dishes', truth)).toEqual([]);
		expect(staleCounts('Finish with the three dishes that close the semester.', 'dishes', truth)).toEqual([]);
		expect(staleCounts('Those four faults are read in the moment.', 'palate', new Set([2]))).toEqual([]);
		expect(staleCounts('thirty terms on restaurant finance', 'lexicon', new Set([39]))).toEqual([]);
	});

	it("only counts the subsection’s own noun, and never another subsection’s", () => {
		expect(staleCounts('Six subjects per folio and twelve techniques in all.', 'dishes', new Set([10]))).toEqual([]);
		expect(staleCounts('61 entries in the Vegetable Atlas', 'lexicon', new Set([266]))).toEqual([]);
	});
});
