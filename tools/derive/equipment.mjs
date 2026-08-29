/**
 * Equipment list: ported from `equipFor` (L3331). EQUIP is 31 [RegExp, label]
 * pairs. The original ran all 31 regexes on every modal open; this runs them
 * once per recipe at build time.
 *
 * Three notes from the parity harness, which compared this port against the
 * original executing itself:
 *
 * - The blob is ingredients + method ONLY (the original's `t`, L3332). Using
 *   the full text was this port's first mistake: a "from the pass" note that
 *   merely mentions a blender is not a recipe that needs one.
 * - The list caps at 6, as the original's `.slice(0,6)` does.
 * - The original then did `.map(([n])=>n)`: destructuring the FIRST element of
 *   each pair, which is the RegExp, so its equipment line rendered regex
 *   sources like "/dutch oven/". That is a display bug in the original and is
 *   deliberately NOT reproduced: we keep its match semantics and emit the
 *   labels it meant to show.
 */
export function deriveEquipment(r, EQUIP) {
	const t = `${r.i.join(' ')} ${r.m.join(' ')}`.toLowerCase();
	return EQUIP.filter(([re]) => re.test(t))
		.map(([, label]) => label)
		.slice(0, 6);
}
