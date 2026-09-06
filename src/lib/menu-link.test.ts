import { describe, it, expect, vi } from 'vitest';
import { htmlToMenuText, linkToText, type LinkResult } from './menu-link';

/**
 * Reading a venue's menu from a link.
 *
 * Two things are under test, and the second matters more than the first. One
 * is the HTML walk: a real restaurant page is mostly navigation, analytics and
 * a cookie bar, and what comes out has to be the dishes, in the order they
 * were printed, with the prices still beside them.
 *
 * The other is the failure. A static app with no server can only read another
 * site's page if that site opted into CORS, and almost none have, so the
 * refusal is the path most cooks will take. Every refusal has to say what
 * happened and hand back an address they can open and copy from themselves.
 * The one exception is an address the app refused to open at all, which comes
 * back with no link, because a `javascript:` URL rendered as a clickable "open
 * it yourself" is a trap, not a next step.
 *
 * Nothing here reads allergens, and nothing here may be made to: a menu names
 * a dish, it does not name what is in it.
 */

const TABLE_MENU = `<!doctype html>
<html lang="en">
<head>
	<title>La Table</title>
	<meta name="description" content="Our menu">
	<style>.price { color: #900 }</style>
</head>
<body>
<header>
	<h1>La Table</h1>
	<nav><ul><li><a href="/">Home</a></li><li><a href="/menu">Menu</a></li></ul></nav>
</header>
<main>
	<h2>Starters</h2>
	<table class="menu">
		<tr><td class="name">Sopa de Lima</td><td class="price">$9</td></tr>
		<tr><td class="name">Pan con Tomate<br><span>rubbed with garlic &amp; salt</span></td><td class="price">$7</td></tr>
	</table>
	<h2>Mains</h2>
	<table class="menu">
		<thead><tr><th>Dish</th><th>Price</th></tr></thead>
		<tbody><tr><td>Cochinita Pibil</td><td>$24</td></tr></tbody>
	</table>
</main>
<footer><p>Open Tuesday to Sunday. &copy; 2026</p></footer>
</body>
</html>`;

const LIST_MENU = `<div class="menu">
	<h3>Small Plates</h3>
	<ul>
		<li><span class="name">Padr&oacute;n Peppers</span> <span class="price">6.50</span></li>
		<li>
			<div class="name">Boquerones</div>
			<div class="desc">white anchovies &amp; parsley</div>
			<div class="price">8</div>
		</li>
		<li><span>Tortilla</span>&nbsp;&nbsp;&nbsp;<span>7</span></li>
	</ul>
</div>`;

const SCRIPTED_MENU = `<body>
<div role="dialog" aria-label="Cookies">
	<p>We use cookies to improve your visit.</p>
	<button>Accept all</button>
</div>
<script>
	var menu = [{ "name": "Analytics Dish", "price": 999 }];
	if (a < b && c > d) { document.write("<p>Tracked</p>"); }
</script>
<section>
	<h2>Tacos</h2>
	<p>Al Pastor &mdash; 4.00</p>
	<p>Suadero <span aria-hidden="true">*</span> 4.50</p>
</section>
<div class="cookie-note">This site uses cookies</div>
</body>`;

const linesOf = (text: string) => text.split('\n');

