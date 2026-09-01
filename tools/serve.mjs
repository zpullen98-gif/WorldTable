/**
 * A plain static file server over build/, because `vite preview` is NOT one.
 *
 * SvelteKit's preview middleware serves from its route manifest: prerendered
 * pages and hashed assets resolve, but any HTML file that is not a route:
 * including the offline shell the service worker must precache BY URL, 404s
 * even though it sits right there on disk. Under vite preview the service
 * worker can never finish installing, which made the offline suite fail
 * against a build that works perfectly on a real host.
 *
 * This is what a real host does, in ~60 lines:
 *   /path            -> build/path, or build/path.html (prerendered routes)
 *   anything unknown -> build/shell.html, status 200 (the SPA fallback,
 *                       mirroring GitHub Pages' 404.html behaviour)
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BUILD = join(dirname(fileURLToPath(import.meta.url)), '..', 'build');
const PORT = Number(process.argv[2] ?? 4173);

const MIME = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.webmanifest': 'application/manifest+json',
	'.png': 'image/png',
	'.svg': 'image/svg+xml',
	'.woff2': 'font/woff2',
	'.woff': 'font/woff',
	'.txt': 'text/plain'
};

async function tryRead(path) {
	try {
		return await readFile(path);
	} catch {
		return null;
	}
}

createServer(async (req, res) => {
	/*
	 * decodeURIComponent throws URIError on a malformed escape, and this handler
	 * is async, so the throw became an unhandled rejection and took the whole
	 * server down: `GET /recipe/%zz` answered ECONNRESET and every request after
	 * it ECONNREFUSED, exit code 1. Playwright runs the suite against this
	 * server, so one bad path would read as a mass failure of everything after
	 * it rather than as the one bad request it is.
	 *
	 * Only the pathname is decoded, so a query or fragment never reached it,
	 * and this is the local static server rather than the shipping app.
	 */
	let url;
	try {
		url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
	} catch {
		res.writeHead(400).end();
		return;
	}
	// Traversal guard: normalize, then refuse anything escaping build/.
	const safe = normalize(url).replace(/^(\.\.[/\\])+/, '');
	const base = join(BUILD, safe);
	if (!base.startsWith(BUILD)) {
		res.writeHead(403).end();
		return;
	}

	let file = null;
	let served = base;
	if (url.endsWith('/')) {
		file = await tryRead(join(base, 'index.html'));
		served = join(base, 'index.html');
	} else {
		file = await tryRead(base);
		if (!file && !extname(base)) {
			// Prerendered routes are extensionless: /lexicon -> lexicon.html
			file = await tryRead(base + '.html');
			served = base + '.html';
		}
	}

	if (!file) {
		// The SPA fallback, as a real host configured for this app would serve it.
		file = await tryRead(join(BUILD, 'shell.html'));
		served = join(BUILD, 'shell.html');
		if (!file) {
			res.writeHead(404).end('not found');
			return;
		}
	}

	res.writeHead(200, {
		'content-type': MIME[extname(served)] ?? 'application/octet-stream',
		'cache-control': 'no-cache'
	});
	res.end(file);
}).listen(PORT, () => {
	console.log(`serving build/ on http://localhost:${PORT}`);
});
