/**
 * The waste log — what died, why, and what it was worth.
 *
 * The guide asks for it by name: *"waste logs (what died in the walk-in, and
 * why — over-prepping is the most common villain)"*. The reason codes are not
 * invented here; `tools/derive/waste.mjs` reads them out of the guide's own
 * leak meter and fails the build if the prose stops naming one.
 *
 * ## Venue-wide, and no person, ever
 *
 * `WasteEntry` HAS NO FIELD FOR WHO LOGGED IT, and that is a structural refusal
 * rather than a display decision. Waste-by-cook is a disciplinary instrument;
 * the data goes dishonest within a fortnight of the first conversation that
 * begins "your name is on four of these", and a log people are afraid of is
 * worse than no log because it reads as evidence while being fiction. The guide
 * reaches the same place from the other direction: *"the answers are systems,
 * not suspicion"*, and the goal is a kitchen where numbers are craft pride and
 * *"not a surveillance state"*.
 *
 * A field that does not exist cannot be added to a report later by somebody who
 * did not read this comment. `EightySix` carries `by` — a name, never a
 * permission — because saying who took the halibut off is useful and blames
 * nobody. That is the line.
 *
 * ## The value is a SNAPSHOT
 *
 * `unitValue` is what one of the thing was worth AT THE MOMENT IT WAS LOGGED,
 * stored on the entry rather than recomputed. Revaluing March's binned demi at
 * today's butter price would make last quarter's waste move every time somebody
 * reprices an item — the trend, which is the only reason to keep a log this
 * long, would be an artefact of the item book rather than a record of what
 * happened. It also means a dish deleted next month does not silently zero out
 * the waste it caused.
 *
 * Pure, and outside any component, for the same reason costing.ts and items.ts
 * are: this is arithmetic somebody will make decisions with.
 */

/**
 * One thing that went in the bin.
 *
 * There is deliberately no `by`, no `cook`, no `loggedBy`. See the header.
 */
export interface WasteEntry {
	/** 'w-' + base36, minted once at log time. */
	id: string;
	/** ms epoch. */
	at: number;
	/** What it was, as the kitchen would say it. Kept even if the dish is deleted. */
	label: string;
	/** Plates, portions, or purchase units — whichever the source is counted in. */
	qty: number;
	/** A `key` from waste.json's reason codes. */
	reason: string;
	/**
	 * What ONE of them was worth when this was logged. Null when the thing could
	 * not be costed at the time, which is kept as null rather than 0 — a bin
	 * nobody could price is not a bin that cost nothing.
	 */
	unitValue: number | null;
	/** Where the value came from. For the trail, never for revaluation. */
	source?: { dishId?: string; prepId?: string; itemSlug?: string };
}

/** What this entry cost the venue. Null when it was never costable. */
export function entryValue(e: WasteEntry): number | null {
	if (e.unitValue === null || !Number.isFinite(e.unitValue)) return null;
	if (!Number.isFinite(e.qty)) return null;
	return e.unitValue * e.qty;
}

const validEntry = (e: unknown): e is WasteEntry =>
	!!e &&
	typeof e === 'object' &&
	typeof (e as WasteEntry).id === 'string' &&
	Number.isFinite((e as WasteEntry).at) &&
	Number.isFinite((e as WasteEntry).qty) &&
	typeof (e as WasteEntry).reason === 'string';

export interface ReasonTotal {
	reason: string;
	money: number;
	count: number;
	/** Share of the valued money, not of the entry count. */
	pct: number;
}

export interface WasteRollup {
	entries: number;
	/**
	 * Entries in the window that carry no value. PRINT THIS. A total that
	 * silently skips four unpriced bins reads as authority and is wrong in the
	 * direction that makes the kitchen look tidier than it is — the same refusal
	 * `plateCost.complete` exists to make.
	 */
	unvalued: number;
	total: number;
	byReason: ReasonTotal[];
	/** The biggest line by money, or null when nothing in the window was valued. */
	top: ReasonTotal | null;
	/**
	 * Waste against what the kitchen actually cooked, which is the guide's own
	 * framing: variance is measured against THEORETICAL COGS. Null unless the
	 * caller can supply that figure, because an unqualified "waste is 6%" with
	 * no denominator stated is the most quotable wrong number this page could
	 * produce.
	 */
	shareOfCogsPct: number | null;
}

