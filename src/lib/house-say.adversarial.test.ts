import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gradeGuest, guestDeck } from './house-say';
import { ALLERGEN_TALK } from './house/house-validate';
import type { House } from './house/house-schema';

/**
 * Guest at the table is a new grading screen, and every new grading screen
 * leaves allergens to the kitchen. A guest who speaks of an allergy is the
 * kitchen's to answer at lineup: the deck never seats one, so no answer is
 * ever graded Missed for leaving out which dishes list shellfish or nuts,
 * and no grade note recites an allergen's dishes back.
 */

const here = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));
const brennans = () =>
	(JSON.parse(readFileSync(here('../../static/shared/packs/brennans-new-orleans.v1.oothouse.json'), 'utf8')) as { house: House }).house;

const DISH_BY_ALLERGEN = /\blists?\b[^.]*\b(shellfish|tree nuts?|nuts|gluten|dairy|peanuts?)\b/i;

describe('Guest at the table leaves allergens to the kitchen', () => {
	it('never deals a guest who speaks of an allergy', () => {
		const h = brennans();
		const seated = guestDeck(h).filter((c) => ALLERGEN_TALK.test(c.title) || ALLERGEN_TALK.test(c.guest));
		expect(seated.map((c) => c.title)).toEqual([]);
	});

	it('no grade note recites which dishes carry an allergen', () => {
		const h = brennans();
		const bad: string[] = [];
		for (const card of guestDeck(h)) {
			const g = gradeGuest(h, card, 'Let me check with the kitchen.');
			for (const n of g?.notes ?? []) if (DISH_BY_ALLERGEN.test(n)) bad.push(card.title + ': ' + n.slice(0, 80));
		}
		expect(bad).toEqual([]);
	});
});
