import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { foundationEntryByRef, foundationLogKey, foundationRecordable, foundationRef, foundationsCategories, foundationsEntries, foundationsMembers, foundationsPractice, resolveFoundation } from './foundations';
import type { CookEntry } from './repertoire';
import deck from './data/floor-deck.json';
import lexicon from './data/lexicon.json';
import data from './data/culinary-foundations.json';
import published from '../../tools/foundations/published.json';

const at = (day: number) => new Date(2026, 9, day, 12).getTime();
const c = foundationsEntries.find(e => e.ref?.startsWith('c:'))!;
const t = foundationsEntries.find(e => e.ref?.startsWith('t:'))!;
const u = foundationsEntries.find(e => !e.ref)!;
/* The photographed sheets: the first 120 entries ever published, in nine subjects. Entries the
 * Fieldbook gains later join published.json after them, so these pins follow the data. */
const PHOTOGRAPHED = published.entries.slice(0, 120) as Array<{ id: string; term: string; ref?: string }>;
const NINE = ['methods', 'vegetables', 'southern', 'mushrooms', 'meats', 'cured', 'cuts', 'fish', 'dairy'];

describe('the photographed culinary terms', () => {
	it('retains every published identity in its subject and resolves every original lesson', () => {
		expect(PHOTOGRAPHED).toHaveLength(120);
		expect(foundationsEntries).toHaveLength(published.entries.length);
		expect(new Set(foundationsEntries.map(e => e.id)).size).toBe(foundationsEntries.length);
		expect(foundationEntryByRef.size).toBe(foundationsEntries.length);
		const byId = new Map(foundationsEntries.map(e => [e.id, e]));
		for (const was of published.entries as Array<{ id: string; term: string; ref?: string }>) {
			expect(byId.get(was.id)?.term, `${was.id}: published term`).toBe(was.term);
			expect(byId.get(was.id)?.ref, `${was.id}: published ref`).toBe(was.ref);
		}
		expect(new Set(PHOTOGRAPHED.map(p => byId.get(p.id)!.category))).toEqual(new Set(NINE));
		// The file's subjects: the nine, then the three the Thanksgiving work added; a subject is drawn once it holds a term.
		expect(data.categories.map(c => c.id)).toEqual([...NINE, 'sauces', 'grains', 'sweets']);
		for (const entry of foundationsEntries) expect(data.categories.map(c => c.id), entry.id).toContain(entry.category);
		expect(foundationsCategories.map(c => c.id)).toEqual(data.categories.filter(c => foundationsEntries.some(e => e.category === c.id)).map(c => c.id));
		for (const entry of foundationsEntries) {
			if (entry.ref?.startsWith('c:')) expect(deck.cards.some(card => card.id === entry.ref!.slice(2))).toBe(true);
			if (entry.ref?.startsWith('t:')) expect(lexicon.some(term => term.slug === entry.ref!.slice(2))).toBe(true);
			expect(foundationsMembers(`foundations:item:${entry.id}`)).toEqual([foundationRef(entry)]);
			expect(foundationsMembers(`foundations:category:${entry.category}`)).toContain(foundationRef(entry));
		}
		expect(foundationsMembers('foundations:category:missing')).toEqual([]);
		expect(foundationsMembers('foundations:item:missing')).toEqual([]);
	});
	it('keeps original Floor Deck history while namespacing new self-assessment', () => {
		expect(foundationLogKey(c)).toBe(c.ref!.slice(2));
		expect(foundationLogKey(t)).toBe(`foundation:${t.id}`);
		expect(foundationLogKey(u)).toBe(`foundation:${u.id}`);
		const log: CookEntry[] = [{ slug: foundationLogKey(c), at: at(14), grade: 'missed' }];
		expect(foundationsPractice(log, at(15))[0]).toBe(foundationRef(c));
		expect(log).toEqual([{ slug: foundationLogKey(c), at: at(14), grade: 'missed' }]);
	});
	it('starts with ten different cards spanning all categories', () => {
		const refs = foundationsPractice([], at(15));
		expect(refs).toHaveLength(10);
		expect(new Set(refs).size).toBe(10);
		expect(new Set(refs.map(ref => foundationEntryByRef.get(ref)!.category)).size).toBe(Math.min(10, foundationsCategories.length));
	});
	it('moves on after today’s practice instead of trapping the reader on today’s misses', () => {
		const first = foundationsPractice([], at(15));
		const log: CookEntry[] = first.map(ref => ({ slug: foundationLogKey(foundationEntryByRef.get(ref)!), at: at(15), grade: 'missed' }));
		expect(foundationsPractice(log, at(15)).some(ref => first.includes(ref))).toBe(false);
		expect(new Set(foundationsPractice(log, at(16)))).toEqual(new Set(first));
	});
	it('uses the latest grade and ignores malformed/future timestamps', () => {
		const refs = foundationsPractice([], at(15));
		const item = foundationEntryByRef.get(refs[0])!;
		const log: CookEntry[] = [
			{ slug: foundationLogKey(item), at: at(14), grade: 'close' },
			{ slug: foundationLogKey(item), at: at(13), grade: 'missed' },
			{ slug: foundationLogKey(c), at: at(16), grade: 'missed' },
			{ slug: foundationLogKey(u), at: NaN, grade: 'missed' }
		];
		expect(foundationsPractice(log, at(15))).not.toContain(foundationRef(item));
		expect(foundationsPractice(log, at(15), 0)).toEqual([]);
		expect(foundationRecordable([{ slug: foundationLogKey(c), at: at(15) + 3600000, grade: 'close' }], c, at(15))).toBe(true);
	});
	it('records at most once on a local day across old and new references', () => {
		for (const entry of [c, t, u]) {
			const log: CookEntry[] = [{ slug: foundationLogKey(entry), at: at(15), grade: 'close' }];
			expect(foundationRecordable(log, entry, at(15))).toBe(false);
			expect(foundationRecordable(log, entry, at(16))).toBe(true);
		}
	});
	it('uses the reviewed definition and leaves deeper reading optional', () => {
		const entry = { ...t, definition: 'A reviewed plain-English definition.', kitchen: 'A practical cue.' };
		expect(resolveFoundation(entry).definition).toBe(entry.definition);
		expect(resolveFoundation(entry).kitchen).toBe(entry.kitchen);
	});
	it('keeps corrected comparisons aligned with the original drill identities', () => {
		for (const id of ['methods-cured', 'methods-fried', 'methods-sauteed', 'methods-smoked', 'cured-prosciutto', 'cuts-cheek']) {
			const entry = foundationsEntries.find(e => e.id === id)!;
			const original = deck.cards.find(card => `c:${card.id}` === entry.ref)!;
			expect(original, id).toBeDefined();
			expect(entry.compare, id).toBe(original.notThis);
			expect(entry.reviewedOn, id).toBe('2026-10-20');
		}
	});
	it('ships complete teaching notes and source links for every photographed term', () => {
		for (const entry of foundationsEntries) {
			for (const field of ['definition', 'guest', 'kitchen', 'compare'] as const) {
				expect(entry[field]?.trim().length, `${entry.id}: ${field}`).toBeGreaterThan(15);
				expect(entry[field], `${entry.id}: no drafting placeholders`).not.toMatch(/\[(?:confirm|insert|actual)/i);
			}
			expect(entry.reviewedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
			expect(entry.sources.length, `${entry.id}: sources`).toBeGreaterThan(0);
			for (const source of entry.sources) expect(new URL(source.url).protocol).toBe('https:');
		}
		expect(PHOTOGRAPHED.filter(e => e.ref?.startsWith('c:'))).toHaveLength(85);
		expect(PHOTOGRAPHED.filter(e => e.ref?.startsWith('t:'))).toHaveLength(21);
		expect(PHOTOGRAPHED.filter(e => !e.ref)).toHaveLength(14);
		const split = ['c:', 't:'].map(prefix => foundationsEntries.filter(e => e.ref?.startsWith(prefix)).length);
		expect(split[0] + split[1] + foundationsEntries.filter(e => !e.ref).length).toBe(foundationsEntries.length);
	});
	it('passes its own gate, tools/foundations/check-foundations.mjs', () => {
		const gate = fileURLToPath(new URL('../../tools/foundations/check-foundations.mjs', import.meta.url));
		expect(execFileSync(process.execPath, [gate], { encoding: 'utf8' })).toMatch(/sound: \d+ entries/);
	});
});
