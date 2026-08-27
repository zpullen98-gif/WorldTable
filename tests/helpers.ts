import type { Page } from '@playwright/test';

/**
 * Navigate and wait for hydration. A prerendered page renders complete HTML
 * long before Svelte attaches a single listener; interacting inside that gap
 * types into dead inputs and clicks buttons wired to nothing. The layout
 * stamps data-hydrated from a browser-only effect — the earliest moment
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
 * Repertoire. That is how an unlabelled <select> — a CRITICAL violation — sat
 * on the menu page without the suite noticing. A page with no user data is not
 * the page users have.
 *
 * addInitScript runs before any page script, so the store hydrates from this
 * rather than racing it.
 */
export async function seedSession(page: Page, patch: Record<string, unknown> = {}) {
	await page.addInitScript((extra) => {
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
			tx.objectStore('state').put(state, 'session');
		};
	}, patch);
}
