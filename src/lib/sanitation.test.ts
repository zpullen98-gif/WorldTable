import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
	ANCHORS,
	CLAUSES,
	FACTS,
	NUMERIC,
	CONFLICT,
	GAPS,
	CF_PAIR,
	readNumbers,
	buildSanitation
} from '../../tools/derive/sanitation.mjs';
import { convertLine } from './scaling';
import sanitationJson from './data/sanitation.json';
import lexiconJson from './data/lexicon.json';
import indexJson from './data/recipes.index.json';

import type { Sanitation, LexiconEntry, RecipeSummary } from './types';

/**
 * Sanitation — and the failures the build gate cannot see.
 *
 * tools/build-data.mjs already refuses a drifted number, a missing clause, a
 * filled gap and a crosslink on a safety entry. All of that runs at BUILD time
 * against the authored module. What it cannot catch is the likelier mistake:
 * somebody edits sanitation.mjs, does not re-run `npm run build:data`, and
 * commits a source file that disagrees with the shipped JSON. The app reads
 * only the JSON.
 *
 * Same shape as palate.test.ts, for the same reason — plus three assertions
 * this feature needs and the others do not: that the unit converter would
 * MANGLE a safety string (so the exemption is load-bearing rather than
 * decorative), that the page does not import the converter, and that nothing
 * shipped names a recipe.
 */
const shipped = sanitationJson as unknown as Sanitation;
const lex = lexiconJson as unknown as LexiconEntry[];
const recipes = indexJson as unknown as RecipeSummary[];
const bySlug = new Map(lex.map((e) => [e.slug, e]));

describe('the authored module reached the shipped data', () => {
	it('ships the clause keys in the authored order', () => {
		expect(shipped.clauses.map((c) => c.key)).toEqual(
			CLAUSES.map((c: { key: string }) => c.key)
		);
	});

	it('ships every authored fact, in order', () => {
		expect(shipped.facts.map((f) => f.key)).toEqual(FACTS.map((f: { key: string }) => f.key));
		for (const f of FACTS) {
			const ship = shipped.facts.find((x) => x.key === f.key)!;
			expect(ship.evidence, `${f.key} evidence drifted`).toBe(f.evidence);
		}
	});

	it('ships every authored number, in order', () => {
		expect(shipped.numeric.map((n) => n.key)).toEqual(NUMERIC.map((n: { key: string }) => n.key));
		for (const n of NUMERIC) {
			const ship = shipped.numeric.find((x) => x.key === n.key)!;
			expect(ship.numbers).toEqual(n.numbers);
		}
	});

	it('ships every authored gap, in order', () => {
		expect(shipped.gaps.map((g) => g.key)).toEqual(GAPS.map((g: { key: string }) => g.key));
	});

	it('quotes the entries as they are shipped today, not as they once were', () => {
		for (const [key, slug] of Object.entries(ANCHORS)) {
			const live = bySlug.get(slug as string);
			expect(live, `anchor ${key} -> ${slug} does not resolve`).toBeDefined();
			if (shipped.entries[key]) {
				expect(shipped.entries[key].definition).toBe(live!.definition);
			}
		}
	});

	it('rebuilding from the shipped lexicon reports no problems', () => {
		const { problems } = buildSanitation(lex, recipes.map((r) => r.slug));
		expect(problems).toEqual([]);
	});
});

describe('reading numbers out of the guide', () => {
	/**
	 * The reason this module does not reuse economics.mjs's helper. That one
	 * splits on runs of non-digits, which is correct for its integer
	 * percentages and silently wrong here.
	 */
	it('keeps decimals that economics.mjs would split apart', () => {
		expect(readNumbers('4.5–54.5°C')).toEqual([4.5, 54.5]);
		expect('4.5–54.5°C'.split(/[^0-9]+/).filter(Boolean).map(Number)).toEqual([4, 5, 54, 5]);
	});

	it('reads each shipped number back out of its own evidence', () => {
		for (const n of shipped.numeric) {
			expect(readNumbers(n.evidence), `${n.key} does not read back`).toEqual(n.numbers);
		}
	});

	it('carries both danger windows, and they differ', () => {
		expect(shipped.conflict).not.toBeNull();
		expect(shipped.conflict!.a.numbers).not.toEqual(shipped.conflict!.b.numbers);
		expect(CONFLICT.b.numbers).toEqual([4.5, 54.5]);
	});
});

