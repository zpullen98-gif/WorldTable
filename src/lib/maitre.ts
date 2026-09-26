/**
 * The Maître d', as this wing reaches her: a lazy loader and a typed facade
 * over `window.OOT.maitre`.
 *
 * THE CLIENT IS ONLINE ONLY AND IS NEVER IN THE BUNDLE. The client is
 * static/shared/oot-maitre.js, a classic script the three apps share
 * (canonical here, to be mirrored byte for byte to the hub), and on its own it is
 * about a third of the precache headroom. So it is not imported, not precached
 * (vite.config.ts globIgnores it) and not fetched until a door is pressed with
 * the device online. This module is the only place that fetches it, and
 * importing this module does nothing: every export is a call, and the first
 * call that needs her is the first request for the script. A route that
 * imported the client eagerly would put it in the /menu chunk for a family
 * member with no key who never uses it, and break the page offline for
 * everyone.
 *
 * TWO WAYS TO LOAD, ONE RESULT. Inside Outside Of Time the shared layer will
 * carry OOT.loadShared(name), a script tag beside the other shared scripts at
 * their ?v=; until it does, and in the standalone build always, a script tag
 * at ${base}/shared/oot-maitre.js does the same job, because the wing serves
 * this repository's static/ folder under /table. Either way the facade then
 * reads window.OOT.maitre at CALL time, never captured at module level
 * (profiles.ts's rule, for its reason: the object appears after this module
 * evaluated, and a captured null would answer for ever).
 *
 * WHAT THIS MODULE MAY KNOW WITHOUT HER. Two answers a screen needs before
 * anybody presses anything: is there a key on this device, and is the device
 * online. hasKey() reads the client's own slot ('oot-maitre-v1') for the one
 * field it needs and returns a boolean, never the key: the same question
 * settings.hasKey() answers, answered without fetching the client, so a
 * family device with no key never fetches it on load: its doors collapse to
 * one chip, and that chip fetches it only to draw her key screen, which
 * still sends nothing to Anthropic (tests/maitre.spec.ts pins the one fetch
 * and the zero requests). The slot name is the one coupling to the client
 * this module carries, and it is the plan's.
 *
 * NEVER THE KEY. Nothing here returns it, logs it or passes it on: the client
 * reads it from its slot and its funnel puts it in one header. The key is
 * outside every export (portable.ts never sees localStorage) and this module
 * keeps it that way by never holding it.
 *
 * Her copy is hers. Every sentence a person can meet at a door is either the
 * client's own (COPY and SCREEN in oot-maitre.js, read off the api) or one of
 * the three lines below that a screen needs BEFORE the client is here. They
 * are copied from the plan, not paraphrased, and the em dash is not used.
 */
import { browser } from '$app/environment';
import { base } from '$app/paths';
import type { MaitreBlock } from './persistence/state';

/** The client's slot. Read here for one boolean and nothing else. */
export const MAITRE_SLOT = 'oot-maitre-v1';
export const MAITRE_SCRIPT = 'oot-maitre.js';
/** The ids the client gives its two dialogs, so a door can wait for one to close. */
export const SETTINGS_DIALOG_ID = 'oot-maitre-settings';
export const CHAT_DIALOG_ID = 'oot-maitre-chat';
/** Fired on window when her settings dialog closes: a key may have arrived, a cap may have moved. */
export const MAITRE_CHANGED = 'oot-maitre-changed';

/* The three lines a screen shows before the client is here, verbatim. */
/** The funnel's own offline line, for a press that could not reach her (COPY.offline). */
export const OFFLINE_LINE = "The Maître d' is online only. Nothing was sent.";
/** The engine row with a key and no network. */
export const OFFLINE_HERE = "The Maître d' is online only. Read it here for now.";
/** A door that is not a reader, with a key and no network (SCREEN.offlineNow). */
export const OFFLINE_NOW = "The Maître d' is online only. This device is offline.";
/** The one chip every door collapses to on a device with no key. */
export const NOT_HERE_LINE = "The Maître d' is not here yet: bring her in ▸";

export type MaitreWing = 'table' | 'codex' | 'ledger';
export type MaitreTask = 'read' | 'enrich' | 'lines' | 'ask' | 'test' | 'cap';

export interface MaitreModel {
	id: string;
	label: string;
	character: string;
	/** Per million tokens: in, cache write, cache read, out. */
	usd: { in: number; cw: number; cr: number; out: number };
}

