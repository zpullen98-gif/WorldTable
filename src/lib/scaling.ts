/**
 * Ingredient text rewriting: servings scaling and metric↔US conversion.
 *
 * Both are ported verbatim from the original (`scaleLine` L2898, `fmtNum` L2892,
 * `convertLine` L3180). They are well-tuned and the guards are hard-won: the
 * partial-number backtrack guard alone is what stops "220g" scaling to "4402g".
 * Kept as pure functions so they are unit-testable, which the originals were not.
 *
 * Deliberately NOT replaced with structured quantity parsing. That is a large
 * project with a low ceiling here — the corpus writes quantities a dozen ways
 * ("1 1/2 tsp", "½", "80/20", "180°C", "a confident ½-inch") and a parser that
 * handles all of them is strictly more code than a regex that rewrites in place.
 */

const FRAC: Record<string, number> = {
	'¼': 0.25,
	'½': 0.5,
	'¾': 0.75,
	'⅓': 1 / 3,
	'⅔': 2 / 3,
	'⅛': 0.125
};

/** Round to something a cook can read, preferring a vulgar fraction. */
export function fmtNum(x: number): string {
	const r = Math.round(x * 100) / 100;
	if (Math.abs(r - Math.round(r)) < 0.02) return String(Math.round(r));
	for (const [f, v] of Object.entries(FRAC)) {
		if (Math.abs(r - v) < 0.03) return f;
		if (r > 1 && Math.abs(r - Math.floor(r) - v) < 0.03) return Math.floor(r) + f;
	}
	return String(r);
}

export function scaleLine(s: string, x: number): string {
	if (x === 1) return s;

	// Normalise ascii fractions to decimals so they scale: mixed numbers first
	// (1 1/2 → 1.5), then proper fractions (1/2 → 0.5). Ratios like 80/20 are
	// left alone because the denominator fails the `n < d` test.
	s = s.replace(/(\d+)[ ](\d)\/(\d{1,2})(?!\d)/g, (m, a, n, d) => {
		const nn = +n;
		const dd = +d;
		return nn < dd && [2, 3, 4, 8, 16].includes(dd) ? String(+a + nn / dd) : m;
	});
	s = s.replace(/(^|[^\d/])(\d)\/(\d{1,2})(?!\d)/g, (m, pre, n, d) => {
		const nn = +n;
		const dd = +d;
		return nn < dd && [2, 3, 4, 8, 16].includes(dd) ? pre + String(nn / dd) : m;
	});

	return s.replace(/(\d+(?:[.]\d+)?|[¼½¾⅓⅔⅛])/g, (m, _g, off: number, str: string) => {
		const rest = str.slice(off + m.length);
		// Partial-number backtrack guard: without it "220" matches as "22".
		if (/^[\d.]/.test(rest)) return m;
		// Denominator of a ratio like 80/20.
		if (off > 0 && str[off - 1] === '/') return m;
		// Temperatures and times are not quantities of anything. Days and weeks
		// belong here as much as minutes: doubling a batch does not double a
		// ferment, and "marinated 3 TO 5 DAYS" was becoming 6 to 10.
		if (
			// The range separator may be a dash OR the word "to": the corpus writes
			// "marinated 3 TO 5 DAYS", and a dash-only guard let the 3 double.
			/^\s*(?:(?:[–-]|\bto\b)\s*\d+(?:[.]\d+)?\s*)?(?:°|%|C\b|F\b|min\b|minutes?\b|hours?\b|h\b|sec|days?\b|weeks?\b|months?\b)/i.test(
				rest
			)
		)
			return m;
		if (/^\/\d/.test(rest)) return m;

		// A pan is a pan whatever the batch size. Catches both halves of a pair,
		// because the first number sees the "x33cm" that follows it:
		// "Butter a 23x33cm pan" was doubling to a 46x66cm pan.
		if (/^\s*(?:[x×]\s*\d+(?:[.]\d+)?\s*)*(?:cm|mm|inch|inches|")/i.test(rest)) return m;

		// "600g each", "(200g each)": a per-unit size, so the COUNT scales and
		// this does not. But "2 tbsp each soy and mirin" is distributive ("two of
		// each") and must scale, which is what the trailing-word lookahead
		// separates: 34 of the corpus's 40 "each" lines are the distributive kind.
		if (/^\s*[a-z]*\s*each\b(?!\s+[a-z])/i.test(rest)) return m;

		// "1 can (395g)" states the size of ONE package. You cannot buy a 790g
		// can. Restricted to package nouns because the general case is genuinely
		// ambiguous — "Juice of 6-8 limes (about 150ml)" SHOULD scale, and so
		// should "500g flour (450g white + 50g whole wheat)".
		const open = str.lastIndexOf('(', off);
		const closed = str.lastIndexOf(')', off);
		const opensParenthetical =
			open !== -1 && closed < open && /^\s*(?:~|about\s+|approx\.?\s+)?$/i.test(str.slice(open + 1, off));
		if (opensParenthetical && /\b(?:cans?|tins?|jars?|packets?|bottles?|boxes|box|tubs?|cartons?|blocks?|sachets?)\s*$/i.test(str.slice(0, open))) {
			return m;
		}

		const v = FRAC[m] !== undefined ? FRAC[m] : parseFloat(m.replace(',', '.'));
		if (isNaN(v) || v >= 1000) return m;
		return fmtNum(v * x);
	});
}

export function convertLine(s: string, units: 'metric' | 'us'): string {
	if (units === 'metric') return s;
	return s
		.replace(/(\d+(?:\.\d+)?)\s*kg\b/gi, (_m, v) => `${Math.round(v * 2.205 * 10) / 10} lb`)
		.replace(/(\d+(?:\.\d+)?)\s*g\b/gi, (m, v) =>
			v < 15 ? m : `${Math.round((v / 28.35) * 10) / 10} oz`
		)
		.replace(/(\d+(?:\.\d+)?)\s*ml\b/gi, (m, v) =>
			v < 15 ? m : `${Math.round((v / 29.57) * 10) / 10} fl oz`
		)
		.replace(/(\d+(?:\.\d+)?)\s*L\b/g, (_m, v) => `${Math.round(v * 1.057 * 10) / 10} qt`)
		// The original emitted a bare "F" here, losing the degree sign it had
		// just consumed from "°C". Restored: 180°C should read 356°F.
		.replace(/(\d+(?:\.\d+)?)\s*°?C\b/g, (_m, v) => `${Math.round((v * 9) / 5 + 32)}°F`)
		/**
		 * Dimension pairs BEFORE the single-value rule, or the single rule takes
		 * first refusal and converts only the half that carries the unit:
		 * "23x33cm" became "23x13 in", a tin that does not exist. Five steps in
		 * the corpus, all of them baking pans, all of them wrong.
		 */
		.replace(
			/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*cm\b/gi,
			(_m, a, b) => `${Math.round((a / 2.54) * 10) / 10}x${Math.round((b / 2.54) * 10) / 10} in`
		)
		.replace(/(\d+(?:\.\d+)?)\s*cm\b/gi, (_m, v) => `${Math.round((v / 2.54) * 10) / 10} in`);
}

/** Both transforms, in the order the original applied them. */
export function renderLine(s: string, scale: number, units: 'metric' | 'us'): string {
	return convertLine(scaleLine(s, scale), units);
}