describe('what comes out of a table-based menu page', () => {
	const text = htmlToMenuText(TABLE_MENU);

	it('keeps a row together, so the price stays beside its dish', () => {
		// A newline between the two cells would leave "$9" alone on a line,
		// where the next pass over the text reads it as a dish name.
		expect(linesOf(text)).toContain('Sopa de Lima\t$9');
		expect(linesOf(text)).toContain('Cochinita Pibil\t$24');
	});

	it('leaves the chrome, the stylesheet and the small print behind', () => {
		expect(text).not.toContain('.price');
		expect(text).not.toContain('color: #900');
		expect(text).not.toContain('Home');
		expect(text).not.toContain('Open Tuesday to Sunday');
		expect(text).not.toContain('Our menu');
	});

	it('keeps the reading order, so the sections still mean something', () => {
		expect(text.indexOf('Starters')).toBeGreaterThanOrEqual(0);
		expect(text.indexOf('Starters')).toBeLessThan(text.indexOf('Sopa de Lima'));
		expect(text.indexOf('Sopa de Lima')).toBeLessThan(text.indexOf('Mains'));
		expect(text.indexOf('Mains')).toBeLessThan(text.indexOf('Cochinita Pibil'));
	});

	it('turns a <br> into a line and decodes the entities around it', () => {
		expect(text).toContain('Pan con Tomate');
		expect(text).toContain('rubbed with garlic & salt');
	});

	it('never leaves a blank line doubled up', () => {
		expect(text).not.toMatch(/\n\n\n/);
		expect(text.startsWith('\n')).toBe(false);
		expect(text.endsWith('\n')).toBe(false);
	});
});

describe('what comes out of a list-based menu page', () => {
	const text = htmlToMenuText(LIST_MENU);
	const lines = linesOf(text);

	it('keeps inline spans on one line and the space between them', () => {
		// "Padrón Peppers6.50" is what a naive trim of every text run gives.
		expect(lines).toContain('Padrón Peppers 6.50');
	});

	it('gives each block-level part of an item its own line', () => {
		expect(lines).toContain('Boquerones');
		expect(lines).toContain('white anchovies & parsley');
		expect(lines).toContain('8');
	});

	it('collapses a run of &nbsp; to a single ordinary space', () => {
		expect(lines).toContain('Tortilla 7');
		// The nbsp itself, spelled out: it is invisible in this file otherwise.
		expect(text).not.toContain('\u00A0');
	});

	it('starts with the section heading', () => {
		expect(lines[0]).toBe('Small Plates');
	});
});

describe('a page carrying a script and a cookie bar', () => {
	const text = htmlToMenuText(SCRIPTED_MENU);

	it('imports nothing at all out of the script', () => {
		expect(text).not.toContain('Analytics Dish');
		expect(text).not.toContain('document.write');
		expect(text).not.toContain('Tracked');
		expect(text).not.toContain('var menu');
	});

	it('is not fooled by a comparison inside the script', () => {
		// `if (a < b && c > d)` reads as the start of a <b> element to anything
		// that walks tags through a script body, and the scan for its closing
		// bracket then runs on and swallows the menu underneath.
		expect(text).toContain('Al Pastor');
		expect(text).toContain('Tacos');
	});

	it('drops a cookie bar that marked itself as a dialog', () => {
		expect(text).not.toContain('Accept all');
		expect(text).not.toContain('We use cookies to improve your visit');
	});

	it('keeps a plainly-marked banner, because it cannot tell it from a dish', () => {
		// This is the honest half. There is no cookie-banner detector here; a
		// banner written as a plain div arrives as one more line for the cook
		// to delete on the review screen, and pretending otherwise would be a
		// promise the walk cannot keep.
		expect(text).toContain('This site uses cookies');
	});

	it('takes a decorative marker out without splitting the dish from its price', () => {
		expect(linesOf(text)).toContain('Suadero 4.50');
	});

	it('leaves the venue its own punctuation', () => {
		// The house style bans the em dash in the product's prose. This is the
		// venue's menu, not the product's prose, and rewriting a dish line is
		// not the importer's business.
		expect(text).toContain('Al Pastor — 4.00');
	});
});

