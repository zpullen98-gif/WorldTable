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
