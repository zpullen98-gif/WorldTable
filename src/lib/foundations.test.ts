import { describe, it, expect } from 'vitest';
import { foundationEntryByRef, foundationLogKey, foundationRecordable, foundationRef, foundationsEntries, foundationsMembers, foundationsPractice, resolveFoundation } from './foundations';
import type { CookEntry } from './repertoire';
import deck from './data/floor-deck.json';
import lexicon from './data/lexicon.json';

const at = (day: number) => new Date(2026, 9, day, 12).getTime();
const c = foundationsEntries.find(e => e.ref?.startsWith('c:'))!;
const t = foundationsEntries.find(e => e.ref?.startsWith('t:'))!;
const u = foundationsEntries.find(e => !e.ref)!;

describe('the photographed culinary terms', () => {
	it('retains all 120 identities across nine categories and resolves every original lesson', () => {
		expect(foundationsEntries).toHaveLength(120);
		expect(new Set(foundationsEntries.map(e => e.id)).size).toBe(120);
		expect(foundationEntryByRef.size).toBe(120);
		expect(new Set(foundationsEntries.map(e => e.category)).size).toBe(9);
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
		expect(new Set(refs.map(ref => foundationEntryByRef.get(ref)!.category)).size).toBe(9);
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
		expect(foundationsEntries.filter(e => e.ref?.startsWith('c:'))).toHaveLength(85);
		expect(foundationsEntries.filter(e => e.ref?.startsWith('t:'))).toHaveLength(21);
		expect(foundationsEntries.filter(e => !e.ref)).toHaveLength(14);
	});
});
