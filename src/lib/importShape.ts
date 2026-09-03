/**
 * Shape guards for a hand-edited `.wtjson`, shared by the two places a file
 * gets read: describeImport (the banner, portable.ts) and mergeSessions (the
 * write, state.ts). One set of rules, so the count and the write can never
 * disagree about what counts as "an array" or "a record".
 *
 * `?? []` and `?? {}` only cover `null`/`undefined`. Measured against
 * describeImport: a `.wtjson` whose `menu`, `pantry`, `menuDishes` or `waste`
 * was hand-typed as a scalar threw a raw TypeError into the import banner
 * (`(incoming.menu ?? []).filter is not a function`). Worse, and silent:
 * `notes` or `shoppingChecks` typed as a STRING throws nothing at all, because
 * `Object.keys('ab')` and `{...'ab'}` both succeed and produce `{0:'a',1:'b'}`
 * - a two-character string becomes two junk notes, counted, banner-announced
 * ("2 new notes"), and written to disk.
 */

/** @returns `v` if it is a real array, else an empty one. */
export function asArray<T>(v: unknown): T[] {
	return Array.isArray(v) ? (v as T[]) : [];
}

/**
 * @returns `v` if it is a plain record - an object, and specifically not an
 * ARRAY, which `typeof [] === 'object'` also satisfies. `typeof` alone
 * already rejects the dangerous case a naive read misses: `Object.keys('ab')`
 * and `{...'ab'}` both treat a string as indexable and would silently mint
 * two junk notes out of a two-character string, but `typeof 'ab' === 'string'`,
 * not `'object'`, so this returns `{}` for it correctly without needing a
 * special case.
 */
export function asRecord<T>(v: unknown): Record<string, T> {
	if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, T>;
	return {};
}