export interface MaitreLedgerEntry {
	at: string;
	wing: string;
	task: MaitreTask;
	model: string;
	in: number;
	cw: number;
	cr: number;
	out: number;
	fetches: number;
	usd: number;
}

/** settings.get(): the record without its key. The key never comes back through the api. */
export interface MaitreSettingsView {
	v: 1;
	models: { read: string; write: string; chat: string };
	capUsd: number;
	ledger: { month: string; usd: number; entries: MaitreLedgerEntry[]; past: Record<string, number> };
	testedAt?: string;
	testedOk?: boolean;
	fetchMode: string;
}

export interface MaitreEstimateInput {
	text?: string;
	chars?: number;
	lines?: number;
	url?: string;
	pdfPages?: number;
	images?: Array<{ width?: number; height?: number }>;
	items?: number;
}

export interface MaitreEstimate {
	task: string;
	model: string;
	label: string;
	tokensIn: number;
	tokensOut: number;
	usd: number;
	/** 'About $0.03 at Haiku 4.5', no full stop. */
	text: string;
}

export interface MaitreProgress {
	text: string;
}

export interface MaitreRunOptions {
	wing?: MaitreWing;
	onProgress?: (p: MaitreProgress) => void;
	/** The second tap on a request estimated over a dollar. */
	confirmed?: boolean;
}

/* ---- the flat desk the model fills (DESK_SCHEMA) ---------------------------
   Every field required, every value a string or a list of strings, no
   number, no nullable, and NO ALLERGEN PROPERTY: the client's validator
   refuses the whole answer if one appears anywhere. maitre-adopt.ts turns
   this into Layer 1's DeskFile so the review table sees one shape. */
export interface FlatDish {
	section: string;
	name: string;
	description: string;
	price: string;
	ingredientsNamed: string[];
	marks: string[];
	confidence: 'high' | 'low';
	raw: string;
}
export interface FlatWine {
	producer: string;
	name: string;
	vintage: string;
	region: string;
	grapes: string[];
	style: string;
	glass: string;
	bottle: string;
	/** One string per pour, measure and price together as printed: '5 oz 45.00'. */
	pours: string[];
	section: string;
	raw: string;
}
export interface FlatCocktail {
	name: string;
	spec: string[];
	price: string;
	section: string;
	method: string;
	glass: string;
	garnish: string;
	raw: string;
}
export interface FlatUnsure {
	raw: string;
	reason: string;
}
export interface FlatDesk {
	dishes: FlatDish[];
	wines: FlatWine[];
	cocktails: FlatCocktail[];
	unsure: FlatUnsure[];
}

/** One row the client's price check blanked: the price she gave was not on the page. */
export interface MaitreFlag {
	kind: 'dish' | 'wine' | 'cocktail';
	index: number;
	name: string;
	field: string;
	flag: string;
}

export interface MaitreProvenance {
	by: 'maitre';
	model: string;
	at: string;
	requestId: string;
	source: 'paste' | 'photo' | 'pdf' | 'link' | 'items';
	usage: unknown;
	usd: number;
	sourceHash?: string;
	sourceUrl?: string;
	/** 'unverified' when there was no text to check her prices against: a photograph, a PDF. */
	priceCheck?: 'verified' | 'unverified';
	photographs?: number;
	pages?: number;
	batches?: number;
	items?: number;
}

export interface MaitreReadResult {
	desk: FlatDesk;
	flags: MaitreFlag[];
	provenance: MaitreProvenance;
	/** The text her prices were checked against; '' for a photograph or a PDF. */
	sourceText: string;
}

/** A photograph already drawn down by the client, or a File for it to draw down. */
export type MaitreImage = Blob | { data: string; mediaType?: string; width?: number; height?: number };

export type MaitreReadInput =
	| { text: string }
	| { images: MaitreImage[] }
	| { pdf: Blob | ArrayBuffer | ArrayBufferView }
	| { url: string };

/** What she is shown of a record: the client whitelists these and never anything else. */
export interface MaitreItemIn {
	id: string;
	kind: 'dish' | 'wine' | 'cocktail';
	name: string;
	section?: string;
	description?: string;
	ingredients?: string[];
	ingredientsNamed?: string[];
	price?: string;
	marks?: string[];
	spec?: string[];
	baseSpirit?: string;
	producer?: string;
	vintage?: string;
	region?: string;
	grapes?: string[];
	style?: string;
	method?: string;
	glass?: string;
	garnish?: string;
	/** enrich only: the empty fields to fill. */
	fill?: string[];
}

