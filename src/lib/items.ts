/**
 * The item book: what the venue buys, and what it has cost over time.
 *
 * ## Why this exists
 *
 * `unitCost` is stored per line per dish, and `editLine` patches it in place.
 * So when butter goes from 6.40 to 7.90, the 6.40 does not exist anywhere
 * afterwards: not on the line, not on the dish, not in the record. The guide's
 * own advice in "Menu Economics" is *"reprice quarterly against invoice creep;
 * menus that sleep bleed"*, and following it was structurally impossible: there
 * was nothing to compare this quarter against. Worse, butter is free text, so
 * the same purchase is fourteen unrelated strings on fourteen dishes and
 * repricing it means finding all fourteen by eye.
 *
 * The sentence this whole module exists to be able to say:
 *
 *   *"Butter is used in 14 dishes. 3 have moved out of the 25-35% band."*
 *
 * ## NEVER MANDATORY
 *
 * A one-off truffle stays free text. If linking an item were required, a
 * ten-minute costing would become an afternoon of master data and the sheet
 * would stop being opened at all, which costs the venue far more than the
 * missing history ever could. The book fills itself from what has already been
 * typed: the datalist is the entire onboarding.
 *
 * Pure and outside any component, for the same reason costing.ts and pass.ts
 * are: this is arithmetic somebody will make decisions with.
 */
import type { CostLine, PricedItem, BandVerdict } from './costing';

/**
 * One observation of what a thing cost, as invoiced.
 *
 * `at` is the observation time, not an edit stamp, and that distinction is the
 * whole record: two devices pricing the same item on different days hold two
 * facts, not a disagreement.
 */
export interface ItemPrice {
	unitCost: number;
	/** The purchase unit this price was for: kg, litre, each, case. */
	unit: string;
	/** ms epoch. */
	at: number;
}

/**
 * One yield test: what went on the scale, and what was left when the trim,
 * bones and cooking loss had taken their share.
 *
 * The guide defines the number — *"usable product after trim and cooking — a
 * $12/kg fish at 45% yield is really $26/kg on the plate"*, and the knife
 * atlas calls yield percentage "literally a function of edge and angle", which
 * is to say a thing each venue MEASURES, because their knives, their cuts and
 * their suppliers are not anyone else's. Quantities are in the item's own
 * purchase unit.
 */
export interface ItemYield {
	grossQty: number;
	usableQty: number;
	/** ms epoch. */
	at: number;
}

export interface Item {
	/** itemSlugOf(name), and the key it is filed under. */
	slug: string;
	/** The name as the venue types it. The newest spelling wins on merge. */
	name: string;
	/** Newest first. Never empty for a live item. */
	history: ItemPrice[];
	/**
	 * Yield tests, newest first. Optional because every record written before
	 * they existed lacks the key, and an item that is never trimmed (salt,
	 * flour) will simply never have one.
	 */
	yields?: ItemYield[];
}

/**
 * How many observations one item keeps.
 *
 * 24 is six years of the quarterly repricing the guide asks for, or two years
 * of monthly. The cap exists because this record lives on a shared tablet and
 * grows forever otherwise; it discards the OLDEST, which are the least useful
 * because nobody reprices against 2019.
 */
export const HISTORY_CAP = 24;

/**
 * How long after an observation a new price is treated as a CORRECTION of it
 * rather than a movement in the market.
 *
 * Typing 18.00, seeing it is wrong and typing 18.50 is one price, entered
 * twice. Recorded as two, it becomes a 2.8% rise in the invoice-creep view and
 * the one number this module exists to produce goes soft. Five minutes is well
 * past a fumbled keystroke and nowhere near a delivery.
 */
export const CORRECTION_WINDOW_MS = 5 * 60 * 1000;

/**
 * How many yield tests one item keeps. Fewer than prices: a yield moves when
 * the knife work or the supplier changes, not with the market, and the guide's
 * advice is to re-test occasionally rather than continuously.
 */
export const YIELD_CAP = 12;

