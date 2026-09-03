import { describe, it, expect } from 'vitest';
import { stepService, ADVANCE_MIN, LONG_HOLD_MIN } from '../../tools/derive/service.mjs';
import full from './data/recipes.full.json';

/**
 * The service split, which had no test at all while three build checks watched
 * it and one of those could never fire.
 *
 * The defect: a 48-hour cure charged twenty hours of hands. isUnattended routes
 * a duration by nearest verb, and when the UNATTENDED list matches nothing in
 * the clause `before(waits)` returns Infinity, which is never less than a finite
 * number — so any incidental ACTIVE token wins. The verbs that govern a long
 * hold (hold, hang, leave, retard, drain) are in NEITHER list, so on the
 * flagship step the governing token was `layer`, out of "two layers of film".
 *
 * Fixed with a magnitude backstop rather than a vocabulary edit, because the
 * vocabulary edits were measured and were worse: adding `cook` to UNATTENDED
 * flips 192 durations whose median is five minutes, most of them correctly
 * attended ("cook 2 min to a blond roux"), and splitting clauses on commas
 * decapitates "Bake 170C, 40-45 min".
 */
const min = (sec: number) => sec / 60;

describe('the magnitude backstop', () => {
	it('books a 48-hour cure as a wait, not as twenty hours of hands', () => {
		const r = stepService(
			'Seal in a vacuum bag, or wrap tight in two layers of film in a tray, and hold at 4C (39F) for 48 hours, turning the parcel every 12 hours.'
		);
		// Was handsOnSec 72000 (20 h) and unattendedSec 0.
		expect(min(r.handsOnSec)).toBe(8);
		expect(min(r.unattendedSec)).toBe(600);
		expect(r.estimated).toBe(true);
	});

	/**
	 * The regression guards, and the reason the line is a magnitude and not a
	 * word list. A dark roux is the canonical cannot-walk-away task; an earlier
	 * candidate fix booked it as a wait.
	 */
	it('does not reach down: short attended work stays hands-on', () => {
		const roux = stepService(
			'Make a dark roux: whisk oil and flour over medium 30-45 min to milk-chocolate brown'
		);
		expect(min(roux.handsOnSec)).toBeGreaterThanOrEqual(45);
		expect(min(roux.unattendedSec)).toBe(0);

		const taffy = stepService(
			'Pull the taffy with buttered hands, stretching and folding, for 15-20 min'
		);
		expect(min(taffy.handsOnSec)).toBe(20);
		expect(min(taffy.unattendedSec)).toBe(0);
	});

	it('draws the line at LONG_HOLD_MIN, and keeps it clear of ADVANCE_MIN', () => {
		expect(LONG_HOLD_MIN).toBe(90);
		// Two constants, two questions. ADVANCE_MIN decides the day-before
		// banner and the Quick filter, and must not drift with the classifier.
		expect(ADVANCE_MIN).toBe(240);

		// 89 obeys the nearest-verb rule; 90 is a wait whatever governs it.
		const under = stepService('Knead and press the dough by hand for 89 min');
		const over = stepService('Knead and press the dough by hand for 90 min');
		expect(min(under.handsOnSec)).toBeGreaterThan(0);
		expect(min(over.unattendedSec)).toBe(90);
	});

	/**
	 * The four separate ways the 90-239 tier failed. No vocabulary edit reaches
	 * all four, which is why the line is a magnitude and not a word list.
	 */
	it('holds the tier item 18 left behind, however it was governed', () => {
		// The governing verb is in NEITHER list, so ACTIVE won uncontested.
		expect(min(stepService('Prove at 24-26C, no hotter, for 2-3 hours, until a light press springs back').unattendedSec)).toBe(180);
		expect(min(stepService('Add the tomatoes and hold at 90C to 95C, partly covered, for 3 hours').unattendedSec)).toBe(180);
		expect(min(stepService('Bulk 2 hours at 22C with two folds in the tub, until doubled').unattendedSec)).toBe(120);

		// A doneness test won the race.
		expect(min(stepService('Cook 2.5 to 3 hours, until a pea crushes to nothing against the pot').unattendedSec)).toBe(180);

		// A manner aside won it.
		expect(min(stepService('Simmer uncovered on medium-low, stirring occasionally, 2 h, as it thickens').unattendedSec)).toBe(120);

		// The token was not a verb at all: temper in "temperature", spoon in
		// "spoonful", a plate you weight with, water that is rolling.
		expect(min(stepService('Cover and leave at room temperature for about 2 hours, until it sets').unattendedSec)).toBe(120);
		expect(min(stepService('Add the halved onion and a spoonful of salt, and hold it at a bare tremble 2 h').unattendedSec)).toBe(120);
		expect(min(stepService('Steam the whole piece over rolling water for about 3 hours').unattendedSec)).toBe(180);
	});

	/**
	 * Where the line stops, and why it is 90 rather than lower. These four are
	 * the honest attended cases in the 45-89 tier - the ones item 18 went out of
	 * its way to protect - and a cook really is pinned to all of them.
	 */
	it('leaves the genuinely attended work below the line alone', () => {
		expect(min(stepService('Stir constantly now, 30-45 min').handsOnSec)).toBe(45);
		expect(
			min(stepService('Simmer the milk in a wide heavy pan, stirring and scraping the sides and bottom constantly, 60-75 min').handsOnSec)
		).toBe(75);
		expect(min(stepService('cook in a double boiler with knotted pandan, stirring, 45 min to a thick amber curd').handsOnSec)).toBe(45);
	});

	/**
	 * The gate: the tier cannot refill without a test going red.
	 *
	 * The threshold here is the LITERAL 90, never LONG_HOLD_MIN. A gate that
	 * reads the constant it polices moves when the constant moves, and passes
	 * whatever it is set to - which is exactly what this one did on its first
	 * mutation test, sitting green while the line was put back to 240.
	 */
	it('books no stated duration of 90 min or more as hands-on, corpus-wide', () => {
		const DUR = /(\d+(?:\.\d+)?)\s*(?:[\u2013-]\s*(\d+(?:\.\d+)?))?\s*(min\b|minute|h\b|hour|day|week)/gi;
		const offenders: string[] = [];
		for (const r of full as Array<{ slug: string; steps?: Array<{ text: string }> }>) {
			for (const st of r.steps ?? []) {
				const stripped = String(st.text).replace(/\([^)]*\)/g, ' ');
				for (const clause of stripped.split(/[;.](?!\d)/)) {
					DUR.lastIndex = 0;
					let long = false;
					for (const m of clause.matchAll(DUR)) {
						const v = parseFloat(m[2] || m[1]);
						const u = m[3].toLowerCase();
						const per = u.startsWith('h') ? 60 : u.startsWith('d') ? 1440 : u.startsWith('w') ? 10080 : 1;
						if (Math.min(Math.round(v * per), 600) >= 90) long = true;
					}
					if (!long) continue;
					// The clause states a 90+ block. If it charges 90+ minutes of
					// hands, the magnitude line stopped applying to it.
					if (min(stepService(clause).handsOnSec) >= 90) offenders.push(`${r.slug}: ${clause.trim().slice(0, 70)}`);
				}
			}
		}
		expect(offenders).toEqual([]);
	});
});

