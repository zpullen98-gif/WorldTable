/**
 * The shared roster, as far as this wing needs it — and a working answer when
 * it is not there at all.
 *
 * `window.OOT.profiles` is installed by the monorepo. The standalone build has
 * no such object, so every function here returns something usable rather than
 * throwing: one unnamed person, no roster, no manager.
 *
 * The object is read at CALL time and never captured in a module-level const.
 * That is db.ts's KEY() pattern verbatim, and for its reason: the answer
 * changes the moment somebody taps a name, and a captured reference would keep
 * answering for whoever was there when this module first evaluated.
 *
 * Only the members this wing actually uses are re-exported. `subscribe` is
 * deliberately absent because it does not exist on OOT.profiles — the real name
 * is `onChange`, and calling the wrong one is a TypeError that would surface
 * only inside the monorepo and never in standalone dev or the e2e suite.
 */
import { browser } from '$app/environment';

/**
 * The live object, or null.
 *
 * Wrapped in try/catch because a hardened browser can throw on `window.OOT`
 * access itself, and losing the roster is survivable where throwing during
 * boot is not — the same defensiveness shared/oot-profiles.js applies to its
 * own localStorage reads.
 */
function api(): OotProfiles | null {
	try {
		return (browser && window.OOT && window.OOT.profiles) || null;
	} catch {
		return null;
	}
}

/** True when the shared layer is present — i.e. we are inside Outside Of Time. */
export function hasProfiles(): boolean {
	return api() !== null;
}

/**
 * Everyone on this device.
 *
 * NOTE: the shared implementation returns `data.list.slice()` — a SHALLOW copy
 * over live profile objects. Never assign to a member of a returned profile:
 * it mutates the in-memory roster with no write and no notification, appears to
 * persist, survives navigation, and is silently clobbered by the next real
 * write. Treat everything here as read-only.
 */
export function list(): readonly OotProfile[] {
	return api()?.list() ?? [];
}

export function current(): OotProfile | null {
	return api()?.current() ?? null;
}

export function get(id: string): OotProfile | undefined {
	return api()?.get(id);
}

/** The display name for whoever is here, standalone included. */
export function currentName(): string | null {
	return current()?.name ?? null;
}

/**
 * Is this the manager's device?
 *
 * False standalone, and false by default in the monorepo — it is opt-in per
 * device, because the tablet on the pass is not the manager's.
 */
export function isManagerDevice(): boolean {
	try {
		return api()?.isManagerDevice() ?? false;
	} catch {
		return false;
	}
}

export function pathDone(wing: string, stepId: string, id?: string): boolean {
	try {
		return api()?.pathDone(wing, stepId, id) ?? false;
	} catch {
		return false;
	}
}

/**
 * Mark an induction step.
 *
 * WRITE-ONCE: the shared implementation returns false if the step is already
 * set, and there is no unmark. Anything that can legitimately change — a
 * person's role, for instance — must NOT be stored here, or they would carry
 * every value they ever chose and nothing could say which is current.
 *
 * The write can also fail silently: the roster is one localStorage key shared
 * by five wings, and a kitchen iPad in private mode throws on write, which the
 * shared layer swallows. Never treat a true return as proof of persistence.
 */
export function markPathStep(wing: string, stepId: string): boolean {
	try {
		return api()?.markPathStep(wing, stepId) ?? false;
	} catch {
		return false;
	}
}

/**
 * Follow the current profile.
 *
 * Fires IMMEDIATELY with current() on registration, so the handler must be
 * idempotent. Returns an unsubscribe — a no-op standalone, so callers can wire
 * it unconditionally.
 *
 * It will NOT fire when a profile is added or when a path step is marked in
 * another tab; only a change of `current` reaches here.
 */
export function onChange(fn: (p: OotProfile | null) => void): () => void {
	const p = api();
	if (!p) return () => {};
	try {
		return p.onChange(fn);
	} catch {
		return () => {};
	}
}
