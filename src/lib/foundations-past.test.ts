import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { foundationsEntries } from '$lib/foundations';
import { isPast } from '$lib/house/house-schema';

/**
 * At the table is the line a captain says to a guest tonight. Once a menu is
 * filed past (the Thanksgiving Day menu of 26 November 2026, in the
 * November 28 edition), a line that tells of its dishes in the present would
 * sell a guest a dish the kitchen no longer makes: "Ours are filled with sweet
 * potato", "On the crudo it adds a deep, earthy note".
 *
 * The rule, clause by clause (a sentence, a part after a semicolon, or a part
 * after ", and"): a clause that names a past dish of the shipped pack, or
 * speaks of the house (our, ours, we) without naming a dish still served,
 * or speaks of a past dish by the word its name ends on ("the crudo"), says so
 * in the past tense. A clause about the term itself ("Radish adds crunch")
 * names no dish and stands in the present.
 */
const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const house = JSON.parse(readFileSync(join(ROOT, 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json'), 'utf8')).house;
const short = (name: string) => name.replace(/^(World Famous|Classic)\s+/i, '').toLowerCase();
const dishes: Array<{ name: string; section: string }> = house.dishes;
const served = dishes.filter((d) => !isPast(d)).map((d) => short(d.name));
const gone = dishes.filter((d) => isPast(d)).map((d) => short(d.name));
const last = (n: string) => n.split(/\s+/).pop()!;
/* The word a dish is called by at the table ("the crudo", "the gumbo"), never a word as broad as "sauce".
 * A word a past dish and a served one share (the crudo, the tart) counts as past: the line has to say which. */
const BROAD = ['sauce'];
const goneWords = [...new Set(gone.map(last))].filter((w) => w.length > 3 && !BROAD.includes(w));
const servedWords = [...new Set(served.map(last))].filter((w) => w.length > 3 && !goneWords.includes(w));
/* Served at the house beyond its dishes' names: the soup, the bananas, the courtyard, the table itself. */
const HOUSE_SERVED = ['soup', 'bananas', 'courtyard', 'your table'];
const PAST = /\b(was|were|came|went|sat|had|served|used|carried|took|glazed|dressed|did|baked|gave|added|brought|set|cut|rounded|soaked|brightened|balanced|stayed)\b/i;
const has = (text: string, words: string[]) => words.some((w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text));

/** The clauses of a guest line that tell of a past dish in the present. metAt says
 * whether the entry was met at a past menu: only then does "the crudo" or "our" point at it. */
function present(guest: string, term = '', metAtPast = true): string[] {
	const out: string[] = [];
	const sentences = guest.split(/(?<=[.!?])\s+/).filter(Boolean);
	sentences.forEach((sentence, i) => {
		const before = (sentences[i - 1] ?? '').toLowerCase();
		for (const c of sentence.split(/;\s*|,\s+and\s+(?=the |our |it |they )/).filter(Boolean)) {
			if (PAST.test(c)) continue;
			const l = c.toLowerCase();
			const namesGone = gone.some((n) => n !== term.toLowerCase() && has(l, [n])) || (metAtPast && goneWords.some((w) => has(l, ['the ' + w])));
			const context = before + ' ' + l;
			/* A served dish by its name, or by its word as the line points at it: "our gumbo", "our Southern grits", a line that opens "Gumbo is". */
			const pointsAt = (w: string) => new RegExp(`\\bour (\\w+ )?${w}\\b`).test(context) || before.startsWith(w);
			const namesServed = has(context, served) || has(context, HOUSE_SERVED) || servedWords.some(pointsAt);
			if (namesGone || (metAtPast && /\b(our|ours|we)\b/.test(l) && !namesServed)) out.push(c);
		}
	});
	return out;
}

describe('the Fieldbook after a menu is filed past', () => {
	it('the shipped pack holds past dishes, so the rule has something to hold', () => {
		expect(gone.length).toBeGreaterThan(0);
		expect(gone).toContain('bay scallop crudo');
		expect(goneWords).toContain('crudo');
	});

	it('the rule catches a line that sells a past dish in the present, and passes the same line told in the past', () => {
		expect(present('Ours are filled with sweet potato and finished in brown butter.')).toHaveLength(1);
		expect(present('On the crudo it adds a deep, earthy note against the sweet raw scallops.')).toHaveLength(1);
		expect(present('Here they are candied, sweet and crunchy, on the sweet potato agnolotti.')).toHaveLength(1);
		expect(present('On Thanksgiving Day ours were filled with sweet potato.')).toHaveLength(0);
		expect(present('In our gumbo it gives a savory, smoky backbone.')).toHaveLength(0);
		expect(present('Radish adds crunch and a gentle peppery bite.')).toHaveLength(0);
	});

	it('no At the table line tells of a past dish in the present', () => {
		const wrong = foundationsEntries.flatMap((e) => {
			const metAtPast = has((e.metAt ?? '').toLowerCase(), gone);
			return present(e.guest ?? '', e.term, metAtPast).map((c) => `${e.id}: ${c}`);
		});
		expect(wrong).toEqual([]);
	});
});
