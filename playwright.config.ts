import { defineConfig } from '@playwright/test';

/**
 * E2E tests run against the PRODUCTION build served by vite preview: the same
 * bytes a user gets, service worker included. Run `npm run build` first; the
 * webServer block only starts the static server, it does not rebuild.
 */
export default defineConfig({
	testDir: 'tests',
	fullyParallel: true,
	/**
	 * Deliberate, not the default.
	 *
	 * Playwright sizes workers from CPU count (half of 20 here), but this suite
	 * is not CPU-parallel work: eleven axe runs walk large DOMs, the offline
	 * specs install service workers, the parity harness loads the 1.5MB archived
	 * original, and every one of them talks to a SINGLE Node static server. At
	 * ten workers the failures moved around the suite run to run: print, then
	 * offline, then a timer, which is the signature of contention rather than
	 * of any one broken test. Four keeps it honest and costs ~20 seconds.
	 */
	workers: 4,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: [['list']],
	timeout: 30_000,

	use: {
		baseURL: 'http://localhost:4173',
		trace: 'retain-on-failure'
	},

	webServer: {
		/**
		 * tools/serve.mjs, NOT vite preview: SvelteKit's preview middleware
		 * serves only route-manifest files, so the precached offline shell
		 * 404s and the service worker can never finish installing. serve.mjs
		 * behaves like the real static host the build ships to.
		 */
		command: 'node tools/serve.mjs 4173',
		url: 'http://localhost:4173',
		/**
		 * Never reuse. vite preview (sirv) builds its file manifest at STARTUP:
		 * a server that outlives a rebuild serves fresh HTML pointing at chunk
		 * hashes it 404s. Both mass failures this suite has ever had were this.
		 */
		reuseExistingServer: false,
		timeout: 30_000
	},

	projects: [
		{
			name: 'chromium',
			use: {
				browserName: 'chromium',
				// The service worker must be allowed to install for the offline suite.
				serviceWorkers: 'allow'
			}
		}
	]
});