describe('a recurrence is not a block of time', () => {
	it('charges the repeated act, not the interval', () => {
		// Shipped 0 hands and 45 min of wait: mopping ribs cost the cook nothing.
		const r = stepService('Mop lightly every 45 min after the second hour');
		expect(min(r.handsOnSec)).toBeGreaterThan(0);
		expect(min(r.unattendedSec)).toBe(0);
	});

	it('reads "at N minute intervals" the same way', () => {
		const r = stepService('Fold it in the bowl four times at 30 minute intervals');
		expect(min(r.handsOnSec)).toBeLessThan(30);
	});

	/** `each` is distributive here, never a recurrence: 59 sites, 0 durations. */
	it('does not treat "each" as a recurrence', () => {
		const r = stepService('Add the butter in pieces, whisking each addition, 4 min');
		expect(min(r.handsOnSec)).toBeGreaterThanOrEqual(4);
	});
});

describe('one range written long is one duration', () => {
	it('sums a spelled range once, not twice', () => {
		// "6 hours to 7 hours" matched twice and booked 13 hours.
		const r = stepService('cook with the lid ajar for 6 hours to 7 hours');
		expect(min(r.unattendedSec)).toBe(420);
	});

	it('carries back over a compound low end', () => {
		const r = stepService('Set the pot on the coals for 1 hour 30 minutes to 2 hours 30 minutes');
		expect(min(r.unattendedSec)).toBe(150);
	});

	it('leaves a low end with no unit alone', () => {
		// "8 to 12 hours" is one match already; nothing to merge.
		const r = stepService('hold there 8 to 12 hours');
		expect(min(r.unattendedSec)).toBe(600);
	});
});

