/**
 * Drill the Menu's question engine, out of the page and under test.
 *
 * /menu/quiz built its questions inline, with `Math.random` wired straight in,
 * so none of its gates could be tested and both of its shuffles were
 * `sort(() => Math.random() - 0.5)`: biased, and in some engines a comparator
 * contract violation (see shuffle in drill.ts). Moved here with the randomness
 * injected, and otherwise unchanged: the dish questions ask exactly what they
 * asked, under exactly the gates they had, and their distractors are drawn by
 * the same loop.
 *
 * NEW: THE HOUSE'S PRODUCERS (see producers.ts). Once a venue has written down
 * at least PRODUCER_QUIZ_MIN of them, three more shapes join the drill:
 *
 * - "Who supplies the {supplies} on {dish}?", answered with a producer's NAME, for a
 *   producer tied to a dish;
 * - "Where is {producer}?", answered with a PLACE, only when that place is the
 *   producer's alone and three other distinct places exist to stand beside it;
 * - "Tell me about {producer}", a flashcard whose answer is the story.
 *
 * The floor is four because a multiple-choice question here has four options
 * and every one of them must be a real producer of this house: three would
 * leave a question with fewer wrong answers than the dish questions give, and
 * a padded option is one a server learns to discard without knowing anything.
 *
 * HOW THEY MIX. The page picks a SUBJECT, then one of that subject's question
 * shapes, and never the same subject twice running while another exists. A
 * producer that can be asked about is one more subject in that pool, weighted
 * exactly like a dish. So a menu of twelve dishes and four producers asks about
 * producers about a quarter of the time, and a venue that wrote down many
 * producers hears about them in proportion. The flashcards shuffle the story
 * cards in among the dish cards the same way. Nothing here changes which DISHES
 * the page counts as drillable, so the page's two gates (four dishes, two of
 * them drillable) read exactly as they did.
 *
 * Grading is untouched: a producer question is right or wrong the way a dish
 * question is, and a finished round is the same round, with the same
 * oot:round-complete and markStudied, whatever it asked.
 */
import type { MenuDish } from './persistence/state';
import type { Producer } from './producers';
import { shuffle, type Rand } from './drill';

export const QUIZ_LENGTH = 10;
/** The drill opens at four dishes. */
export const DISH_QUIZ_MIN = 4;
/** Producer questions join at four producers. See the header for why four. */
export const PRODUCER_QUIZ_MIN = 4;

/** Anything a question can offer as an answer: a dish, a producer, a place. */
export interface Choice {
	id: string;
	name: string;
}

export interface Question {
	kindLabel: string;
	prompt: string;
	target: Choice;
	options: Choice[];
}

/**
 * A question shape that fits a subject, with its options still to be drawn.
 * Kept lazy so the gates (which subjects are drillable at all) never spend
 * randomness, and a test of a gate never depends on a draw.
 */
export interface QuestionKind {
	kindLabel: string;
	prompt: string;
	target: Choice;
	options: (rand: Rand) => Choice[];
}

export interface Subject {
	/** 'dish:' or 'producer:' + the record's id, so the two can never collide. */
	id: string;
	kinds: QuestionKind[];
}

export type DeckCard = { kind: 'dish'; dish: MenuDish } | { kind: 'producer'; producer: Producer };

const pick = <T>(arr: readonly T[], rand: Rand): T => arr[Math.floor(rand() * arr.length)];

/* ---- the dishes: moved from the page, behaviour unchanged -------------- */

/** Four dishes: the target, and three from its own section when it has enough. */
function dishOptions(target: MenuDish, dishes: readonly MenuDish[], rand: Rand): Choice[] {
	const sameSection = dishes.filter((d) => d.section === target.section && d.id !== target.id);
	const chosen = new Map<string, MenuDish>([[target.id, target]]);
	while (chosen.size < 4) {
		const cand = pick(sameSection.length >= 3 ? sameSection : dishes, rand);
		chosen.set(cand.id, cand);
	}
	return shuffle([...chosen.values()], rand);
}

