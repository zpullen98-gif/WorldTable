/**
 * Schema migrations. Append-only: never edit a migration that has shipped, or
 * you change the meaning of data already sitting on someone's disk.
 */
import { CURRENT_VERSION, EMPTY_SESSION, mergeStepWindow, type SessionState } from './state';

type Migration = (state: Record<string, unknown>) => Record<string, unknown>;

/** Index N upgrades version N -> N+1. */
const MIGRATIONS: Migration[] = [
	// 0 -> 1: the shape written by the very first build. Nothing to change yet;
	// the entry exists so version 0 blobs are recognised rather than rejected.
	(s) => ({ ...s, schemaVersion: 1 })
];

/**
 * Thrown for a record written by a NEWER build. Typed so the write path can
 * tell "refuse, and hold" apart from a genuinely broken record.
 */
export class NewerVersionError extends Error {
	found: number;
	constructor(found: number) {
		super(`session was written by a newer version (v${found} > v${CURRENT_VERSION})`);
		this.name = 'NewerVersionError';
		this.found = found;
	}
}

/**
 * Recipe slugs that changed address, old to new. PERMANENT.
 *
 * tools/slugify.mjs used to fold accents by NFD-normalising and dropping the
 * combining marks, which works only for letters Unicode will take apart: ø, æ,
 * ı, ł and ð are single codepoints, fell through to the [^a-z0-9] sweep and
 * became hyphens. Smørrebrød was /recipe/sm-rrebr-d and Mantı was /recipe/mant.
 * The transliteration fix (commit 5ef6984) moved 22 pages, and those 22 old
 * spellings are the only ones the live site ever served, so every pin, note,
 * cook, step timing and menu-dish pointer written against them since the site
 * went live is keyed on a slug no recipe has any more. The guest menu drops the
 * pin (bySlug.get returns undefined and .filter(Boolean) hides it), the
 * Repertoire stops showing the cook, the note is unreachable. Nothing is
 * destroyed; it becomes unreachable, which is the same thing to a cook.
 *
 * Applied on EVERY load, not as a numbered migration step, for the reason
 * normaliseCosting() gives: bumping CURRENT_VERSION would arm the hold-and-
 * refuse path for the first time in this app's life, and this is a rename,
 * not a shape change. It is idempotent (a new slug maps to itself) and cheap.
 * It is also applied inside the .wtjson import path, because a file exported
 * from the live site today carries the old slugs, and will for as long as
 * anyone keeps the file. That is why the map never goes away.
 */
export const SLUG_RENAMES: ReadonlyMap<string, string> = new Map([
	['imam-bay-ld', 'imam-bayildi'],
	['mercimek-corbas', 'mercimek-corbasi'],
	['k-ymal-pide', 'kiymali-pide'],
	['mant', 'manti'],
	['c-lb-r', 'cilbir'],
	['f-st-kl-baklava', 'fistikli-baklava'],
	['sm-rrebr-d', 'smorrebrod'],
	['bleskiver', 'aebleskiver'],
	['kayseri-mant-s', 'kayseri-mantisi'],
	['rugbr-d', 'rugbrod'],
	['dyrl-gens-natmad', 'dyrlaegens-natmad'],
	['stegt-fl-sk-med-persillesovs', 'stegt-flaesk-med-persillesovs'],
	['fl-skesteg-med-spr-d-sv-r', 'flaeskesteg-med-sprod-svaer'],
	['risalamande-med-kirseb-rsauce', 'risalamande-med-kirsebaersauce'],
	['dr-mmekage-fra-brovst', 'drommekage-fra-brovst'],
	['rugbrau', 'rugbraud'],
	['r-mmegr-t', 'rommegrot'],
	['go-abki-w-sosie-pomidorowym', 'golabki-w-sosie-pomidorowym'],
	['po-gesek', 'polgesek'],
	['pinnekj-tt', 'pinnekjott'],
	['rullep-lse', 'rullepolse'],
	['bondepige-med-sl-r', 'bondepige-med-slor']
]);

/** The current spelling of a recipe slug; anything not renamed is itself. */
export function renameSlug(slug: string): string {
	return SLUG_RENAMES.get(slug) ?? slug;
}

/**
 * The menu hash is the sorted menu joined on '|' (menu/+page.svelte), so a
 * renamed pin changes the hash and would orphan every shopping tick and the
 * live service run keyed on it. Re-keyed here so a tick survives its dish
 * being renamed underneath it.
 */
