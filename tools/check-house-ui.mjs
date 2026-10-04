#!/usr/bin/env node
/**
 * check-house-ui.mjs: static/shared/oot-house-ui.js draws the house and keeps
 * her marks the way the brief says, in the voice the wings allow.
 *
 *   node tools/check-house-ui.mjs
 *
 * Exits 1 on any failure. Run it after any edit to the file, and the site's
 * check-mirror fails on drift between the canonical file and its mirror.
 *
 * WHAT IS PROVED, in rising order of how quietly it would fail:
 *
 *   1. The file: no dash in any spelling (the five the client filters, and
 *      the en dash), no carriage return, pure ASCII, no glyph at or above
 *      U+2190 (which is where the arrows, the symbols and every emoji live),
 *      never the Codex's retired word for study, never a level numbered,
 *      no real person named (the four pillars the Ledger names by their
 *      works, and the authors the quote bank may name), no innerHTML, and
 *      every sentence a person reads inside STRINGS at the top. The mirror
 *      on the site, when that checkout is present, is byte-identical.
 *
 *   2. Loading: the file runs in node:vm over a minimal document stub
 *      (written below: elements, text nodes, attributes, listeners, closest
 *      and querySelector by tag, class and data attribute), installs
 *      window.OOT.houseUI = { readView, review }, leaves the first install
 *      standing when loaded twice, and touches nothing until a view is
 *      called.
 *
 *   3. The views, rendered over src/lib/house/fixtures/house-min.json: the
 *      card, the tasting table resolved to dish names, every list, the
 *      lineup register with its Confirm on shift word; the Kept eyebrow
 *      over the fixture as it is and Hers, not yet kept over a copy with
 *      marks of hers; every button with text; one listener however many
 *      times a root is drawn; Keep calling hooks.setMark with by 'person'
 *      and her value; Edit then Save with the typed value, for a line, for
 *      the five parts (labelled with the schema's own labels), for the three
 *      timed lines (with the live count against LINE_CAPS) and for the
 *      thirteen of a pairing; Discard calling hooks.discard; the review
 *      steps covering exactly the schema's mark lists; Keep all on this item
 *      and Keep all that read cleanly doing what their words say.
 *
 *   4. Every string either view draws, held to the same voice rules as the
 *      file; and this check held to them too.
 */
import ts from 'typescript';
import vm from 'node:vm';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UI = path.join(ROOT, 'static', 'shared', 'oot-house-ui.js');
const SCHEMA = path.join(ROOT, 'src', 'lib', 'house', 'house-schema.ts');
const FIXTURE = path.join(ROOT, 'src', 'lib', 'house', 'fixtures', 'house-min.json');
const SITE = process.env.OOT_SITE || path.join(ROOT, '..', 'zpullen98-gif.github.io');
const MIRROR = path.join(SITE, 'shared', 'oot-house-ui.js');

/* -------------------------------------------------------------------------
 * The rules
 * ---------------------------------------------------------------------- */

/**
 * The dash in every spelling the House refuses, built from escapes so this
 * file does not carry what it refuses: the client's five (the em dash, its
 * three entities and the spaced double hyphen) and the en dash.
 */
const DASH = new RegExp(['\\u2014', '\\u2013', '&' + 'mdash;', '&#' + '8212;', '&#' + 'x2014;', '\\x20-{2}\\x20'].join('|'), 'g');
/** The Codex's retired word for study, in both spellings, as check-home.js writes it. */
const RETIRED = /practi[cs]e/i;
/** A level numbered: the Codex's NUMERAL_RE widened to every numeral. */
const NUMERAL = /\bLevel\s+(?:[IVX]+|\d+)\b/;
/**
 * The people this file may not name: the four pillars the Ledger names by
 * their works and never by their authors, and the authors the quote bank
 * may put words to. A surname alone where it is distinctive.
 */
const NAMED = [
	'Jerry Thomas', 'Gary Regan', 'DeGroff', 'Meehan',
	'Bourdain', 'James Beard', 'Julia Child', 'Craddock', 'Brillat', 'Escoffier',
	'Elizabeth David', 'Hemingway', 'M. F. K. Fisher', 'Harold McGee', 'Keller'
];

/** @param {string} s */
function firstGlyph(s) {
	for (const ch of s) {
		const c = ch.codePointAt(0) || 0;
		if (c >= 0x2190) return 'U+' + c.toString(16).toUpperCase();
	}
	return '';
}

/**
 * The voice rules the Codex's check-home.js applies to every drawn string,
 * plus the en dash and the people. Each problem is a sentence.
 * @param {string} s
 * @param {boolean} people whether to apply the names rule
 */
function voiceProblems(s, people) {
	/** @type {string[]} */
	const out = [];
	const dashes = s.match(DASH);
	if (dashes) out.push(`${dashes.length} dash(es) in a refused spelling`);
	if (RETIRED.test(s)) out.push('the retired word for study');
	const numeral = NUMERAL.exec(s);
	if (numeral) out.push('a level numbered: ' + numeral[0]);
	const glyph = firstGlyph(s);
	if (glyph) out.push('a glyph ' + glyph);
	if (people) for (const name of NAMED) if (s.includes(name)) out.push('a real person named: ' + name);
	return out;
}

/* -------------------------------------------------------------------------
 * The ledger of checks
 * ---------------------------------------------------------------------- */

let passed = 0;
let failed = 0;

/**
 * @param {string} name
 * @param {boolean} ok
 * @param {string} [detail]
 */
function check(name, ok, detail) {
	if (ok) { passed++; console.log('  ok  ' + name); return; }
	failed++;
	console.log('  FAIL ' + name + (detail ? '\n       ' + detail : ''));
}

