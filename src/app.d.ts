/// <reference types="@vite-pwa/sveltekit" />
/// <reference types="vite-plugin-pwa/svelte" />
// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	/**
	 * Injected by vite.config.ts. The safety page states when it was BUILT and
	 * never "current as of": an offline app cannot know when a food code changed.
	 */
	const __BUILD_DATE__: string;
}

export {};
