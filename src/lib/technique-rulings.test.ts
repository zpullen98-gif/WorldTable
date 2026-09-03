import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import full from './data/recipes.full.json';
import overrides from './data/overrides.json';

type Recipe = { slug: string; techniques: string[]; steps: Array<{ text: string }>; note?: string };
const R = full as unknown as Recipe[];
const bySlug = new Map(R.map((r) => [r.slug, r]));
const carriers = (label: string) => R.filter((r) => r.techniques.includes(label)).map((r) => r.slug);

describe('two keywords that read the wrong sense every time', () => {
	/**
	 * 'then slice' and 'shingle' put seven tags on 'Resting meat & slicing
	 * against the grain', and not one phrase teaches resting or grain direction:
	 * salsa criolla slices ONIONS, negiyaki slices spring onion, goya chanpuru
	 * slices bitter melon, gesiers slices gizzards over leaves, laplap says the
	 * taro "will then slice instead of slumping", pan de jamon shingles HAM onto
	 * dough, and tafelspitz's is a serving line.
	 *
	 * A keyword earns deletion by being wrong in EVERY instance. The contrast
	 * case, measured and deliberately kept: 'sear' is 1 false positive in 67.
	 */
	it('no longer tags a dish that only slices a vegetable', () => {
		const LABEL = 'Resting meat & slicing against the grain';
		for (const slug of [
			'salsa-criolla',
			'negiyaki',
			'goya-chanpuru',
			'pan-de-jamon',
			'laplap-with-chicken',
			'gesiers-de-canard-confits',
			'tafelspitz'
		]) {
			expect(bySlug.get(slug)?.techniques, slug).not.toContain(LABEL);
		}
	});

	it('keeps the label on the meat it belongs to', () => {
		const n = carriers('Resting meat & slicing against the grain').length;
		// 63 before the deletion, 56 after: exactly the seven, and nothing else.
		expect(n).toBe(56);
	});

	it('leaves the keywords that are sound', () => {
		const table = readFileSync(join(process.cwd(), 'tools', 'derive', 'technique-table.mjs'), 'utf8');
		// The KEYWORD ARRAY, not the whole file: the deleted words are still
		// named in the comment above it, which is where they belong.
		const entry = table.slice(0, table.indexOf("l: 'Resting meat & slicing against the grain'"));
		const kw = entry.slice(entry.lastIndexOf('k: ['));
		expect(kw).toContain("'across the grain'");
		expect(kw).toContain("'against the grain'");
		expect(kw).not.toContain("'then slice'");
		expect(kw).not.toContain("'shingle'");
	});
});

describe('an override states a ruling, not a frozen list', () => {
	/**
	 * `ov.techniques` REPLACES the derived array, so a row using it freezes that
	 * recipe against every later widening. Both pudding rows used the array form
	 * to remove one wrong label, and froze two more wrong ones in with it.
	 */
	it('states the two pudding rulings subtractively', () => {
		const rows = (overrides as { recipes: Record<string, Record<string, unknown>> }).recipes;
		for (const slug of ['christmas-pudding', 'steak-and-kidney-pudding']) {
			expect(rows[slug].techniques, slug).toBeUndefined();
			expect(rows[slug].techniquesDrop, slug).toContain('Pleating dumplings');
		}
	});

	it('drops the two tags the frozen form was hiding', () => {
		// "serve with brandy butter or custard" is a serving suggestion; the
		// recipe never makes a custard.
		expect(bySlug.get('christmas-pudding')?.techniques).not.toContain('Tempering a custard');
		// "soak the kidney in cold salted water" is drawing blood out of offal,
		// not testing gnocchi for buoyancy.
		expect(bySlug.get('steak-and-kidney-pudding')?.techniques).not.toContain(
			'Salted water & the float test'
		);
	});

	/**
	 * The survey said unfreezing would let christmas-pudding reach Flambé. It
	 * would not have: Flambé matched only the phrase 'tilt to ignite'. The label
	 * needed a keyword, and 'blue flames' is one hit with no false positives.
	 *
	 * NOT the bare verb 'ignite', which is three and one of them argues AGAINST
	 * flame: txuleta a la brasa says "dripping fat that ignites lays down soot
	 * rather than smoke".
	 */
	it('reaches Flambé by a keyword, which is what was actually missing', () => {
		expect(bySlug.get('christmas-pudding')?.techniques).toContain('Flambé');
		expect(bySlug.get('txuleta-a-la-brasa')?.techniques).not.toContain('Flambé');
		expect(carriers('Flambé').sort()).toEqual(
			['bananas-foster', 'christmas-pudding', 'flambe-pan-sauce-brandy-and-green-peppercorn', 'garides-saganaki'].sort()
		);
	});

	/** And the rest of each pudding's derivation is live again. */
	it('leaves the rulings surgical', () => {
		expect(bySlug.get('christmas-pudding')?.techniques).toContain('Steaming: basket, leaf and lid');
		expect(bySlug.get('steak-and-kidney-pudding')?.techniques).toContain('Searing: the hard crust');
	});
});
