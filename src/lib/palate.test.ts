import { describe, it, expect } from 'vitest';
import { FAULTS, META_RULE, REPAIR_ANCHOR, PROTOCOL_ANCHOR, parseRepairTable, buildPalate } from '../../tools/derive/palate.mjs';
import palate from './data/palate.json';
import lexicon from './data/lexicon.json';

import type { Palate, LexiconEntry } from './types';

/**
 * The palate — and the failure the build gate cannot see.
 *
 * `tools/build-data.mjs` already refuses a fault the Repair Table no longer
 * states, a lever whose evidence has vanished from its clause, and a clause the
 * guide states that nothing carries. All of that runs at BUILD time against the
 * authored module. What it cannot catch is the likelier mistake: somebody edits
 * palate.mjs, does not re-run `npm run build:data`, and commits a source file
 * that disagrees with the shipped JSON. The app reads only the JSON.
 *
 * So these assertions read the SHIPPED data and compare it back to the source —
 * the same shape as standards.test.ts, for the same reason.
 */
const shipped = palate as unknown as Palate;
const lex = lexicon as unknown as LexiconEntry[];

describe('the authored palate reached the shipped data', () => {
	it('ships exactly the authored faults, in the authored order', () => {
		expect(shipped.faults.map((f) => f.slug)).toEqual(
			FAULTS.map((f: { slug: string }) => f.slug)
		);
	});

	it('carries every lever, in order of gentleness', () => {
		for (const authored of FAULTS) {
			const ship = shipped.faults.find((f) => f.slug === authored.slug);
			expect(ship, `${authored.slug} is missing from palate.json`).toBeDefined();
			expect(ship!.levers.map((l) => l.move)).toEqual(
				authored.levers.map((l: { move: string }) => l.move)
			);
		}
	});

	it('carries the meta-rule verbatim', () => {
		expect(shipped.metaRule).toBe(META_RULE);
	});

	it('anchors to two lexicon entries that exist', () => {
		const slugs = new Set(lex.map((e) => e.slug));
		expect(slugs.has(REPAIR_ANCHOR)).toBe(true);
		expect(slugs.has(PROTOCOL_ANCHOR)).toBe(true);
		expect(shipped.repair.slug).toBe(REPAIR_ANCHOR);
		expect(shipped.protocol.slug).toBe(PROTOCOL_ANCHOR);
	});

	it('quotes the entries as they are shipped, not as they once were', () => {
		const repair = lex.find((e) => e.slug === REPAIR_ANCHOR)!;
		const protocol = lex.find((e) => e.slug === PROTOCOL_ANCHOR)!;
		expect(shipped.repair.definition).toBe(repair.definition);
		expect(shipped.protocol.definition).toBe(protocol.definition);
	});
});

describe('the structure is a true claim about the guide’s prose', () => {
	const clauses = parseRepairTable(shipped.repair.definition);

	it('finds one labelled clause per fault and nothing else', () => {
		expect([...clauses.keys()].sort()).toEqual(
			FAULTS.map((f: { key: string }) => f.key).sort()
		);
	});

	it('every lever’s evidence still appears in its own fault’s clause', () => {
		const drifted: string[] = [];
		for (const f of FAULTS) {
			const clause = (clauses.get(f.key) ?? '').toLowerCase();
			for (const lever of f.levers) {
				if (!clause.includes(lever.token)) drifted.push(`${f.key}/${lever.move}`);
			}
		}
		expect(drifted, 'a lever is filed under a fault the prose does not support').toEqual([]);
	});

	/**
	 * This used to compute exactly the predicate above it with the variables
	 * renamed - "no lever is satisfied by the wrong fault's clause alone" read
	 * as a cross-clause check but was proven, by evidence appearing in its OWN
	 * clause, which is precisely what the test above it already established.
	 * 500 randomised token mutations produced identical output on both; adding
	 * a `{move:'Salt', token:'salt'}` lever to TOO SALTY - an instruction to
	 * salt an already-too-salty dish - left both green.
	 *
	 * The real property, matching what palate.mjs's build gate now checks: a
	 * lever must not name the very fault it is meant to cure. Token SHARING
	 * across faults is not itself wrong - "acid" legitimately cures both TOO
	 * SWEET and TOO SPICY - so this does not assert exclusivity, only that a
	 * fault's own descriptor never appears among its own remedies.
	 */
	it('no lever cures its own fault by naming it', () => {
		const selfNamed: string[] = [];
		for (const f of FAULTS) {
			for (const lever of f.levers) {
				if (lever.token.includes(f.slug) || f.slug.includes(lever.token)) {
					selfNamed.push(`${f.key}/${lever.move}`);
				}
			}
		}
		expect(selfNamed).toEqual([]);
	});

	it('rebuilding from the shipped lexicon reports no problems', () => {
		const { problems } = buildPalate(lex);
		expect(problems).toEqual([]);
	});
});

describe('the faults are usable at the pass', () => {
	it('every fault states a symptom and at least one lever', () => {
		for (const f of shipped.faults) {
			expect(f.symptom.length, `${f.slug} has no symptom`).toBeGreaterThan(20);
			expect(f.levers.length, `${f.slug} has no levers`).toBeGreaterThan(0);
		}
	});

	it('no lever repeats a move within one fault', () => {
		for (const f of shipped.faults) {
			const moves = f.levers.map((l) => l.move);
			expect(new Set(moves).size, `${f.slug} lists a move twice`).toBe(moves.length);
		}
	});
});
