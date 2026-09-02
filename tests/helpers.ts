import type { Page } from '@playwright/test';

/**
 * Navigate and wait for hydration. A prerendered page renders complete HTML
 * long before Svelte attaches a single listener; interacting inside that gap
 * types into dead inputs and clicks buttons wired to nothing. The layout
 * stamps data-hydrated from a browser-only effect: the earliest moment
 * interaction is real.
 */
export async function goto(page: Page, path: string) {
	await page.goto(path);
	await page.waitForSelector('html[data-hydrated]', { timeout: 15_000 });
}

/**
 * Put a session on the page before it loads, so data-driven UI actually renders.
 *
 * Every a11y view was checked with an EMPTY session, which meant whole sections
 * were never looked at: the shopping list, the cellar picker, The Pass, The
 * Repertoire. That is how an unlabelled <select>, a CRITICAL violation, sat
 * on the menu page without the suite noticing. A page with no user data is not
 * the page users have.
 *
 * addInitScript runs before any page script, so the store hydrates from this
 * rather than racing it.
 */
export async function seedSession(
	page: Page,
	patch: Record<string, unknown> = {},
	profileId?: string
) {
	await page.addInitScript(
		([extra, id]) => {
		// Same switch seedHouse has: addInitScript re-runs on EVERY navigation,
		// so a spec that must observe what the APP left on disk after a reload
		// flips this first, or the seed quietly puts the record back.
		if (localStorage.getItem('__wt_seed_off')) return;
		const DAY = 86_400_000;
		const now = Date.now();
		const state = {
			schemaVersion: 1,
			menu: ['coq-au-vin', 'cacio-e-pepe', 'the-french-omelette', 'pizza-margherita'],
			notes: {},
			pantry: [],
			shoppingChecks: {},
			cookedLog: [
				{ slug: 'the-french-omelette', at: now - 300 * DAY, grade: 'met' },
				{ slug: 'the-french-omelette', at: now - 20 * DAY, grade: 'met' },
				{ slug: 'cacio-e-pepe', at: now - 40 * DAY, grade: 'met' },
				{ slug: 'ratatouille', at: now - 25 * DAY, grade: 'missed' },
				{ slug: 'chicken-piccata', at: now - 10 * DAY, grade: 'close' },
				{ slug: 'miso-soup', at: now - 18 * DAY }
			],
			familyRecipes: [],
			menuDishes: [
				{ id: 'd-1', name: 'Chargrilled Salmon', section: 'Mains', description: '', ingredients: [], allergens: [], price: '24.00', ts: now },
				{ id: 'd-2', name: 'Cacio e Pepe', section: 'Mains', description: '', ingredients: [], allergens: [], price: '16.00', ts: now }
			],
			dishCosts: {
				'd-1': {
					lines: [
						{ id: 'c-1', item: 'Salmon fillet', unitCost: 12, unit: 'kg', usedQty: 0.2, yieldPct: 45 },
						{ id: 'c-2', item: 'New potato', unitCost: 1.5, unit: 'kg', usedQty: 0.25, yieldPct: 80 }
					],
					sold: 120,
					ts: now
				},
				'd-2': {
					lines: [{ id: 'c-3', item: 'Pecorino', unitCost: 25, unit: 'kg', usedQty: 0.06, yieldPct: 100 }],
					sold: 220,
					ts: now
				}
			},
			lastWrite: now,
			...(extra as Record<string, unknown>)
		};
			const open = indexedDB.open('world-table');
			open.onupgradeneeded = () => open.result.createObjectStore('state');
			open.onsuccess = () => {
				const tx = open.result.transaction('state', 'readwrite');
				// BOTH keys. db.ts KEY() returns the bare 'session' only while no
				// non-legacy profile is current; the moment a roster exists it
				// returns 'session::<id>' and a seed written only to the base key
				// leaves every seeded test reading an EMPTY session: silently
				// restoring the blind spot the SEEDED a11y block exists to close.
				tx.objectStore('state').put(state, 'session');
				if (id) tx.objectStore('state').put(state, 'session::' + id);
			};
		},
		[patch, profileId ?? null] as [Record<string, unknown>, string | null]
	);
}

/**
 * Put a HOUSE record on the page before it loads, the venue's half of the
 * split that seedSession covers for the person.
 *
 * Exists because the transport spec needs a venue with a prep-backed costing,
 * an item book and a waste log, and none of that lives in the session. Every
 * .wtjson defect so far has been in exactly this record's travel arrangements.
 */
export async function seedHouse(page: Page, patch: Record<string, unknown> = {}) {
	await page.addInitScript(
		(extra) => {
			// addInitScript re-runs on EVERY navigation, so without this switch a
			// test that wipes the venue and reloads finds it resurrected by its
			// own seed. The transport spec flips it before playing "site B".
			if (localStorage.getItem('__wt_seed_off')) return;
			const now = Date.now();
			const record = {
				schemaVersion: 1,
				dishes: [
					{ id: 'd1', name: 'Braised cheek', section: 'Mains', description: '', ingredients: [], allergens: [], price: '28', ts: now }
				],
				preps: [
					{
						id: 'p-demi', name: 'Demi-glace', batch: '1 x 20L pot', portions: 10, par: 20,
						handsOnSec: 3600, unattendedSec: 32400, ts: now,
						lines: [
							{ id: 'a', item: 'Veal bones', unitCost: 20, unit: 'kg', usedQty: 1, yieldPct: 100 },
							{ id: 'b', item: 'Mirepoix', unitCost: 10, unit: 'kg', usedQty: 1, yieldPct: 100 }
						]
					}
				],
				items: {
					butter: { slug: 'butter', name: 'Butter', history: [
						{ unitCost: 9.5, unit: 'kg', at: now - 86_400_000 },
						{ unitCost: 6.4, unit: 'kg', at: now - 90 * 86_400_000 }
					] }
				},
				waste: [
					{ id: 'w-seed', at: now - 3_600_000, label: 'Demi-glace', qty: 2, reason: 'overprep', unitValue: 3 }
				],
				prepCounts: {}, eightySix: {}, absorbed: [], lastWrite: now,
				dishCosts: {
					d1: {
						lines: [
							{ id: 'l1', item: 'Beef cheek', unitCost: 18, unit: 'kg', usedQty: 0.25, yieldPct: 80 },
							{ id: 'l2', item: 'Demi-glace', unitCost: 0, unit: 'portion', usedQty: 1, yieldPct: 100, prepId: 'p-demi' },
							// STALE ON PURPOSE: the line stores 6.40 while the book holds
							// 9.50, so the plate only costs 9.10 if the BOOK travelled and
							// was followed. A wrong-but-plausible 8.95 means somebody made
							// linked lines read their stored price again.
							{ id: 'l3', item: 'Butter', itemSlug: 'butter', unitCost: 6.4, unit: 'kg', usedQty: 0.05, yieldPct: 100 }
						],
						sales: [], ts: now
					}
				},
				...(extra as Record<string, unknown>)
			};
			const open = indexedDB.open('world-table');
			open.onupgradeneeded = () => open.result.createObjectStore('state');
			open.onsuccess = () => {
				open.result.transaction('state', 'readwrite').objectStore('state').put(record, 'house');
			};
		},
		patch
	);
}
