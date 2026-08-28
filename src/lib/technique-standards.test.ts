import { describe, it, expect } from 'vitest';
import {
	TECHNIQUE_STANDARDS,
	TECHNIQUE_GATE_MIN_RECIPES,
	JUDGED_BY_MAX,
	MIN_MARKS,
	MAX_MARKS
} from '../../tools/derive/technique-standards.mjs';
import full from './data/recipes.full.json';
import techniques from './data/techniques.json';
import techniqueStandards from './data/technique-standards.json';

import type { RecipeDetail, TechniqueStandard, StandardMark as Mark } from './types';

/**
 * The technique standards, and the failures the build gate cannot see.
 *
 * `tools/build-data.mjs` gates the authored module in both directions and reads
 * its headline numbers back out of its own doc comment. All of that runs at
 * BUILD time against the source. What it cannot catch is the same mistake
 * standards.test.ts exists for: somebody edits technique-standards.mjs, does not
 * re-run `npm run build:data`, and commits an authored file that disagrees with
 * the shipped JSON. The app reads only the JSON.
 *
 * So these read the SHIPPED data and compare it back to the source — and then
 * check the JOIN, which is the part that is new here. A dish standard is
 * attached to its recipe directly; a technique standard is reached through
 * `judgedBy`, and a join has ways to be wrong that an attachment does not.
 */
const detail = full as unknown as RecipeDetail[];
const shipped = techniqueStandards as unknown as TechniqueStandard[];
const shippedBySlug = new Map(shipped.map((t) => [t.slug, t]));
const techs = techniques as unknown as Array<{ slug: string; label: string; recipes: string[] }>;
const techBySlug = new Map(techs.map((t) => [t.slug, t]));

type Authored = { slug: string; marks: Mark[]; fault: string };
const authored = TECHNIQUE_STANDARDS as Authored[];

describe('the authored technique standards reached the shipped data', () => {
	it('ships every authored standard, and nothing else', () => {
		const src = authored.map((s) => s.slug).sort();
		const out = shipped.map((s) => s.slug).sort();
		expect(out, 'technique-standards.mjs was edited without re-running build:data').toEqual(src);
	});

	it('carries the marks and fault through unchanged', () => {
		for (const s of authored) {
			expect(shippedBySlug.get(s.slug)?.marks).toEqual(s.marks);
			expect(shippedBySlug.get(s.slug)?.fault).toBe(s.fault);
		}
	});

	/**
	 * `recipeCount` is a number the recipe page prints. Numbers that are printed
	 * and not re-derived are how economics.mjs shipped a stale range — so it is
	 * read back out of the technique table rather than trusted.
	 */
	it('states a recipe count that matches the technique table', () => {
		const wrong = shipped
			.filter((s) => s.recipeCount !== techBySlug.get(s.slug)?.recipes.length)
			.map((s) => `${s.slug}: ships ${s.recipeCount}, table has ${techBySlug.get(s.slug)?.recipes.length}`);
		expect(wrong).toEqual([]);
	});

	it('names each technique as the technique table names it', () => {
		const wrong = shipped
			.filter((s) => s.label !== techBySlug.get(s.slug)?.label)
			.map((s) => s.slug);
		expect(wrong).toEqual([]);
	});
});

describe('a technique standard is a checklist, not a method', () => {
	it(`gives every technique ${MIN_MARKS}–${MAX_MARKS} marks`, () => {
		const bad = authored
			.filter((s) => s.marks.length < MIN_MARKS || s.marks.length > MAX_MARKS)
			.map((s) => `${s.slug} (${s.marks.length})`);
		expect(bad).toEqual([]);
	});

	it('states a fault for every technique', () => {
		expect(authored.filter((s) => !s.fault?.trim()).map((s) => s.slug)).toEqual([]);
	});

	it('does not smuggle method in as outcome', () => {
		// Same rule the dish standards are held to: an instruction tells the cook
		// what to DO, when the whole point is to say what to LOOK FOR.
		const instruction = /^(use|add|stir|heat|cook|season|place|remove|whisk|fold|pour|set) /i;
		const offenders: string[] = [];
		for (const s of authored) {
			for (const m of s.marks)
				if (instruction.test(m.text.trim())) offenders.push(`${s.slug}: ${m.text}`);
		}
		expect(offenders).toEqual([]);
	});

	/**
	 * The constraint this file has and standards.mjs does not.
	 *
	 * A technique standard is read beside up to 100 different dishes, so a mark
	 * naming a particular one is wrong for the other 99. The Path of Study's 45
	 * dish names are the cheap provable case — distinctive enough that a hit is
	 * a real hit rather than a common word collision.
	 */
	/**
	 * The same constraint, one level tighter, and the half the module header
	 * states without anything enforcing it: *"a mark that mentions the protein,
	 * the fat, or the pan material has smuggled a dish into a technique and is
	 * wrong for most of them"*.
	 *
	 * The dish-name check above only catches the 45 Path of Study titles. This
	 * catches the far likelier slip — writing `searing` against a steak, or
	 * `sweating` against onions — where no dish is named and the mark is still
	 * false for the ninety-nine other recipes carrying the tag.
	 *
	 * A word is allowed when the TECHNIQUE ITSELF names it: sugar-stages may say
	 * sugar, rubbing-fat-into-flour may say flour, whipping-a-meringue may talk
	 * about whites. Anything else is a dish that got in.
	 */
	it('never names an ingredient or a vessel its own technique does not', () => {
		const VOCAB = [
			'beef', 'pork', 'chicken', 'duck', 'lamb', 'veal', 'bacon', 'steak',
			'salmon', 'prawn', 'prawns', 'shrimp', 'tuna', 'cod',
			'onion', 'onions', 'garlic', 'tomato', 'tomatoes', 'potato', 'potatoes',
			'mushroom', 'mushrooms', 'carrot', 'carrots', 'aubergine', 'eggplant',
			'rice', 'pasta', 'noodle', 'noodles',
			'butter', 'cream', 'cheese', 'wine', 'stock', 'milk', 'honey',
			'wok', 'skillet', 'saucepan', 'griddle', 'plancha'
		];
		const offenders: string[] = [];
		for (const st of authored) {
			const owned = st.slug.replace(/-/g, ' ');
			const text = [...st.marks.map((m) => m.text), st.fault].join(' ').toLowerCase();
			for (const w of VOCAB) {
				if (new RegExp(`\\b${w}\\b`).test(text) && !owned.includes(w)) {
					offenders.push(`${st.slug}: "${w}"`);
				}
			}
		}
		expect(offenders).toEqual([]);
	});

	it('never names a specific dish', () => {
		const dishNames = detail
			.filter((r) => r.standard)
			.map((r) => r.slug.replace(/-/g, ' '))
			.filter((n) => n.length > 8);
		const offenders: string[] = [];
		for (const s of authored) {
			const text = [...s.marks.map((m) => m.text), s.fault].join(' ').toLowerCase();
			for (const n of dishNames) if (text.includes(n)) offenders.push(`${s.slug}: ${n}`);
		}
		expect(offenders).toEqual([]);
	});
});

