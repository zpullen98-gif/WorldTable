/// <reference types="@vite-pwa/sveltekit" />
/// <reference types="vite-plugin-pwa/svelte" />
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		/**
		 * The shallow states /menu and /menu/quiz set: `study` is the dish whose
		 * card is open on the study view (so the back gesture closes it), and
		 * `fromStudy` marks a trip to the flash cards that should come back.
		 */
		interface PageState {
			study?: string;
			fromStudy?: boolean;
			/** The entry's in-app depth and its page's base depth (stores/nav.svelte.ts). */
			ootd?: number;
			ootb?: number;
			/** The scroll the entry was left at, restored on a pop back to it. */
			ooty?: number;
			/** The tab that opened /menu when the address no longer says: 'more' for a drawer More opened. */
			via?: string;
			/** The editing page of /menu, pushed over the study view. */
			edit?: boolean;
			/** /flashcards: the deck screen, the run and its summary (routes/flashcards). */
			fc?: {
				deck: string;
				run?: boolean;
				refs?: string[];
				i?: number;
				flipped?: boolean;
				got?: number;
				again?: number;
				missed?: string[];
				done?: boolean;
				/** Narrow this deck: a meal of the menu, or every level of a Floor Deck section. */
				meal?: string;
				every?: boolean;
				/** Explicit choice to practise a large collection in one sitting. */
				full?: boolean;
			};
			/** /quizzes: the quick quiz, its answers and its results (routes/quizzes). */
			qq?: {
				qs: Array<{
					/** cuisine: one of Cuisine's multiple choice questions, ref its id (since 12 Oct 2026). */
					kind: 'house' | 'deck' | 'lexicon' | 'cuisine';
					ref: string;
					label: string;
					stem: string;
					options: string[];
					answer: string;
					why?: string;
					drill?: string;
					/** cuisine: the entry it is about (Read about it) and the card it teaches (Study the misses). */
					entry?: string;
					card?: string;
				}>;
				i: number;
				picked: string | null;
				right: number;
				chosen: Array<string | null>;
				done: boolean;
			};
			/**
			 * /cuisine: a card run and its summary, or a round and its results
			 * (routes/cuisine). The chapters, the entries, the deck screens and
			 * the views are drawn from the address and carry no state.
			 */
			cz?: {
				/** 'run': the card screen then the summary; 'round': the questions then the results. */
				s: 'run' | 'round';
				/** run: the deck (all, lv:<n>, ch:<key>, e:<entryId>, today or misses). */
				deck?: string;
				/** run: the card ids in the order shown, an Again card sent round once more at the end. */
				refs?: string[];
				/** run and round: the place, from 0. */
				i: number;
				flipped?: boolean;
				got?: number;
				again?: number;
				/** run: the card ids answered Again. */
				missed?: string[];
				/** round: the scope (all, lv:<n>, ch:<key>, e:<entryId>) and the kind. */
				quiz?: string;
				kind?: 'mc' | 'steps' | 'match';
				/** round: each item as dealt: its id, its shuffled options (mc), its shuffled stages (steps) or its right column's order (match). */
				items?: Array<{ id: string; opts?: string[]; pool?: string[]; order?: number[] }>;
				/** round, the item on show: the option picked (mc), the pool indexes placed (steps), the pairs made as [left, right] (match). */
				picked?: string | null;
				placed?: number[];
				links?: Array<[number, number]>;
				/** round: each answered item, right or not, with what was said and the positions or rows that were wrong. */
				answers?: Array<{ ok: boolean; said?: string; wrong?: number[] }>;
				done?: boolean;
			};
		}
		// interface Platform {}
	}

	/**
	 * Injected by vite.config.ts. The safety page states when it was BUILT and
	 * never "current as of": an offline app cannot know when a food code changed.
	 */
	const __BUILD_DATE__: string;

	/**
	 * Also injected by vite.config.ts. Which manifest this build links, and what
	 * a home-screen icon made from it is called. Both differ between the
	 * standalone World Table and the World Table as a wing of Outside Of Time.
	 */
	const __MANIFEST_HREF__: string;
	const __APP_NAME__: string;
}

export {};
