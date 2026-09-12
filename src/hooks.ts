import type { Reroute } from '@sveltejs/kit';
import { bareHtmlPath } from '$lib/htmlPath';

/**
 * Universal hooks: this runs in the prerenderer and in the browser.
 *
 * reroute: the on-disk spelling of a page routes to the page. See
 * $lib/htmlPath.ts for the defect this closes. The hook changes only which
 * route is matched; the address bar is left as it was, and the layout
 * tidies that separately, after hydration.
 *
 * It returns undefined for every pathname that does not end in .html, which
 * is every URL the app produces itself, so the router's normal path is
 * untouched. The pathname it returns includes `base`, as SvelteKit requires.
 */
export const reroute: Reroute = ({ url }) => {
	const bare = bareHtmlPath(url.pathname);
	return bare === url.pathname ? undefined : bare;
};