describe('the reverse gate holds in the shipped data', () => {
	it(`leaves no technique on ${TECHNIQUE_GATE_MIN_RECIPES}+ recipes unassessable`, () => {
		const uncovered = techs
			.filter((t) => t.recipes.length >= TECHNIQUE_GATE_MIN_RECIPES && !shippedBySlug.has(t.slug))
			.map((t) => `${t.slug} (${t.recipes.length})`);
		expect(uncovered, 'a technique crossed the threshold with nothing written').toEqual([]);
	});

	it('writes no standard for a technique the table does not have', () => {
		expect(shipped.filter((s) => !techBySlug.has(s.slug)).map((s) => s.slug)).toEqual([]);
	});
});

describe('the judgedBy join', () => {
	const judged = detail.filter((r) => r.judgedBy);

	it('resolves every slug to a shipped standard', () => {
		const dangling = new Set<string>();
		for (const r of judged) for (const s of r.judgedBy!) if (!shippedBySlug.has(s)) dangling.add(s);
		expect([...dangling]).toEqual([]);
	});

	it('never doubles up with a dish standard', () => {
		expect(detail.filter((r) => r.standard && r.judgedBy).map((r) => r.slug)).toEqual([]);
	});

	it(`carries at most ${JUDGED_BY_MAX}, and never an empty array`, () => {
		const bad = judged
			.filter((r) => r.judgedBy!.length === 0 || r.judgedBy!.length > JUDGED_BY_MAX)
			.map((r) => `${r.slug} (${r.judgedBy!.length})`);
		expect(bad).toEqual([]);
	});

	/**
	 * The ordering claim, which is the whole reason `judgedBy[0]` is the one cook
	 * mode grades against. Most-specific-first means ascending recipe count: the
	 * technique that applies to fewest dishes says most about this one.
	 */
	it('is ordered most-specific-first', () => {
		const misordered: string[] = [];
		for (const r of judged) {
			const counts = r.judgedBy!.map((s) => shippedBySlug.get(s)!.recipeCount);
			for (let i = 1; i < counts.length; i++) {
				if (counts[i] < counts[i - 1]) misordered.push(`${r.slug}: ${counts.join(' -> ')}`);
			}
		}
		expect(misordered).toEqual([]);
	});

	it('never lists the same technique twice for one recipe', () => {
		const dupes = judged
			.filter((r) => new Set(r.judgedBy!).size !== r.judgedBy!.length)
			.map((r) => r.slug);
		expect(dupes).toEqual([]);
	});
});

describe('what this bought, measured against the shipped data', () => {
	it('takes the assessable corpus from 45 to 789 of 970', () => {
		const dish = detail.filter((r) => r.standard).length;
		const byTechnique = detail.filter((r) => r.judgedBy).length;
		expect(dish).toBe(45);
		expect(byTechnique).toBe(744);
		expect(dish + byTechnique).toBe(789);
		expect(detail.length).toBe(970);
	});

	it('does it with 46 pieces of writing', () => {
		expect(shipped.length).toBe(46);
	});

	/**
	 * The honest remainder, asserted so it cannot quietly drift to zero and take
	 * the copy's honesty with it. 181 dishes can still only be recorded as
	 * cooked, and the recipe page renders no block at all for them.
	 *
	 * Split, because the two halves have different futures. 143 carry no
	 * technique tag at all and no threshold will ever reach them; the other 38
	 * exercise only techniques too rare in this corpus to be worth a standard,
	 * and dropping the threshold below 15 is the lever if that ever changes.
	 */
	it('leaves 181 dishes with no standard of any kind', () => {
		const none = detail.filter((r) => !r.standard && !r.judgedBy);
		expect(none.length).toBe(181);
		expect(none.filter((r) => !r.techniques?.length).length).toBe(143);
		expect(none.filter((r) => r.techniques?.length).length).toBe(38);
	});
});