describe('the parts of a page that trip a naive strip', () => {
	it('keeps a bare < in a description instead of eating the rest of the line', () => {
		expect(htmlToMenuText('<p>Ready in < 5 minutes, at the pass</p>')).toBe(
			'Ready in < 5 minutes, at the pass'
		);
	});

	it('does not end a tag inside a quoted attribute', () => {
		// indexOf('>') ends this tag mid-attribute and spills stew"> into the menu.
		expect(htmlToMenuText('<a href="/x" title="soup > stew">Caldo</a>')).toBe('Caldo');
	});

	it('drops an HTML comment, including one wrapping markup', () => {
		expect(htmlToMenuText('<p>Mole</p><!-- <p>Old price 12</p> --><p>16</p>')).toBe('Mole\n16');
	});

	it('drops a head that was never closed, and stops at the body', () => {
		// </head> is optional in HTML and hand-written pages leave it out. A
		// scan that only looks for the closing tag eats the whole document.
		const text = htmlToMenuText(
			'<html><head><title>Ignore me</title><body><p>Ceviche</p></body></html>'
		);
		expect(text).toBe('Ceviche');
	});

	it('drops hidden content but keeps an accordion section', () => {
		expect(htmlToMenuText('<div hidden><p>Last year</p></div><p>Now</p>')).toBe('Now');
		expect(htmlToMenuText('<div aria-hidden="true"><p>Icon</p></div><p>Now</p>')).toBe('Now');
		// hidden="until-found" is how a browser marks a collapsed section it
		// will reveal on find-in-page, and on a restaurant site that is very
		// often the menu itself.
		expect(htmlToMenuText('<div hidden="until-found"><p>Desserts</p></div>')).toBe('Desserts');
	});

	it('does not mistake data-hidden for hidden', () => {
		expect(htmlToMenuText('<div data-hidden="true"><p>Churros</p></div>')).toBe('Churros');
	});

	it('counts nesting, so an inner nav does not end the outer one early', () => {
		const text = htmlToMenuText('<nav>A<nav>B</nav>C</nav><p>Arepas</p>');
		expect(text).toBe('Arepas');
	});

	it('decodes numeric and named entities, and leaves a bare ampersand alone', () => {
		expect(htmlToMenuText('<p>Caf&eacute; &#8226; Th&#xe9; &frac12; portion</p>')).toBe(
			'Café • Thé ½ portion'
		);
		// Requiring the semicolon is what keeps this from reading an entity out
		// of a page that never had one.
		expect(htmlToMenuText('<p>AT&Tea Room, salt &amp; pepper</p>')).toBe(
			'AT&Tea Room, salt & pepper'
		);
		expect(htmlToMenuText('<p>&notareal; entity</p>')).toBe('&notareal; entity');
	});

	it('strips the invisible characters that would ride into a saved dish', () => {
		// A soft hyphen inside a name is impossible to see on the review screen
		// and breaks every later match against that name.
		expect(htmlToMenuText('<p>Bouil&shy;labaisse</p>')).toBe('Bouillabaisse');
		expect(htmlToMenuText('<p>Ta\u200Bcos</p>')).toBe('Tacos');
	});

	it('returns nothing for a page with nothing in it', () => {
		expect(htmlToMenuText('')).toBe('');
		expect(htmlToMenuText('<html><body>   \n  </body></html>')).toBe('');
	});
});

/* ---------------------------------------------------------------------- */

interface Call {
	url: string;
	init: RequestInit | undefined;
}

/** A fetch that answers with whatever the test hands it, and records the call. */
function fetchReturning(reply: Response | (() => Response), calls: Call[] = []): typeof fetch {
	return (async (input: RequestInfo | URL, init?: RequestInit) => {
		calls.push({ url: String(input), init });
		return typeof reply === 'function' ? reply() : reply;
	}) as typeof fetch;
}

const html = (body: string, type = 'text/html; charset=utf-8', status = 200) =>
	new Response(body, { status, headers: { 'content-type': type } });

/** Narrowing helper, so a failed read can be read for its reason. */
function refused(result: LinkResult): { reason: string; openUrl: string } {
	if (result.ok) throw new Error(`expected a refusal, got text: ${result.text.slice(0, 60)}`);
	return { reason: result.reason, openUrl: result.openUrl };
}