/**
 * @param {unknown} a
 * @param {unknown} b
 */
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

/* -------------------------------------------------------------------------
 * The document stub
 * ---------------------------------------------------------------------- */

/** @typedef {{ type: string, target: StubNode, preventDefault: () => void }} StubEvent */
/** @typedef {{ tag: string, classes: string[], attrs: Array<{ name: string, value: string | null }> }} Simple */

/**
 * One selector, as the file writes them: a tag, classes and attribute
 * tests, or a comma-separated list of those. No combinators.
 * @param {string} sel
 * @returns {Simple[]}
 */
function parseSelector(sel) {
	return sel.split(',').map((raw) => {
		const s = raw.trim();
		const m = /^([a-zA-Z0-9]*)((?:\.[\w-]+)*)((?:\[[^\]]+\])*)$/.exec(s);
		if (!m) throw new Error('stub: a selector it does not read: ' + s);
		const classes = m[2] ? m[2].split('.').filter(Boolean) : [];
		/** @type {Array<{ name: string, value: string | null }>} */
		const attrs = [];
		const re = /\[([^\]=]+)(?:=("?)([^\]"]*)\2)?\]/g;
		let a;
		while ((a = re.exec(m[3]))) attrs.push({ name: a[1], value: a[3] === undefined ? null : a[3] });
		return { tag: m[1].toUpperCase(), classes, attrs };
	});
}

/**
 * @param {StubNode} n
 * @param {Simple} p
 */
function matchOne(n, p) {
	if (p.tag && n.tagName !== p.tag) return false;
	const cls = (n.getAttribute('class') || '').split(/\s+/);
	for (const c of p.classes) if (!cls.includes(c)) return false;
	for (const a of p.attrs) {
		const v = n.getAttribute(a.name);
		if (v === null) return false;
		if (a.value !== null && v !== a.value) return false;
	}
	return true;
}

/** The least of a DOM node the file needs: what a wing's document gives it. */
class StubNode {
	/**
	 * @param {'element' | 'text'} kind
	 * @param {string} tag
	 * @param {string} text
	 */
	constructor(kind, tag, text) {
		this.kind = kind;
		this.tagName = tag.toUpperCase();
		this.text = text;
		/** @type {StubNode[]} */
		this.childNodes = [];
		/** @type {StubNode | null} */
		this.parentNode = null;
		/** @type {Record<string, string>} */
		this.attrs = {};
		/** @type {Record<string, Array<(ev: StubEvent) => void>>} */
		this.listeners = {};
		this.value = '';
		this.focused = 0;
	}
	/** @returns {StubNode | null} */
	get firstChild() { return this.childNodes.length ? this.childNodes[0] : null; }
	/** @param {StubNode} n */
	appendChild(n) {
		if (n.parentNode) n.parentNode.removeChild(n);
		n.parentNode = this;
		this.childNodes.push(n);
		return n;
	}
	/** @param {StubNode} n */
	removeChild(n) {
		const i = this.childNodes.indexOf(n);
		if (i < 0) throw new Error('stub: removeChild of a node that is not a child');
		this.childNodes.splice(i, 1);
		n.parentNode = null;
		return n;
	}
	/**
	 * @param {string} k
	 * @param {string} v
	 */
	setAttribute(k, v) { this.attrs[k] = String(v); }
	/** @param {string} k */
	getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; }
	/** @returns {string} */
	get textContent() { return this.kind === 'text' ? this.text : this.childNodes.map((c) => c.textContent).join(''); }
	/**
	 * @param {string} type
	 * @param {(ev: StubEvent) => void} fn
	 */
	addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); }
	/** A bubbling event: every listener from this node up to the root. @param {string} type */
	dispatch(type) {
		/** @type {StubEvent} */
		const ev = { type, target: this, preventDefault() {} };
		/** @type {StubNode | null} */
		let n = this;
		for (; n; n = n.parentNode) {
			const fns = n.listeners[type] || [];
			for (const fn of fns.slice()) fn.call(n, ev);
		}
	}
	click() { this.dispatch('click'); }
	focus() { this.focused++; }
	/** @param {string} sel */
	matches(sel) { return parseSelector(sel).some((p) => matchOne(this, p)); }
	/** @param {string} sel */
	closest(sel) {
		/** @type {StubNode | null} */
		let n = this;
		for (; n; n = n.parentNode) if (n.kind === 'element' && n.matches(sel)) return n;
		return null;
	}
	/** @param {string} sel */
	querySelectorAll(sel) {
		/** @type {StubNode[]} */
		const out = [];
		/** @param {StubNode} n */
		const walk = (n) => {
			for (const c of n.childNodes) {
				if (c.kind === 'element' && c.matches(sel)) out.push(c);
				walk(c);
			}
		};
		walk(this);
		return out;
	}
	/** @param {string} sel */
	querySelector(sel) {
		const all = this.querySelectorAll(sel);
		return all.length ? all[0] : null;
	}
}

function makeDocument() {
	const head = new StubNode('element', 'head', '');
	const body = new StubNode('element', 'body', '');
	return {
		head,
		body,
		/** @param {string} tag */
		createElement: (tag) => new StubNode('element', tag, ''),
		/** @param {string} s */
		createTextNode: (s) => new StubNode('text', '#text', String(s))
	};
}

/**
 * The file run in a bare context with the stub as its document and the
 * context itself as its window, the way a wing has them.
 * @param {string} src
 * @param {ReturnType<typeof makeDocument>} doc
 */
function loadUI(src, doc) {
	/** @type {Record<string, unknown>} */
	const sandbox = { document: doc, console };
	sandbox.window = sandbox;
	vm.createContext(sandbox);
	vm.runInContext(src, sandbox, { filename: 'oot-house-ui.js' });
	return sandbox;
}

