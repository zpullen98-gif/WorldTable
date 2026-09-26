import { test, expect, type Page } from '@playwright/test';
import { cannedDeskFile, goto, seedDesk, seedHouse, seedMaitre, seedSession, TEST_KEY } from './helpers';
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
	{ path: '/service/deck', name: 'floor deck landing' },
	{ path: '/service/deck/study', name: 'floor deck sitting' },
	{ path: '/service/deck/test', name: 'floor deck written test' },
	{ path: '/service/deck/say', name: 'floor deck say it back' },
	{ path: '/service/deck/lineup', name: 'floor deck lineup' },
	{ path: '/family', name: 'family chapter' },
	{ path: '/menu', name: 'menu worksheet' },
	/* Added with the global .chip rule: these three used the class and defined
	   no style, so they rendered raw operating-system controls and carried the
	   contrast failure. They are in the sweep now so that cannot come back. */
	/* The chapter route renders the same toolbar as /recipes, now with a Clear
	   control and an empty state that offers buttons - and was never swept. */
	{ path: '/chapter/italian', name: 'chapter grid' },
	{ path: '/menu/preps', name: 'prep list' },
	{ path: '/menu/producers', name: 'producer list' },
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
			/*
			 * axe walks every node, and on the recipe grid that is every card in
			 * the corpus: legitimately slow, slower still with four workers
			 * hammering one static server.
			 *
			 * This said 1710 and allowed two minutes. The corpus is 1844 now, the
			 * grid scan measures 1.4 to 1.6 minutes on an idle machine, and under
			 * the full suite it began timing out — a failure that looks exactly
			 * like a real accessibility regression and is not one. Three minutes
			 * restores the margin the two originally bought. If this starts
			 * failing again, measure the scan alone before believing it.
			 */
			test.setTimeout(180_000);
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
const NOW = Date.now();
const hers = (value: string) => ({ value, by: 'maitre', ts: NOW, model: 'claude-opus-5' });
/**
 * A dish she has written on and nobody has kept: five rows hers, the eyebrow
 * saying so, Keep, Edit and Discard on each and the two bulk chips below.
 * Seeded on the HOUSE record, because that is where marks live and the
 * session seed has no dish with any.
 */
const HER_DISH = {
	id: 'd1', name: 'Braised cheek', section: 'Mains', description: 'Beef cheek, red wine, roots', ingredients: [], allergens: [], price: '28', ts: NOW,
	maitre: {
		say: hers('brayzd cheek'),
		guest: hers('Beef cheek, braised until it gives. It comes with what the garden had that morning.'),
		why: hers('The cheek is the one cut a slow oven makes better than a fast pan.'),
		pairs: hers('I would pour something with a little grip beside it.'),
		origin: hers('A bistro cut, from every town with a butcher.')
	}
};

/* `seed` puts the data on the page; the session seed unless a view needs
   another record. `ready` is the one selector that only exists once the data
   rendered, named per view for the reason given in the loop. */
const SEEDED: Array<{ path: string; name: string; ready: string; seed?: (page: Page) => Promise<void> }> = [
	{ path: '/menu', name: 'menu worksheet with a menu on it', ready: '.plan li' },
	{ path: '/repertoire', name: 'repertoire with dishes cooked', ready: '.rows li' },
	{ path: '/menu/costing', name: 'costing sheet with dishes costed', ready: '.quadrants li' },
	{ path: '/coverage', name: 'coverage board with a cooked log', ready: '.people li' },
	/* The desk with a share on it: the review table, its Kind selects and its
	   flags only exist once something has been read, and the empty sweep above
	   sees the doors and nothing else. */
	{ path: '/menu', name: 'menu worksheet with a desk share waiting', ready: '.review tbody tr', seed: (page) => seedDesk(page, cannedDeskFile()) },
	/* A dish carrying her unkept lines: the block with its three chips per
	   row, the word and the rule on each, the bulk chips under it. */
	{ path: '/menu', name: 'menu worksheet with a dish carrying her unkept lines', ready: '.lines', seed: (page) => seedHouse(page, { dishes: [HER_DISH] }) }
];