describe('the address a cook pastes', () => {
	it('completes a bare domain with https', async () => {
		const calls: Call[] = [];
		await linkToText('joesdiner.test/menu', fetchReturning(html(LIST_MENU), calls));
		expect(calls[0].url).toBe('https://joesdiner.test/menu');
	});

	it('trims the whitespace that comes with a copied link', async () => {
		const calls: Call[] = [];
		await linkToText('  https://joesdiner.test/menu  ', fetchReturning(html(LIST_MENU), calls));
		expect(calls[0].url).toBe('https://joesdiner.test/menu');
	});

	it('leaves an http address as http rather than upgrading it silently', async () => {
		const calls: Call[] = [];
		await linkToText('http://joesdiner.test/menu', fetchReturning(html(LIST_MENU), calls));
		expect(calls[0].url).toBe('http://joesdiner.test/menu');
	});

	it('refuses a scheme that is not http or https, and offers no link to open', async () => {
		const calls: Call[] = [];
		for (const bad of ['javascript:alert(1)', 'data:text/html,<p>x</p>', 'ftp://x.test/menu']) {
			const said = refused(await linkToText(bad, fetchReturning(html(''), calls)));
			expect(said.reason).toMatch(/http and https/);
			// The screen renders openUrl as a link. Handing back an address the
			// app just declined to fetch would turn the refusal into a click.
			expect(said.openUrl).toBe('');
		}
		expect(calls).toHaveLength(0);
	});

	it('refuses an empty box and a mangled address without fetching', async () => {
		const calls: Call[] = [];
		expect(refused(await linkToText('   ', fetchReturning(html(''), calls))).reason).toMatch(
			/no address/i
		);
		expect(
			refused(await linkToText('not an address at all', fetchReturning(html(''), calls))).reason
		).toMatch(/not a web address/i);
		expect(calls).toHaveLength(0);
	});
});

describe('reading the page at the far end', () => {
	it('hands back the menu text, and nothing that could pass for an allergen', async () => {
		const result = await linkToText('joesdiner.test/menu', fetchReturning(html(TABLE_MENU)));
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.text).toContain('Sopa de Lima\t$9');
		expect(result.text).not.toContain('Home');
		// The contract the review screen leans on: text, and only text. An
		// allergen has to be checked dish by dish by a person.
		expect(Object.keys(result).sort()).toEqual(['ok', 'text']);
	});

	it('sends nothing about the cook along with the request', async () => {
		const calls: Call[] = [];
		await linkToText('joesdiner.test/menu', fetchReturning(html(TABLE_MENU), calls));
		expect(calls[0].init?.credentials).toBe('omit');
		expect(calls[0].init?.referrerPolicy).toBe('no-referrer');
	});

	it('takes a text/plain menu as it stands rather than through the HTML walk', async () => {
		// The HTML pass collapses newlines, which is the one thing a plain-text
		// menu cannot survive.
		const plain = 'STARTERS\nSopa de Lima 9\nPan con Tomate 7\n\nMAINS\nCochinita Pibil 24\n';
		const result = await linkToText(
			'joesdiner.test/menu.txt',
			fetchReturning(html(plain, 'text/plain'))
		);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(linesOf(result.text)).toContain('Sopa de Lima 9');
		expect(linesOf(result.text)).toContain('Cochinita Pibil 24');
	});
});

