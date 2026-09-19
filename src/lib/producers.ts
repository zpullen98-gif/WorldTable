/**
 * The house's producers: who grows it, makes it, lands it or mills it.
 *
 * WHY THIS EXISTS. The owner photographed a staff training packet that listed
 * four creameries and a farm as "cheeses". They are this venue's suppliers,
 * not vocabulary every kitchen shares, so they came out of the Floor Deck, and
 * they needed somewhere to go: a server who can say where the cheese on the
 * board comes from, and one true sentence about the people who made it, sells
 * the board. So My Menu gets a place to write them down, study them, and tie
 * them to the dishes they are on. Nothing is seeded; a venue types its own.
 *
 * WHAT A PRODUCER IS. The basics (name, where, what kind, what they supply),
 * the story a server can tell, and the dishes it is on. No per-product cards:
 * "what they supply" is one line of free text, because the venue knows what it
 * buys and a product catalogue is a second menu nobody will keep current.
 *
 * WHY THE LINK LIVES HERE, ON THE PRODUCER, AND NOT ON THE DISH. saveDish() in
 * routes/menu/+page.svelte rebuilds a MenuDish field by field from the form,
 * so any pointer stored on the dish that the form does not carry is silently
 * dropped by the very next edit of that dish. That exact trap once lost
 * `Prep.station`: displayed, stored, and wiped by an unrelated save. A dish
 * edit never touches this record, so a link kept here cannot be lost that way.
 *
 * On the HOUSE record for the reason the menu is: who supplies the venue is a
 * fact about the venue, not about whoever is holding the tablet.
 *
 * Pure, and outside any component, for the reason lineup.ts and waste.ts are:
 * a runes module is unreachable from a unit test.
 */

export type ProducerKind = 'creamery' | 'farm' | 'fishery' | 'mill' | 'other';

/** In the order the form offers them, with the words it offers them in. */
export const PRODUCER_KINDS: ReadonlyArray<{ kind: ProducerKind; label: string }> = [
	{ kind: 'creamery', label: 'Creamery' },
	{ kind: 'farm', label: 'Farm' },
	{ kind: 'fishery', label: 'Fishery' },
	{ kind: 'mill', label: 'Mill' },
	{ kind: 'other', label: 'Other' }
];

const KINDS = new Set<string>(PRODUCER_KINDS.map((k) => k.kind));

export interface Producer {
	/** 'pr-' + base36, minted once at first save, never recomputed. */
	id: string;
	/** Required, trimmed. */
	name: string;
	/** "Thomasville, Georgia". Free text, may be empty. */
	place: string;
	kind: ProducerKind;
	/** "the Green Hill and the Thomasville Tomme". Free text, may be empty. */
	supplies: string;
	/** A few sentences a server can tell at the table. May be empty. */
	story: string;
	/** The menu dishes this producer is on. THE LINK LIVES HERE: see the header. */
	dishIds: string[];
	/** ms epoch of the last edit. The merge's tiebreak. */
	ts: number;
}

export function kindLabel(kind: ProducerKind): string {
	return PRODUCER_KINDS.find((k) => k.kind === kind)?.label ?? 'Other';
}

const str = (v: unknown) => (typeof v === 'string' ? v : '');

/**
 * Whatever was on disk or in a file, as a clean producer, or null.
 *
 * A row with no string id or no name is dropped rather than repaired: minting
 * an id here would make the same hand-edited row a NEW producer on every read,
 * and a producer called "" is a blank line on a page a server studies from.
 * Everything else is coerced: missing text becomes '', an unknown kind becomes
 * 'other', and the dish list keeps only strings, once each.
 */
export function normaliseProducer(x: unknown): Producer | null {
	if (!x || typeof x !== 'object') return null;
	const r = x as Record<string, unknown>;
	if (typeof r.id !== 'string' || !r.id) return null;
	const name = str(r.name).trim();
	if (!name) return null;
	const kind = typeof r.kind === 'string' && KINDS.has(r.kind) ? (r.kind as ProducerKind) : 'other';
	const dishIds = Array.isArray(r.dishIds)
		? [...new Set(r.dishIds.filter((d): d is string => typeof d === 'string' && d.length > 0))]
		: [];
	return {
		id: r.id,
		name,
		place: str(r.place).trim(),
		kind,
		supplies: str(r.supplies).trim(),
		story: str(r.story).trim(),
		dishIds,
		ts: typeof r.ts === 'number' && Number.isFinite(r.ts) ? r.ts : 0
	};
}

/** A whole list, cleaned. A non-array is an empty list; a duplicate id keeps its first row. */
export function normaliseProducers(raw: unknown): Producer[] {
	if (!Array.isArray(raw)) return [];
	const seen = new Set<string>();
	const out: Producer[] = [];
	for (const x of raw) {
		const p = normaliseProducer(x);
		if (!p || seen.has(p.id)) continue;
		seen.add(p.id);
		out.push(p);
	}
	return out;
}

/**
 * Two devices' producers, as one: a union by id, the newer `ts` winning.
 *
 * The same rule preps follow in adoptImport, and for the same reason: a
 * producer is edited whole in one form, so there is no finer unit to merge.
 * A tie keeps mine, so importing a file twice changes nothing. Order is
 * stable: mine in my order (a replaced producer keeps its place), then theirs
 * that I did not have, in their order.
 *
 * A deletion does not travel, the waste log's trade: a second device still
 * holding the producer brings it back on the next import.
 *
 * THE DISH LINKS GO WITH THE WINNER, and that is a trade too. They ride inside
 * the record, so a link ticked on one tablet is lost if the same producer was
 * edited later on another (a typo fixed in the story), in both directions. A
 * union of dishIds would keep it, but then an UN-tick could never travel, and
 * a stale "From ..." line is a wrong fact said to a guest, where a missing one
 * is only a line not said. The one case that union was needed for, a dish
 * arriving through the import with its credits, is handled apart: see
 * relinkArrivals.
 */