/* -------------------------------------------------------------------------
 * The schema, run
 * ---------------------------------------------------------------------- */

/** house-schema.ts to CommonJS in memory; it imports nothing. */
function loadSchema() {
	const src = readFileSync(SCHEMA, 'utf8');
	const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
	const mod = { exports: /** @type {Record<string, any>} */ ({}) };
	new Function('exports', 'module', 'require', out)(mod.exports, mod, () => { throw new Error('house-schema.ts imports nothing'); });
	return mod.exports;
}

/* -------------------------------------------------------------------------
 * The hooks and the fixture
 * ---------------------------------------------------------------------- */

/** @typedef {{ kind: string, id: string, field: string, mark: any }} SetCall */
/** @typedef {{ kind: string, id: string, field: string }} DiscardCall */

/**
 * A recorder for the three hooks.
 * @param {(kind: string, id: string) => Array<{ field?: string, said?: string }>} [problems]
 */
function recorder(problems) {
	/** @type {{ setMark: SetCall[], discard: DiscardCall[] }} */
	const calls = { setMark: [], discard: [] };
	/** @type {Record<string, unknown>} */
	const hooks = {
		/** @type {(kind: string, id: string, field: string, mark: unknown) => void} */
		setMark: (kind, id, field, mark) => { calls.setMark.push({ kind, id, field, mark }); },
		/** @type {(kind: string, id: string, field: string) => void} */
		discard: (kind, id, field) => { calls.discard.push({ kind, id, field }); }
	};
	if (problems) hooks.problems = problems;
	return { calls, hooks };
}

/** @returns {any} */
function fixture() { return JSON.parse(readFileSync(FIXTURE, 'utf8')); }

/**
 * Every kept mark whose path the test names becomes hers.
 * @param {any} v
 * @param {(path: string) => boolean} which
 * @param {string} [p]
 */
function flip(v, which, p = '') {
	if (Array.isArray(v)) { v.forEach((x, i) => flip(x, which, p + '[' + i + ']')); return; }
	if (v && typeof v === 'object') {
		if (v.by === 'person' && typeof v.ts === 'number' && which(p)) v.by = 'maitre';
		for (const k of Object.keys(v)) flip(v[k], which, p + '.' + k);
	}
}

/** @param {number} n */
function words(n) {
	const out = [];
	for (let i = 0; i < n; i++) out.push('word');
	return out.join(' ');
}

/* -------------------------------------------------------------------------
 * 1. The file
 * ---------------------------------------------------------------------- */

console.log('check-house-ui: ' + path.relative(ROOT, UI));
const src = readFileSync(UI, 'utf8');
const schema = loadSchema();

