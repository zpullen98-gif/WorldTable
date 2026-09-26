import type { Page } from '@playwright/test';
import { hashText } from '../src/lib/desk/desk-text';

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
 * Put a desk file in the Menu Desk's inbox before the page loads: the draft
 * another room (the Codex, the Ledger) would have left on the shared origin.
 *
 * localStorage, not IndexedDB, because that is the slot the three apps share
 * (src/lib/desk/desk-inbox.ts). Same seed switch as the other two: the desk
 * marks its share taken on adopt, and a spec that wants to see that mark
 * survive a reload flips `__wt_seed_off` first.
 */
export async function seedDesk(page: Page, file: Record<string, unknown>) {
	await page.addInitScript((json) => {
		if (localStorage.getItem('__wt_seed_off')) return;
		localStorage.setItem('oot-menu-desk-v1', json);
	}, JSON.stringify(file));
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

/**
 * A desk file the way another room would have left it, with the plan's
 * minimum on every row: two dishes for the kitchen and one wine for the
 * Codex, hashed from the text they were read from so the "never twice" state
 * can recognise the same paste. `over` replaces top-level fields (the source,
 * the taken marks); `text` is what the hash is taken from.
 */
export function cannedDeskFile(over: Record<string, unknown> = {}, text = 'Turtle Soup au Sherry\n12\nSoup du Jour\n11') {
	const at = new Date().toISOString();
	const row = (id: string, name: string, price: string, extra: Record<string, unknown>) => ({
		id,
		section: 'SOUPS',
		name,
		price: { printed: price, parts: price ? [{ amount: price, label: '' }] : [] },
		marks: [],
		confidence: 'high',
		why: [],
		raw: `${name}\n${price}`,
		lines: [0, 1],
		...extra
	});
	return {
		format: 'oot-menu-desk',
		version: 1,
		createdAt: at,
		source: { kind: 'paste', at, reader: 'desk-reader/1', readIn: 'codex', hash: hashText(text) },
		items: [
			row('k-seed0001', 'Turtle Soup au Sherry', '12', { kind: 'dish', description: '', ingredientsNamed: [] }),
			row('k-seed0002', 'Soup du Jour', '11', { kind: 'dish', description: '', ingredientsNamed: [] }),
			row('k-seed0003', 'Ployez-Jacquemart', '45.00', {
				kind: 'wine', producer: '', wine: 'Ployez-Jacquemart', vintage: '2010', region: 'Champagne',
				country: 'France', grapes: [], style: 'Extra-Brut', bin: '', pours: [], bottle: '',
				descriptors: 'Extra-Brut, Champagne, France'
			})
		],
		unsorted: [],
		...over
	};
}

/* ---- the Maître d' -------------------------------------------------------
 * Her client (static/shared/oot-maitre.js) keeps one slot on the origin and
 * talks to one host. The specs seed the slot the way the key screen writes
 * it and answer the host with page.route, so nothing a spec does can reach
 * Anthropic: CI has no key and must never need one. */

/** The client's slot, the one coupling src/lib/maitre.ts carries. */
export const MAITRE_SLOT = 'oot-maitre-v1';

/**
 * A key with the shape of an Anthropic key and none of its bytes. It is only
 * ever sent to a route a spec fulfils itself, and the export spec proves it
 * is in no file the app writes.
 */
export const TEST_KEY = 'sk-ant-api03-test-0000-never-a-real-key-4242';

/**
 * Put her key on the device before the page loads, the way the key screen
 * leaves the slot: the record the client's sanitize() accepts whole, with the
 * ledger on THIS month, because the client's rollMonth files any other month
 * under `past` on the first read and a spec that seeded spend would find a
 * clean ledger. Same seed switch as the other seeds.
 */
export async function seedMaitre(page: Page, patch: Record<string, unknown> & { key: string }) {
	await page.addInitScript(
		([slot, extra]) => {
			if (localStorage.getItem('__wt_seed_off')) return;
			const rec = {
				v: 1,
				models: { read: 'claude-haiku-4-5', write: 'claude-opus-5', chat: 'claude-opus-5' },
				capUsd: 5,
				ledger: { month: new Date().toISOString().slice(0, 7), usd: 0, entries: [], past: {} },
				fetchMode: '',
				...(extra as Record<string, unknown>)
			};
			localStorage.setItem(slot, JSON.stringify(rec));
		},
		[MAITRE_SLOT, patch] as [string, Record<string, unknown>]
	);
}

/** What GET /v1/models answers: the three models the picker knows, so a tested key is missing none. */
export const MODELS_JSON = {
	data: [{ id: 'claude-haiku-4-5' }, { id: 'claude-sonnet-5' }, { id: 'claude-opus-5' }],
	has_more: false
};

/**
 * A menu for her to read, and what she reads off it. Small on purpose: the
 * point is the road her answer takes, not the menu. Every price she gives
 * but one is printed on the page; the one that is not ("4" on the bread) is
 * the client's price check earning its keep, and the whole first line as a
 * name is the offline reader's comma split disagreeing with her, which is
 * the "Differs from the offline read" flag.
 */
export const CANNED_MENU = 'STARTERS\nCrispy squid, lemon aioli 9.50\nSoup of the day 6\nBread and butter\nWINE\nHouse red 7';

/** Her flat desk (the client's DESK_SCHEMA) for CANNED_MENU: every field present, every value a string or a list, no allergen key anywhere. */
export function cannedFlatDesk() {
	return {
		dishes: [
			{ section: 'STARTERS', name: 'Crispy squid, lemon aioli', description: '', price: '9.50', ingredientsNamed: [], marks: [], confidence: 'high', raw: 'Crispy squid, lemon aioli 9.50' },
			{ section: 'STARTERS', name: 'Soup of the day', description: '', price: '6', ingredientsNamed: [], marks: [], confidence: 'high', raw: 'Soup of the day 6' },
			{ section: 'STARTERS', name: 'Bread and butter', description: '', price: '4', ingredientsNamed: [], marks: [], confidence: 'high', raw: 'Bread and butter' }
		],
		wines: [
			{ producer: '', name: 'House red', vintage: '', region: '', grapes: [], style: '', glass: '7', bottle: '', pours: [], section: 'WINE', raw: 'House red 7' }
		],
		cocktails: [],
		unsure: []
	};
}

/**
 * Her five lines for the items a floor request carried, by id, every field
 * filled so "Keep all five" renders. Plain prose in her rules: no dash, no
 * adjective that sells, not a word about allergens (the client empties a line
 * that speaks of them, and a spec that wants that case writes its own).
 */
export function floorLinesFor(items: Array<{ id: string; name: string }>) {
	return {
		items: items.map(({ id, name }) => ({
			id,
			say: `${name}, said as it is written.`,
			guest: `${name} is cooked slowly and comes to the table hot. Ask me about the rest of the menu.`,
			why: `The kitchen makes ${name} from what came in that morning, and that is the one thing worth knowing.`,
			pairs: `I would pour something with a little acid beside ${name}.`,
			origin: 'A house dish, from no place the menu names.'
		}))
	};
}

const sseEvent = (type: string, data: unknown) => `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;

/**
 * A streamed answer the way /v1/messages streams one, for page.route to
 * fulfil: message_start with the input side of the usage, one text block,
 * the JSON split three ways so no delta is a whole document (the client must
 * parse once at the end, never per delta), message_delta with the stop
 * reason and the output side, message_stop. The usage prices to about a cent
 * on Haiku, so the ledger and the meter have a figure to show.
 */
export function sseAnswer(text: string, stop = 'end_turn') {
	const third = Math.ceil(text.length / 3);
	let s = sseEvent('message_start', {
		type: 'message_start',
		message: {
			id: 'msg_canned', type: 'message', role: 'assistant', model: 'canned', content: [], stop_reason: null,
			usage: { input_tokens: 900, cache_creation_input_tokens: 2000, cache_read_input_tokens: 0, output_tokens: 1 }
		}
	});
	s += sseEvent('content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } });
	s += sseEvent('ping', { type: 'ping' });
	s += sseEvent('content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: text.slice(0, third) } });
	s += sseEvent('content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: text.slice(third, 2 * third) } });
	s += sseEvent('content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: text.slice(2 * third) } });
	s += sseEvent('content_block_stop', { type: 'content_block_stop', index: 0 });
	s += sseEvent('message_delta', { type: 'message_delta', delta: { stop_reason: stop, stop_sequence: null }, usage: { output_tokens: 500 } });
	s += sseEvent('message_stop', { type: 'message_stop' });
	return s;
}
