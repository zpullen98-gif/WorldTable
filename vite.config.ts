import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Empty for local dev and `npm run preview`. GitHub Pages serves from a
// subpath, so deploying there is just: BASE_PATH=/WorldTable npm run build
const base = (process.env.BASE_PATH ?? '') as '' | `/${string}`;

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Static output: no server, no runtime. `fallback` gives us a SPA
			// entry point for routes we deliberately don't prerender, and is what
			// the service worker's navigation fallback serves offline.
			adapter: adapter({
				pages: 'build',
				assets: 'build',
				fallback: '200.html',
				precompress: false,
				strict: false
			}),

			paths: { base },

			prerender: {
				// A dead internal link is a bug; a dead YouTube link is the
				// internet's problem. Fail the build on ours only.
				handleHttpError: 'fail',
				handleMissingId: 'fail'
			}
		})
	]
});
