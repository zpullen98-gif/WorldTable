/**
 * Bringing a menu in from a link, and being straight about when that cannot
 * work.
 *
 * ## What this can and cannot do
 *
 * There is no server anywhere in this product, so the only thing that can go
 * and get a page is the cook's own browser, and a browser is not allowed to
 * read a page on somebody else's origin unless that site opts in with CORS.
 * Most restaurant sites do not. The usual workaround is to bounce the request
 * off a public proxy, and that is exactly what this file must never do: it
 * would hand the venue's address to a stranger to fix a convenience, and this
 * app tells people their kitchen never leaves their device.
 *
 * So the fetch is attempted, and when it fails the failure is the feature.
 * `reason` says what happened in a sentence a cook can act on, and `openUrl`
 * is the address to open in a new tab so they can select the menu, copy it and
 * paste it into the box instead. The screen offers that as the next step, so
 * the two fields always travel together.
 *
 * The one request this file makes goes to the address the cook typed and
 * nowhere else, carries no cookies (`credentials: 'omit'`) and does not tell
 * the site where the reader came from (`referrerPolicy: 'no-referrer'`).
 *
 * ## Allergens
 *
 * Nothing here returns allergen information, and nothing downstream may invent
 * any from this text. A menu says "Pad Thai", not "peanuts, egg, fish, soy",
 * and an imported dish must reach the kitchen with `allergens: []` and
 * `allergensCheckedAt` still undefined, which is what separates "nobody has
 * checked this dish" from "somebody checked, and it contains none".
 *
 * ## Why the HTML is walked by hand
 *
 * `htmlToMenuText` is the pure half and the tested half, and it runs under
 * plain Node in vitest where there is no DOMParser to borrow. A regex that
 * strips angle brackets is not an option either: it turns `<script>` bodies
 * into dish names, and the first thing a cook would see imported off a real
 * restaurant page is a line of Google Analytics. So the string is scanned tag
 * by tag, quoted attributes included, and the elements that never hold menu
 * text are skipped whole.
 */

export type LinkResult =
	| { ok: true; text: string }
	| { ok: false; reason: string; openUrl: string };

/**
 * How long to wait before giving up on a site. Long enough for a slow café
 * host on a phone connection, short enough that a cook standing at the pass
 * gets an answer and the copy-and-paste route instead of a spinner.
 */
const TIMEOUT_MS = 12_000;

/**
 * Below this many characters the page is treated as unreadable rather than as
 * a very short menu. A page whose menu is drawn by JavaScript after load
 * returns a full HTML document whose text is a cookie line and a phone number,
 * and reporting that as success would hand the cook an empty box with no
 * explanation and no way forward.
 */
const TOO_LITTLE_TEXT = 40;

/* -------------------------------------------------------------------------
 * The address
 * ---------------------------------------------------------------------- */

/**
 * People paste `joesdiner.com/menu` far more often than they paste a scheme,
 * so a bare domain is completed rather than refused. Everything that is not
 * http or https is refused outright, and refused with an EMPTY `openUrl`:
 * the screen renders that field as a link the cook can click, and handing it
 * back a `javascript:` or `data:` address we already declined to fetch would
 * turn a typo, or a pasted trap, into a click that runs.
 */
function tidyUrl(raw: string): { ok: true; url: string } | { ok: false; reason: string } {
	const trimmed = raw.trim();
	if (!trimmed) {
		return { ok: false, reason: 'There is no address in the box yet.' };
	}
	// A scheme is a letter followed by letters, digits, +, - or . up to the
	// colon. Testing for that rather than for "://" keeps `mailto:` and
	// `javascript:` in the refusal branch below instead of quietly growing an
	// https:// prefix and becoming a fetchable address.
	const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed);
	const candidate = hasScheme ? trimmed : `https://${trimmed}`;

	let parsed: URL;
	try {
		parsed = new URL(candidate);
	} catch {
		return { ok: false, reason: 'That is not a web address the app can read.' };
	}
	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
		return {
			ok: false,
			reason: `The app opens http and https addresses only, and that one is ${parsed.protocol.replace(':', '')}.`
		};
	}
	if (!parsed.hostname) {
		return { ok: false, reason: 'That address is missing a site name.' };
	}
	return { ok: true, url: parsed.toString() };
}