/** The five lines a floor uses, by id, empty when there was nothing honest to write. */
export interface FloorLines {
	id: string;
	say: string;
	guest: string;
	why: string;
	pairs: string;
	origin: string;
}

export interface MaitreLinesResult {
	items: FloorLines[];
	/** A line emptied on the way in: it spoke of allergens. */
	flags: Array<{ id: string; field: string; flag: string }>;
	provenance: MaitreProvenance | null;
	usd: number;
}

export interface EnrichField {
	name: string;
	value: string[];
	from: 'menu' | 'canon' | 'none';
}
export interface EnrichItem {
	id: string;
	kind: 'dish' | 'wine' | 'cocktail';
	fields: EnrichField[];
}
export interface MaitreEnrichResult {
	items: EnrichItem[];
	flags: unknown[];
	provenance: MaitreProvenance | null;
	usd: number;
}

/**
 * A dish as the chat may see it. Built field by field by the caller, and the
 * caller is where the doctrine holds: NEVER `allergens`, never
 * `allergensCheckedAt`. `maitre` rides in whole because the client reads only
 * the kept lines out of it and its own sweep refuses the block it builds if a
 * forbidden key somehow appears.
 */
export interface MaitreHouseDish {
	id: string;
	name: string;
	section: string;
	description: string;
	ingredients: string[];
	price: string;
	maitre?: MaitreBlock;
}
export interface MaitreHouse {
	dishes: MaitreHouseDish[];
	wines?: unknown[];
	cocktails?: unknown[];
	/** The desk's other shares, by name only. */
	waiting?: Record<string, string[]>;
}

export interface MaitreChatOptions {
	house: MaitreHouse;
	wing?: MaitreWing;
	/** Keep this on {name} as {field}: the caller writes the record. A throw is shown as her "could not be kept" line. */
	onKeep?: (id: string, field: string, q: string, a: string) => void;
}

export interface MaitreAskResult {
	answer: string;
	model: string;
	usage: unknown;
	usd: number;
	requestId: string;
}

export interface MaitreApi {
	settings: {
		get(): MaitreSettingsView;
		set(patch: Partial<{ key: string; models: Partial<MaitreSettingsView['models']>; capUsd: number; fetchMode: string }>): MaitreSettingsView;
		forgetKey(): void;
		forgetAll(): void;
		hasKey(): boolean;
	};
	models: MaitreModel[];
	pricesDated: string;
	online(): boolean;
	test(key: string, opts?: { save?: boolean; wing?: MaitreWing }): Promise<{ ok: true; models: string[]; missing: string[] }>;
	estimate(task: MaitreTask, input?: MaitreEstimateInput): MaitreEstimate;
	/** '$0.38', or 'under a cent'. */
	money(usd: number): string;
	readMenu(input: MaitreReadInput, opts?: MaitreRunOptions): Promise<MaitreReadResult>;
	enrich(items: MaitreItemIn[], opts?: MaitreRunOptions): Promise<MaitreEnrichResult>;
	guestLines(items: MaitreItemIn[], opts?: MaitreRunOptions): Promise<MaitreLinesResult>;
	ask(
		question: string,
		history: Array<{ role: 'user' | 'assistant'; content: string }>,
		opts?: { house?: MaitreHouse; wing?: MaitreWing; confirmed?: boolean }
	): Promise<MaitreAskResult>;
	/** False where there is no document to draw into. */
	openSettings(): boolean;
	openChat(opts: MaitreChatOptions): boolean;
	ledger: {
		month(): string;
		total(): number;
		entries(): MaitreLedgerEntry[];
		remaining(): number;
		past(): Record<string, number>;
	};
	copy: Record<string, string>;
}

/**
 * What the client throws: an Error named MaitreError with a `code` and her
 * sentence in `message`. The codes a screen acts on: 'no-key' (she opened the
 * key screen herself), 'cap' (the refusal, with the figures), 'confirm' (a
 * request over a dollar wants a second tap), 'offline', and everything else,
 * whose message is shown as it is.
 */
export interface MaitreError extends Error {
	name: 'MaitreError';
	code: string;
	status?: number;
	detail?: unknown;
	used?: number;
	cap?: number;
	estimate?: number;
	would?: number;
	url?: string;
}

export function isMaitreError(e: unknown): e is MaitreError {
	return e instanceof Error && e.name === 'MaitreError' && typeof (e as MaitreError).code === 'string';
}

/** Her sentence, or the offline line for anything that is not hers: a failed script, a thrown fetch. */
export function maitreMessage(e: unknown): string {
	if (isMaitreError(e)) return e.message;
	return OFFLINE_LINE;
}