function renameMenuHash(hash: string): string {
	return hash.split('|').map(renameSlug).sort().join('|');
}

/** A `slug#index#stepCount` key, with only the slug part renamed. */
function renameStepKey(key: string): string {
	const at = key.indexOf('#');
	if (at === -1) return renameSlug(key);
	return renameSlug(key.slice(0, at)) + key.slice(at);
}

/**
 * Every place a session keys on a recipe slug, brought to the current
 * spelling. Pure, idempotent, and tolerant of a partial or hand-edited record:
 * a field that is not the shape it should be is left exactly as it was, for
 * mergeSessions' asArray/asRecord guards to deal with.
 *
 * Collisions are merged rather than dropped. A note under both spellings
 * (typed once before the rename and once after) joins the two texts; two step
 * windows for one key merge the way an import merges them. Nothing a cook
 * wrote is thrown away by a rename.
 */
export function remapSessionSlugs<T extends Partial<SessionState>>(state: T): T {
	if (!state || typeof state !== 'object') return state;
	const out: Record<string, unknown> = { ...state };

	if (Array.isArray(state.menu)) {
		out.menu = [...new Set(state.menu.map((s) => (typeof s === 'string' ? renameSlug(s) : s)))];
	}

	if (state.notes && typeof state.notes === 'object' && !Array.isArray(state.notes)) {
		const notes: Record<string, string> = {};
		for (const [k, v] of Object.entries(state.notes)) {
			const key = renameSlug(k);
			notes[key] = key in notes && notes[key] !== v ? `${notes[key]}\n\n${v}` : v;
		}
		out.notes = notes;
	}

	if (state.stepActuals && typeof state.stepActuals === 'object' && !Array.isArray(state.stepActuals)) {
		const actuals: Record<string, number[]> = {};
		for (const [k, arr] of Object.entries(state.stepActuals)) {
			const key = renameStepKey(k);
			actuals[key] = key in actuals && Array.isArray(arr) ? mergeStepWindow(actuals[key], arr) : arr;
		}
		out.stepActuals = actuals;
	}

	if (state.shoppingChecks && typeof state.shoppingChecks === 'object' && !Array.isArray(state.shoppingChecks)) {
		const checks: Record<string, string[]> = {};
		for (const [hash, lines] of Object.entries(state.shoppingChecks)) {
			const key = renameMenuHash(hash);
			checks[key] =
				key in checks && Array.isArray(lines) ? [...new Set([...checks[key], ...lines])] : lines;
		}
		out.shoppingChecks = checks;
	}

	if (Array.isArray(state.cookedLog)) {
		out.cookedLog = state.cookedLog.map((e) =>
			e && typeof e.slug === 'string' ? { ...e, slug: renameSlug(e.slug) } : e
		);
	}

	if (Array.isArray(state.menuDishes)) {
		out.menuDishes = remapDishSlugs(state.menuDishes);
	}

	if (state.planRun && typeof state.planRun === 'object' && typeof state.planRun.menuHash === 'string') {
		const ticks: Record<string, number> = {};
		for (const [k, at] of Object.entries(state.planRun.ticks ?? {})) {
			// Row keys are `slug-n`; the slug is everything before the last dash.
			const dash = k.lastIndexOf('-');
			ticks[dash === -1 ? renameSlug(k) : renameSlug(k.slice(0, dash)) + k.slice(dash)] = at;
		}
		out.planRun = { ...state.planRun, menuHash: renameMenuHash(state.planRun.menuHash), ticks };
	}

	return out as T;
}

/** The menu dishes' pointers into the guide, for the house record and the session transport alike. */
export function remapDishSlugs<D extends { recipeSlug?: string }>(dishes: D[]): D[] {
	return dishes.map((d) =>
		d && typeof d === 'object' && typeof d.recipeSlug === 'string' && SLUG_RENAMES.has(d.recipeSlug)
			? { ...d, recipeSlug: renameSlug(d.recipeSlug) }
			: d
	);
}

