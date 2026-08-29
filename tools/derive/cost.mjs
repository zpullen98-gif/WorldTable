/**
 * Cost tier 1-4, ported from `costFor` (L3320), minus the `R.indexOf(r)` scan.
 */
export function deriveCost(r, blob) {
	let s = 1;
	if (/lobster|caviar|truffle|foie|wagyu|ibérico|saffron|uni\b|crab|jamón/.test(blob)) s += 2;
	if (
		/beef|lamb|duck|veal|shrimp|prawn|salmon|tuna|scallop|brisket|short rib|oxtail|prosciutto|pork belly/.test(
			blob
		)
	)
		s += 1;
	if (/cream|butter|parmigiano|gruyère|mascarpone|wine|brandy|cognac|sherry/.test(blob)) s += 0.5;
	if (r.i.length >= 9) s += 0.5;
	return Math.max(1, Math.min(4, Math.round(s)));
}
