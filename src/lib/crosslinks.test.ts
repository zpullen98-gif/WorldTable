import { describe, it, expect } from 'vitest';
import lexicon from './data/lexicon.json';
import overrides from './data/overrides.json';
import knownBad from './known-bad-crosslinks.json';

/**
 * The cross-links, held to their hand reads.
 *
 * The scorer shipped 1,148 links and a 117-link stratified hand read put the
 * defective population at ~510 - a restaurant-finance term on capital stacks
 * linked to Crepes via "Stack under a towel"; a cocktail template linked to
 * Pad Thai via "equally sweet, sour, salty". The fix is a justification rule
 * in tools/derive/crosslinks.mjs plus a reasoned override table, and BOTH ends
 * are pinned here: the ledger of hand-read coincidences must never ship again,
 * and the pins that survived a human read must not quietly vanish.
 *
 * This binds under `npm test` even when build:data never ran - the build gates
 * check the generator, this checks the shipped JSON.
 */
const entries = lexicon as unknown as Array<{ slug: string; recipes?: string[] }>;
const linkSet = new Set(entries.flatMap((e) => (e.recipes ?? []).map((r) => `${e.slug}|${r}`)));

describe('the shipped cross-links', () => {
	it('never resurrect a hand-read coincidence', () => {
		const shipped = (knownBad as Array<{ term: string; recipe: string; read: string }>).filter(
			(b) => linkSet.has(`${b.term}|${b.recipe}`)
		);
		expect(shipped.map((b) => b.read)).toEqual([]);
	});

	it('keep every link a human pinned', () => {
		const lex = (overrides as { lexicon?: Record<string, { keep?: string[] }> }).lexicon ?? {};
		const missing: string[] = [];
		for (const [term, ov] of Object.entries(lex)) {
			if (term.startsWith('_')) continue;
			for (const r of ov.keep ?? []) if (!linkSet.has(`${term}|${r}`)) missing.push(`${term} -> ${r}`);
		}
		expect(missing).toEqual([]);
	});

	/** The same floors as the build gate, so `npm test` alone catches a wipe. */
	it('meet the minimums', () => {
		expect(linkSet.size).toBeGreaterThanOrEqual(550);
		expect(entries.filter((e) => e.recipes?.length).length).toBeGreaterThanOrEqual(250);
	});

	/** Double-lock on the safety pair, independent of the sanitation gate. */
	it('leave the safety entries empty', () => {
		for (const slug of [
			'food-safety-the-chef-owners-non-negotiables',
			'health-inspections-and-crisis-management'
		]) {
			const e = entries.find((x) => x.slug === slug);
			expect(e, slug).toBeTruthy();
			expect(e?.recipes ?? []).toEqual([]);
		}
	});
});