function offline(cause: string): MaitreError {
	const e = new Error(OFFLINE_LINE) as MaitreError;
	e.name = 'MaitreError';
	e.code = 'offline';
	e.detail = cause;
	return e;
}

/** True unless the browser says the device is off the network. Same test the client makes. */
export function online(): boolean {
	try {
		return !(browser && typeof navigator !== 'undefined' && navigator.onLine === false);
	} catch {
		return true;
	}
}

/**
 * Is there a key on this device. A boolean and nothing else: the key itself
 * is read only by the client. try/catch, because a hardened browser can throw
 * on localStorage itself and a door that cannot tell is a door that says no.
 */
export function hasKey(): boolean {
	if (!browser) return false;
	try {
		const raw = localStorage.getItem(MAITRE_SLOT);
		if (!raw) return false;
		const rec = JSON.parse(raw) as { key?: unknown } | null;
		return !!rec && typeof rec === 'object' && typeof rec.key === 'string' && rec.key.length > 0;
	} catch {
		return false;
	}
}

/** The client, if a door has already brought it in. Read at call time, never captured. */
export function installed(): MaitreApi | null {
	if (!browser) return null;
	try {
		return window.OOT?.maitre ?? null;
	} catch {
		return null;
	}
}

let pending: Promise<MaitreApi> | null = null;

/** Waits for the client to install itself after a loader that returned no promise. */
function untilInstalled(ms: number): Promise<MaitreApi> {
	return new Promise((resolve, reject) => {
		const started = Date.now();
		const tick = () => {
			const api = installed();
			if (api) return resolve(api);
			if (Date.now() - started > ms) return reject(new Error('the shared loader installed nothing'));
			setTimeout(tick, 50);
		};
		tick();
	});
}

function fetchClient(): Promise<MaitreApi> {
	const oot = window.OOT;
	const shared = oot?.loadShared;
	if (typeof shared === 'function') {
		// The hub's loader, once it exists: the script beside the other shared
		// scripts at their ?v=, so the lockstep bump keeps her fresh with them.
		return Promise.resolve(shared.call(oot, MAITRE_SCRIPT)).then(() => untilInstalled(15_000));
	}
	return new Promise((resolve, reject) => {
		const src = `${base}/shared/${MAITRE_SCRIPT}`;
		const s = document.createElement('script');
		s.src = src;
		s.async = true;
		s.onload = () => {
			const api = installed();
			if (api) resolve(api);
			else reject(new Error('the script ran and installed nothing'));
		};
		s.onerror = () => {
			// Taken out again so the next press can try afresh: a tag that failed
			// once and stayed would make a second attempt a no-op.
			s.remove();
			reject(new Error(`the script did not load: ${src}`));
		};
		document.head.appendChild(s);
	});
}

/**
 * Bring her in: the client, loaded once per page and shared by every door.
 * Refuses without a request when the device is offline, because the script
 * is not precached and a fetch for it would only fail slower. A failed load
 * clears the way for the next press rather than pinning the failure.
 */
export function loadMaitre(): Promise<MaitreApi> {
	const have = installed();
	if (have) return Promise.resolve(have);
	if (!browser) return Promise.reject(offline('no window'));
	if (!online()) return Promise.reject(offline('the device is offline'));
	if (!pending) {
		pending = fetchClient().catch((e: unknown) => {
			pending = null;
			throw offline(e instanceof Error ? e.message : String(e));
		});
	}
	return pending;
}

/** Resolves when the dialog with that id is closed, at once if it is not open. */
export function whenClosed(id: string): Promise<void> {
	return new Promise((resolve) => {
		const el = browser ? document.getElementById(id) : null;
		if (!(el instanceof HTMLDialogElement) || !el.open) return resolve();
		el.addEventListener('close', () => resolve(), { once: true });
	});
}

/**
 * Her key screen, and the wait for it to close. Every door on the page
 * listens for MAITRE_CHANGED so a key pasted at one door lights the others,
 * and so a raised cap moves every estimate line at once.
 */
export async function openSettings(): Promise<void> {
	const api = await loadMaitre();
	if (!api.openSettings()) return;
	await whenClosed(SETTINGS_DIALOG_ID);
	window.dispatchEvent(new Event(MAITRE_CHANGED));
}

/** Ask the Maître d': the chat dialog, drawn by the client. */
export async function openChat(opts: MaitreChatOptions): Promise<void> {
	const api = await loadMaitre();
	api.openChat(opts);
}