describe('when the read cannot happen, and the cook needs the next step', () => {
	const target = 'https://joesdiner.test/menu';

	it('names the refusal for what it is, and hands back the address to open', async () => {
		// This is the ordinary ending, not the rare one: a browser cannot read
		// another site's page unless that site opted in, and restaurant sites
		// have no reason to have done it.
		const said = refused(
			await linkToText(target, (() => {
				throw new TypeError('Failed to fetch');
			}) as unknown as typeof fetch)
		);
		expect(said.reason).toMatch(/did not allow the app to read/);
		expect(said.openUrl).toBe(target);
	});

	it('says the page is gone on a 404, and still offers the address', async () => {
		const said = refused(await linkToText(target, fetchReturning(html('Not found', 'text/html', 404))));
		expect(said.reason).toContain('404');
		expect(said.openUrl).toBe(target);
	});

	it('names the site error on any other bad status', async () => {
		expect(
			refused(await linkToText(target, fetchReturning(html('nope', 'text/html', 503)))).reason
		).toContain('503');
		expect(
			refused(await linkToText(target, fetchReturning(html('nope', 'text/html', 403)))).reason
		).toContain('403');
	});

	it('stops waiting on a site that never answers', async () => {
		vi.useFakeTimers();
		try {
			const hangs = ((_input: RequestInfo | URL, init?: RequestInit) =>
				new Promise<Response>((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () =>
						reject(new DOMException('aborted', 'AbortError'))
					);
				})) as typeof fetch;
			const pending = linkToText(target, hangs);
			await vi.advanceTimersByTimeAsync(60_000);
			const said = refused(await pending);
			expect(said.reason).toMatch(/took longer than \d+ seconds/);
			expect(said.openUrl).toBe(target);
		} finally {
			vi.useRealTimers();
		}
	});

	it('stops waiting on a site that answers and then stalls mid-page', async () => {
		// The clock has to cover the read, not just the reply. Clearing it once
		// the headers arrived left a stalled body waiting for good.
		vi.useFakeTimers();
		try {
			const stalls = ((_input: RequestInfo | URL, init?: RequestInit) =>
				Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ 'content-type': 'text/html' }),
					text: () =>
						new Promise<string>((_resolve, reject) => {
							init?.signal?.addEventListener('abort', () =>
								reject(new DOMException('aborted', 'AbortError'))
							);
						})
				} as unknown as Response)) as typeof fetch;
			const pending = linkToText(target, stalls);
			await vi.advanceTimersByTimeAsync(60_000);
			const said = refused(await pending);
			expect(said.reason).toMatch(/took longer than \d+ seconds/);
			expect(said.openUrl).toBe(target);
		} finally {
			vi.useRealTimers();
		}
	});

	it('says so when the link is a PDF, which is what half of them are', async () => {
		const said = refused(
			await linkToText(target, fetchReturning(html('%PDF-1.7', 'application/pdf')))
		);
		expect(said.reason).toMatch(/PDF/);
		expect(said.openUrl).toBe(target);
	});

	it('names any other kind of file rather than importing gibberish', async () => {
		const said = refused(
			await linkToText(target, fetchReturning(html('{"menu":[]}', 'application/json')))
		);
		expect(said.reason).toContain('application/json');
	});

	it('explains a page whose menu is drawn after it loads', async () => {
		// A JavaScript-rendered menu returns a full document whose text is a
		// cookie line and a phone number. Calling that a success hands the cook
		// an empty box with nothing to do about it.
		const shell = '<html><head><title>Joe</title></head><body><div id="app"></div></body></html>';
		const said = refused(await linkToText(target, fetchReturning(html(shell))));
		expect(said.reason).toMatch(/almost no text/);
		expect(said.openUrl).toBe(target);
	});

	it('writes every refusal in the house voice', async () => {
		const reasons = [
			refused(await linkToText('javascript:alert(1)')).reason,
			refused(await linkToText('   ')).reason,
			refused(await linkToText(target, fetchReturning(html('x', 'text/html', 404)))).reason,
			refused(await linkToText(target, fetchReturning(html('%PDF', 'application/pdf')))).reason,
			refused(
				await linkToText(target, (() => {
					throw new TypeError('Failed to fetch');
				}) as unknown as typeof fetch)
			).reason
		];
		for (const reason of reasons) {
			expect(reason).not.toContain('—');
			expect(reason).not.toContain(' -- ');
			expect(reason).not.toMatch(/sorry|unfortunately|oops/i);
			// One sentence, and it ends like one.
			expect(reason.trim()).toMatch(/[.)]$/);
		}
	});
});