/**
 * The same predicates as the build gates in tools/build-data.mjs, deliberately:
 * the gate fails the build, these fail the PR. Before the fix the first was 43
 * and the second 19.
 */
describe('the shipped corpus', () => {
	const recipes = full as unknown as Array<{
		slug: string;
		steps?: Array<{ handsOnSec?: number; unattendedSec?: number }>;
	}>;

	it('has no step booking a block of hands too long to fit in a service', () => {
		const bad = recipes.flatMap((r) =>
			(r.steps ?? [])
				.map((s, i) => ({ slug: r.slug, i: i + 1, m: min(s.handsOnSec ?? 0) }))
				.filter((s) => s.m >= ADVANCE_MIN)
		);
		expect(bad.map((b) => `${b.slug} #${b.i} (${b.m} min)`)).toEqual([]);
	});

	it('has no recipe above the 600-minute ceiling an authored t must obey', () => {
		const bad = recipes
			.map((r) => ({
				slug: r.slug,
				m: (r.steps ?? []).reduce((a, s) => a + min(s.handsOnSec ?? 0), 0)
			}))
			.filter((r) => r.m > 600);
		expect(bad.map((b) => `${b.slug} (${b.m} min)`)).toEqual([]);
	});

	it('has no long recipe with zero unattended time, which no method has', () => {
		const bad = recipes
			.map((r) => {
				const h = (r.steps ?? []).reduce((a, s) => a + min(s.handsOnSec ?? 0), 0);
				const w = (r.steps ?? []).reduce((a, s) => a + min(s.unattendedSec ?? 0), 0);
				return { slug: r.slug, h, w };
			})
			.filter((r) => r.w === 0 && r.h + r.w >= ADVANCE_MIN);
		expect(bad.map((b) => b.slug)).toEqual([]);
	});
});

/**
 * Two units the parser could not read at all.
 *
 * DECIMALS. The clause splitter cut on a bare full stop, so "simmer 1.5 h"
 * became "simmer 1" and "5 h" and the step booked FIVE HOURS. Thirty-three
 * recipes said it that way and every one shipped 300 minutes: the digits after
 * the point were being read as a fresh duration, not rounded away.
 *
 * DAYS, WEEKS, OVERNIGHT. 140 steps across 125 recipes stated a wait in units
 * DURATION had never seen and booked ZERO for it - guanciale hung for five
 * weeks and the service split said nothing at all.
 */
describe('durations the parser could not read', () => {
	it('reads a decimal instead of splitting on it', () => {
		expect(min(stepService('simmer 1.5 h').unattendedSec)).toBe(90);
		// The top of a range, as everywhere else in this module.
		expect(min(stepService('simmer 2–2.5 h until sliding off the bone').unattendedSec)).toBe(150);
		expect(min(stepService('oven 150°C, 2.5 h, lid ajar').unattendedSec)).toBe(150);
	});

	it('reads a wait stated in days or weeks, held to the ceiling', () => {
		expect(min(stepService('Cure in the fridge 3 days, turning daily.').unattendedSec)).toBe(600);
		expect(min(stepService('Hang in a cool place for 1 week.').unattendedSec)).toBe(600);
	});

	it('values overnight at eight hours', () => {
		const r = stepService('Season meat with curry powder and aromatics; marinate overnight.');
		expect(min(r.unattendedSec)).toBe(480);
	});

	/**
	 * Measured, not cautious-by-default: of the 26 clauses pairing overnight
	 * with a number, most are a RANGE ("30 min to overnight"), an ALTERNATIVE
	 * ("rise 90 min, or cold-ferment overnight") or a RESTATEMENT ("overnight,
	 * 12 hours"), and adding to any of those would over-count - the direction
	 * item 18 spent its whole effort undoing.
	 */
	it('does not add overnight to a clause that already states a number', () => {
		expect(min(stepService('Marinate chicken 30 min to overnight').unattendedSec)).toBe(30);
		expect(min(stepService('Keep it at 40-45C overnight, 12 hours, until it foams').unattendedSec)).toBe(600);
	});

	/** The item-18 guards, unmoved by any of it. */
	it('still leaves short attended work alone', () => {
		expect(
			min(stepService('Make a dark roux: whisk oil and flour over medium 30-45 min to milk-chocolate brown').handsOnSec)
		).toBeGreaterThanOrEqual(45);
		expect(min(stepService('Pull the taffy with buttered hands, stretching and folding, for 15-20 min').handsOnSec)).toBe(20);
	});
});
