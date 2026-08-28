/**
 * Costing a plate, and engineering a menu.
 *
 * The guide states the whole method in "Menu Economics: Food Cost, Yield & Par"
 * and reaches three arbitrary recipes with it. This is that entry made to
 * compute, against the dishes a venue has already entered on The Kitchen's Menu
 * — which is the one place in this app that already knows a dish's price.
 *
 * ## Yield is the entire point
 *
 * The guide is blunt about it: "a $12/kg fish at 45% yield is really $26/kg on
 * the plate; costing raw invoice prices is the classic rookie bankruptcy." A
 * costing sheet that multiplies invoice price by quantity is not a simplified
 * version of this — it is the specific error that closes restaurants, and it
 * would look completely convincing on screen. So yield is not an optional
 * refinement here; it divides every line, and a line defaults to 100% only
 * because saying so out loud is better than hiding the assumption.
 *
 * Pure, and outside any component, for the same reason repertoire.ts and
 * pass.ts are: this is arithmetic somebody will make decisions with.
 */

export interface CostLine {
	id: string;
	/** What it is — free text, matching how the venue buys it. */
	item: string;
	/** What one purchase unit costs, as invoiced. */
	unitCost: number;
	/** The purchase unit, for display only: kg, litre, each, punnet. */
	unit: string;
	/** How much of that unit one plate uses. */
	usedQty: number;
	/** Usable share after trim, bone and cooking loss. 100 = no loss. */
	yieldPct: number;
	/**
	 * This line is a PREP, not a purchase — its unit cost comes from what the
	 * prep costs per portion rather than from an invoice.
	 *
	 * Resolved to a plain line by resolveLines() before anything reaches
	 * plateCost, so every function below this one keeps seeing arithmetic it
	 * already knows how to do.
	 */
	prepId?: string;
}

/**
 * The costable part of a prep — deliberately the minimum, so costing.ts does
 * not have to know that a prep also carries a station, a par and a shelf life.
 * The full record lives in persistence/house.ts.
 */
export interface CostablePrep {
	id: string;
	/** Plate-portions one batch makes. The divisor, so it must be > 0. */
	portions: number;
	lines: CostLine[];
}

/**
 * What one portion of a prep costs, and whether every line in it costed.
 *
 * `complete` matters more here than anywhere else in this file. A demi-glace
 * with one blank line understates every dish that uses it at once — the same
 * error plateCost refuses, multiplied by however many plates the sauce goes on.
 */
export function prepPortionCost(prep: CostablePrep): {
	perPortion: number | null;
	complete: boolean;
} {
	// A prep referencing a prep is a graph, and a graph needs a cycle detector
	// nobody will maintain. Depth is capped at one and the refusal is loud:
	// the nested line cannot be costed, so the prep is incomplete.
	const nested = prep.lines.some((l) => l.prepId);
	const { total, complete } = plateCost(prep.lines.filter((l) => !l.prepId));
	if (!Number.isFinite(prep.portions) || prep.portions <= 0) {
		return { perPortion: null, complete: false };
	}
	return { perPortion: total / prep.portions, complete: complete && !nested };
}

/**
 * Flatten prep-backed lines into plain ones, and report whether anything was
 * left uncosted along the way.
 *
 * yieldPct is LOCKED TO 100 for a resolved line, and that is the guard, not a
 * default: the trim, the bones and the reduction already happened inside the
 * prep and are already in its per-portion cost. Letting a dish apply its own
 * yield on top would divide by the loss twice and quietly overstate the plate —
 * the one direction of error this sheet is otherwise careful to refuse.
 */
export function resolveLines(
	lines: CostLine[],
	preps: ReadonlyArray<CostablePrep>
): { lines: CostLine[]; complete: boolean } {
	const byId = new Map(preps.map((p) => [p.id, p]));
	let complete = true;
	const out = lines.map((l) => {
		if (!l.prepId) return l;
		const prep = byId.get(l.prepId);
		if (!prep) {
			// The prep was deleted out from under the dish. Uncostable, and it
			// must not silently vanish from the total.
			complete = false;
			return { ...l, unitCost: Number.NaN, yieldPct: 100 };
		}
		const { perPortion, complete: prepComplete } = prepPortionCost(prep);
		// An incomplete prep makes the LINE uncostable, not merely this function
		// unhappy. Returning a priced line beside a complete:false flag put the
		// propagation at the mercy of whoever called us: plateCost() on its own
		// would report a confident total over a sauce nobody had finished
		// costing. Emitting NaN makes plateCost refuse it directly, which is the
		// same refusal it already applies to any other line it cannot price.
		if (perPortion === null || !prepComplete) {
			complete = false;
			return { ...l, unitCost: Number.NaN, yieldPct: 100 };
		}
		return { ...l, unitCost: perPortion, yieldPct: 100 };
	});
	return { lines: out, complete };
}

