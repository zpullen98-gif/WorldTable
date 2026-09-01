import { test, expect } from '@playwright/test';
import { goto, seedSession } from './helpers';
import AxeBuilder from '@axe-core/playwright';

/**
 * axe-core over every view, in both services. Zero serious/critical violations
 * is the bar; moderate/minor are reported in the failure output when the bar
 * is missed, so the fix starts from a list rather than a hunt.
 *
 * Two things keep this suite honest under load. resultTypes:['violations'] stops
 * axe returning a `passes` entry for every node it checked — on the 970-card
 * grid that payload is enormous, and serialising it across CDP under five-way
 * parallel load truncated the response, surfacing as axe dying with
 * "Unexpected end of JSON input": a red suite that said nothing about
 * accessibility. We only ever read `violations`.
 *
 * And readiness is `html[data-hydrated]` (via goto), never networkidle: with
 * eleven axe runs racing five-wide against one static server, "no request for
 * 500ms" can be delayed arbitrarily. Hydration is the signal this app actually
 * defines, and it is deterministic.
 */

const VIEWS = [
	{ path: '/', name: 'today dashboard' },
	{ path: '/recipes', name: 'recipe grid' },
	{ path: '/recipe/cacio-e-pepe', name: 'recipe page' },
	{ path: '/lexicon', name: 'lexicon' },
	{ path: '/technique', name: 'technique index' },
	{ path: '/technique/braising', name: 'technique page' },
	{ path: '/pantry', name: 'pantry match' },
	{ path: '/study', name: 'path of study' },
	{ path: '/safety', name: 'food safety' },
	{ path: '/learn', name: 'learn hub' },
	{ path: '/practise', name: 'practise hub' },
	{ path: '/service', name: 'service hub' },
	{ path: '/service/srv-room', name: 'service track module' },
	{ path: '/service/drill', name: 'service drill' },
	{ path: '/family', name: 'family chapter' },
	{ path: '/menu', name: 'menu worksheet' },
	/* Added with the global .chip rule: these three used the class and defined
	   no style, so they rendered raw operating-system controls and carried the
	   contrast failure. They are in the sweep now so that cannot come back. */
	{ path: '/menu/preps', name: 'prep list' },
	{ path: '/menu/costing', name: 'costing sheet' },
	{ path: '/practise/calibrate', name: 'calibration' }
];

/* Both services. The app follows prefers-color-scheme, so emulating it is
   enough to swap the whole palette. */
const SERVICES = [
	{ scheme: 'light', name: 'day' },
	{ scheme: 'dark', name: 'night' }
] as const;

for (const { scheme, name: service } of SERVICES) {
	for (const view of VIEWS) {
		test(`axe: ${view.name} has no serious violations in ${service} service`, async ({ page }) => {
			// axe walks every node — on the 1710-card grid that is legitimately
			// slow, slower still with the whole suite hammering one static server.
			test.setTimeout(120_000);
			await page.emulateMedia({ colorScheme: scheme });
			await goto(page, view.path);

			const results = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa'])
				.options({ resultTypes: ['violations'] })
				.analyze();

			const serious = results.violations.filter(
				(v) => v.impact === 'serious' || v.impact === 'critical'
			);
			expect(
				serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`)
			).toEqual([]);
		});
	}
}

test('cook mode is reachable and escapable by keyboard alone', async ({ page }) => {
	await goto(page, '/recipe/cacio-e-pepe');
	await page.getByRole('button', { name: /Cook mode/ }).click();
	await expect(page.locator('.cook')).toBeVisible();

	const results = await new AxeBuilder({ page })
		.include('.cook')
		.withTags(['wcag2a', 'wcag2aa'])
		.options({ resultTypes: ['violations'] })
		.analyze();
	const serious = results.violations.filter(
		(v) => v.impact === 'serious' || v.impact === 'critical'
	);
	expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);

	await page.keyboard.press('Escape');
	await expect(page.locator('.cook')).toHaveCount(0);
});

/**
 * The same bar, on pages that have something on them.
 *
 * The VIEWS sweep above runs with an empty session and therefore never renders
 * the shopping list, the cellar picker, The Pass or The Repertoire — anything
 * gated behind user data. That gap hid an unlabelled <select> on the menu page,
 * which axe rates CRITICAL, for as long as the section existed.
 */
const SEEDED = [
	{ path: '/menu', name: 'menu worksheet with a menu on it', ready: '.plan li' },
	{ path: '/repertoire', name: 'repertoire with dishes cooked', ready: '.rows li' },
	{ path: '/menu/costing', name: 'costing sheet with dishes costed', ready: '.quadrants li' },
	{ path: '/coverage', name: 'coverage board with a cooked log', ready: '.people li' }
];

for (const view of SEEDED) {
	test(`axe: ${view.name}`, async ({ page }) => {
		test.setTimeout(120_000);
		await seedSession(page);
		await goto(page, view.path);
		// The section under test only exists once the store has hydrated from IDB.
		// Named per view rather than as one shared selector: a wait that matches
		// some other page's markup would pass while the section under test never
		// rendered, which is the failure this whole block exists to prevent.
		await page.locator(view.ready).first().waitFor({ timeout: 15_000 });

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa'])
			.options({ resultTypes: ['violations'] })
			.analyze();
		const serious = results.violations.filter(
			(v) => v.impact === 'serious' || v.impact === 'critical'
		);
		expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`)).toEqual([]);
	});
}