/**
 * Roll the log up over a window. Venue-wide, by reason, never by person.
 *
 * `from`/`to` are ms epoch and the window is half-open — `[from, to)` — so
 * consecutive weeks cannot both claim an entry logged exactly at midnight.
 */
export function rollUpWaste(
	log: ReadonlyArray<WasteEntry>,
	from: number,
	to: number,
	theoreticalCogs: number | null = null
): WasteRollup {
	const inWindow = (log ?? []).filter(
		(e) => validEntry(e) && e.at >= from && e.at < to
	);

	let total = 0;
	let unvalued = 0;
	const byKey = new Map<string, { money: number; count: number }>();

	for (const e of inWindow) {
		const v = entryValue(e);
		const slot = byKey.get(e.reason) ?? { money: 0, count: 0 };
		slot.count += 1;
		if (v === null) unvalued += 1;
		else {
			slot.money += v;
			total += v;
		}
		byKey.set(e.reason, slot);
	}

	const byReason: ReasonTotal[] = [...byKey.entries()]
		.map(([reason, s]) => ({
			reason,
			money: s.money,
			count: s.count,
			pct: total > 0 ? (s.money / total) * 100 : 0
		}))
		// Money first, then count, then key — a total order, so two reasons that
		// cost the same amount do not swap places between renders.
		.sort((a, b) => b.money - a.money || b.count - a.count || (a.reason < b.reason ? -1 : 1));

	return {
		entries: inWindow.length,
		unvalued,
		total,
		byReason,
		// A reason with no money attached is not the "biggest line" — it is an
		// unpriced one, and calling it the top would answer "where is the money
		// going" with a row that has no money in it.
		top: byReason.find((r) => r.money > 0) ?? null,
		shareOfCogsPct:
			theoreticalCogs !== null && Number.isFinite(theoreticalCogs) && theoreticalCogs > 0
				? (total / theoreticalCogs) * 100
				: null
	};
}

/**
 * Merge two logs. UNION BY ID.
 *
 * An entry is immutable once written — it records something that happened at a
 * time — so there is no conflict to resolve and nothing to prefer. Union is the
 * only rule that cannot lose a bin, and losing bins is how a log stops being
 * evidence of anything. Same conclusion `mergeCostings` reached about weeks of
 * covers and `mergeItems` about prices: two devices hold disjoint observations,
 * not competing records.
 *
 * NOT CAPPED, unlike the item book. An old price is dead weight — nobody
 * reprices against 2019 — but old waste is the trend, and the only reason to
 * keep a log across a year is to be able to say "last October we binned half
 * this". Bounding it would delete the answer to the question it exists for.
 */
export function mergeWaste(
	mine: ReadonlyArray<WasteEntry> | undefined,
	theirs: ReadonlyArray<WasteEntry> | undefined
): WasteEntry[] {
	const byId = new Map<string, WasteEntry>();
	for (const e of mine ?? []) if (validEntry(e)) byId.set(e.id, e);
	for (const e of theirs ?? []) if (validEntry(e) && !byId.has(e.id)) byId.set(e.id, e);
	// Newest first, then by id so the order is total and two devices agree.
	return [...byId.values()].sort((a, b) => b.at - a.at || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/**
 * The sentence the log exists to be able to say.
 *
 * The guide asserts a most-common cause — *"over-prepping is the most common
 * villain"* — which means a venue's own log can either confirm it or contradict
 * it, and both are worth reading. A log that only listed totals would leave the
 * chef to do that comparison in their head, which is to say never.
 *
 * `labelOf` resolves a reason key to its label so this stays free of waste.json.
 */
export function wasteHeadline(
	rollup: WasteRollup,
	villain: string,
	labelOf: (key: string) => string
): string | null {
	if (!rollup.top || rollup.total <= 0) return null;
	const top = rollup.top;
	const pct = top.pct.toFixed(0);
	if (top.reason === villain) {
		return `${labelOf(top.reason)} is ${pct}% of what you threw away — the guide's most common villain, and yours.`;
	}
	return `${labelOf(top.reason)} is your biggest line at ${pct}%, ahead of ${labelOf(villain)} — which the guide calls the most common villain.`;
}
