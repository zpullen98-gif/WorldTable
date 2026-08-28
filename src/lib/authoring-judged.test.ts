import { describe, it, expect } from 'vitest';
import {
	resolveJudgedBy,
	FAMILY_TECHNIQUE_MAX,
	FAMILY_JUDGED_BY_MAX
} from './authoring';
import { JUDGED_BY_MAX } from '../../tools/derive/technique-standards.mjs';
import techniqueStandards from './data/technique-standards.json';
import techniques from './data/techniques.json';
import indexJson from './data/recipes.index.json';
import { familySlug } from './authoring';

import type { TechniqueStandard, RecipeSummary } from './types';

/**
 * Making the venue's own dishes assessable.
 *
 * A gastropub paying $49.99 a month could only assess its staff on somebody
 * else's coq au vin: `authoring.ts` set `techniques: []` on every family recipe,
 * so a house dish never resolved `judgedBy`, `/family/[slug]` passed no `judged`
 * prop, and cook mode skipped grading entirely — the ladder in repertoire.ts
 * climbed on pure attendance for every dish the venue actually cooks.
 */
const standards = techniqueStandards as unknown as TechniqueStandard[];
const bySlug = new Map(standards.map((s) => [s.slug, s]));

describe('resolveJudgedBy applies the same rule the build does', () => {
	it('keeps the cap in step with the one build-data.mjs uses', () => {
		expect(FAMILY_JUDGED_BY_MAX, 'the house rule drifted from the build rule').toBe(JUDGED_BY_MAX);
	});

	it('lets an author describe more than the app will show', () => {
		expect(FAMILY_TECHNIQUE_MAX).toBeGreaterThan(FAMILY_JUDGED_BY_MAX);
	});

	it('orders rarest-first, because the rare technique says most about the dish', () => {
		const searing = bySlug.get('searing-the-hard-crust')!;
		const roux = bySlug.get('making-a-roux')!;
		expect(searing.recipeCount).toBeGreaterThan(roux.recipeCount);
		expect(resolveJudgedBy([searing.slug, roux.slug], standards)).toEqual([
			roux.slug,
			searing.slug
		]);
	});

	it(`never returns more than ${FAMILY_JUDGED_BY_MAX}`, () => {
		const four = standards.slice(0, 4).map((s) => s.slug);
		expect(resolveJudgedBy(four, standards)).toHaveLength(FAMILY_JUDGED_BY_MAX);
	});

	it('drops a tick that names no written standard', () => {
		expect(resolveJudgedBy(['not-a-technique'], standards)).toEqual([]);
		expect(resolveJudgedBy(['not-a-technique', 'braising'], standards)).toEqual(['braising']);
	});

	it('de-duplicates rather than judging a dish twice on one technique', () => {
		expect(resolveJudgedBy(['braising', 'braising'], standards)).toEqual(['braising']);
	});

	it('returns nothing for an author who ticked nothing', () => {
		expect(resolveJudgedBy([], standards)).toEqual([]);
	});
});

describe('a self-declared tick can never credit a station', () => {
	/**
	 * THE SAFETY PROPERTY, and it is structural rather than a convention.
	 *
	 * On a shared tablet the author of a recipe and its cook are the same
	 * person, so a ticked box would BE self-credited station coverage if the
	 * board read it. It cannot: /coverage builds `recipesByTechnique` from
	 * techniques.json — the audited, both-directions-gated derived table — and
	 * `techniquesTouched` looks cooks up by slug WITHIN those lists. No family
	 * slug appears in one, so no amount of ticking reaches the board.
	 *
	 * stations.mjs refuses by name to credit work never done — it gates "The
	 * soufflé" on its exact recipe list so a manager cannot believe their pastry
	 * cook was tested on the most collapse-prone item in the repertoire. This
	 * asserts the same refusal holds for house dishes.
	 */
	const techs = techniques as unknown as Array<{ label: string; recipes: string[] }>;

	/**
	 * The chain, in two links, neither of them vacuous.
	 *
	 * A first draft of this test looked for slugs starting "fam-" and would have
	 * passed against any codebase at all: family recipes are identified by
	 * `source === 'family'`, not by a prefix. The real property is that
	 * familySlug() REFUSES to mint a slug the guide already holds.
	 */
	it('mints a family slug that no guide recipe has', () => {
		const guide = (indexJson as unknown as RecipeSummary[])[0];
		const minted = familySlug(guide.name, []);
		expect(minted).not.toBe(guide.slug);
		expect(minted).toBe(`${guide.slug}-family`);
	});

	it('the coverage table names only guide slugs, so a minted one can never be in it', () => {
		const guideSlugs = new Set((indexJson as unknown as RecipeSummary[]).map((r) => r.slug));
		const referenced = new Set(techs.flatMap((t) => t.recipes));
		const foreign = [...referenced].filter((slug) => !guideSlugs.has(slug));
		expect(foreign, 'the coverage table references something outside the guide').toEqual([]);
	});

	it('every technique the board can credit is backed by a real recipe list', () => {
		const empty = techs.filter((t) => !t.recipes.length).map((t) => t.label);
		expect(empty).toEqual([]);
	});
});
