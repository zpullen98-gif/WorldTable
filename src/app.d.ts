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
			};
			/** /quizzes: the quick quiz, its answers and its results (routes/quizzes). */
			qq?: {
				qs: Array<{
					kind: 'house' | 'deck' | 'lexicon';
					ref: string;
					label: string;
					stem: string;
					options: string[];
					answer: string;
					why?: string;
					drill?: string;
				}>;
				i: number;
				picked: string | null;
				right: number;
				chosen: Array<string | null>;
				done: boolean;
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