export interface Band {
	key: string;
	label: string;
	lowPct: number;
	highPct: number;
	note: string;
}

export type BandVerdict = 'under' | 'on' | 'over' | 'unknown';

/**
 * What a unit actually costs once the bin is accounted for.
 *
 * Returns null rather than Infinity for a zero or negative yield: a plate cost
 * of Infinity renders as "Infinity" and looks like a bug, where null can be
 * shown as the question it really is.
 */
export function trueUnitCost(unitCost: number, yieldPct: number): number | null {
	if (!Number.isFinite(unitCost) || !Number.isFinite(yieldPct)) return null;
	if (yieldPct <= 0) return null;
	return unitCost / (yieldPct / 100);
}

export function lineCost(line: CostLine): number | null {
	const per = trueUnitCost(line.unitCost, line.yieldPct);
	if (per === null || !Number.isFinite(line.usedQty)) return null;
	return per * line.usedQty;
}

/**
 * Plate cost, and whether every line contributed.
 *
 * `complete` is false when any line could not be costed. A total that silently
 * skips two unpriced ingredients is worse than no total — it reads as authority
 * and is simply wrong, which is how a dish gets priced.
 */
export function plateCost(lines: CostLine[]): { total: number; complete: boolean } {
	let total = 0;
	let complete = true;
	for (const l of lines) {
		const c = lineCost(l);
		if (c === null) complete = false;
		else total += c;
	}
	return { total, complete };
}

/**
 * The price a venue typed, which is free text: "14", "£14.50", "$14.50", "14,50".
 *
 * Returns null for anything that is not a number, so an unpriced dish is absent
 * from the menu-engineering pass rather than sitting at the origin pretending
 * to be a dog.
 */
export function parsePrice(raw: string | number | null | undefined): number | null {
	if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;
	if (!raw) return null;
	const cleaned = String(raw)
		.replace(/[^\d.,-]/g, '')
		.replace(/,(\d{2})$/, '.$1') // 14,50 -> 14.50
		.replace(/,/g, '');
	if (!cleaned || !/\d/.test(cleaned)) return null;
	const n = Number.parseFloat(cleaned);
	return Number.isFinite(n) ? n : null;
}

export interface DishEconomics {
	plateCost: number;
	complete: boolean;
	price: number | null;
	/** Ingredient cost as a share of price. Null without a price. */
	foodCostPct: number | null;
	/** Money left on the plate. The number that pays rent. */
	contribution: number | null;
}

export function dishEconomics(lines: CostLine[], rawPrice: string | number | null): DishEconomics {
	const { total, complete } = plateCost(lines);
	const price = parsePrice(rawPrice);
	return {
		plateCost: total,
		complete,
		price,
		foodCostPct: price && price > 0 ? (total / price) * 100 : null,
		contribution: price === null ? null : price - total
	};
}

/**
 * What a menu price is actually worth to the venue.
 *
 * In a tax-inclusive market — most of the world — the number on the menu
 * includes the tax, and the venue never sees it. An 18.00 dish at 20% is 15.00
 * of revenue: costing against the 18 overstates contribution by 3.00 and
 * understates food cost by around five points, ON EVERY DISH, silently, in the
 * direction that makes the whole menu look profitable. That is the same
 * direction `plateCost.complete` exists to refuse, and this one had no alert.
 *
 * The rate is NEVER inferred from locale or currency symbol. An inferred rate
 * produces a completely plausible figure wrong by exactly the tax rate, which is
 * worse than the honest error it replaces — a venue can see a setting it did not
 * turn on, and cannot see an assumption nobody told it about.
 */
export function netOfTax(price: number | null, ratePct: number | null | undefined): number | null {
	if (price === null || !Number.isFinite(price)) return null;
	if (!Number.isFinite(ratePct) || (ratePct as number) <= 0) return price;
	return price / (1 + (ratePct as number) / 100);
}

/**
 * Where a percentage sits against a band.
 *
 * For food cost, lower is better and "under" is not a failure — but it is worth
 * saying, because the guide's other warning is that underpricing is the
 * commonest form of restaurant self-harm, and an implausibly low food cost is
 * usually an incomplete recipe rather than a triumph.
 */
export function bandFor(pct: number | null, band: Band): BandVerdict {
	if (pct === null || !Number.isFinite(pct)) return 'unknown';
	if (pct < band.lowPct) return 'under';
	if (pct > band.highPct) return 'over';
	return 'on';
}

/**
 * What the whole menu adds up to.
 *
 * The sheet ranked dishes and never summed them, so when a chef says "our food
 * cost is 31%" that is the arithmetic MEAN of the dish percentages — and the
 * mean is not the number. The plowhorse at 42% is a third of covers and the
 * puzzle at 22% sells four a week, so the figure the venue actually runs at is
 * weighted by what sold, and it is worse than the mean nearly every time.
 *
 * Weighted food cost is Σ(plateCost × sold) ÷ Σ(price × sold): the money that
 * left the walk-in over the money that came through the till. Everything here
 * is over the dishes carrying BOTH a price and a covers count, and the caller
 * must say so — an undated, unqualified weighted food cost is the most quotable
 * wrong number this app could produce.
 */
