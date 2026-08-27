import { describe, it, expect } from 'vitest';
import { redact, significantWords, MAX_REDACTED_SHARE, PROMPT_MAX } from '../../tools/derive/drills.mjs';
import drills from './data/drills.json';
import lexicon from './data/lexicon.json';

import type { LexiconEntry } from './types';

/**
 * Prompt redaction — and the leak that only showed up on screen.
 *
 * The build gate checks that no significant word of a term survives in its own
 * prompt. It passed, and the Munster card still gave itself away: it redacted
 * "Munster" and left "the mild American 'muenster'", with Munster in the
 * option list underneath. Exact matching cannot see a near-spelling, and 25 of
 * 186 cards leaked the same way.
 */
const lex = lexicon as unknown as LexiconEntry[];
const cards = (drills as { cards: Array<{ slug: string; term: string; prompt: string }> }).cards;

const fold = (s: string) =>
	s
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase();

/** One edit apart, five characters up — the rule the derivation applies. */
function nearSpelling(a: string, b: string) {
	if (a.length < 5 || b.length < 5) return false;
	if (Math.abs(a.length - b.length) > 1) return false;
	let i = 0,
		j = 0,
		d = 0;
	while (i < a.length && j < b.length) {
		if (a[i] === b[j]) {
			i++;
			j++;
			continue;
		}
		if (++d > 1) return false;
		if (a.length > b.length) i++;
		else if (b.length > a.length) j++;
		else {
			i++;
			j++;
		}
	}
	return d + (a.length - i) + (b.length - j) <= 1;
}

describe('a prompt never contains its own answer', () => {
	it('hides the term itself', () => {
		const r = redact('Riesling is the sommelier’s white.', 'Riesling');
		expect(fold(r.prompt)).not.toContain('riesling');
	});

	it('hides the possessive and the plural', () => {
		const r = redact("Riesling's acid. Rieslings age.", 'Riesling');
		expect(fold(r.prompt)).not.toContain('riesling');
	});

	/** The Munster case, exactly. */
	it('hides a near-spelling that exact matching misses', () => {
		const r = redact("Alsace's washed rind, no relation to American muenster.", 'Munster');
		expect(fold(r.prompt)).not.toContain('muenster');
	});

	it('leaves a genuinely different word alone', () => {
		const r = redact('Served with bread and butter alongside.', 'Munster');
		expect(r.prompt).toContain('butter');
		expect(r.hits).toBe(0);
	});

	it('redacts before it cuts, never after', () => {
		// The answer must not survive in the part that gets clipped away either.
		const long = 'x'.repeat(PROMPT_MAX) + ' Roquefort at the end.';
		const r = redact(long, 'Roquefort');
		expect(fold(r.prompt)).not.toContain('roquefort');
	});
});

describe('every shipped card', () => {
	const bySlug = new Map(lex.map((e) => [e.slug, e]));

	it('leaks no significant word of its own term', () => {
		const leaks: string[] = [];
		for (const c of cards) {
			const prompt = fold(c.prompt);
			for (const w of significantWords(c.term) as string[]) {
				if (new RegExp(`(^|[^a-z0-9])${w}(?![a-z0-9])`).test(prompt)) leaks.push(`${c.term}: ${w}`);
			}
		}
		expect(leaks).toEqual([]);
	});

	it('leaks no near-spelling either', () => {
		const leaks: string[] = [];
		for (const c of cards) {
			const sig = significantWords(c.term) as string[];
			const words = new Set(fold(c.prompt).split(/[^a-z0-9]+/).filter((w) => w.length > 3));
			for (const s of sig) {
				for (const w of words) if (w !== s && nearSpelling(s, w)) leaks.push(`${c.term}: ${w} ~ ${s}`);
			}
		}
		expect(leaks, 'a near-spelling of the answer survives in its own prompt').toEqual([]);
	});

	it('is not redacted into meaninglessness', () => {
		for (const c of cards) {
			const entry = bySlug.get(c.slug);
			if (!entry) continue;
			const { hiddenShare } = redact(entry.definition, c.term);
			expect(hiddenShare, `${c.term} is mostly dashes`).toBeLessThanOrEqual(MAX_REDACTED_SHARE);
		}
	});

	it('still reads as a question', () => {
		for (const c of cards) {
			expect(c.prompt.replace(/——/g, '').trim().length, `${c.term} has no prose left`).toBeGreaterThan(80);
		}
	});
});