/**
 * The key an item is filed under.
 *
 * Lowercase, trimmed, inner whitespace collapsed — and DELIBERATELY NOTHING
 * ELSE. No accent folding, no punctuation stripping, no singularisation. A
 * normaliser clever enough to file "creme fraiche" and "crème fraîche" together
 * is also clever enough to file "cream" and "creams" together, and the venue
 * cannot see it happening or undo it. The datalist is what stops one purchase
 * becoming two spellings, because it offers the spelling that already exists,
 * and a chef choosing from a list is a better deduplicator than a regex
 * guessing at what they meant.
 */
export function itemSlugOf(name: string): string {
	return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Newest first, then by price and unit so the order is total and stable. */
function sortHistory(h: ItemPrice[]): ItemPrice[] {
	return [...h].sort(
		(a, b) => b.at - a.at || b.unitCost - a.unitCost || (a.unit < b.unit ? -1 : a.unit > b.unit ? 1 : 0)
	);
}

const validPrice = (p: unknown): p is ItemPrice =>
	!!p &&
	typeof p === 'object' &&
	Number.isFinite((p as ItemPrice).unitCost) &&
	(p as ItemPrice).unitCost >= 0 &&
	typeof (p as ItemPrice).unit === 'string' &&
	Number.isFinite((p as ItemPrice).at);

const validYield = (y: unknown): y is ItemYield =>
	!!y &&
	typeof y === 'object' &&
	Number.isFinite((y as ItemYield).grossQty) &&
	(y as ItemYield).grossQty > 0 &&
	Number.isFinite((y as ItemYield).usableQty) &&
	(y as ItemYield).usableQty >= 0 &&
	(y as ItemYield).usableQty <= (y as ItemYield).grossQty &&
	Number.isFinite((y as ItemYield).at);

const sortYields = (h: ItemYield[]): ItemYield[] =>
	[...h].sort((a, b) => b.at - a.at || b.usableQty - a.usableQty || b.grossQty - a.grossQty);

/**
 * The yield the venue last measured, as the percentage the costing line wants.
 * Null when nothing was ever put on the scale, never a default of 100, because
 * an assumed yield is exactly the number this book exists to replace.
 */
export function measuredYieldPct(item: Item | undefined): number | null {
	if (!item) return null;
	const h = sortYields((item.yields ?? []).filter(validYield));
	if (!h.length) return null;
	return (h[0].usableQty / h[0].grossQty) * 100;
}

/**
 * File a yield test. Same contract as recordPrice: pure, returns a new record,
 * refuses what cannot be true. `usableQty > grossQty` is refused because a
 * line's yield divides a cost, the sheet caps at 100%, and a thing that
 * gains weight in cooking is a PREP with portions, not a line with a yield.
 */
export function recordYield(
	items: Record<string, Item>,
	name: string,
	grossQty: number,
	usableQty: number,
	at: number
): Record<string, Item> {
	const slug = itemSlugOf(name);
	if (!slug) return items;
	const entry = { grossQty, usableQty, at };
	if (!validYield(entry)) return items;
	const existing = items[slug];
	// A yield test on an unknown item mints it, priceless. The book can know
	// how a thing trims before it knows what it costs.
	const base: Item = existing ?? { slug, name, history: [] };
	const yields = sortYields([entry, ...(base.yields ?? []).filter(validYield)]).slice(0, YIELD_CAP);
	return { ...items, [slug]: { ...base, name: existing ? base.name : name, yields } };
}

/** What the venue is paying now. Null for an item carrying no usable price. */
export function currentPrice(item: Item | undefined): ItemPrice | null {
	if (!item) return null;
	const h = sortHistory(item.history.filter(validPrice));
	return h[0] ?? null;
}

/**
 * The price before the current one — the comparison the guide asks for.
 *
 * Skips entries that repeat the current figure: re-typing 7.90 in March after
 * 7.90 in January is not a price change, and showing it as "previous: 7.90"
 * beside "now: 7.90" reads as a movement of zero rather than as no movement at
 * all. Null when the item has only ever had one price.
 */
export function previousPrice(item: Item | undefined): ItemPrice | null {
	if (!item) return null;
	const h = sortHistory(item.history.filter(validPrice));
	const now = h[0];
	if (!now) return null;
	// SAME UNIT only. 7.90/kg against 8.00/case is not a 1.3% rise: a unit
	// change re-bases the whole series, and the honest previous price is the
	// last different figure quoted in the unit the venue buys in NOW.
	return h.slice(1).find((p) => p.unit === now.unit && p.unitCost !== now.unitCost) ?? null;
}

/** The move from the previous price to the current one, as a percentage. */
export function priceMovePct(item: Item | undefined): number | null {
	const now = currentPrice(item);
	const was = previousPrice(item);
	if (!now || !was || was.unitCost <= 0) return null;
	return ((now.unitCost - was.unitCost) / was.unitCost) * 100;
}

/**
 * File a price against an item, minting the item if it is new.
 *
 * Returns a NEW record; the caller writes it. `at` is passed in rather than
 * read from the clock so this stays pure and the tests can be about the rules
 * rather than about timing.
 *
 * Three things it refuses to do, each for a reason:
 *  - An unchanged price adds nothing. The history is of CHANGES; a row saying
 *    "still 7.90" on every edit of the quantity would bury the two rows that
 *    matter under fifty that do not.
 *  - A correction inside CORRECTION_WINDOW_MS REPLACES the newest entry rather
 *    than stacking on it. See that constant.
 *  - A cost that is not a positive number is not filed at all. ZERO IS EXCLUDED
 *    deliberately and not as sloppiness about falsiness: addLine() mints a line
 *    at unitCost 0, so the moment somebody types "Butter" into a fresh row the
 *    book would otherwise record that butter costs nothing, and then every
 *    other dish that follows the book would price its butter at zero. "The
 *    price of butter fell to zero" is the kind of fact this book must never
 *    assert. A genuinely free ingredient needs no price history.
 */
export function recordPrice(
	items: Record<string, Item>,
	name: string,
	unitCost: number,
	unit: string,
	at: number
): Record<string, Item> {
	const slug = itemSlugOf(name);
	if (!slug) return items;
	if (!Number.isFinite(unitCost) || unitCost <= 0) return items;
	if (!Number.isFinite(at)) return items;

	const existing = items[slug];
	const history = existing ? sortHistory(existing.history.filter(validPrice)) : [];
	const newest = history[0];

	if (newest && newest.unitCost === unitCost && newest.unit === unit) {
		// Nothing moved. Keep the name fresh, the venue may have fixed its
		// capitalisation, and leave the history exactly as it was.
		if (existing && existing.name === name) return items;
		// `...existing` carries the yields. Both of this function's return paths
		// rebuilt the item as {slug, name, history} in draft, so committing ANY
		// price wiped every yield test the venue had run: recordYield preserved
		// prices, and the mirror was never checked. The reprice is the single
		// most common book operation; the yield tests are the rarest data in it.
		return { ...items, [slug]: { ...existing, slug, name, history } };
	}

	const entry: ItemPrice = { unitCost, unit, at };
	const next =
		newest && at - newest.at < CORRECTION_WINDOW_MS && at >= newest.at
			? [entry, ...history.slice(1)]
			: [entry, ...history];

	return {
		...items,
		[slug]: { ...(existing ?? {}), slug, name, history: sortHistory(next).slice(0, HISTORY_CAP) }
	};
}

/**
 * Merge two item books. THE PART THAT MATTERS.
 *
 * History is UNIONED, never replaced. Newer-wins-whole is the obvious rule and
 * it is precisely wrong here: the losing device's copy holds every price change
 * IT recorded, and those are observations the winner never made. Discarding
 * them destroys the only thing this feature exists to keep, and it would do it
 * silently, leaving a plausible, shorter history that looks completely fine.
 * `mergeCostings` reached the same conclusion about weeks of covers, for the
 * same reason: two devices' records are disjoint observations, not competing
 * sheets.
 *
 * UNION ON THE WHOLE OBSERVATION, not on `at` alone. Keying on the timestamp is
 * the brief, and it loses data in one narrow case: two devices that stamped
 * DIFFERENT prices in the same millisecond, where one silently wins. That is
 * the exact failure the union exists to prevent, so an observation is its
 * price, its unit and its time together: identical ones collapse, and
 * different ones both survive.
 *
 * Order-independent, and that is load-bearing: the cap is applied after the
 * union by a total sort, so both devices converge on the same book whichever
 * direction the file travelled, and re-importing your own export is a no-op.
 */
export function mergeItems(
	mine: Record<string, Item> | undefined,
	theirs: Record<string, Item> | undefined
): Record<string, Item> {
	const out: Record<string, Item> = { ...(mine ?? {}) };
	for (const [slug, incoming] of Object.entries(theirs ?? {})) {
		if (!incoming || typeof incoming !== 'object' || !Array.isArray(incoming.history)) continue;
		const ours = out[slug];
		if (!ours) {
			const history = sortHistory(incoming.history.filter(validPrice)).slice(0, HISTORY_CAP);
			const yields = sortYields((incoming.yields ?? []).filter(validYield)).slice(0, YIELD_CAP);
			// An item can arrive knowing only its yield: a venue that weighed the
			// fish before it ever typed a price still made an observation.
			if (!history.length && !yields.length) continue;
			out[slug] = {
				slug,
				name: incoming.name ?? slug,
				history,
				...(yields.length ? { yields } : {})
			};
			continue;
		}
		const seen = new Map<string, ItemPrice>();
		for (const p of [...ours.history, ...incoming.history].filter(validPrice)) {
			seen.set(`${p.at}|${p.unitCost}|${p.unit}`, p);
		}
		const history = sortHistory([...seen.values()]).slice(0, HISTORY_CAP);
		// Yields union exactly as prices do, and for the same reason: two
		// devices' tests are disjoint observations, not competing records.
		const ySeen = new Map<string, ItemYield>();
		for (const y of [...(ours.yields ?? []), ...(incoming.yields ?? [])].filter(validYield)) {
			ySeen.set(`${y.at}|${y.grossQty}|${y.usableQty}`, y);
		}
		const yields = sortYields([...ySeen.values()]).slice(0, YIELD_CAP);
		// The name follows the NEWEST observation, so a venue that corrected a
		// spelling on one device sees the correction on the other rather than
		// whichever device happened to import.
		const oursNewest = sortHistory(ours.history.filter(validPrice))[0];
		const theirsNewest = sortHistory(incoming.history.filter(validPrice))[0];
		const name =
			theirsNewest && (!oursNewest || theirsNewest.at > oursNewest.at)
				? (incoming.name ?? ours.name)
				: ours.name;
		out[slug] = { slug, name, history, ...(yields.length ? { yields } : {}) };
	}
	return out;
}

/** The shape resolveLines needs. The book itself carries far more. */
export function pricedItems(items: Record<string, Item>): Record<string, PricedItem> {
	const out: Record<string, PricedItem> = {};
	for (const [slug, item] of Object.entries(items ?? {})) {
		const p = currentPrice(item);
		if (p) out[slug] = { slug, unitCost: p.unitCost, unit: p.unit };
	}
	return out;
}

/**
 * Every item name the venue has typed, for the datalist.
 *
 * Sorted by name rather than by use: the list is read alphabetically by
 * somebody who already knows what they are looking for.
 */
export function itemNames(items: Record<string, Item>): string[] {
	return Object.values(items ?? {})
		.map((i) => i.name)
		.sort((a, b) => a.localeCompare(b));
}

export interface ItemUsage {
	slug: string;
	name: string;
	current: ItemPrice | null;
	previous: ItemPrice | null;
	movePct: number | null;
	/** Menu dish ids that reach this item, directly or through a prep. */
	dishIds: string[];
	/** Of those, the ones whose food cost now sits ABOVE the band. See below. */
	outOfBandIds: string[];
	/**
	 * Dishes holding this item on an UNLINKED line whose stored price is not
	 * what the book says the venue pays. A linked line can never be stale: it
	 * follows the book by construction, so every entry here is a line that
	 * predates the book, or one somebody unlinked and forgot. This is the list
	 * the guide's "reprice quarterly" instruction actually needs.
	 */
	staleDishIds: string[];
	/** The venue's measured yield for this item, when a test has been run. */
	yieldPct: number | null;
}

/**
 * Which dishes reach each item, and how many of them have drifted out of band.
 *
 * USAGE FOLLOWS PREPS. Butter in the demi is butter in every dish the demi is
 * poured over, and answering "which dishes does this price move?" with only the
 * lines that name it directly would miss exactly the dishes that are hardest to
 * find by eye, which is the whole reason the sheet needed this. Depth is one,
 * matching prepPortionCost's cap: a prep referencing a prep is a graph, and a
 * graph needs a cycle detector nobody will maintain.
 *
 * USAGE ALSO FOLLOWS THE NAME, not only `itemSlug`. Linking is opt-in and always
 * will be, so counting only linked lines would make the headline sentence read
 * "Butter is used in 1 dish" on a menu with fourteen, understating exactly the
 * exposure the venue opened the page to see, and understating it worst on the
 * day the book is newest and least linked. A line reading "Butter" is a line
 * that buys butter whether or not anybody has told the sheet so.
 *
 * The band verdict is computed by the CALLER and passed in. It depends on the
 * price the venue typed, the tax setting and the band from economics.json, and
 * this module has no business knowing any of that.
 */
export function itemUsage(
	items: Record<string, Item>,
	dishes: Array<{ id: string; lines: CostLine[]; verdict: BandVerdict }>,
	preps: ReadonlyArray<{ id: string; lines: CostLine[] }>
): ItemUsage[] {
	const prepById = new Map(preps.map((p) => [p.id, p]));
	const bySlug = new Map<string, { ids: Set<string>; out: Set<string>; stale: Set<string> }>();

	const slugsOf = (l: CostLine) => (l.itemSlug ? [l.itemSlug] : l.item ? [itemSlugOf(l.item)] : []);

	for (const d of dishes) {
		const reached = new Set<string>();
		for (const l of d.lines) {
			for (const sl of slugsOf(l)) reached.add(sl);
			if (l.prepId) {
				for (const pl of prepById.get(l.prepId)?.lines ?? []) {
					for (const sl of slugsOf(pl)) reached.add(sl);
				}
			}
		}
		// Stale detection wants the LINE, not just the slug it reached.
		const staleHere = new Set<string>();
		for (const l of d.lines) {
			if (l.prepId || l.itemSlug) continue; // prep lines and linked lines cannot be stale
			const slug = l.item ? itemSlugOf(l.item) : '';
			if (!slug) continue;
			const current = currentPrice(items[slug]);
			if (current && l.unitCost !== current.unitCost) staleHere.add(slug);
		}

		for (const slug of reached) {
			let e = bySlug.get(slug);
			if (!e) bySlug.set(slug, (e = { ids: new Set(), out: new Set(), stale: new Set() }));
			e.ids.add(d.id);
			if (staleHere.has(slug)) e.stale.add(d.id);
			// ONLY 'over', and this was measured on screen rather than reasoned
			// about. Counting 'under' too made a brand-new book announce
			// "1 has moved out of the band" over a plaice whose sheet had one
			// line on it: every dish is under the band before it is fully
			// costed, so the headline was at its loudest exactly when it had the
			// least to say. 'unknown' is excluded for the same reason: a dish
			// nobody has priced has not drifted.
			//
			// It is also the only direction this row can speak to. The book is
			// here for invoice creep, and a price going up pushes food cost out
			// the TOP. A dish below the band is not hurt by butter rising, and
			// the sheet above already says "below 25%, usually an incomplete
			// sheet rather than a triumph" where that belongs.
			if (d.verdict === 'over') e.out.add(d.id);
		}
	}

	return Object.values(items ?? {})
		.map((item) => {
			const e = bySlug.get(item.slug);
			return {
				slug: item.slug,
				name: item.name,
				current: currentPrice(item),
				previous: previousPrice(item),
				movePct: priceMovePct(item),
				dishIds: [...(e?.ids ?? [])],
				outOfBandIds: [...(e?.out ?? [])],
				staleDishIds: [...(e?.stale ?? [])],
				yieldPct: measuredYieldPct(item)
			};
		})
		.sort((a, b) => b.dishIds.length - a.dishIds.length || a.name.localeCompare(b.name));
}