export function mergeProducers(mine: unknown, theirs: unknown): Producer[] {
	const byId = new Map<string, Producer>();
	for (const p of normaliseProducers(mine)) byId.set(p.id, p);
	for (const p of normaliseProducers(theirs)) {
		const have = byId.get(p.id);
		if (!have || p.ts > have.ts) byId.set(p.id, p);
	}
	return [...byId.values()];
}

/**
 * A dish that ARRIVED through an import (new to this device, or deleted here
 * and brought back, since adoptImport resurrects dishes) keeps the credits the
 * file gave it, even where my copy of the producer won the merge.
 *
 * Without this, deleting a dish here prunes it off its producers (pruneDish,
 * which does not restamp), and importing the other tablet's file brings the
 * dish back with a tie on the producer's ts that keeps MY unlinked copy: the
 * dish returns uncredited here while the other tablet still credits it. The
 * dish comes back as the file has it, so its credits come back as the file
 * has them too.
 *
 * `ts` is not restamped, so both tablets end on the same record. Returns the
 * same array when nothing changed.
 */
export function relinkArrivals(
	merged: Producer[],
	theirs: unknown,
	arrived: ReadonlySet<string>
): Producer[] {
	if (!arrived.size) return merged;
	const theirById = new Map(normaliseProducers(theirs).map((p) => [p.id, p]));
	let changed = false;
	const next = merged.map((p) => {
		const extra = (theirById.get(p.id)?.dishIds ?? []).filter(
			(d) => arrived.has(d) && !p.dishIds.includes(d)
		);
		if (!extra.length) return p;
		changed = true;
		return { ...p, dishIds: [...p.dishIds, ...extra] };
	});
	return changed ? next : merged;
}

/** Who is on this dish, in the order the producers list them. */
export function producersForDish(list: readonly Producer[], dishId: string): Producer[] {
	return list.filter((p) => p.dishIds.includes(dishId));
}

/**
 * Take a removed dish off every producer.
 *
 * Returns the SAME array when no producer carried it, the identity the store's
 * no-op checks read (recordItemPrice's `next === this.#r.items`), so removing a
 * dish nobody supplies does not hand a fresh array to every reader of the list.
 *
 * `ts` is NOT restamped: restamping would let this device's producer beat a
 * real edit made to the same producer elsewhere, for nothing more than a dish
 * having been deleted here. An import can bring the dish back (adoptImport
 * resurrects dishes), and then this device's unstamped copy ties and wins, so
 * relinkArrivals restores the file's credit for any dish the import brought.
 */
export function pruneDish(list: Producer[], dishId: string): Producer[] {
	if (!list.some((p) => p.dishIds.includes(dishId))) return list;
	return list.map((p) =>
		p.dishIds.includes(dishId) ? { ...p, dishIds: p.dishIds.filter((d) => d !== dishId) } : p
	);
}

/**
 * After this, exactly the named producers carry the dish.
 *
 * Called by the dish form on save. Only a producer whose membership CHANGED is
 * touched and restamped: a dish saved with the same producers ticked changes
 * nothing, and a producer nobody edited must not start winning merges because
 * a dish beside it was saved. Returns the same array when nothing changed.
 */
export function setDishProducers(
	list: Producer[],
	dishId: string,
	producerIds: readonly string[],
	now: number
): Producer[] {
	const want = new Set(producerIds);
	let changed = false;
	const next = list.map((p) => {
		const has = p.dishIds.includes(dishId);
		const should = want.has(p.id);
		if (has === should) return p;
		changed = true;
		return {
			...p,
			dishIds: should ? [...p.dishIds, dishId] : p.dishIds.filter((d) => d !== dishId),
			ts: now
		};
	});
	return changed ? next : list;
}

/**
 * 'pr-' and eight base36 characters: the mint the dish and prep forms use,
 * with its own prefix so a producer id can never be mistaken for either.
 * `taken` is checked because a clash would make two producers one on the next
 * merge; at 36^8 it is belt and braces.
 */
export function mintProducerId(taken: Iterable<string> = [], rand: () => number = Math.random): string {
	const used = new Set(taken);
	let s: string;
	do {
		s = 'pr-';
		while (s.length < 11) s += Math.floor(rand() * 36).toString(36);
	} while (used.has(s));
	return s;
}

/** One producer as the dish card names it: "Sweet Grass Dairy, Thomasville, Georgia". */
function credit(p: Producer): string {
	return p.place ? `${p.name}, ${p.place}` : p.name;
}

/**
 * The line on a dish card: "From Sweet Grass Dairy, Thomasville, Georgia".
 *
 * Several are joined the way a person says them. A place usually carries its
 * own comma ("Thomasville, Georgia"), so once three or more are listed and any
 * has a place, semicolons separate them, or the list would read as one
 * producer too many. Empty when the dish has none, and the card then says
 * nothing.
 */
export function fromLine(list: readonly Producer[]): string {
	const parts = list.map(credit);
	if (!parts.length) return '';
	if (parts.length === 1) return `From ${parts[0]}`;
	if (parts.length === 2) return `From ${parts[0]} and ${parts[1]}`;
	const sep = list.some((p) => p.place) ? '; ' : ', ';
	const last = sep === '; ' ? '; and ' : ' and ';
	return `From ${parts.slice(0, -1).join(sep)}${last}${parts[parts.length - 1]}`;
}