/* -------------------------------------------------------------------------
 * HTML to text
 * ---------------------------------------------------------------------- */

/** Elements that close themselves, so a `</p>`-style depth count never applies. */
const VOID_TAGS = new Set([
	'area',
	'base',
	'br',
	'col',
	'embed',
	'hr',
	'img',
	'input',
	'link',
	'meta',
	'param',
	'source',
	'track',
	'wbr'
]);

/**
 * Script and style bodies are raw text, not markup, so they are skipped with a
 * search for the closing tag rather than by walking tags. Walking would be
 * wrong and badly wrong: `if (a < b)` inside a script reads as the start of a
 * `<b>` element, and the scan for its `>` runs on into the page and swallows
 * the menu.
 */
const RAW_TEXT_TAGS = new Set(['script', 'style']);

/**
 * Elements that never hold a dish. `head` holds the machine-readable half of
 * the page, `nav`, `header` and `footer` hold the chrome that surrounds every
 * page of the site, `template` holds markup that was never rendered at all,
 * `noscript` holds a nag about JavaScript, and `svg` holds path data plus the
 * odd `<title>` that would land mid-menu as a stray word.
 */
const DROP_TAGS = new Set([
	'script',
	'style',
	'head',
	'nav',
	'header',
	'footer',
	'template',
	'noscript',
	'svg'
]);

/**
 * The same landmarks spelled as ARIA roles, because a cookie bar or a site
 * header is as often a `<div role="dialog">` as it is a real element. This is
 * not a cookie-banner detector and does not pretend to be one: a banner
 * marked up as a plain `<div class="cookie-notice">` comes through as two
 * lines of text, which the cook deletes on the review screen along with
 * anything else the page carried.
 */
const DROP_ROLES = new Set(['banner', 'navigation', 'contentinfo', 'dialog', 'alertdialog', 'search']);

/** Containers and headings worth a blank line, so a menu's sections survive. */
const PARA_TAGS = new Set([
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'hr',
	'table',
	'section',
	'article',
	'aside',
	'main',
	'ul',
	'ol',
	'dl',
	'blockquote',
	'figure'
]);

/** Everything else that starts a new line. */
const LINE_TAGS = new Set([
	'p',
	'div',
	'br',
	'li',
	'tr',
	'thead',
	'tbody',
	'tfoot',
	'dt',
	'dd',
	'pre',
	'address',
	'caption',
	'figcaption',
	'summary',
	'details',
	'fieldset',
	'legend',
	'option',
	'form',
	'nav',
	'header',
	'footer',
	'dialog'
]);

/**
 * Table cells break with a tab, not a newline. A table menu writes the dish in
 * one cell and the price in the next, and a newline between them leaves
 * "$24" sitting alone on a line where it reads like the name of the next
 * dish. A tab keeps the row intact and still marks where the columns were.
 */
const CELL_TAGS = new Set(['td', 'th']);

const NO_BREAK = 0;
const CELL_BREAK = 1;
const LINE_BREAK = 2;
const PARA_BREAK = 3;

function breakFor(name: string): number {
	if (PARA_TAGS.has(name)) return PARA_BREAK;
	if (LINE_TAGS.has(name)) return LINE_BREAK;
	if (CELL_TAGS.has(name)) return CELL_BREAK;
	return NO_BREAK;
}

