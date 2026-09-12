/**
 * The .html spelling of a page, and the app's own spelling of it.
 *
 * Every page this build writes is a file: build/recipe/acaraje.html,
 * build/chapter/alabama.html, build/recipes.html. The app links them WITHOUT
 * the extension, and GitHub Pages answers both spellings with the same file,
 * so a reader can arrive by either. But the client router matched the
 * pathname it was given: "/recipe/acaraje.html" was looked up as a dish named
 * "acaraje.html", the [slug] load threw 404, and the prerendered page that had
 * just painted correctly was replaced by "Nothing at this address". Every
 * .html link in the wild, and every <loc> in a sitemap that lists the files as
 * they lie on disk, landed on a 404 inside an app that otherwise worked.
 *
 * hooks.ts reroutes the .html spelling to the route (this function), and the
 * layout rewrites the address bar to the bare form once, so the reader ends
 * up on the URL the app itself would have produced.
 *
 * Returns the pathname unchanged when there is nothing to strip, so it is safe
 * to call on every navigation.
 */
export function bareHtmlPath(pathname: string): string {
	if (!pathname.endsWith('.html')) return pathname;
	const bare = pathname.endsWith('/index.html')
		? pathname.slice(0, -'/index.html'.length)
		: pathname.slice(0, -'.html'.length);
	return bare || '/';
}
