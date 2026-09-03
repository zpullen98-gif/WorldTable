/**
 * What `wt.prefs.v1` is allowed to say.
 *
 * The store read it back with `{ ...DEFAULTS, ...parsed }`, which is a spread,
 * not a check: whatever the key held became the preference. localStorage is the
 * one store here a person can open a console and edit, and it is also the one
 * that survives every other kind of reset.
 *
 * TWO CALL SITES DISAGREED ABOUT THE SAME STORED BYTE. The inline script in
 * src/app.html - which paints before first paint, and is the whole reason these
 * four live in localStorage at all - guards properly:
 *
 *     if (p.service === 'day' || p.service === 'night')
 *
 * so a stored `service: "dusk"` leaves `data-service` unset and the CSS default
 * paints. The store then returned `service: "dusk"` from the same bytes, which
 * is truthy, so `resolvedService` answered "dusk", the toggle computed its
 * opposite from it, and the next `setService` wrote `data-service="dusk"` onto
 * an element the boot script had deliberately left alone. One value, two
 * readings, and the disagreement only shows up as a theme that will not toggle.
 *
 * Pure and outside the runes store on purpose, per the rule the rest of this
 * codebase follows: a validator vitest cannot reach is a validator nobody
 * checks. Per-FIELD fallback rather than all-or-nothing, because a person whose
 * units got corrupted should not also lose their hemisphere.
 */
export type Service = 'day' | 'night';
export type Units = 'metric' | 'us';
export type Hemisphere = 'N' | 'S';

export interface Prefs {
	schemaVersion: number;
	/** null means "follow prefers-color-scheme", and is a real value here. */
	service: Service | null;
	units: Units;
	hemisphere: Hemisphere;
}

export const PREFS_VERSION = 1;

export const DEFAULTS: Prefs = {
	schemaVersion: PREFS_VERSION,
	service: null,
	units: 'metric',
	hemisphere: 'N'
};

/** Exactly the test app.html makes, so the two sites cannot drift apart. */
export const isService = (v: unknown): v is Service => v === 'day' || v === 'night';
const isUnits = (v: unknown): v is Units => v === 'metric' || v === 'us';
const isHemisphere = (v: unknown): v is Hemisphere => v === 'N' || v === 'S';

/**
 * @param parsed whatever JSON.parse returned, which is to say anything at all
 */
export function sanitizePrefs(parsed: unknown): Prefs {
	if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ...DEFAULTS };
	const p = parsed as Record<string, unknown>;

	/*
	 * An unknown FUTURE version keeps its old behaviour: do not guess at its
	 * shape, use defaults for this session, and above all do not persist over
	 * what a newer build wrote.
	 */
	if (typeof p.schemaVersion === 'number' && p.schemaVersion > PREFS_VERSION) {
		return { ...DEFAULTS };
	}

	return {
		schemaVersion: PREFS_VERSION,
		// `null` is a value, not an absence: it means follow the OS. Anything
		// that is neither null nor a known service falls back to it, which is
		// also what app.html does by leaving data-service unset.
		service: p.service === null || isService(p.service) ? (p.service as Service | null) : null,
		units: isUnits(p.units) ? p.units : DEFAULTS.units,
		hemisphere: isHemisphere(p.hemisphere) ? p.hemisphere : DEFAULTS.hemisphere
	};
}