{
	const problems = voiceProblems(src, true);
	check('the file: no dash in any spelling, no retired word, no level numbered, no glyph, no real person named', !problems.length, problems.join('; '));
	check('the file carries no carriage return', !src.includes('\r'));
	check('the file is pure ASCII', !/[^\x00-\x7f]/.test(src));
	check('the file never assigns innerHTML or outerHTML, nor calls insertAdjacentHTML', !/\.(?:innerHTML|outerHTML)\s*=|insertAdjacentHTML\s*\(/.test(src));
	check('the file installs window.OOT.houseUI and returns when it is there', src.includes('OOT.houseUI = { readView: readView, review: review }') && src.includes('if (OOT.houseUI) return;'));
	check('esc() makes a text node and every string child goes through it', src.includes('return w.document.createTextNode(String(s == null ? \'\' : s));') && src.includes('el.appendChild(esc(kids))'));

	/* STRINGS is the one place the words live: outside it (and the header,
	   and the stylesheet) no string literal reads as prose, where prose is a
	   capitalised word followed by a space and a letter. */
	const stringsAt = src.indexOf('\n  var STRINGS = {');
	const stringsEnd = src.indexOf('\n  };', stringsAt);
	const cssAt = src.indexOf('\n  var CSS =');
	const cssEnd = src.indexOf(";\n", cssAt);
	const headerEnd = src.indexOf('*/') + 2;
	check('STRINGS and CSS are each declared once at the top', stringsAt > 0 && stringsEnd > stringsAt && cssAt > stringsEnd && cssEnd > cssAt && src.indexOf('var STRINGS', stringsAt + 20) < 0);
	const rest = src.slice(headerEnd, stringsAt) + src.slice(stringsEnd, cssAt) + src.slice(cssEnd);
	const noComments = rest.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
	const literals = noComments.match(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g) || [];
	const prose = literals.filter((l) => /[A-Z][a-z]+ [a-z]/.test(l));
	check('outside STRINGS no string literal reads as prose', !prose.length, prose.slice(0, 5).join(', '));

	if (existsSync(MIRROR)) {
		const m = readFileSync(MIRROR, 'utf8');
		check('the mirror on the site is byte-identical: ' + path.relative(ROOT, MIRROR), m === src, 'copy the canonical file over; never edit the mirror');
	} else {
		console.log('  skip the mirror on the site is absent at ' + MIRROR);
	}
}

/* -------------------------------------------------------------------------
 * 2. Loading
 * ---------------------------------------------------------------------- */

const doc = makeDocument();
const sandbox = loadUI(src, doc);
/** @type {any} */
const OOT = sandbox.OOT;
const ui = OOT && OOT.houseUI;
check('loads in node:vm over the stub and installs OOT.houseUI with readView and review', !!ui && typeof ui.readView === 'function' && typeof ui.review === 'function');
check('loading draws nothing and touches no head', doc.head.childNodes.length === 0 && doc.body.childNodes.length === 0);
{
	vm.runInContext(src, /** @type {vm.Context} */ (sandbox), { filename: 'oot-house-ui.js' });
	check('a second load leaves the first install standing', OOT.houseUI === ui);
}

if (!ui) {
	console.log('check-house-ui: ' + failed + ' of ' + (passed + failed) + ' checks FAILED');
	process.exit(1);
}

/** @type {string[]} every string either view drew, for the voice sweep */
const drawn = [];

/** A fresh root in the stub body, drawn by one of the two views. */
function root() {
	const r = doc.createElement('div');
	doc.body.appendChild(r);
	return r;
}

/**
 * @param {StubNode} r
 * @param {any} house
 * @param {Record<string, unknown>} hooks
 */
function read(r, house, hooks) { ui.readView(r, house, hooks); drawn.push(r.textContent); return r; }
/**
 * @param {StubNode} r
 * @param {any} house
 * @param {string} step
 * @param {Record<string, unknown>} hooks
 */
function review(r, house, step, hooks) { ui.review(r, house, step, hooks); drawn.push(r.textContent); return r; }

/** @param {StubNode} r @param {string} sel */
function all(r, sel) { return r.querySelectorAll(sel); }
/** @param {StubNode} r @param {string} sel */
function one(r, sel) { const n = r.querySelector(sel); if (!n) throw new Error('nothing matches ' + sel); return n; }
/** @param {StubNode} r @param {string} text */
function buttonNamed(r, text) { return all(r, 'button').filter((b) => b.textContent === text); }
/** @param {StubNode} r @param {string} id @param {string} field */
function markRowOf(r, id, field) {
	const item = all(r, '[data-item="' + id + '"]')[0];
	if (!item) throw new Error('no item ' + id + ' drawn');
	return one(item, '[data-mark="' + field + '"]');
}
/** @param {StubNode} r @param {string} id @param {string} field @param {string} chip */
function pressOn(r, id, field, chip) {
	const row = markRowOf(r, id, field);
	const b = one(row, '[data-h="' + chip + '"]');
	b.click();
	drawn.push(r.textContent);
}

/* -------------------------------------------------------------------------
 * 3. The read view
 * ---------------------------------------------------------------------- */

{
	const house = fixture();
	const { calls, hooks } = recorder();
	const r = read(root(), house, hooks);
	const text = r.textContent;
	check('the card: name, address, telephone, the meal row, dress code, menus read on, history',
		['The house', 'The Lantern Room', '14 Quay Lane, Harbourside', '01234 567890', 'Tuesday to Saturday', '6 pm to 10 pm', 'Smart, jackets welcome', 'Menus read on', '2026-09-28', 'Opened in the old lamp store'].every((s) => text.includes(s)));
	const tables = all(r, 'table');
	check('the meals are a table of rows and the tasting a table of courses', tables.length === 2 && all(tables[0], 'tr').length === 2 && all(tables[1], 'tr').length === 3);
	const courseCells = all(tables[1], 'td').map((c) => c.textContent);
	check('the tasting courses resolve to dish names and the pour text, and a course with no pour says so',
		same(courseCells, ['1. To start', 'Beetroot and Apple Salad', 'A glass of the Harbour White', '2. The main', 'Lantern Roast Chicken', 'No pour printed']), courseCells.join(' | '));
	check('the tasting carries its name, price, meal and the drinks word', text.includes('The Harbour Supper') && text.includes('Price 45') && text.includes('Drinks not included'));
	check('the must-knows, the lexicon, the conversations and the mix-ups are drawn',
		['The kitchen closes at ten', 'Last orders for food', 'Verjus', 'vair ZHOO', 'The juice of unripe grapes', 'Salt baked', 'A table in a hurry', 'We have a show at eight', 'The beetroot salad is plated cold', 'Name the time honestly', 'Lantern Roast Chicken or Beetroot and Apple Salad', 'One is a roast main', 'Are you starting with it'].every((s) => text.includes(s)));
	check('the lexicon and the conversation say which items they are about', text.includes('About Verjus and Tonic') && text.includes('About Beetroot and Apple Salad, Lantern Roast Chicken'));
	check('the lineup register: the question, whom to ask, the item, and the Confirm on shift word',
		text.includes('Which stock goes into the rosemary gravy') && text.includes('Ask the chef.') && text.includes('About Lantern Roast Chicken') && text.includes('Confirm on shift'));
	check('over the fixture every mark is kept: the Kept eyebrow appears and Hers, not yet kept does not',
		all(r, '[data-state="kept"]').length === 9 && text.includes('Kept') && !text.includes('Hers, not yet kept') && all(r, 'button').length === 0);
	check('a read view of a kept house calls no hook', calls.setMark.length === 0 && calls.discard.length === 0);
	const style = all(doc.head, 'style');
	check('one stylesheet, appended to the head on the first draw, makes every chip and box 44px',
		style.length === 1 && /\.oot-h-chip\{min-height:44px/.test(style[0].textContent) && /\.oot-h textarea,\.oot-h input\{[^}]*min-height:44px/.test(style[0].textContent));
	read(r, house, hooks);
	read(r, house, hooks);
	check('a root drawn three times holds one view and one click listener', r.childNodes.length === 1 && (r.listeners.click || []).length === 1 && all(doc.head, 'style').length === 1);
	ui.readView(root(), null, hooks);
	check('no house: the view says so and throws nothing', doc.body.childNodes[1].textContent.includes('There is no house on this device yet.'));
}

{
	const house = fixture();
	flip(house, (p) => /^\.history$|^\.lexicon\[0\]\.say$|^\.lexicon\[1\]\.say$|^\.scenarios\[0\]\.you$|^\.mixUps\[0\]\.difference$|^\.mustKnows\[0\]\.body$/.test(p));
	const { calls, hooks } = recorder();
	const r = read(root(), house, hooks);
	const text = r.textContent;
	check('over a copy with six of hers: both eyebrows appear', text.includes('Kept') && text.includes('Hers, not yet kept') && all(r, '[data-state="hers"]').length === 6 && all(r, '[data-state="kept"]').length === 3);
	const buttons = all(r, 'button');
	check('every mark of hers carries Keep, Edit and Discard, and every button has text and the chip class',
		buttons.length === 18 && buttons.every((b) => b.textContent.trim().length > 0 && (b.getAttribute('class') || '').split(' ').includes('oot-h-chip') && b.getAttribute('type') === 'button'));
	check('the history of hers is drawn under the eyebrow with its chips', one(r, '[data-mark="history"]').getAttribute('data-state') === 'hers');

	/* Keep */
	const histRow = one(r, '[data-mark="history"]');
	one(histRow, '[data-h="keep"]').click();
	drawn.push(r.textContent);
	check('Keep on the history calls hooks.setMark(house, id, history, mark) with by person and her value',
		calls.setMark.length === 1 && calls.setMark[0].kind === 'house' && calls.setMark[0].id === 'h-lantern0' && calls.setMark[0].field === 'history'
			&& calls.setMark[0].mark.by === 'person' && calls.setMark[0].mark.value === house.history.value && typeof calls.setMark[0].mark.ts === 'number' && calls.setMark[0].mark.ts > house.history.ts);
	check('after Keep the history reads Kept on this screen before the wing redraws', one(r, '[data-mark="history"]').getAttribute('data-state') === 'kept');
	pressOn(r, 'x-verjus01', 'say', 'keep');
	check('Keep on a lexicon term calls hooks.setMark(lexicon, id, say, mark) with the same value',
		calls.setMark.length === 2 && same([calls.setMark[1].kind, calls.setMark[1].id, calls.setMark[1].field, calls.setMark[1].mark.value, calls.setMark[1].mark.by], ['lexicon', 'x-verjus01', 'say', 'vair ZHOO', 'person']));

	/* Edit then Save */
	pressOn(r, 's-hurry001', 'you', 'edit');
	const editors = all(r, '[data-editor]');
	check('Edit opens one box, a textarea holding her line, and the focus goes to it',
		editors.length === 1 && all(editors[0], 'textarea').length === 1 && one(editors[0], '[data-e="text"]').value === house.scenarios[0].you.value && one(editors[0], '[data-e="text"]').focused === 1 && buttonNamed(editors[0], 'Save').length === 1 && buttonNamed(editors[0], 'Cancel').length === 1);
	one(editors[0], '[data-e="text"]').value = '  The salad is cold and ready; the chicken is twenty minutes. Order both now.  ';
	one(editors[0], '[data-h="save"]').click();
	drawn.push(r.textContent);
	check('Save calls hooks.setMark(scenarios, id, you, mark) with the typed value, trimmed, by person',
		calls.setMark.length === 3 && same([calls.setMark[2].kind, calls.setMark[2].id, calls.setMark[2].field, calls.setMark[2].mark.by, calls.setMark[2].mark.value],
			['scenarios', 's-hurry001', 'you', 'person', 'The salad is cold and ready; the chicken is twenty minutes. Order both now.']));
	check('after Save the typed line is what the screen shows, kept', r.textContent.includes('The salad is cold and ready') && one(r, '[data-mark="you"]').getAttribute('data-state') === 'kept');

	/* Cancel, a blank Save */
	pressOn(r, 'k-lastord1', 'body', 'edit');
	one(r, '[data-h="cancel"]').click();
	drawn.push(r.textContent);
	check('Cancel closes the box and writes nothing', all(r, '[data-editor]').length === 0 && calls.setMark.length === 3 && one(r, '[data-mark="body"]').getAttribute('data-state') === 'hers');
	pressOn(r, 'k-lastord1', 'body', 'edit');
	one(r, '[data-e="text"]').value = '   ';
	one(r, '[data-h="save"]').click();
	drawn.push(r.textContent);
	check('a blank Save closes the box and writes nothing', all(r, '[data-editor]').length === 0 && calls.setMark.length === 3 && one(r, '[data-mark="body"]').getAttribute('data-state') === 'hers');

	/* Discard */
	pressOn(r, 'm-chkbeet1', 'difference', 'discard');
	check('Discard calls hooks.discard(mixUps, id, difference) and the mark leaves the screen',
		calls.discard.length === 1 && same(calls.discard[0], { kind: 'mixUps', id: 'm-chkbeet1', field: 'difference' }) && !r.textContent.includes('One is a roast main') && all(all(r, '[data-item="m-chkbeet1"]')[0], '[data-mark="difference"]').length === 0);
	check('the mix-up itself stays, with its other mark', r.textContent.includes('Are you starting with it'));
	check('a mark set by the house arriving again clears the presses', (read(r, fixture(), hooks), all(r, '[data-state="kept"]').length === 9 && r.textContent.includes('One is a roast main')));
}

/* -------------------------------------------------------------------------
 * 4. Hers, to look over
 * ---------------------------------------------------------------------- */

/** @param {StubNode} r @param {string} id */
function fieldsDrawn(r, id) {
	const item = all(r, '[data-item="' + id + '"]')[0];
	return item ? all(item, '[data-mark]').map((m) => m.getAttribute('data-mark')) : [];
}

{
	const house = fixture();
	flip(house, () => true);
	const { calls, hooks } = recorder();
	const r = review(root(), house, 'formula', hooks);
	const text = r.textContent;
	check('formula: the heading, the step name, the count and the hint', text.includes('Hers, to look over') && text.includes('The formula') && text.includes('17 lines of hers wait on this step.') && text.includes('What she wrote, as she wrote it.'));
	check('formula: the dish and the cocktail with marks of hers, named with their kind and section',
		all(r, '[data-item]').map((i) => i.getAttribute('data-item')).join(',') === 'd-chicken1,b-collins1' && text.includes('DishLantern Roast Chicken') && text.includes('CocktailThe Lantern Collins') && text.includes('Mains') && !text.includes('Beetroot and Apple SaladStarters'));
	check('formula on a dish covers DISH_MARKS without the pairing, in the schema order',
		same(fieldsDrawn(r, 'd-chicken1'), schema.DISH_MARKS.filter((/** @type {string} */ f) => f !== 'pairing')), fieldsDrawn(r, 'd-chicken1').join(','));
	check('formula on a cocktail covers COCKTAIL_MARKS, in the schema order', same(fieldsDrawn(r, 'b-collins1'), schema.COCKTAIL_MARKS), fieldsDrawn(r, 'b-collins1').join(','));
	check('every mark of hers carries Keep, Edit and Discard; each item Keep all on this item; the step Keep all that read cleanly',
		buttonNamed(r, 'Keep').length === 17 && buttonNamed(r, 'Edit').length === 17 && buttonNamed(r, 'Discard').length === 17 && buttonNamed(r, 'Keep all on this item').length === 2 && buttonNamed(r, 'Keep all that read cleanly').length === 1);
	check('the kept parts, lines and the list are drawn with their labels and counts',
		text.includes('main ingredientHalf a corn fed chicken') && text.includes('Ten seconds') && text.includes('15 of 25 words') && text.includes('accompanimentsLeeks and crushed potatoes') && text.includes('chicken, leeks, crushed potatoes, rosemary gravy'));

	/* the parts editor */
	pressOn(r, 'd-chicken1', 'parts', 'edit');
	let ed = one(r, '[data-editor="parts"]');
	let boxes = all(ed, 'input');
	let labels = all(ed, 'label').map((l) => one(l, '.oot-h-label').textContent);
	check('the parts editor is five labelled boxes carrying the schema\'s DISH_PARTS labels, filled with her parts',
		boxes.length === 5 && same(labels, Object.values(schema.DISH_PARTS)) && same(boxes.map((b) => b.getAttribute('data-e')), schema.KEYS.FormulaParts) && boxes[0].value === 'Half a corn fed chicken', labels.join(' | '));
	boxes.forEach((b, i) => { b.value = 'typed ' + (b.getAttribute('data-e') || i); });
	one(ed, '[data-h="save"]').click();
	drawn.push(r.textContent);
	check('Save on the parts writes the five typed parts under the five keys, by person',
		calls.setMark.length === 1 && calls.setMark[0].kind === 'dish' && calls.setMark[0].id === 'd-chicken1' && calls.setMark[0].field === 'parts' && calls.setMark[0].mark.by === 'person'
			&& same(calls.setMark[0].mark.value, { main: 'typed main', technique: 'typed technique', sauce: 'typed sauce', sides: 'typed sides', taste: 'typed taste' }));

	/* the cocktail's parts carry the cocktail labels */
	pressOn(r, 'b-collins1', 'parts', 'edit');
	ed = one(r, '[data-editor="parts"]');
	labels = all(ed, 'label').map((l) => one(l, '.oot-h-label').textContent);
	check('the parts editor on a cocktail carries COCKTAIL_PARTS labels', same(labels, Object.values(schema.COCKTAIL_PARTS)), labels.join(' | '));
	one(ed, '[data-h="cancel"]').click();

	/* the lines editor */
	pressOn(r, 'b-collins1', 'lines', 'edit');
	ed = one(r, '[data-editor="lines"]');
	const areas = all(ed, 'textarea');
	check('the lines editor is three boxes, one per timed line, filled with hers',
		areas.length === 3 && same(areas.map((a) => a.getAttribute('data-e')), schema.KEYS.Lines) && areas[0].value === house.cocktails[0].lines.value.s10);
	const counts = all(ed, '[data-count]');
	check('each line shows its count against LINE_CAPS', counts.length === 3 && counts[0].textContent === '13 of ' + schema.LINE_CAPS.s10 + ' words' && counts[2].textContent.endsWith(' of ' + schema.LINE_CAPS.s45 + ' words'));
	areas[0].value = 'one two three';
	areas[0].dispatch('input');
	check('the count follows the typing', counts[0].textContent === '3 of 25 words');
	areas[0].value = words(26);
	areas[0].dispatch('input');
	check('a line over its cap says so in words', counts[0].textContent === '26 of 25 words. Over its cap');
	areas[0].value = 'A long gin drink, built over ice.';
	one(ed, '[data-h="save"]').click();
	drawn.push(r.textContent);
	check('Save on the lines writes the three typed lines, by person',
		calls.setMark.length === 2 && calls.setMark[1].kind === 'cocktail' && calls.setMark[1].field === 'lines' && calls.setMark[1].mark.by === 'person'
			&& same(calls.setMark[1].mark.value, { s10: 'A long gin drink, built over ice.', s20: house.cocktails[0].lines.value.s20, s45: house.cocktails[0].lines.value.s45 }));

	/* the list editor */
	pressOn(r, 'd-chicken1', 'ingredientsNamed', 'edit');
	ed = one(r, '[data-editor="ingredientsNamed"]');
	check('a list mark edits one per line', all(ed, 'textarea').length === 1 && one(ed, '[data-e="list"]').value === 'chicken\nleeks\ncrushed potatoes\nrosemary gravy' && ed.textContent.includes('One per line'));
	one(ed, '[data-e="list"]').value = 'chicken\n\n  leeks  \n';
	one(ed, '[data-h="save"]').click();
	drawn.push(r.textContent);
	check('Save on a list writes the typed lines, trimmed, blanks dropped', calls.setMark.length === 3 && same(calls.setMark[2].mark.value, ['chicken', 'leeks']) && calls.setMark[2].field === 'ingredientsNamed');
	const upsells = markRowOf(r, 'b-collins1', 'upsells');
	check('an id list is drawn as names', upsells.textContent.includes('Verjus and Tonic'));

	/* Keep all on this item */
	const before = calls.setMark.length;
	one(all(r, '[data-item="b-collins1"]')[0], '[data-h="keep-item"]').click();
	drawn.push(r.textContent);
	const kept = calls.setMark.slice(before);
	check('Keep all on this item keeps every mark of hers on that item, by person, with her values',
		kept.length === 8 && kept.every((c) => c.kind === 'cocktail' && c.id === 'b-collins1' && c.mark.by === 'person') && same(kept.map((c) => c.field), schema.COCKTAIL_MARKS.filter((/** @type {string} */ f) => f !== 'lines'))
			&& kept[0].mark.value === house.cocktails[0].say.value, kept.map((c) => c.field).join(','));
	check('after it the cocktail leaves the step and the count falls', all(r, '[data-item]').length === 1 && r.textContent.includes('6 lines of hers wait on this step.'));
}

{
	/* Keep all that read cleanly: a dash, a line over its cap, a problem the hook names */
	const house = fixture();
	flip(house, () => true);
	house.dishes[0].why.value = 'A dash here ' + String.fromCharCode(0x2014) + ' and the line is held back';
	house.cocktails[0].lines.value.s10 = words(30);
	const { calls, hooks } = recorder((kind, id) => (kind === 'dish' && id === 'd-chicken1' ? [{ field: 'say', said: 'Not in the house voice' }] : []));
	const sweep = drawn.length;
	const r = review(root(), house, 'formula', hooks);
	check('the problems are drawn in words on the marks they hold back',
		markRowOf(r, 'd-chicken1', 'say').textContent.includes('Not in the house voice') && markRowOf(r, 'd-chicken1', 'why').textContent.includes('Carries a dash')
			&& markRowOf(r, 'b-collins1', 'lines').textContent.includes('Over its cap: Ten seconds, 30 of 25 words') && !markRowOf(r, 'd-chicken1', 'guest').textContent.includes('Not in the house voice'));
	one(r, '[data-h="keep-clean"]').click();
	drawn.push(r.textContent);
	const fields = calls.setMark.map((c) => c.kind + '.' + c.id + '.' + c.field);
	check('Keep all that read cleanly keeps the fourteen clean marks and holds back the three',
		calls.setMark.length === 14 && !fields.includes('dish.d-chicken1.say') && !fields.includes('dish.d-chicken1.why') && !fields.includes('cocktail.b-collins1.lines') && fields.includes('dish.d-chicken1.lines') && fields.includes('cocktail.b-collins1.say'), fields.join(','));
	check('the three held back are what is left on the step', r.textContent.includes('3 lines of hers wait on this step.') && same(fieldsDrawn(r, 'd-chicken1'), ['say', 'why']) && same(fieldsDrawn(r, 'b-collins1'), ['lines']));
	/* These renders drew her dash on purpose, under the word that says so, and stay out of the voice sweep. */
	drawn.length = sweep;
}

{
	/* a problem naming no field holds the whole item */
	const house = fixture();
	flip(house, () => true);
	const { calls, hooks } = recorder(() => [{ said: 'Hold this one for lineup' }]);
	const r = review(root(), house, 'wines', hooks);
	check('wines: the wine with every WINE_MARK, parts and lines among them, in the schema order', same(fieldsDrawn(r, 'w-lantern1'), schema.WINE_MARKS), fieldsDrawn(r, 'w-lantern1').join(','));
	check('the wine\'s parts are drawn with WINE_PARTS labels', r.textContent.includes('grape and regionBacchus from Quay Lane') && r.textContent.includes('what it goes withThe roast chicken and the beetroot salad'));
	check('an id list on a wine is drawn as names', markRowOf(r, 'w-lantern1', 'firstPickIds').textContent.includes('Lantern Roast Chicken'));
	one(r, '[data-h="keep-clean"]').click();
	drawn.push(r.textContent);
	check('a problem naming no field holds every mark on the item back from Keep all that read cleanly', calls.setMark.length === 0 && all(r, '[data-mark]').every((m) => m.textContent.includes('Hold this one for lineup')));
	pressOn(r, 'w-lantern1', 'profile', 'keep');
	check('Keep by hand still keeps it', calls.setMark.length === 1 && calls.setMark[0].kind === 'wine' && calls.setMark[0].field === 'profile' && calls.setMark[0].mark.value === 'Green apple, cut grass, a saline finish.');
}

{
	/* pairings: thirteen boxes */
	const house = fixture();
	flip(house, () => true);
	const { calls, hooks } = recorder();
	const r = review(root(), house, 'pairings', hooks);
	check('pairings: the dish with its pairing and nothing else', same(all(r, '[data-item]').map((i) => i.getAttribute('data-item')), ['d-chicken1']) && same(fieldsDrawn(r, 'd-chicken1'), ['pairing']));
	check('the pairing is drawn with its ids resolved to names and its principles', r.textContent.includes('The wineQuay Lane Harbour White 2024') && r.textContent.includes('Without alcoholVerjus and Tonic') && r.textContent.includes('The second picknone') && r.textContent.includes('acid, fat, bridge'));
	pressOn(r, 'd-chicken1', 'pairing', 'edit');
	const ed = one(r, '[data-editor="pairing"]');
	const boxes = all(ed, 'input').concat(all(ed, 'textarea'));
	const labels = all(ed, 'label').map((l) => one(l, '.oot-h-label').textContent);
	/* the bottle tiers are optional and have no box: they ride over from the mark Save replaces */
	const pairingBoxes = schema.KEYS.Pairing.filter((/** @type {string} */ k) => !schema.OPTIONAL_KEYS.Pairing.includes(k));
	check('the pairing editor is thirteen labelled boxes, one per key of the schema\'s Pairing but the optional bottle tiers',
		boxes.length === 13 && same(all(ed, '[data-e]').map((b) => b.getAttribute('data-e')), pairingBoxes) && labels.length === 13 && ed.textContent.includes('Separated by commas, from: ' + schema.PRINCIPLES.join(', ')));
	one(ed, '[data-e="principles"]').value = 'Acid, salt, nonsense, acid, tannin';
	one(ed, '[data-e="secondId"]').value = 'b-collins1';
	one(ed, '[data-h="save"]').click();
	drawn.push(r.textContent);
	const v = calls.setMark.length ? calls.setMark[0].mark.value : null;
	check('Save on the pairing keeps the principles within PRINCIPLES, once each, lower case, and the rest as typed',
		!!v && same(v.principles, ['acid', 'salt', 'tannin']) && v.secondId === 'b-collins1' && v.wineId === 'w-lantern1' && v.sayIt === house.dishes[0].pairing.value.sayIt && same(Object.keys(v), pairingBoxes));
}

{
	/* a pairing carrying bottle tiers keeps them through an edit, though no box shows them */
	const house = fixture();
	flip(house, () => true);
	const tiers = { classic: { wineId: 'w-lantern1', why: 'Why it works.', sayIt: 'The line to say.' } };
	house.dishes[0].pairing.value.bottles = tiers;
	const { calls, hooks } = recorder();
	const r = review(root(), house, 'pairings', hooks);
	pressOn(r, 'd-chicken1', 'pairing', 'edit');
	const ed = one(r, '[data-editor="pairing"]');
	one(ed, '[data-e="why"]').value = 'A new why.';
	one(ed, '[data-h="save"]').click();
	const v = calls.setMark.length ? calls.setMark[0].mark.value : null;
	check('Save on a pairing with bottle tiers keeps the tiers as they were', !!v && v.why === 'A new why.' && JSON.stringify(v.bottles) === JSON.stringify(tiers));
}

{
	/* lexicon and scenarios cover the words and the table */
	const house = fixture();
	flip(house, () => true);
	const { calls, hooks } = recorder();
	let r = review(root(), house, 'lexicon', hooks);
	check('lexicon: every term with its marks of hers', same(all(r, '[data-item]').map((i) => i.getAttribute('data-item')), ['x-verjus01', 'x-saltbak1']) && same(fieldsDrawn(r, 'x-verjus01'), ['say', 'toGuest']) && same(fieldsDrawn(r, 'x-saltbak1'), ['say']) && r.textContent.includes('TermVerjus'));
	pressOn(r, 'x-saltbak1', 'say', 'discard');
	check('Discard on the step calls hooks.discard(lexicon, id, say) and the term leaves the step', same(calls.discard, [{ kind: 'lexicon', id: 'x-saltbak1', field: 'say' }]) && all(r, '[data-item]').length === 1);
	r = review(root(), house, 'scenarios', hooks);
	check('scenarios: the conversation, the mix-up and the must-know with their marks of hers',
		same(all(r, '[data-item]').map((i) => i.getAttribute('data-item')), ['s-hurry001', 'm-chkbeet1', 'k-lastord1']) && same(fieldsDrawn(r, 's-hurry001'), ['you', 'principle']) && same(fieldsDrawn(r, 'm-chkbeet1'), ['difference', 'ask']) && same(fieldsDrawn(r, 'k-lastord1'), ['body'])
			&& r.textContent.includes('ConversationA table in a hurry') && r.textContent.includes('Mix-upLantern Roast Chicken or Beetroot and Apple Salad') && r.textContent.includes('Must-knowThe kitchen closes at ten'));
	r = review(root(), house, 'card', hooks);
	check('an unknown step says so and draws no chips', r.textContent.includes('No such step.') && all(r, 'button').length === 0);
	r = review(root(), fixture(), 'formula', hooks);
	check('a step with nothing of hers says so', r.textContent.includes('Nothing of hers waits on this step.') && all(r, 'button').length === 0);
	ui.review(root(), null, 'formula', hooks);
	check('review with no house says so', doc.body.childNodes[doc.body.childNodes.length - 1].textContent.includes('There is no house on this device yet.'));
}

/* -------------------------------------------------------------------------
 * 5. The voice, over everything drawn, and over this check
 * ---------------------------------------------------------------------- */

{
	const everything = drawn.join('\n');
	const problems = voiceProblems(everything, true);
	check('every string either view drew (' + drawn.length + ' renders): no dash, no retired word, no level numbered, no glyph, no real person named', !problems.length, problems.join('; '));
	const own = voiceProblems(readFileSync(fileURLToPath(import.meta.url), 'utf8'), false);
	check('check-house-ui.mjs itself: no dash, no retired word, no level numbered, no glyph', !own.length, own.join('; '));
}

console.log('');
if (failed) {
	console.log('check-house-ui: ' + failed + ' of ' + (passed + failed) + ' checks FAILED');
	process.exit(1);
}
console.log('check-house-ui: all ' + passed + ' checks pass');
