/**
 * The quick quiz's mix (routes/quizzes, PageState.qq): how many questions each
 * side gives and the order they are asked in.
 *
 * PURE, like today.ts and for the same reason: the page's runes cannot be
 * reached from a unit test, and a mix that has to top itself up from three
 * sources is arithmetic that must be tested rather than eyeballed.
 *
 * Three sides since Cuisine (12 Oct 2026): the house's dish
 * questions, the level's (the Floor Deck and the Lexicon in turn) and
 * Cuisine's multiple choice. With a house the round asks four, four and two;
 * without one, eight from the level and two from Cuisine. A side that cannot
 * give its share is topped up by the others, one question at a time, the
 * level first, then the house, then Cuisine, so a device whose Cuisine could
 * not be read deals five and five, as the round did before Cuisine.
 */

/** Questions in a round. */
export const QUICK_ROUND = 10;

/** Cuisine's share of a round. */
export const QUICK_CUISINE = 2;

export interface QuickMix {
	house: number;
	level: number;
	cuisine: number;
}

/** What each side is asked for: with a house four, four and two; without one, eight and two. */
export function quickTargets(hasHouse: boolean, round = QUICK_ROUND): QuickMix {
	const cuisine = Math.min(QUICK_CUISINE, round);
	const house = hasHouse ? Math.floor((round - cuisine) / 2) : 0;
	return { house, level: round - cuisine - house, cuisine };
}

/**
 * How many each side gives: its share, or all it has when that is fewer,
 * then the shortfall taken one at a time from the sides with questions to
 * spare, in turn (the level, the house, Cuisine), until the round is full or
 * nothing is left anywhere.
 */
export function quickSplit(targets: QuickMix, avail: QuickMix, round = QUICK_ROUND): QuickMix {
	const out: QuickMix = {
		house: Math.max(0, Math.min(targets.house, avail.house)),
		level: Math.max(0, Math.min(targets.level, avail.level)),
		cuisine: Math.max(0, Math.min(targets.cuisine, avail.cuisine))
	};
	const order: Array<keyof QuickMix> = ['level', 'house', 'cuisine'];
	let left = round - out.house - out.level - out.cuisine;
	while (left > 0) {
		let moved = false;
		for (const k of order) {
			if (left > 0 && out[k] < avail[k]) {
				out[k] += 1;
				left -= 1;
				moved = true;
			}
		}
		if (!moved) break;
	}
	return out;
}

/**
 * The order a round asks in: the house and the level in turn, the house
 * first and each topping up the other (as the round always alternated), with
 * Cuisine's questions spread evenly through it and the last of them asked
 * last. Every list is taken whole and in its own order.
 */
export function quickOrder<T>(house: readonly T[], level: readonly T[], cuisine: readonly T[]): T[] {
	const h = [...house];
	const l = [...level];
	const turn: T[] = [];
	while (h.length || l.length) {
		const a = turn.length % 2 === 0 ? h : l;
		const b = a === h ? l : h;
		turn.push((a.length ? a : b).shift() as T);
	}
	const total = turn.length + cuisine.length;
	const at = new Set(cuisine.map((_, k) => Math.round(((k + 1) * total) / cuisine.length) - 1));
	const z = [...cuisine];
	const out: T[] = [];
	for (let i = 0; i < total; i++) {
		if ((at.has(i) && z.length) || !turn.length) out.push(z.shift() as T);
		else out.push(turn.shift() as T);
	}
	return out;
}

/** The sources a dealt round drew on, named for its results line: "the menu, Commis and Cuisine". */
export function quickSources(kinds: readonly string[], levelName: string): string {
	const parts: string[] = [];
	if (kinds.includes('house')) parts.push('the menu');
	if (kinds.includes('deck') || kinds.includes('lexicon')) parts.push(levelName);
	if (kinds.includes('cuisine')) parts.push('Cuisine');
	if (parts.length <= 1) return parts[0] ?? levelName;
	return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

/** A count of ten or fewer in words, as the round's lines say them. */
export function countWord(n: number): string {
	return WORDS[n] ?? String(n);
}

/**
 * The line under Quick quiz, the level named: "Ten questions: four from the
 * menu, four from Commis and two from Cuisine." With no Cuisine questions to
 * ask (its index unread), the line the round had before Cuisine.
 */
export function quickLine(hasHouse: boolean, withCuisine: boolean, levelName: string): string {
	if (!withCuisine) return hasHouse ? `Ten questions: five from the menu, five from ${levelName}.` : `Ten questions from ${levelName}.`;
	const t = quickTargets(hasHouse);
	return hasHouse
		? `Ten questions: ${countWord(t.house)} from the menu, ${countWord(t.level)} from ${levelName} and ${countWord(t.cuisine)} from Cuisine.`
		: `Ten questions: ${countWord(t.level)} from ${levelName} and ${countWord(t.cuisine)} from Cuisine.`;
}