/* A dish is drillable when at least one question shape fits it. Price and
 * allergen questions demand uniqueness, or the question has two right
 * answers and the guest deserves better than a coin flip. */
export function dishKinds(d: MenuDish, dishes: readonly MenuDish[]): QuestionKind[] {
	const out: QuestionKind[] = [];
	const options = (rand: Rand) => dishOptions(d, dishes, rand);
	if (d.description)
		out.push({
			kindLabel: 'Which dish does the menu describe?',
			prompt: `“${d.description}”`,
			target: d,
			options
		});
	if (d.ingredients.length >= 2)
		out.push({
			kindLabel: 'Whose ingredients are these?',
			prompt: d.ingredients.join(' · '),
			target: d,
			options
		});
	if (d.price && dishes.filter((x) => x.price === d.price).length === 1)
		out.push({
			kindLabel: 'Which dish sells at this price?',
			prompt: d.price,
			target: d,
			options
		});
	/**
	 * Only a dish somebody has actually checked may pose an allergen
	 * question, and uniqueness is only meaningful across dishes that have
	 * all been checked: an unmarked dish carrying the same allergen looks
	 * like an absence, which is what would make the "unique" answer wrong.
	 *
	 * This refuses on the same ground dishKinds already refuses a non-unique
	 * allergen: a question with a defensible-looking wrong answer is worse
	 * than no question, and this is the one deck where the wrong answer gets
	 * said out loud to a guest.
	 */
	const allChecked = dishes.every((x) => x.allergensCheckedAt);
	const unique =
		d.allergensCheckedAt && allChecked
			? d.allergens.find((a) => dishes.filter((x) => x.allergens.includes(a)).length === 1)
			: undefined;
	if (unique)
		out.push({
			kindLabel: 'The table asks: which dish carries it?',
			prompt: unique,
			target: d,
			options
		});
	return out;
}

/** The dishes the page counts as drillable. Producers never change this. */
export function drillableDishes(dishes: readonly MenuDish[]): MenuDish[] {
	return dishes.filter((d) => dishKinds(d, dishes).length > 0);
}

/* ---- the producers ------------------------------------------------------ */

const placeKey = (place: string) => place.trim().toLowerCase();

/**
 * "the Green Hill" reads well on the producers page ("Supplies the Green
 * Hill") and doubled in the question ("Who supplies the the Green Hill..."),
 * so the question drops ONE leading article and supplies its own. Only the
 * first word: "the Green Hill and the Tomme" keeps its second "the".
 *
 * The question was "Whose {supplies} is on {dish}?", and it broke on the
 * commonest entry there is: "Whose heirloom tomatoes is on...". "Who supplies
 * the ... on ..." reads for one thing, several, or a plural.
 */
export function withoutArticle(s: string): string {
	return s.trim().replace(/^(the|a|an)\s+/i, '');
}
const asChoice = (p: Producer): Choice => ({ id: p.id, name: p.name });

/**
 * The question shapes one producer supports, given the whole house.
 *
 * Empty below PRODUCER_QUIZ_MIN producers, always. Each shape's own gate
 * (three other producers, three other places) already implies that, so the
 * guard below changes no answer today; it is here to state the rule in one
 * place, so a future shape with a looser gate inherits it.
 *
 * Two records under ONE NAME (typed twice, or the same creamery minted on two
 * tablets) are one producer to anyone reading the buttons: the other is never
 * a wrong answer to "Who supplies...", and "Where is {name}?" is not asked of either,
 * since both places would be right.
 */
