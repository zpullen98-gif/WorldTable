/**
 * Say it back and Guest at the table, as /menu/quiz runs them offline: pure
 * helpers over the engine's own graders in $lib/house/house-drills, so the
 * page holds state and the rules sit here under test.
 *
 * NO KEY, NO NETWORK. Both modes grade on the device through gradeSaid and
 * gradeScenario, which compare what was said with what the house KEPT. The
 * Maitre d' is not asked and nothing leaves the page.
 *
 * KEPT MARKS ONLY. An item reaches Say it back only through sayable(), which
 * reads a lines mark by a person; a scenario reaches Guest at the table only
 * through roleable(), which reads a kept answer; a mix-up only with a kept
 * difference. Her unkept words never grade and are never shown here.
 *
 * ALLERGENS ARE THE KITCHEN'S. Nothing here reads, writes or infers an
 * allergen. The page shows a service note only as the person's own words
 * under the fixed eyebrow, and says once that allergens are confirmed at
 * lineup.
 *
 * NOTHING HERE RECORDS. The page records through house-drilled.ts when a
 * person presses Record it, and marks the day studied then; this module
 * returns lists, keys and words, and touches no storage and no level.
 */
import { gradeScenario, gradeSaid, roleable, sayable, type SaidVerdict, type SayLength, type ScenarioGrade, type SayableItem } from './house/house-drills';
import { isMark } from './house/house-schema';
import { ALLERGEN_TALK } from './house/house-validate';
import type { House, ItemKind, Mark, Scenario } from './house/house-schema';
import { drilledKey } from './house-drilled';

export type Rand = () => number;

/** The lengths in the order the chips show them, with what each chip says. */
export const SAY_LENGTHS: readonly SayLength[] = ['s10', 's20', 's45'];
export const LENGTH_CHIPS: Readonly<Record<SayLength, string>> = {
	s10: '10 seconds',
	s20: '20 seconds',
	s45: '45 seconds'
};

/** The kinds Say it back can be pointed at: the dishes first, the drinks and wines when the person chooses. */
export const SAY_KINDS: readonly ItemKind[] = ['dish', 'cocktail', 'wine'];
export const SAY_KIND_CHIPS: Readonly<Record<string, string>> = {
	dish: 'Dishes',
	cocktail: 'Drinks',
	wine: 'Wines'
};

/** A verdict as a word, never a colour alone. */
export const VERDICT_WORDS: Readonly<Record<SaidVerdict, string>> = {
	met: 'Met',
	close: 'Close',
	missed: 'Missed'
};

/** The fixed eyebrow over a person's own service note, the same words /menu uses. */
export const SERVICE_EYEBROW = 'Your words. Allergens: confirm at lineup.';

/** The one sentence beside the Speak button. */
export const SPEECH_SENTENCE = "Your voice goes to your browser's speech service, not to Anthropic.";

/** The key a Say it back attempt records under: `house:<houseId>:<itemId>:say-<length>`. */
export function sayKey(houseId: string, itemId: string, length: SayLength): string {
	return drilledKey(houseId, itemId, 'say-' + length);
}

/** The key a Guest at the table answer records under: `house:<houseId>:<scenarioId>:guest`. */
export function guestKey(houseId: string, cardId: string): string {
	return drilledKey(houseId, cardId, 'guest');
}

/** One section of sayable items, in the house's order. */
export interface SaySection {
	section: string;
	items: SayableItem[];
}

/** The sayable items of the chosen kinds, grouped by section in the order the house lists them. */
export function saySections(house: House, kinds: readonly ItemKind[]): SaySection[] {
	const out: SaySection[] = [];
	const at = new Map<string, SaySection>();
	for (const item of sayable(house)) {
		if (!kinds.includes(item.kind)) continue;
		const name = item.section || SAY_KIND_CHIPS[item.kind] || 'The house';
		const key = item.kind + '|' + name;
		let sec = at.get(key);
		if (!sec) {
			sec = { section: name, items: [] };
			at.set(key, sec);
			out.push(sec);
		}
		sec.items.push(item);
	}
	return out;
}

/** How many sayable items each kind holds: the count beside each kind chip. */
export function sayCounts(house: House): Record<string, number> {
	const out: Record<string, number> = { dish: 0, cocktail: 0, wine: 0 };
	for (const item of sayable(house)) out[item.kind] = (out[item.kind] ?? 0) + 1;
	return out;
}

/** A random pick from a list, never the one just shown while another exists. */
export function pickNext<T extends { id: string }>(list: readonly T[], lastId: string, rand: Rand): T | null {
	if (!list.length) return null;
	const pool = list.length > 1 ? list.filter((x) => x.id !== lastId) : list.slice();
	const r = rand();
	return pool[Math.floor((r >= 0 && r < 1 ? r : 0) * pool.length)] ?? null;
}

