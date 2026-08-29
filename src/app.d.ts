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

	/**
	 * Also injected by vite.config.ts. Which manifest this build links, and what
	 * a home-screen icon made from it is called. Both differ between the
	 * standalone World Table and the World Table as a wing of Outside Of Time.
	 */
	const __MANIFEST_HREF__: string;
	const __APP_NAME__: string;
}

export {};