export interface RollupDish {
	id: string;
	name: string;
	plateCost: number;
	price: number | null;
	sold: number | null;
}

export interface MenuRollup {
	/** Null when nothing carries both a price and a count. */
	weightedFoodCostPct: number | null;
	/** What the menu contributed over the period, in money. */
	totalContribution: number;
	covers: number;
	/** How many dishes went into this, and how many exist. Print both. */
	usable: number;
	of: number;
	/** Share of covers, by dish id — menu mix. */
	mixPct: Map<string, number>;
	/**
	 * The smallest set of dishes that is most of the covers.
	 *
	 * Not a rule of thumb dressed as a finding: it reports the real count at the
	 * real share rather than asserting 80/20.
	 */
	pareto: { dishes: number; of: number; pct: number } | null;
}

export function rollUpMenu(dishes: RollupDish[], paretoTarget = 0.7): MenuRollup {
	const usable = dishes.filter(
		(d) =>
			d.price !== null &&
			Number.isFinite(d.price) &&
			d.price > 0 &&
			d.sold !== null &&
			Number.isFinite(d.sold) &&
			// A dish that sold none contributes nothing and is not evidence of a
			// food cost. It is counted as unusable rather than as a zero, so it
			// cannot drag a weighted figure it had no part in.
			(d.sold as number) > 0
	) as Array<RollupDish & { price: number; sold: number }>;

	const covers = usable.reduce((n, d) => n + d.sold, 0);
	const cost = usable.reduce((n, d) => n + d.plateCost * d.sold, 0);
	const revenue = usable.reduce((n, d) => n + d.price * d.sold, 0);

	const mixPct = new Map<string, number>();
	for (const d of usable) mixPct.set(d.id, covers > 0 ? (d.sold / covers) * 100 : 0);

	let pareto: MenuRollup['pareto'] = null;
	if (covers > 0 && usable.length > 1) {
		const bySold = [...usable].sort((a, b) => b.sold - a.sold);
		let running = 0;
		let n = 0;
		for (const d of bySold) {
			running += d.sold;
			n++;
			if (running / covers >= paretoTarget) break;
		}
		pareto = { dishes: n, of: usable.length, pct: (running / covers) * 100 };
	}

	return {
		weightedFoodCostPct: revenue > 0 ? (cost / revenue) * 100 : null,
		totalContribution: revenue - cost,
		covers,
		usable: usable.length,
		of: dishes.length,
		mixPct,
		pareto
	};
}

export interface EngineeredDish {
	id: string;
	name: string;
	contribution: number;
	sold: number;
	popular: boolean;
	profitable: boolean;
	quadrant: 'star' | 'plowhorse' | 'puzzle' | 'dog';
}

/**
 * Menu engineering: popularity against profit.
 *
 * Thresholds are the standard ones rather than anything invented here. Profit
 * is measured against the MEAN contribution of the menu. Popularity is measured
 * against 70% of an equal share — with N dishes, a dish selling its fair share
 * would take 1/N of covers, and the convention is that anything clearing 70% of
 * that counts as popular. A median would look more natural and is wrong: it
 * forces half the menu to be unpopular however evenly it sells.
 *
 * Dishes with no price or no sales figure are left out entirely. A dish at the
 * origin because nobody typed a number is not a dog.
 */
export function engineerMenu(
	dishes: Array<{ id: string; name: string; contribution: number | null; sold: number | null }>
): EngineeredDish[] {
	const usable = dishes.filter(
		(d): d is { id: string; name: string; contribution: number; sold: number } =>
			d.contribution !== null &&
			Number.isFinite(d.contribution) &&
			d.sold !== null &&
			Number.isFinite(d.sold) &&
			d.sold > 0
	);
	if (!usable.length) return [];

	const meanContribution = usable.reduce((n, d) => n + d.contribution, 0) / usable.length;
	const totalSold = usable.reduce((n, d) => n + d.sold, 0);
	const fairShare = totalSold / usable.length;
	const popularityFloor = fairShare * 0.7;

	return usable
		.map((d) => {
			const popular = d.sold >= popularityFloor;
			const profitable = d.contribution >= meanContribution;
			const quadrant = popular
				? profitable
					? ('star' as const)
					: ('plowhorse' as const)
				: profitable
					? ('puzzle' as const)
					: ('dog' as const);
			return { ...d, popular, profitable, quadrant };
		})
		.sort((a, b) => b.contribution * b.sold - a.contribution * a.sold);
}

/** Two decimals, and never "-0.00". */
export function money(n: number): string {
	const v = Math.abs(n) < 0.005 ? 0 : n;
	return v.toFixed(2);
}