for (const view of SEEDED) {
	test(`axe: ${view.name}`, async ({ page }) => {
		test.setTimeout(120_000);
		await (view.seed ?? seedSession)(page);
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

/**
 * The Menu Desk with rows on it, in both services. The empty-session sweep
 * sees the desk's doors and never its review table, its Kind selects, its
 * flags or the rooms below it, because those only render once something has
 * been read. A share seeded in the inbox renders all of them on load.
 */
const DESK_NOW = new Date().toISOString();
const DESK_ROW = {
	price: { printed: '12', parts: [{ amount: '12', label: '' }] },
	marks: [],
	confidence: 'low',
	why: ['Could be a dish or a cocktail: the line does not say clearly enough which.'],
	lines: [0, 1]
};
const DESK_SEED = {
	format: 'oot-menu-desk',
	version: 1,
	createdAt: DESK_NOW,
	source: { kind: 'paste', at: DESK_NOW, reader: 'desk-reader/1', readIn: 'codex', hash: 'a11ydesk' },
	items: [
		{ ...DESK_ROW, id: 'k-a11y0001', kind: 'dish', section: 'STARTERS', name: 'Turtle Soup au Sherry', raw: 'Turtle Soup au Sherry\n12', description: 'Veal fond, egg and crushed lemon', ingredientsNamed: [] },
		{ ...DESK_ROW, id: 'k-a11y0002', kind: 'unsure', section: 'STARTERS', name: 'Kiss the Crab', raw: 'Kiss the Crab\n12', could: ['dish', 'cocktail'] },
		{ ...DESK_ROW, id: 'k-a11y0003', kind: 'wine', section: 'WINE BY GLASS', name: 'Ployez-Jacquemart', raw: 'Ployez-Jacquemart\n12', producer: '', wine: 'Ployez-Jacquemart', vintage: '2010', region: 'Champagne', country: 'France', grapes: [], style: 'Extra-Brut', bin: '', pours: [], bottle: '', descriptors: 'Extra-Brut, Champagne, France' }
	],
	unsorted: [{ raw: 'Price of Entrée includes Soup or Salad and Dessert', line: 9, reason: 'heading-note' }]
};

for (const { scheme, name: service } of SERVICES) {
	test(`axe: the Menu Desk with a share on it in ${service} service`, async ({ page }) => {
		test.setTimeout(120_000);
		await page.emulateMedia({ colorScheme: scheme });
		await seedDesk(page, DESK_SEED);
		await goto(page, '/menu');
		await page.locator('.review').first().waitFor({ timeout: 15_000 });
		// Open the rooms below the table as well, so their list and its selects are swept.
		await page.getByRole('button', { name: /Show the 1 wine for the Codex/ }).click();

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

/**
 * Her two dialogs, drawn by the client (static/shared/oot-maitre.js) into
 * this page, in both services. The dialog carries its own palette as tokens
 * on the element and ignores the page's, which is exactly why both schemes
 * are swept: a token that leaked from the page would pass in one service and
 * fail in the other. Included by element, so the page under the backdrop is
 * not what is being judged. Her host is refused outright; neither dialog
 * opens with a request anyway, and the chat's Keep and the key screen's Test
 * are exercised in maitre.spec.ts, not here.
 */
for (const { scheme, name: service } of SERVICES) {
	test(`axe: her key screen has no serious violations in ${service} service`, async ({ page }) => {
		await page.emulateMedia({ colorScheme: scheme });
		await page.route('**/api.anthropic.com/**', (route) => route.abort());
		await goto(page, '/menu');
		// No key on the device: the screen opens on the family line, with the
		// key field, the model radios, the cap chips and the ledger under it.
		await page.getByRole('button', { name: "The Maître d'", exact: true }).click();
		const dialog = page.locator('dialog#oot-maitre-settings[open]');
		await expect(dialog).toBeVisible();
		await expect(dialog).toContainText('Bring her in with a key of your own');
		// Forget asks in words, inside the same dialog: those buttons are swept too.
		await dialog.getByRole('button', { name: 'Forget my key' }).click();
		await expect(dialog).toContainText('Only the key goes.');

		const results = await new AxeBuilder({ page })
			.include('dialog')
			.withTags(['wcag2a', 'wcag2aa'])
			.options({ resultTypes: ['violations'] })
			.analyze();
		const serious = results.violations.filter(
			(v) => v.impact === 'serious' || v.impact === 'critical'
		);
		expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`)).toEqual([]);
	});

	test(`axe: Ask the Maître d' has no serious violations in ${service} service`, async ({ page }) => {
		await page.emulateMedia({ colorScheme: scheme });
		await page.route('**/api.anthropic.com/**', (route) => route.abort());
		// The chat door only renders with a key on the device.
		await seedMaitre(page, { key: TEST_KEY });
		await seedHouse(page, { dishes: [HER_DISH] });
		await goto(page, '/menu');
		// The house arrives from IDB a beat after hydration; until it does the
		// menu is empty, the desk is open (two more buttons carry her name, so
		// the locator is exact) and a click that won the race would send her an
		// empty house and get the empty-house line instead of the one below.
		await page.locator('.lines').first().waitFor({ timeout: 15_000 });
		await page.getByRole('button', { name: "Ask the Maître d'", exact: true }).click();
		const dialog = page.locator('dialog#oot-maitre-chat[open]');
		await expect(dialog).toBeVisible();
		await expect(dialog).toContainText('She can see the house menu, 1 dish, and every line you kept.');
		await expect(dialog.getByRole('textbox', { name: 'Your question' })).toBeFocused();

		const results = await new AxeBuilder({ page })
			.include('dialog')
			.withTags(['wcag2a', 'wcag2aa'])
			.options({ resultTypes: ['violations'] })
			.analyze();
		const serious = results.violations.filter(
			(v) => v.impact === 'serious' || v.impact === 'critical'
		);
		expect(serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length} nodes)`)).toEqual([]);
	});
}
