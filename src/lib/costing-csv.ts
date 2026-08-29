/**
 * The costing sheet as a file a spreadsheet can open.
 *
 * ONE-WAY, PERMANENTLY. There is no CSV importer and there is never going to
 * be one — the `.wtjson` is the single portability contract, with merge
 * semantics that are tested, and a second import path is a second set of merge
 * bugs. This file exists because the person who asks for the sheet is often
 * not the person who runs the app: an accountant, a partner, a bank. They get
 * the numbers; the numbers do not come back this way.
 *
 * Raw numbers, no currency symbols — a symbol turns a number into a string in
 * every spreadsheet tool, which breaks the one thing the recipient wants to do
 * with it. The qualification travels as COLUMNS (week, tax basis, complete),
 * not as a footnote, because a CSV has nowhere else to keep it and an
 * unqualified weighted food cost is the most quotable wrong number this app
 * could produce.
 */
import type { CostLine, CostablePrep, PricedItem } from './costing';
import { dishEconomics, resolveLines, netOfTax, parsePrice } from './costing';

/** RFC 4180: quote when needed, double the quotes inside. */
function cell(v: string | number | null): string {
	if (v === null) return '';
	if (typeof v === 'number') return Number.isFinite(v) ? String(Math.round(v * 100) / 100) : '';
	return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}

export interface CsvDish {
	id: string;
	name: string;
	price: string;
	lines: CostLine[];
	/** Covers for the stated week, when the venue counted them. */
	sold: number | null;
}

/**
 * One row per dish. `weekStart` and the tax basis are stamped on every row so
 * a row cut-and-pasted out of the file still says what it is.
 */
export function costingCsv(
	dishes: CsvDish[],
	preps: ReadonlyArray<CostablePrep>,
	items: Readonly<Record<string, PricedItem>>,
	tax: { inclusive: boolean; ratePct: number } | undefined,
	weekStart: string
): string {
	const basis = tax?.inclusive ? `net of ${tax.ratePct}% tax` : 'as typed';
	const head = [
		'dish',
		'menu price',
		'revenue basis',
		'net revenue',
		'plate cost',
		'costing complete',
		'food cost pct',
		'contribution',
		'covers',
		'week starting'
	];
	const rows = [head.map(cell).join(',')];
	for (const d of dishes) {
		const { lines } = resolveLines(d.lines, preps, items);
		const net = tax?.inclusive ? netOfTax(parsePrice(d.price), tax.ratePct) : parsePrice(d.price);
		const e = dishEconomics(lines, net);
		rows.push(
			[
				cell(d.name),
				cell(parsePrice(d.price)),
				cell(basis),
				cell(e.price),
				cell(e.plateCost),
				// Words, not booleans: "no" in a spreadsheet reads; "FALSE" gets
				// re-typed as a formula error by every tool that opens it.
				cell(e.complete ? 'yes' : 'no — lines missing'),
				cell(e.foodCostPct),
				cell(e.contribution),
				cell(d.sold),
				cell(weekStart)
			].join(',')
		);
	}
	return rows.join('\r\n') + '\r\n';
}

export function csvFilename(now = new Date()): string {
	return `costing-${now.toISOString().slice(0, 10)}.csv`;
}