export function migrate(raw: Partial<SessionState>): SessionState {
	let version = typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 0;

	if (version > CURRENT_VERSION) {
		// Written by a newer build. Refuse rather than guess, and critically,
		// refuse without overwriting, so downgrading and upgrading again is safe.
		throw new NewerVersionError(version);
	}

	let state = raw as Record<string, unknown>;
	while (version < CURRENT_VERSION) {
		state = MIGRATIONS[version](state);
		version++;
	}

	// The slug rename runs on every load, whatever the version. See SLUG_RENAMES.
	state = remapSessionSlugs(state as Partial<SessionState>) as Record<string, unknown>;

	// Merge over defaults so a field added in a later build is present even in a
	// session that predates it.
	return { ...structuredClone(EMPTY_SESSION), ...(state as Partial<SessionState>), schemaVersion: CURRENT_VERSION };
}

export type HeldReason = 'newer' | 'unrecognised' | 'unreadable';
export type SessionRead =
	| { state: SessionState; held: false }
	| { state: SessionState; held: true; reason: HeldReason };

/**
 * Read a stored record, or refuse it - the readHouse shape, for the session.
 *
 * `held` means: this build must not read it and must NEVER write over it.
 * The promise migrate() made above - "refuse without overwriting, so
 * downgrading and upgrading again is safe" - was being broken by its own
 * caller: loadSession caught the throw, snapshotted the record under a
 * corrupt.* key nothing reads, returned an empty session, and the very next
 * tap persisted that empty over the real record. Reproduced end to end: tick
 * 'Chicken', bump the stored version to 2, reload, tick 'Beef' - and Chicken
 * is gone from the live key.
 *
 * house.ts fixed the same defect for the house record and said so ("db.ts's
 * session path already had the right instinct and this did not follow it").
 * This follows it. A held read hands back an EMPTY session and never the
 * newer record's content, so nothing this build does not understand leaks
 * into a page.
 *
 * The bound is "anything not positively recognised": a version this build has
 * never seen is `newer`; a version that is not a number at all is
 * `unrecognised` (migrate's `: 0` coercion is kept for the ONE case its
 * comment justifies - a record predating the field); a record a migration
 * step cannot process is `unreadable`.
 */
export function readSession(raw: unknown): SessionRead {
	const empty = () => structuredClone(EMPTY_SESSION);
	if (!raw || typeof raw !== 'object') return { state: empty(), held: false };
	const v = (raw as { schemaVersion?: unknown }).schemaVersion;
	if (v !== undefined && typeof v !== 'number') return { state: empty(), held: true, reason: 'unrecognised' };
	if (typeof v === 'number' && v > CURRENT_VERSION) return { state: empty(), held: true, reason: 'newer' };
	try {
		return { state: migrate(raw as Partial<SessionState>), held: false };
	} catch {
		return { state: empty(), held: true, reason: 'unreadable' };
	}
}

/**
 * The legacy importer for the original app's "session code".
 *
 * That was `btoa(JSON.stringify({menu, notes, pantry, fam, day, hemi}))` behind a
 * `WT1.` prefix (L3501), with menu and notes keyed by ARRAY INDEX into the recipe
 * list. Indices are exactly why this format had to die: adding a single family
 * recipe pushed onto the array and silently repointed every saved reference. So
 * the import resolves indices through the recipe order they were written
 * against, and reports anything it cannot place instead of dropping it.
 */
export interface LegacyImport {
	state: Partial<SessionState>;
	unresolved: string[];
}

export function importLegacyCode(
	code: string,
	orderedSlugs: string[],
	pantryLabels: Set<string>
): LegacyImport {
	const trimmed = code.trim();
	if (!trimmed.startsWith('WT1.')) throw new Error('Not a WT1 session code');

	let payload: {
		menu?: number[];
		notes?: Record<string, string>;
		pantry?: string[];
		fam?: unknown[];
		hemi?: string;
	};
	try {
		payload = JSON.parse(atob(trimmed.slice(4)));
	} catch {
		throw new Error('Session code is not readable: it may have been truncated in transit');
	}

	const unresolved: string[] = [];
	const at = (i: number) => {
		const slug = orderedSlugs[i];
		if (!slug) unresolved.push(`recipe #${i}`);
		return slug;
	};

	const menu = (payload.menu ?? []).map(at).filter((s): s is string => Boolean(s));

	const notes: Record<string, string> = {};
	for (const [k, v] of Object.entries(payload.notes ?? {})) {
		const slug = at(Number(k));
		if (slug) notes[slug] = v;
	}

	const pantry = (payload.pantry ?? []).filter((l) => {
		if (pantryLabels.has(l)) return true;
		unresolved.push(`pantry “${l}”`);
		return false;
	});

	return { state: { menu, notes, pantry }, unresolved };
}
