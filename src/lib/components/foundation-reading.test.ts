import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import FoundationReading from './FoundationReading.svelte';
import { foundationsEntries, resolveFoundation, type FoundationEntry } from '$lib/foundations';
import deck from '$lib/data/floor-deck.json';
import type { FloorDeck } from '$lib/types';

/**
 * The three fields a Fieldbook entry may carry beyond the photographed sheet:
 * say (a plain respelling), background (its history, sourced) and metAt (where
 * he met it). Each is drawn only when the entry has it, under the same section
 * markup as the readings beside it, and the entry's own background comes before
 * the linked Floor Deck card's why.
 */
const plain = foundationsEntries.find(e => !e.ref)!;
const carded = foundationsEntries.find(e => e.ref?.startsWith('c:') && (deck as FloorDeck).cards.find(c => `c:${c.id}` === e.ref)?.why)!;
const html = (entry: FoundationEntry, withDeck = false) =>
	render(FoundationReading, { props: { reading: resolveFoundation(entry, withDeck ? (deck as FloorDeck) : undefined) } }).body
		// Svelte's hydration comments and scoped class hashes, which say nothing about the markup's shape.
		.replace(/<!--[^]*?-->/g, '').replace(/ class="svelte-[a-z0-9]+"/g, '').replace(/ svelte-[a-z0-9]+/g, '');
const headings = (body: string) => [...body.matchAll(/<h3>([^<]+)<\/h3>/g)].map(m => m[1]);
const sectionText = (body: string, heading: string) => body.match(new RegExp(`<section class="[^"]*"><h3>${heading}</h3><p>([^<]*)</p></section>`))?.[1];

const full: FoundationEntry = {
	...plain,
	say: 'ah-nyoh-LOH-tee',
	background: 'A written history of the term, with every fact resting on its sources.',
	metAt: 'Brennan’s Thanksgiving Day 2026: a dish of the day'
};

describe('the Fieldbook reading draws say, background and metAt', () => {
	it('draws none of the three for an entry that carries none of them and links no card', () => {
		const body = html({ ...plain, say: undefined, background: undefined, metAt: undefined });
		const h = headings(body);
		expect(h).not.toContain('Say it');
		expect(h).not.toContain('Background');
		expect(h).not.toContain('Where you met it');
		expect(h[0]).toBe('In plain English');
	});
	it('draws Say it first, beside the term, then In plain English and Background', () => {
		const body = html(full);
		const h = headings(body);
		expect(h.slice(0, 3)).toEqual(['Say it', 'In plain English', 'Background']);
		expect(sectionText(body, 'Say it')).toBe(full.say);
		expect(sectionText(body, 'Background')).toBe(full.background);
	});
	it('draws Where you met it near the end, after the readings and before the sources', () => {
		const body = html(full);
		const h = headings(body);
		expect(h.at(-1)).toBe('Where you met it');
		expect(h.indexOf('Where you met it')).toBeGreaterThan(h.indexOf('Tell them apart'));
		expect(sectionText(body, 'Where you met it')).toBe(full.metAt);
		if (full.sources.length) expect(body.indexOf('Where you met it')).toBeLessThan(body.indexOf('class="sources"'));
	});
	it('wears the same section markup as the readings beside it', () => {
		const body = html(full);
		for (const heading of ['Say it', 'Background', 'Where you met it', 'In the kitchen']) {
			expect(body, heading).toMatch(new RegExp(`<section(?: class="[^"]*")?><h3>${heading}</h3><p>`));
		}
	});
	it('puts the entry’s own background first and keeps the card’s why as the fallback', () => {
		expect(carded, 'an entry linked to a Floor Deck card with a why').toBeDefined();
		const why = (deck as FloorDeck).cards.find(c => `c:${c.id}` === carded.ref)!.why!;
		expect(resolveFoundation({ ...carded, background: undefined }, deck as FloorDeck).background).toBe(why);
		expect(resolveFoundation({ ...carded, background: 'Its own history.' }, deck as FloorDeck).background).toBe('Its own history.');
		expect(sectionText(html({ ...carded, background: 'Its own history.' }, true), 'Background')).toBe('Its own history.');
	});
	it('carries say and metAt through resolveFoundation, empty when absent', () => {
		expect(resolveFoundation(full)).toMatchObject({ say: full.say, metAt: full.metAt, background: full.background });
		expect(resolveFoundation({ ...plain, say: undefined, metAt: undefined })).toMatchObject({ say: '', metAt: '' });
	});
});