describe('the safety copy is exempt from the unit converter', () => {
	/**
	 * The exemption is load-bearing, not decorative. Proven by showing the
	 * converter WOULD mutate the string: it matches "60°C" and rewrites it,
	 * turning "4–60°C (40–140°F)" into a sentence with two different Fahrenheit
	 * ranges in it.
	 */
	it('the converter would mangle the danger zone if it were let near it', () => {
		const dangerZone = shipped.numeric.find((n) => n.key === 'dangerZone')!;
		expect(convertLine(dangerZone.evidence, 'us')).not.toBe(dangerZone.evidence);
	});

	it("the guide's own C/F pair does not agree with the converter", () => {
		expect(Math.round((CF_PAIR.lowC * 9) / 5 + 32)).toBe(39);
		expect(CF_PAIR.lowF).toBe(40);
		expect(shipped.cf.disagrees).toBe(true);
	});

	it('the page imports neither the converter nor the session store', () => {
		const src = readFileSync('src/routes/safety/+page.svelte', 'utf8');
		// Anchored to a real import STATEMENT. The page's own header comment says
		// in prose that it does not import these, and an unanchored search matched
		// that sentence — a test that fails on the documentation of the rule it
		// checks is worse than no test at all.
		expect(src).not.toMatch(/^\s*import[^\n]*convertLine/m);
		expect(src).not.toMatch(/^\s*import[^\n]*renderLine/m);
		expect(src).not.toMatch(/^\s*import[^\n]*session/m);
	});

	it('the page does not print', () => {
		const src = readFileSync('src/routes/safety/+page.svelte', 'utf8');
		expect(src).toContain('data-print="hide"');
	});
});

describe('the refusals stay refused', () => {
	/**
	 * All five per-recipe hazard rules were measured unshippable. This walks the
	 * shipped object and fails if anything in it names a recipe — the gate that
	 * keeps the refusal in force after everyone who read the measurements has
	 * moved on.
	 */
	it('nothing shipped names a recipe', () => {
		const slugs = new Set(recipes.map((r) => r.slug));
		const found: string[] = [];
		const walk = (node: unknown, path: string) => {
			if (typeof node === 'string') {
				if (slugs.has(node)) found.push(`${path} = ${node}`);
				return;
			}
			if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`));
			if (node && typeof node === 'object') {
				for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
			}
		};
		walk(shipped, '');
		expect(found).toEqual([]);
	});

	it('carries no field named for recipes or hazards', () => {
		const banned = ['recipes', 'slugs', 'flags', 'hazards'];
		const seen: string[] = [];
		const walk = (node: unknown) => {
			if (Array.isArray(node)) return node.forEach(walk);
			if (node && typeof node === 'object') {
				for (const [k, v] of Object.entries(node)) {
					if (banned.includes(k)) seen.push(k);
					walk(v);
				}
			}
		};
		walk(shipped);
		expect(seen).toEqual([]);
	});

	it('the two safety entries reach no recipes at all', () => {
		for (const slug of [ANCHORS.safety, ANCHORS.inspections]) {
			expect(bySlug.get(slug as string)!.recipes, `${slug} regained crosslinks`).toEqual([]);
		}
	});
});

describe("the guide's silences are load-bearing", () => {
	it('every gap still names something the guide actually says', () => {
		for (const g of GAPS) {
			const entry = bySlug.get(ANCHORS[g.namedAnchor as keyof typeof ANCHORS] as string)!;
			expect(entry.definition, `${g.key}: the guide no longer names this`).toContain(g.named);
		}
	});

	/**
	 * The half that matters. If a token a gap declares absent ever appears, the
	 * gap has been quietly filled — which for this subject means invented
	 * regulatory content shipped as though it were the guide's.
	 */
	it('every absent token is still absent from the whole lexicon', () => {
		const offenders: string[] = [];
		for (const g of GAPS) {
			for (const token of g.absent as string[]) {
				const allowed = g.except && g.except.token === token ? g.except.slug : null;
				for (const e of lex) {
					if (e.slug === allowed) continue;
					if (e.definition.toLowerCase().includes(token.toLowerCase())) {
						offenders.push(`${g.key}: "${token}" now appears in ${e.slug}`);
					}
				}
			}
		}
		expect(offenders).toEqual([]);
	});

	it('a declared exception is still real — the allowance is not stale', () => {
		for (const g of GAPS) {
			if (!g.except) continue;
			const holder = bySlug.get(g.except.slug);
			expect(holder, `${g.key} allows a token in a slug that no longer exists`).toBeDefined();
			expect(holder!.definition.toLowerCase()).toContain(g.except.token.toLowerCase());
		}
	});
});