/** The length to start an item on: the one asked for when the item carries it, else its first. */
export function lengthFor(item: SayableItem | null, wanted: SayLength): SayLength {
	if (!item || !item.lengths.length) return wanted;
	return item.lengths.includes(wanted) ? wanted : item.lengths[0];
}

/** A guest card: a kept scenario, or a mix-up asked as which is which. */
export interface GuestCard {
	id: string;
	kind: 'scenario' | 'mixUp';
	title: string;
	guest: string;
}

function kept(m: Mark | undefined): string {
	return isMark(m) && m.by === 'person' && typeof m.value === 'string' ? m.value.trim() : '';
}

function nameById(house: House): Map<string, string> {
	const out = new Map<string, string>();
	for (const list of [house.dishes, house.wines, house.cocktails]) {
		for (const item of list) if (item && item.id && item.name) out.set(item.id, item.name);
	}
	return out;
}

/** The mix-up as the scenario grader reads it: the kept ask (or the two names) as the guest, the kept difference as the answer. Null without a kept difference or both names. */
function mixUpScenario(house: House, id: string): Scenario | null {
	const m = house.mixUps.find((x) => x.id === id);
	if (!m || !kept(m.difference)) return null;
	const names = nameById(house);
	const a = names.get(m.aId);
	const b = names.get(m.bId);
	if (!a || !b) return null;
	const ask = kept(m.ask);
	return {
		id: m.id,
		title: 'Which is which: ' + a + ' and ' + b,
		guest: ask || 'What is the difference between the ' + a + ' and the ' + b + '?',
		you: m.difference,
		itemIds: [m.aId, m.bId],
		ts: m.ts
	};
}

/**
 * A guest who speaks of an allergy or a diet the kitchen must answer. Such a
 * card is the kitchen's at lineup, never a drill: grading it would score a
 * person on reciting which dishes carry an allergen. Read wide on the title
 * and the guest's words (whole words, so nutmeg and eggs Sardou stay out of
 * it), and on ALLERGEN_TALK in the kept answer.
 */
const DIET_TALK = /\b(allerg\w*|intoleran\w*|gluten|coeliac|celiac|dairy|lactose|vegan|shellfish|nuts?|tree nuts?|peanuts?|sesame|soy|wheat)\b/i;

/** True when a scenario or mix-up belongs to the kitchen and is never dealt or graded here. */
export function kitchensCard(title: string, guest: string, answer: string): boolean {
	return DIET_TALK.test(title) || DIET_TALK.test(guest) || ALLERGEN_TALK.test(title) || ALLERGEN_TALK.test(guest) || ALLERGEN_TALK.test(answer);
}

function scenarioIsKitchens(house: House, id: string): boolean {
	const s = house.scenarios.find((x) => x.id === id);
	if (!s) return false;
	return kitchensCard(s.title || '', s.guest || '', kept(s.you));
}

/** Every guest card the house can deal: its kept scenarios, then its mix-ups with a kept difference, never one that is the kitchen's. */
export function guestDeck(house: House): GuestCard[] {
	const out: GuestCard[] = roleable(house)
		.filter((s) => !scenarioIsKitchens(house, s.id))
		.map((s) => ({ id: s.id, kind: 'scenario' as const, title: s.title, guest: s.guest }));
	for (const m of house.mixUps) {
		const sc = mixUpScenario(house, m.id);
		if (sc && !kitchensCard(sc.title, sc.guest, kept(sc.you))) out.push({ id: sc.id, kind: 'mixUp', title: sc.title, guest: sc.guest });
	}
	return out;
}

/** An answer to a guest card graded on the device by the engine's own gradeScenario; null when the card is no longer on the house. */
export function gradeGuest(house: House, card: GuestCard, said: string): ScenarioGrade | null {
	if (card.kind === 'scenario') return scenarioIsKitchens(house, card.id) ? null : gradeScenario(house, card.id, said);
	const sc = mixUpScenario(house, card.id);
	if (!sc || kitchensCard(sc.title, sc.guest, kept(sc.you))) return null;
	return gradeScenario({ ...house, scenarios: [sc] }, sc.id, said);
}

/** gradeSaid, re-exported so the page imports both graders from one place. */
export { gradeSaid };

/** The service note on an item, the person's own words, or empty. */
export function serviceNoteOf(house: House, itemId: string): string {
	for (const list of [house.dishes, house.wines, house.cocktails]) {
		const item = list.find((x) => x.id === itemId);
		if (item) return typeof item.serviceNote === 'string' ? item.serviceNote.trim() : '';
	}
	return '';
}
