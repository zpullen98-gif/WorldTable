/**
 * Equipment list — ported from `equipFor` (L3331). EQUIP is 31 [RegExp, label]
 * pairs. The original ran all 31 regexes on every modal open; this runs them
 * once per recipe at build time.
 */
export function deriveEquipment(blob, EQUIP) {
	const out = [];
	for (const [re, label] of EQUIP) {
		if (re.test(blob) && !out.includes(label)) out.push(label);
	}
	return out;
}
