import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * The House's screens on the Table never read, write or infer allergens.
 * The House has no field for one (house-schema.ts, pinned there), and these
 * three components read the House alone, so the word has no business in
 * them at all: the one exception is the fixed eyebrow over a PERSON's
 * service note, which says the word only to say "confirm at lineup". The
 * dish form on /menu carries the same eyebrow, verbatim, and its own
 * allergen boxes stay the Table's row's, untouched.
 *
 * Read from the source, like waste.test.ts: a type cannot stop a template
 * from printing a field, and a grep can.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const EYEBROW = 'Your words. Allergens: confirm at lineup.';
const COMPONENTS = ['MaitreLines.svelte', 'HouseCard.svelte', 'HouseLists.svelte'];
const read = (rel: string) => readFileSync(resolve(HERE, rel), 'utf8');

describe('the House screens and allergens', () => {
	for (const file of COMPONENTS) {
		it(`${file} never names allergens outside the fixed eyebrow`, () => {
			const src = read(file).split(EYEBROW).join('');
			expect(src).not.toMatch(/allerg/i);
		});
		it(`${file} carries no dash of any spelling`, () => {
			const src = read(file);
			expect(src).not.toMatch(new RegExp('\\u2014|\\u2013|&mdash;|&#8212;|&#x2014;', 'i'));
			expect(src).not.toMatch(new RegExp(' ' + '--' + ' '));
		});
	}
	it('the dish form carries the eyebrow verbatim, once, over the service note', () => {
		const src = read('../../routes/menu/+page.svelte');
		expect(src.split(EYEBROW).length - 1).toBe(1);
		expect(src).toMatch(/serviceNote/);
		expect(src).toMatch(/house\.setDishField\(rec\.id, \{ serviceNote/);
	});
	it('the guest page prints the twenty second line only when a person kept it', () => {
		const src = read('../../routes/menu/guest/+page.svelte');
		expect(src).toMatch(/item\.lines\.by !== 'person'/);
	});
});
