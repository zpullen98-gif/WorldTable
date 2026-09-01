import { describe, it, expect } from 'vitest';
import { advanceWait, QUICK_MINUTES, ADVANCE_MIN } from '../../tools/derive/advance.mjs';
import { matches } from './filter';
import { DEFAULT_FILTERS } from './types';
import type { RecipeSummary } from './types';
import index from './data/recipes.index.json';

/**
 * Advance time: what a cook has to plan around.
 *
 * "Under 40 min" filtered on `minutes`, which is ACTIVE minutes by contract, so
 * it answered with Guanciale (30 minutes of work, five weeks hanging),
 * Preserved Lemons and Sauerkraut. 109 dishes passed on the active number
 * alone. Every case below is a real corpus line.
 */

const step = (text: string) => ({ text });

describe('reading a wait out of a method', () => {
	it('finds the units the service split was never taught', () => {
		// service.mjs stops at hours and caps at 600 minutes, deliberately.
		expect(advanceWait([step('Give it 3 to 5 weeks, until it has lost 30% of its weight')]).advanceMin)
			.toBe(5 * 10080);
		expect(advanceWait([step('Seal and leave a month at room temperature')]).advanceMin).toBe(43200);
		expect(advanceWait([step('Ferment at 18 to 22C for 2 to 4 weeks')]).advanceMin).toBe(4 * 10080);
	});

	it('plans for the top of a range, which is what a cook has to book', () => {
		expect(advanceWait([step('Leave at room temperature 7 to 10 days')]).advanceMin).toBe(10 * 1440);
	});

	it('reads overnight as twelve hours, since the method never says a number', () => {
		const a = advanceWait([step('Cover and refrigerate overnight')]);
		expect(a.advanceMin).toBe(720);
		expect(a.advancePhrase).toBe('overnight');
	});

	it('quotes the method rather than paraphrasing it', () => {
		expect(advanceWait([step('Give it 3 to 5 weeks to hang')]).advancePhrase).toBe('3 to 5 weeks');
	});
});

describe('waiting is not keeping', () => {
	it('ignores shelf life, which is the same words about a different thing', () => {
		expect(advanceWait([step('Keeps two weeks refrigerated')]).advanceMin).toBe(0);
		expect(advanceWait([step('Refrigerate up to 6 months')]).advanceMin).toBe(0);
		expect(advanceWait([step('It holds three weeks in the fridge')]).advanceMin).toBe(0);
		expect(advanceWait([step('Eat from 30 minutes, gone by two weeks')]).advanceMin).toBe(0);
	});

	it('ignores an opinion about when it is nicer', () => {
		expect(advanceWait([step('it is better after a week in the fridge')]).advanceMin).toBe(0);
		expect(advanceWait([step('improves for three days')]).advanceMin).toBe(0);
	});

	it('still reads a cure that names the same appliance', () => {
		/* The cue has to be the verb of keeping, never the fridge: this is
		   Guanciale's cure and "keeps two weeks refrigerated" is not, and both
		   sentences say the fridge. */
		expect(advanceWait([step('Rub the cure in, seal, and refrigerate 7 days at 4C')]).advanceMin)
			.toBe(7 * 1440);
	});

	it('does not read the age of an ingredient as a wait', () => {
		// "toast only if they are a day old" is about a bought bagel.
		expect(advanceWait([step('Toast only if they are a day old')]).advanceMin).toBe(0);
	});

	it('takes the real wait even when a longer shelf life is stated too', () => {
		/* Shio Koji states both, and the longer number is the meaningless one. */
		const a = advanceWait([
			step('Leave at room temperature 7 to 10 days, stirring daily'),
			step('Refrigerate up to 6 months')
		]);
		expect(a.advanceMin).toBe(10 * 1440);
		expect(a.advancePhrase).toBe('7 to 10 days');
	});
});

describe('what "Under 40 min" now answers', () => {
	const rows = index as unknown as RecipeSummary[];
	const quick = { ...DEFAULT_FILTERS, quick: true };
	const named = (name: string) => rows.find((r) => r.name === name)!;

	it('drops the dishes that need a cure, however little work they are', () => {
		for (const name of [
			'Guanciale',
			'Preserved Lemons',
			'Sauerkraut, the Two Ingredient Ferment',
			'Gravlax, the Cure by Weight'
		]) {
			const r = named(name);
			expect(r.minutes, `${name} is still short on active work`).toBeLessThanOrEqual(QUICK_MINUTES);
			expect(matches(r, quick), `${name} must not answer "Under 40 min"`).toBe(false);
		}
	});

	it('keeps the dishes that really are quick', () => {
		for (const name of ['Cacio e Pepe', 'Quick Pickled Red Onions']) {
			const r = named(name);
			expect(matches(r, quick), `${name} must still answer "Under 40 min"`).toBe(true);
		}
	});

	it('leaves `minutes` alone: it still means active work', () => {
		// The fix is a second field, not a redefinition of the first one.
		expect(named('Guanciale').minutes).toBe(30);
		expect(named('Preserved Lemons').minutes).toBe(20);
	});

	it('every dish it drops can say why, in the method’s own words', () => {
		const dropped = rows.filter(
			(r) => r.minutes <= QUICK_MINUTES && (r.advanceMin ?? 0) >= ADVANCE_MIN
		);
		expect(dropped.length).toBeGreaterThan(50);
		for (const r of dropped) expect(r.advancePhrase, `${r.name} has no phrase`).toBeTruthy();
	});

	it('carries the field only where there is a wait, so the index stays lean', () => {
		const withField = rows.filter((r) => r.advanceMin !== undefined);
		expect(withField.length).toBeLessThan(rows.length / 2);
		for (const r of withField) expect(r.advanceMin).toBeGreaterThan(0);
	});
});