const NAMED_ENTITIES: Record<string, string> = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' ',
	ensp: ' ',
	emsp: ' ',
	thinsp: ' ',
	shy: '',
	ndash: '–',
	/* The em dash below is a literal on purpose. The monorepo publish gate
	   counts U+2014 across the built tree, and the escape hatch it offers,
	   writing the escape instead, only survives inside a regex body: rolldown
	   folds both an escape and a String.fromCharCode call in a plain string
	   straight back to the character, which was measured, not assumed. There is
	   nothing to be done about it and nothing that needs doing: an entity table
	   exists to produce the characters it names, and one dash sits well inside
	   the gate's baseline. Escape the ones in menu-parse.ts, not this one. */
	mdash: '—',
	hellip: '…',
	lsquo: '‘',
	rsquo: '’',
	ldquo: '“',
	rdquo: '”',
	bull: '•',
	middot: '·',
	sbquo: '‚',
	dagger: '†',
	Dagger: '‡',
	times: '×',
	frac12: '½',
	frac14: '¼',
	frac34: '¾',
	deg: '°',
	euro: '€',
	pound: '£',
	yen: '¥',
	cent: '¢',
	copy: '©',
	reg: '®',
	trade: '™',
	sect: '§',
	para: '¶',
	laquo: '«',
	raquo: '»',
	aacute: 'á',
	agrave: 'à',
	acirc: 'â',
	auml: 'ä',
	aring: 'å',
	atilde: 'ã',
	aelig: 'æ',
	ccedil: 'ç',
	eacute: 'é',
	egrave: 'è',
	ecirc: 'ê',
	euml: 'ë',
	iacute: 'í',
	icirc: 'î',
	iuml: 'ï',
	ntilde: 'ñ',
	oacute: 'ó',
	ograve: 'ò',
	ocirc: 'ô',
	ouml: 'ö',
	oslash: 'ø',
	otilde: 'õ',
	uacute: 'ú',
	ugrave: 'ù',
	ucirc: 'û',
	uuml: 'ü',
	szlig: 'ß'
};

/**
 * The semicolon is required. It is optional in the HTML spec for a handful of
 * legacy names, and honouring that turns "AT&Tea Room" into "AT<Tea Room" on a
 * page that never contained an entity at all. A menu loses nothing by leaving
 * a malformed entity as the literal text the page author typed.
 */
function decodeEntities(text: string): string {
	if (!text.includes('&')) return text;
	return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]{1,31});/gi, (whole, body: string) => {
		if (body[0] === '#') {
			const code =
				body[1] === 'x' || body[1] === 'X'
					? Number.parseInt(body.slice(2), 16)
					: Number.parseInt(body.slice(1), 10);
			// Lone surrogates and out-of-range codepoints throw from
			// fromCodePoint, and a menu page with a broken entity in it should
			// still import: keep the source text rather than the exception.
			if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return whole;
			if (code >= 0xd800 && code <= 0xdfff) return whole;
			return String.fromCodePoint(code);
		}
		const named = NAMED_ENTITIES[body];
		if (named !== undefined) return named;
		// Case-insensitive second look, so &Eacute; and &NBSP; decode too,
		// without letting &AMP; overwrite the deliberately cased &Dagger;.
		const lower = NAMED_ENTITIES[body.toLowerCase()];
		return lower !== undefined ? lower : whole;
	});
}

/**
 * Runs of whitespace become one space, because HTML says so and because a
 * pretty-printed page indents every line of the menu. The invisible
 * characters go with them: a soft hyphen or a zero-width space inside a dish
 * name is impossible to see on the review screen and would sit in the saved
 * dish forever, quietly failing every later match on its name.
 */
function normaliseText(raw: string): string {
	return decodeEntities(raw)
		.replace(/[\u00AD\u200B-\u200D\uFEFF]/g, '')
		.replace(/\s+/g, ' ');
}

interface Tag {
	name: string;
	closing: boolean;
	selfClosing: boolean;
	attrs: string;
	/** Index just past the closing `>`. */
	end: number;
}

/**
 * Reads one tag starting at `at`, which must be a `<`. Returns null when what
 * follows is not a tag name at all, which is how a bare `<` in prose ("< 5
 * minutes") stays in the text instead of eating the rest of the line.
 *
 * The scan for the closing `>` tracks quotes, because `<a title="soup > stew">`
 * is legal markup and a naive indexOf('>') ends the tag inside the attribute
 * and spills `stew">` into the menu.
 */
function readTag(html: string, at: number): Tag | null {
	let i = at + 1;
	const closing = html[i] === '/';
	if (closing) i++;
	const nameStart = i;
	while (i < html.length && /[a-zA-Z0-9:_-]/.test(html[i])) i++;
	if (i === nameStart || !/^[a-zA-Z]/.test(html[nameStart])) return null;
	const name = html.slice(nameStart, i).toLowerCase();

	const attrStart = i;
	let quote = '';
	while (i < html.length) {
		const c = html[i];
		if (quote) {
			if (c === quote) quote = '';
		} else if (c === '"' || c === "'") {
			quote = c;
		} else if (c === '>') {
			break;
		}
		i++;
	}
	const attrs = html.slice(attrStart, i);
	return {
		name,
		closing,
		selfClosing: attrs.trimEnd().endsWith('/'),
		attrs,
		end: i < html.length ? i + 1 : html.length
	};
}

