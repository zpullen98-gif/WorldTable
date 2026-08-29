/**
 * The Outside Of Time shared layer, as this wing sees it.
 *
 * `window.OOT` is installed by the monorepo's shared/*.js scripts and is ABSENT
 * in the standalone build: static/shared/ here carries only oot-home.css. So
 * every member is optional and every caller must cope with the whole object
 * being undefined. src/lib/profiles.ts is the only place that reads it.
 *
 * THIS IS THE ONLY DECLARATION OF window.OOT. There used to be a second, much
 * narrower one inside src/lib/persistence/db.ts, describing profiles as
 * `{ key(base: string): string }` and nothing else. Two declarations of the
 * same property do not merge into a union: TypeScript raises TS2717
 * ("Subsequent property declarations must have the same type"), so adding a
 * wider one elsewhere is a compile error rather than a widening. Keep it here.
 *
 * Names are copied from the export block of shared/oot-profiles.js. `switch` is
 * a reserved word and is quoted there; it is quoted here for the same reason.
 */

interface OotProfile {
	id: string;
	name: string;
	created: number;
	lastSeen: number;
	/** The device's pre-profile progress, kept under the unnamespaced keys. */
	legacy?: boolean;
	lastDay?: string;
	/** wing -> stepId -> timestamp. WRITE-ONCE per step; there is no unmark. */
	path?: Record<string, Record<string, number>>;
}

interface OotProfiles {
	list(): OotProfile[];
	current(): OotProfile | null;
	get(id: string): OotProfile | undefined;
	add(name: string): OotProfile;
	rename(id: string, name: string): boolean;
	remove(id: string): boolean;
	adopt(name: string): OotProfile | null;
	touch(): void;
	/** Namespaces a storage key to the current person. Read at CALL time. */
	key(base: string): string;
	pathDone(wing: string, stepId: string, id?: string): boolean;
	/** Returns false if the step was already marked; there is no unmark. */
	markPathStep(wing: string, stepId: string): boolean;
	pathProgress(wing: string, id?: string): number;
	isManagerDevice(): boolean;
	setManagerDevice(on: boolean): boolean;
	exportProfile(id?: string): unknown;
	importProfile(blob: unknown): OotProfile | null;
	markStudied(): void;
	streak(id?: string): number;
	studiedToday(): boolean;
	/**
	 * Fires IMMEDIATELY with current() on registration, then on every change of
	 * the current profile. Returns an unsubscribe. Handlers must be idempotent.
	 *
	 * It does NOT fire when a profile is added, renamed, or when a path step is
	 * marked in another tab: only when `current` itself changed.
	 */
	onChange(fn: (p: OotProfile | null) => void): () => void;
	switch(id: string): boolean;
}

interface Window {
	OOT?: {
		profiles?: OotProfiles;
		log?: unknown;
		gate?: unknown;
		pass?: unknown;
		auth?: unknown;
	};
}