export function producerKinds(
	p: Producer,
	producers: readonly Producer[],
	dishes: readonly MenuDish[]
): QuestionKind[] {
	if (producers.length < PRODUCER_QUIZ_MIN) return [];
	const out: QuestionKind[] = [];
	const nameKey = (x: Producer) => x.name.trim().toLowerCase();
	const namesake = (x: Producer) => x.id !== p.id && nameKey(x) === nameKey(p);

	/*
	 * "Who supplies the {supplies} on {dish}?" One per dish the producer is tied to
	 * that is still on the menu. The wrong answers exclude every OTHER producer
	 * on the same dish: a cheese board from two creameries would otherwise
	 * offer a second right answer marked wrong, the coin flip the dish
	 * questions refuse. With no `supplies` written the question asks the plain
	 * version, which the same exclusion keeps honest.
	 */
	for (const dishId of p.dishIds) {
		const dish = dishes.find((d) => d.id === dishId);
		if (!dish) continue;
		const others = producers.filter(
			(x) => x.id !== p.id && !namesake(x) && !x.dishIds.includes(dishId)
		);
		if (others.length < 3) continue;
		out.push({
			kindLabel: 'Who supplies it?',
			prompt: p.supplies
				? `Who supplies the ${withoutArticle(p.supplies)} on ${dish.name}?`
				: `Who supplies ${dish.name}?`,
			target: asChoice(p),
			options: (rand) => shuffle([asChoice(p), ...shuffle(others, rand).slice(0, 3).map(asChoice)], rand)
		});
	}

	/*
	 * "Where is {producer}?" Only when the place is this producer's alone (two
	 * creameries in one town would make the town a right answer to both), and
	 * only with three OTHER distinct places to offer beside it. Places are
	 * compared trimmed and case-folded, so "Thomasville, Georgia" typed twice
	 * is one place and not two options that read the same.
	 */
	const key = placeKey(p.place);
	if (
		key &&
		producers.filter((x) => placeKey(x.place) === key).length === 1 &&
		!producers.some(namesake)
	) {
		const otherPlaces = new Map<string, Choice>();
		for (const x of producers) {
			const k = placeKey(x.place);
			if (k && k !== key && !otherPlaces.has(k)) otherPlaces.set(k, { id: `place:${k}`, name: x.place.trim() });
		}
		if (otherPlaces.size >= 3) {
			const target: Choice = { id: `place:${key}`, name: p.place.trim() };
			out.push({
				kindLabel: 'Where is the producer?',
				prompt: `Where is ${p.name}?`,
				target,
				options: (rand) => shuffle([target, ...shuffle([...otherPlaces.values()], rand).slice(0, 3)], rand)
			});
		}
	}

	return out;
}

/** Producers whose story can be a flashcard: written down, and past the floor. */
export function storyProducers(producers: readonly Producer[]): Producer[] {
	if (producers.length < PRODUCER_QUIZ_MIN) return [];
	return producers.filter((p) => p.story.trim());
}

/* ---- the round and the deck -------------------------------------------- */

/** Every subject the quiz may ask about: drillable dishes, then askable producers. */
export function quizSubjects(dishes: readonly MenuDish[], producers: readonly Producer[]): Subject[] {
	const out: Subject[] = [];
	for (const d of dishes) {
		const kinds = dishKinds(d, dishes);
		if (kinds.length) out.push({ id: `dish:${d.id}`, kinds });
	}
	for (const p of producers) {
		const kinds = producerKinds(p, producers, dishes);
		if (kinds.length) out.push({ id: `producer:${p.id}`, kinds });
	}
	return out;
}

/**
 * One question. Never the same subject twice running while an alternative
 * exists: one drillable subject would mean ten questions with one possible
 * answer, which is why the page's floor is two drillable dishes.
 */
export function askFrom(
	subjects: readonly Subject[],
	lastSubjectId: string,
	rand: Rand
): { subjectId: string; question: Question } | null {
	if (!subjects.length) return null;
	const pool = subjects.filter((s) => s.id !== lastSubjectId);
	const subject = pick(pool.length ? pool : subjects, rand);
	const kind = pick(subject.kinds, rand);
	return {
		subjectId: subject.id,
		question: { kindLabel: kind.kindLabel, prompt: kind.prompt, target: kind.target, options: kind.options(rand) }
	};
}

/** The study deck: every dish, and every producer with a story, shuffled together. */
export function buildDeck(dishes: readonly MenuDish[], producers: readonly Producer[], rand: Rand): DeckCard[] {
	return shuffle(
		[
			...dishes.map((dish): DeckCard => ({ kind: 'dish', dish })),
			...storyProducers(producers).map((producer): DeckCard => ({ kind: 'producer', producer }))
		],
		rand
	);
}