/** The value of one attribute, '' when it is present with no value, null when absent. */
const ATTR_PATTERNS = {
	hidden: /(?:^|\s)hidden(?:\s*=\s*("[^"]*"|'[^']*'|[^\s>]*))?/i,
	'aria-hidden': /(?:^|\s)aria-hidden(?:\s*=\s*("[^"]*"|'[^']*'|[^\s>]*))?/i,
	role: /(?:^|\s)role(?:\s*=\s*("[^"]*"|'[^']*'|[^\s>]*))?/i
} as const;

function attrValue(attrs: string, name: keyof typeof ATTR_PATTERNS): string | null {
	const found = ATTR_PATTERNS[name].exec(attrs);
	if (!found) return null;
	return (found[1] ?? '')
		.replace(/^["']|["']$/g, '')
		.trim()
		.toLowerCase();
}

/**
 * True for an element the page itself says is not being read: an ARIA
 * landmark that mirrors one of the dropped tags, something hidden from
 * assistive technology, or something with the `hidden` attribute.
 *
 * `hidden="until-found"` is the deliberate exception. It marks content a
 * browser will reveal when you search the page, and it is how accordions are
 * built, which on a restaurant site is very often how the menu sections
 * themselves are built. Dropping those would drop the whole menu.
 */
function isDropped(tag: Tag): boolean {
	if (!tag.attrs.trim()) return false;
	const role = attrValue(tag.attrs, 'role');
	if (role && role.split(/\s+/).some((token) => DROP_ROLES.has(token))) return true;
	if (attrValue(tag.attrs, 'aria-hidden') === 'true') return true;
	const hidden = attrValue(tag.attrs, 'hidden');
	return hidden !== null && hidden !== 'until-found';
}

/** Skips a script or style body by finding its closing tag as plain text. */
function skipRawText(html: string, name: string, from: number): number {
	const close = new RegExp(`</${name}(\\s[^>]*)?>`, 'i').exec(html.slice(from));
	return close ? from + close.index + close[0].length : html.length;
}

/**
 * Skips a whole element, counting nesting so a `<nav>` inside a `<nav>` does
 * not end the outer one early.
 *
 * The `head` case carries a guard that is not theoretical: `</head>` is
 * optional in HTML and plenty of hand-written pages leave it out, so a scan
 * that only looks for the closing tag runs to the end of the file and drops
 * the entire document. Meeting `<body>` ends the head, exactly as a browser
 * would treat it.
 */
function skipElement(html: string, name: string, from: number): number {
	let depth = 1;
	let i = from;
	while (i < html.length) {
		const lt = html.indexOf('<', i);
		if (lt < 0) return html.length;
		if (html.startsWith('<!--', lt)) {
			const close = html.indexOf('-->', lt + 4);
			i = close < 0 ? html.length : close + 3;
			continue;
		}
		const tag = readTag(html, lt);
		if (!tag) {
			i = lt + 1;
			continue;
		}
		if (name === 'head' && !tag.closing && tag.name === 'body') return lt;
		if (tag.name === name) {
			if (tag.closing) {
				depth--;
				if (depth === 0) return tag.end;
			} else if (!tag.selfClosing && !VOID_TAGS.has(tag.name)) {
				depth++;
			}
		}
		i = tag.end;
	}
	return html.length;
}

/**
 * Turns fetched HTML into the text worth parsing: the reading order kept, the
 * chrome and the machinery gone, and one line per line the page would have
 * shown, so a menu that was laid out as a list or a table still looks like a
 * menu afterwards.
 */
export function htmlToMenuText(html: string): string {
	const out: string[] = [];
	// The break owed to the next piece of text. Held rather than written so a
	// run of `</div></div><div>` costs one newline instead of three blank
	// lines, and so a break at the very start of the document writes nothing.
	let pending = NO_BREAK;
	// Whitespace seen between two pieces of text with no block boundary
	// between them. `<b>Sopa</b> <i>de Lima</i>` has to stay two words.
	let spaced = false;

	const write = (text: string) => {
		if (out.length === 0) {
			// Nothing emitted yet, so there is nothing to break away from.
			pending = NO_BREAK;
			spaced = false;
		}
		if (pending === PARA_BREAK) out.push('\n\n');
		else if (pending === LINE_BREAK) out.push('\n');
		else if (pending === CELL_BREAK) out.push('\t');
		else if (spaced) out.push(' ');
		out.push(text);
		pending = NO_BREAK;
		spaced = false;
	};

	/**
	 * Writes one run of page text, keeping the space that sat beside a tag.
	 * The leading and trailing spaces are the whole reason this is not just
	 * write(text.trim()): the source of "Sopa <b>de</b> Lima" arrives as three
	 * runs, and dropping the space each one carried spells "Sopade Lima".
	 */
	const writeText = (text: string) => {
		const trimmed = text.trim();
		if (!trimmed) {
			if (text) spaced = true;
			return;
		}
		if (text.startsWith(' ')) spaced = true;
		write(trimmed);
		if (text.endsWith(' ')) spaced = true;
	};

	let i = 0;
	while (i < html.length) {
		const lt = html.indexOf('<', i);
		if (lt < 0) {
			writeText(normaliseText(html.slice(i)));
			break;
		}
		if (lt > i) writeText(normaliseText(html.slice(i, lt)));

		if (html.startsWith('<!--', lt)) {
			const close = html.indexOf('-->', lt + 4);
			i = close < 0 ? html.length : close + 3;
			continue;
		}
		// The doctype, and processing instructions from XML-ish exports.
		if (html.startsWith('<!', lt) || html.startsWith('<?', lt)) {
			const close = html.indexOf('>', lt + 1);
			i = close < 0 ? html.length : close + 1;
			continue;
		}

		const tag = readTag(html, lt);
		if (!tag) {
			// Not markup at all: "< 5 minutes" in a description.
			write('<');
			i = lt + 1;
			continue;
		}

		if (!tag.closing) {
			if (RAW_TEXT_TAGS.has(tag.name)) {
				i = skipRawText(html, tag.name, tag.end);
				continue;
			}
			const skippable = !tag.selfClosing && !VOID_TAGS.has(tag.name);
			if (skippable && (DROP_TAGS.has(tag.name) || isDropped(tag))) {
				i = skipElement(html, tag.name, tag.end);
				// What the removal leaves behind is the gap the element itself
				// would have made: a line where a nav or a hidden div stood, and
				// only a space where a decorative span sat. Breaking the line for
				// every dropped element put the price of "Suadero <span
				// aria-hidden>*</span> 4.50" on a line of its own, where it reads
				// as the name of the next dish.
				const gap = breakFor(tag.name);
				if (gap > pending) pending = gap;
				spaced = gap === NO_BREAK;
				continue;
			}
		}

		const strength = breakFor(tag.name);
		if (strength > pending) pending = strength;
		if (strength !== NO_BREAK) spaced = false;
		i = tag.end;
	}

	return tidyLines(out.join(''));
}

/** Trims every line, drops the empty ones down to at most one in a row. */
function tidyLines(text: string): string {
	const lines = text.split('\n').map((line) => line.replace(/^[ \t]+|[ \t]+$/g, ''));
	const kept: string[] = [];
	for (const line of lines) {
		if (line === '' && (kept.length === 0 || kept[kept.length - 1] === '')) continue;
		kept.push(line);
	}
	while (kept.length && kept[kept.length - 1] === '') kept.pop();
	return kept.join('\n');
}

/* -------------------------------------------------------------------------
 * The fetch
 * ---------------------------------------------------------------------- */

/**
 * What a failed read hands back: what happened, and the address to open in a
 * new tab so the cook can copy the menu themselves.
 */
function failed(reason: string, openUrl: string): LinkResult {
	return { ok: false, reason, openUrl };
}

/** Said by both places that can run out of patience: the headers and the body. */
function tookTooLong(): string {
	return `That site took longer than ${Math.round(TIMEOUT_MS / 1000)} seconds to answer.`;
}

/** Plain-language shape of an HTTP status, so the reason is not a number alone. */
function statusReason(status: number): string {
	if (status === 404 || status === 410) return 'That page is not there any more (404).';
	if (status === 401 || status === 403) return `That site refused the request (${status}).`;
	if (status === 429) return 'That site is asking for fewer requests right now (429).';
	if (status >= 500) return `That site is having trouble of its own (${status}).`;
	return `That site answered with an error (${status}).`;
}

/**
 * Fetches a page and returns the text worth parsing, or the reason it could
 * not, paired with the address to open by hand.
 *
 * @param url what the cook typed, scheme optional
 * @param fetchImpl the fetch to use; the tests pass their own
 */
export async function linkToText(url: string, fetchImpl?: typeof fetch): Promise<LinkResult> {
	const tidied = tidyUrl(url);
	// No openUrl on a refused address, deliberately: see tidyUrl. The screen
	// hides the "open it yourself" step when there is nothing safe to open.
	if (!tidied.ok) return failed(tidied.reason, '');
	const target = tidied.url;

	const doFetch =
		fetchImpl ?? (typeof fetch === 'function' ? fetch.bind(globalThis) : undefined);
	if (!doFetch) {
		return failed('This browser cannot fetch a page on its own.', target);
	}

	const controller = new AbortController();
	// A flag rather than a check on the error, because what a failed fetch
	// throws is not the same object in every browser and the difference
	// between "gave up waiting" and "was refused" is the whole message.
	let timedOut = false;
	const timer = setTimeout(() => {
		timedOut = true;
		controller.abort();
	}, TIMEOUT_MS);

	// The timer runs until the text is in hand, not until the headers are: a
	// site that answers and then stalls partway through its body is a real
	// ending, and clearing the clock early left this waiting for good.
	try {
		let res: Response;
		try {
			res = await doFetch(target, {
				signal: controller.signal,
				redirect: 'follow',
				// Nothing about this cook goes with the request: no cookies for
				// the venue's site, and no referrer telling it where the reader
				// came from. There are no custom headers either, which keeps this
				// a plain GET that never triggers a CORS preflight.
				credentials: 'omit',
				referrerPolicy: 'no-referrer'
			});
		} catch {
			if (timedOut) return failed(tookTooLong(), target);
			if (typeof navigator !== 'undefined' && navigator.onLine === false) {
				return failed('This device is offline, so the app could not reach that site.', target);
			}
			// The ordinary ending. A cross-origin read needs the site to opt in,
			// and a restaurant site has no reason to have done that.
			return failed(
				'That site did not allow the app to read its page, which is how most restaurant sites are set up.',
				target
			);
		}

		if (!res.ok) return failed(statusReason(res.status), target);

		const type = (res.headers.get('content-type') ?? '').toLowerCase();
		if (type.includes('pdf')) {
			return failed('That link is a PDF, and the app reads web pages only.', target);
		}
		const isHtml = type.includes('html') || type.includes('xml');
		const isText = type.startsWith('text/') || type === '';
		if (!isHtml && !isText) {
			return failed(
				`That link gives back ${type.split(';')[0]}, which is not a web page the app can read.`,
				target
			);
		}

		let body: string;
		try {
			body = await res.text();
		} catch {
			if (timedOut) return failed(tookTooLong(), target);
			return failed('That page stopped sending partway through.', target);
		}

		// A page served as text/plain is already the menu. Running it through
		// the HTML pass would collapse its newlines into one paragraph, which is
		// the one shape a menu cannot survive.
		const looksLikeHtml = isHtml || /<\/?[a-z][a-z0-9]*[\s/>]/i.test(body);
		const text = looksLikeHtml ? htmlToMenuText(body) : tidyLines(body.replace(/\r\n?/g, '\n'));

		if (text.trim().length < TOO_LITTLE_TEXT) {
			return failed(
				'That page came back with almost no text, which usually means its menu is drawn after the page loads.',
				target
			);
		}
		return { ok: true, text };
	} finally {
		clearTimeout(timer);
	}
}
