#!/usr/bin/env node
/* parse-guide.mjs: the Brennan's server guide, read by its own labels.

   Reads house/brennans/guide.txt (pdftotext -layout of the 51 page guide),
   strips the page furniture and writes house/brennans/parsed.json: the 52
   menu items of section 3 with their five parts, three timed lines and
   pairing block, the 20 wines of section 4, and the scenarios, mix-ups,
   must-knows, menu words and sources of section 5. Every string is trimmed
   and its inner whitespace collapsed; nothing is dash-stripped here, the
   builder does that with its log. Quoted lines lose their outer quotation
   marks only.

   The parser is deterministic: a field is placed by a label the guide prints
   (MAIN INGREDIENT, 10 SEC, WINE, GRAPES, GUEST, DIFFERENCE and the rest) or
   by a column offset read from a header line. A line between blocks that no
   rule places goes into `unplaced` with its line number, and the run fails
   on any unplaced line, on an item count other than 52 or a wine count other
   than 20, unless --allow-unplaced is given for a look.

   Usage: node house/parse-guide.mjs [--allow-unplaced] [--quiet]
   Runs from any directory. Exits 1 with the file and the rule on failure,
   prints one summary line on success. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GUIDE = path.join(HERE, 'brennans', 'guide.txt');
const OUT = path.join(HERE, 'brennans', 'parsed.json');
const REL = (p) => path.relative(process.cwd(), p) || p;

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
	console.log(`parse-guide.mjs: read ${REL(GUIDE)} and write ${REL(OUT)}.

  --allow-unplaced   write the file even when lines are unplaced or counts are off
  --quiet            print only the summary line
  --help             this text

Fails (exit 1) naming the line when a line between blocks is unplaced, when
the items are not 52 or the wines not 20.`);
	process.exit(0);
}
for (const a of args) if (!['--allow-unplaced', '--quiet'].includes(a)) fail(`${a.startsWith('-') ? 'unknown' : 'unexpected'} argument ${a}; see --help`);
const ALLOW = args.includes('--allow-unplaced');
const QUIET = args.includes('--quiet');

/* ---------- the page furniture ---------- */

const HEADER_RE = /^\f?\s*Brennan’s \u2014 server dialogue & wine pairing guide\s+Menus read ([A-Z][a-z]+) (\d{1,2}), (\d{4})\s*$/;
const FOOTER_RE = /^\s*Page (\d+) of (\d+)\s*$/;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function fail(msg) {
	console.error('parse-guide: ' + msg);
	process.exit(1);
}

if (!fs.existsSync(GUIDE)) fail(`${REL(GUIDE)}: the guide is missing`);
const raw = fs.readFileSync(GUIDE, 'utf8').replace(/\r\n?/g, '\n').split('\n');

/* Every line that is not furniture, with its 1-based number in the file and its page. */
const lines = [];
let page = 1;
let readOn = '';
for (let i = 0; i < raw.length; i++) {
	const text = raw[i];
	const h = text.match(HEADER_RE);
	if (h) {
		if (!readOn) {
			const m = MONTHS.indexOf(h[1]) + 1;
			if (m > 0) readOn = `${h[3]}-${String(m).padStart(2, '0')}-${h[2].padStart(2, '0')}`;
		}
		continue;
	}
	const f = text.match(FOOTER_RE);
	if (f) {
		page = Number(f[1]) + 1;
		continue;
	}
	lines.push({ n: i + 1, page, text: text.replace(/\f/g, '') });
}
if (!readOn) fail(`${REL(GUIDE)}: no page header carries the date the menus were read`);

/* ---------- helpers ---------- */

const collapse = (s) => s.replace(/\s+/g, ' ').trim();
const indentOf = (t) => (t.match(/^ */) || [''])[0].length;
const isBlank = (t) => t.trim() === '';
function unquote(s) {
	s = collapse(s);
	if (s.length >= 2 && s.startsWith('“') && s.endsWith('”')) return collapse(s.slice(1, -1));
	return s;
}
/* A cell or a label is the text before the first run of two spaces; one character on its own
   (the guide prints a lone dash for a term with no respelling) is tried first, so the engine
   never swallows the run into a longer label. */
const CELL_RE = /^(\S|\S.*?\S)(?: {2,}(.*))?$/;
const LABEL_RE = /^ {1,5}(\S|\S.*?\S)(?: {2,}(.*))?$/;
/* A word broken at its hyphen over a line break joins without a space; everything else with one. */
function join(prev, next) {
	if (!prev) return next;
	if (/[A-Za-z]-$/.test(prev) && /^[a-z]/.test(next)) return prev + next;
	return prev + ' ' + next;
}
/* A label line: up to five spaces, the label, then two or more spaces (or the end) and the value. */
function labelOf(text) {
	const m = text.match(LABEL_RE);
	if (!m) return null;
	return { label: m[1], value: m[2] === undefined ? '' : m[2] };
}
function nextNonBlank(from, upto) {
	for (let j = from; j < upto; j++) if (!isBlank(lines[j].text)) return j;
	return -1;
}
const unplaced = [];
function leave(line, why) {
	unplaced.push({ line: line.n, page: line.page, text: collapse(line.text), why });
}

/* The section headings and their one-paragraph preambles. */
const s3 = lines.findIndex((l) => /^ 3\. Every menu item$/.test(l.text));
const s4 = lines.findIndex((l) => /^ 4\. The by-the-glass list$/.test(l.text));
const s5 = lines.findIndex((l) => /^ 5\. Guest conversations$/.test(l.text));
if (s3 < 0 || s4 < 0 || s5 < 0 || !(s3 < s4 && s4 < s5)) fail(`${REL(GUIDE)}: the three section headings 3, 4 and 5 were not found in order`);
/* The preamble after a heading runs to the first blank line; it returns the index after it. */
function skipPreamble(i, upto) {
	let j = i + 1;
	while (j < upto && !isBlank(lines[j].text)) j++;
	return j;
}

/* ---------- section 3: every menu item ---------- */

const ITEM_LABELS = new Set(['SERVICE NOTE']);
const PAIRING_LABELS = {
	'WINE': 'wine',
	'WHY': 'why',
	'SAY IT': 'sayIt',
	'“WHY THIS': 'whyThisWine',
	'ON THE PALATE': 'palate',
	'PRINCIPLES': 'principles',
	'SECOND CHOICE': 'second',
	'STEP UP': 'stepUp',
	'SERVE': 'serve',
	'AVOID': 'avoid',
	'ZERO-PROOF': 'zeroProof'
};
const COLUMN_LABELS = [
	['main', 'MAIN INGREDIENT'],
	['technique', 'TECHNIQUE'],
	['sauce', 'SAUCE & KEY'],
	['sides', 'ACCOMPANIMENTS'],
	['taste', 'HOW IT TASTES']
];
const MEAL_RE = /^ (.*?) (SIGNATURE )?((?:Breakfast & lunch|Dinner|Tasting menus)\b.*)$/;
const TITLE_MEAL_RE = /^(Breakfast & lunch|Dinner)(?: (\$\S+))?$/;
const TASTING_RE = /^Tasting menus (breakfast tasting|dinner tasting)(?:, (.*))?$/;
const ZERO_PROOF_NAMES = [
	'The Black Hills', 'The Catalina Island', 'Café Glacé de la Maison',
	'Our New Orleans\u2013style coffee with chicory', 'New Orleans\u2013style coffee with chicory',
	'Congregation Coffee & Chicory'
];

function isItemTitle(i, upto) {
	const l = lines[i];
	if (indentOf(l.text) !== 1 || isBlank(l.text)) return false;
	const j = nextNonBlank(i + 1, upto);
	return j >= 0 && /^ Menu: /.test(lines[j].text);
}

function parseTitle(line, section) {
	const m = line.text.match(MEAL_RE);
	if (!m) return null;
	let name = collapse(m[1]);
	let nameNote = '';
	const paren = name.match(/^(.*?) \(([^()]*)\)$/);
	if (paren) { name = paren[1]; nameNote = paren[2]; }
	const item = {
		kind: section === 'Signature drinks' ? 'cocktail' : 'dish',
		name,
		signature: !!m[2],
		section,
		meals: [],
		tastings: [],
		prices: []
	};
	if (nameNote) item.nameNote = nameNote;
	for (const seg of collapse(m[3]).split(' · ')) {
		const s = seg.trim();
		const pm = s.match(TITLE_MEAL_RE);
		const tm = s.match(TASTING_RE);
		if (pm) {
			item.meals.push(pm[1]);
			if (pm[2]) item.prices.push({ meal: pm[1], printed: pm[2] });
		} else if (tm) {
			item.meals.push(s);
			item.tastings.push({ tasting: tm[1], course: tm[2] || '' });
		} else {
			leave(line, `a meal segment on the title line no rule reads: ${s}`);
		}
	}
	item.page = line.page;
	item.line = line.n;
	return item;
}

/* The column table: offsets read from the header, each row sliced at them. */
function readTable(headerText) {
	const cols = [];
	for (const [key, label] of COLUMN_LABELS) {
		const at = headerText.indexOf(label);
		if (at >= 0) cols.push({ key, at });
	}
	cols.sort((a, b) => a.at - b.at);
	return cols;
}
function sliceRow(text, cols, line) {
	const cells = {};
	for (let c = 0; c < cols.length; c++) {
		const from = cols[c].at;
		const to = c + 1 < cols.length ? cols[c + 1].at : text.length;
		if (c > 0 && from > 0 && from < text.length && text[from - 1] !== ' ' && text[from] !== ' ') {
			leave(line, `a table cell runs across the ${cols[c].key} column boundary at column ${from}`);
		}
		cells[cols[c].key] = collapse(text.slice(from, to));
	}
	return cells;
}

function finishItem(it) {
	const f = it.fields;
	const item = {
		kind: it.kind,
		name: it.name,
		signature: it.signature,
		section: it.section,
		meals: it.meals,
		tastings: it.tastings,
		prices: it.prices,
		menuLine: collapse(f.menu || ''),
		parts: { main: '', technique: '', sauce: '', sides: '', taste: '' },
		lines: { s10: '', s20: '', s45: '' },
		lineWords: { s10: null, s20: null, s45: null },
		serviceNote: collapse(f.serviceNote || ''),
		page: it.page,
		line: it.line
	};
	if (it.nameNote) item.nameNote = it.nameNote;
	for (const key of Object.keys(item.parts)) item.parts[key] = collapse(it.parts[key] || '');
	for (const key of ['s10', 's20', 's45']) {
		if (f[key] !== undefined) item.lines[key] = unquote(f[key]);
		if (it.words[key] !== undefined) item.lineWords[key] = it.words[key];
	}
	if (Object.keys(it.pairing).length) {
		const p = {};
		for (const [key, val] of Object.entries(it.pairing)) {
			const text = collapse(val);
			if (key === 'sayIt' || key === 'whyThisWine') p[key] = unquote(text);
			else if (key === 'principles') p.principles = text.split(',').map((s) => s.trim()).filter(Boolean);
			else if (key === 'second') {
				const at = text.indexOf(' \u2014 ');
				if (at > 0) { p.second = text.slice(0, at).trim(); p.secondWhy = text.slice(at + 3).trim(); }
				else p.second = text;
			} else if (key === 'zeroProof') {
				let hit = null;
				for (const name of ZERO_PROOF_NAMES) {
					const at = text.indexOf(name);
					if (at >= 0 && (hit === null || at < hit.at)) hit = { name, at };
				}
				p.zeroProofText = text;
				if (hit) {
					p.zeroProof = hit.name.replace(/^(The|Our) /, '');
					let rest = text.slice(0, hit.at) + text.slice(hit.at + hit.name.length);
					rest = rest.replace(/^\s*[:\u2014,]\s*/, '').replace(/\s*[:\u2014,]\s*$/, '');
					rest = collapse(rest.replace(/\s*[:\u2014]\s*[:\u2014]\s*/g, ' \u2014 '));
					if (rest) p.zeroProofWhy = rest;
				} else {
					p.zeroProof = text;
				}
			} else p[key] = text;
		}
		item.pairing = p;
	}
	return item;
}

const items = [];
{
	let i = skipPreamble(s3, s4);
	let section = '';
	let cur = null;        /* the open item */
	let field = null;      /* the field continuation lines append to: ['fields', key] or ['pairing', key] */
	let table = null;      /* the column offsets while inside the parts table */
	const close = () => { if (cur) items.push(finishItem(cur)); cur = null; field = null; table = null; };
	for (; i < s4; i++) {
		const line = lines[i];
		const text = line.text;
		if (isBlank(text)) continue;
		const ind = indentOf(text);

		if (isItemTitle(i, s4)) {
			close();
			const it = parseTitle(line, section);
			if (!it) { leave(line, 'a title line without a meal word'); continue; }
			cur = Object.assign(it, { fields: {}, words: {}, parts: {}, pairing: {} });
			continue;
		}
		if (table) {
			if (ind === 1 && /^ (10|20|45) SEC /.test(text)) table = null;
			else {
				const cells = sliceRow(text, table, line);
				for (const [key, val] of Object.entries(cells)) {
					if (!val) continue;
					if (key === 'sauce' && val === 'FLAVORS') continue;   /* the header's second line */
					cur.parts[key] = join(cur.parts[key] || '', val);
				}
				continue;
			}
		}
		if (!cur) {
			if (ind === 1 && isItemTitle(nextNonBlank(i + 1, s4), s4)) { section = collapse(text); continue; }
			leave(line, 'outside any item');
			continue;
		}
		const menu = text.match(/^ Menu: (.*)$/);
		if (menu) { cur.fields.menu = menu[1]; field = ['fields', 'menu']; continue; }
		if (ind === 3 && text.trim().startsWith('MAIN INGREDIENT')) {
			table = readTable(text);
			field = null;
			continue;
		}
		const sec = text.match(/^ (10|20|45) SEC (\d+)W {2,}(.*)$/);
		if (sec) {
			const key = 's' + sec[1];
			cur.fields[key] = sec[3];
			cur.words[key] = Number(sec[2]);
			field = ['fields', key];
			continue;
		}
		const lab = ind <= 5 ? labelOf(text) : null;
		if (lab && ITEM_LABELS.has(lab.label)) {
			const key = lab.label === 'SERVICE NOTE' ? 'serviceNote' : lab.label;
			cur.fields[key] = lab.value;
			field = ['fields', key];
			continue;
		}
		if (lab && lab.label === 'WINE?”' && lab.value === '') continue;   /* the second line of the WHY THIS WINE? label */
		if (lab && Object.prototype.hasOwnProperty.call(PAIRING_LABELS, lab.label)) {
			const key = PAIRING_LABELS[lab.label];
			cur.pairing[key] = lab.value;
			field = ['pairing', key];
			continue;
		}
		if (ind > 5 && field) {
			const [bag, key] = field;
			cur[bag][key] = join(cur[bag][key] || '', text.trim());
			continue;
		}
		if (ind === 1 && field && field[0] === 'fields' && field[1] === 'menu') {
			cur.fields.menu = join(cur.fields.menu, text.trim());
			continue;
		}
		if (ind === 1 && isItemTitle(nextNonBlank(i + 1, s4), s4)) { close(); section = collapse(text); continue; }
		leave(line, cur ? `inside the item ${cur.name}, no label or column placed it` : 'outside any item');
	}
	close();
}

/* ---------- section 4: the by-the-glass list ---------- */

const WINE_LABELS = {
	'GRAPES · REGION': 'grapesRegion',
	'PROFILE': 'profile',
	'SAY IT': 'sayIt',
	'GOES WITH': 'goesWith',
	'FIRST PICK FOR': 'firstPickFor',
	'SERVE': 'serve'
};
const WINE_PRICE_RE = /^(.*?) (\$\d+(?:\.\d+)? (?:glass|half-bottle|bottle))$/;

function isWineTitle(i, upto) {
	if (i < 0) return false;
	const l = lines[i];
	if (indentOf(l.text) !== 1 || isBlank(l.text)) return false;
	const j = nextNonBlank(i + 1, upto);
	return j >= 0 && /^ GRAPES · REGION /.test(lines[j].text);
}
function finishWine(w) {
	const wine = {
		group: w.group,
		name: w.name,
		price: w.price,
		grapesRegion: '',
		profile: '',
		sayIt: '',
		goesWith: '',
		firstPickFor: [],
		serve: '',
		page: w.page,
		line: w.line
	};
	for (const [key, val] of Object.entries(w.fields)) {
		const text = collapse(val);
		if (key === 'sayIt') wine.sayIt = unquote(text);
		else if (key === 'firstPickFor') wine.firstPickFor = text.split(' · ').map((s) => s.trim()).filter(Boolean);
		else wine[key] = text;
	}
	return wine;
}

const wines = [];
{
	let i = skipPreamble(s4, s5);
	let group = '';
	let cur = null;
	let field = null;
	const close = () => { if (cur) wines.push(finishWine(cur)); cur = null; field = null; };
	for (; i < s5; i++) {
		const line = lines[i];
		const text = line.text;
		if (isBlank(text)) continue;
		const ind = indentOf(text);
		if (isWineTitle(i, s5)) {
			close();
			const title = collapse(text);
			const pm = title.match(WINE_PRICE_RE);
			cur = { group, name: pm ? pm[1] : title, price: pm ? pm[2] : '', page: line.page, line: line.n, fields: {} };
			continue;
		}
		if (ind === 1 && isWineTitle(nextNonBlank(i + 1, s5), s5)) { close(); group = collapse(text); continue; }
		if (!cur) { leave(line, 'outside any wine'); continue; }
		const lab = ind <= 5 ? labelOf(text) : null;
		if (lab && Object.prototype.hasOwnProperty.call(WINE_LABELS, lab.label)) {
			const key = WINE_LABELS[lab.label];
			cur.fields[key] = lab.value;
			field = key;
			continue;
		}
		if (ind > 5 && field) { cur.fields[field] = join(cur.fields[field], text.trim()); continue; }
		leave(line, `inside the wine ${cur.name}, no label placed it`);
	}
	close();
}

/* ---------- section 5: guest conversations ---------- */

const scenarios = [];
const mixUps = [];
const mustKnows = [];
const terms = [];
const sources = [];
{
	const SUBS = { 'Scenarios': 'scenarios', 'Dishes guests mix up': 'mixUps', 'Must-knows': 'mustKnows', 'Menu words': 'terms', 'Sources': 'sources' };
	const SCEN_LABELS = { 'GUEST': 'guest', 'YOU': 'you', 'PRINCIPLE': 'principle' };
	const MIX_LABELS = { 'DIFFERENCE': 'difference', 'ASK': 'ask' };
	let mode = '';
	let cur = null;
	let field = null;
	let termCols = null;
	const close = () => {
		if (!cur) { field = null; return; }
		if (mode === 'scenarios') {
			scenarios.push({ title: cur.title, guest: collapse(cur.guest || ''), you: unquote(cur.you || ''), principle: collapse(cur.principle || ''), page: cur.page, line: cur.line });
		} else if (mode === 'mixUps') {
			const vs = cur.title.split(' vs. ');
			mixUps.push({ a: vs[0] || cur.title, b: vs[1] || '', difference: collapse(cur.difference || ''), ask: unquote(cur.ask || ''), page: cur.page, line: cur.line });
		} else if (mode === 'mustKnows') {
			mustKnows.push({ title: collapse(cur.title), body: collapse(cur.body || ''), page: cur.page, line: cur.line });
		} else if (mode === 'terms') {
			terms.push({ term: collapse(cur.term), say: collapse(cur.say), toGuest: collapse(cur.toGuest), page: cur.page, line: cur.line });
		}
		cur = null;
		field = null;
	};
	let i = s5 + 1;
	for (; i < lines.length; i++) {
		const line = lines[i];
		const text = line.text;
		if (isBlank(text)) continue;
		const ind = indentOf(text);
		const plain = collapse(text);
		if (ind === 1 && Object.prototype.hasOwnProperty.call(SUBS, plain)) { close(); mode = SUBS[plain]; termCols = null; continue; }

		if (mode === 'scenarios' || mode === 'mixUps') {
			const LABELS = mode === 'scenarios' ? SCEN_LABELS : MIX_LABELS;
			const lab = ind <= 5 ? labelOf(text) : null;
			if (lab && Object.prototype.hasOwnProperty.call(LABELS, lab.label)) {
				if (!cur) { leave(line, 'a label before any title'); continue; }
				field = LABELS[lab.label];
				cur[field] = lab.value;
				continue;
			}
			if (ind === 1) { close(); cur = { title: plain, page: line.page, line: line.n }; continue; }
			if (ind > 5 && cur && field) { cur[field] = join(cur[field], text.trim()); continue; }
			leave(line, `inside ${mode}, no label placed it`);
			continue;
		}
		if (mode === 'mustKnows') {
			if (ind === 1) {
				const m = text.match(/^ (\S|\S.*?\S)(?: {2,}(.*))?$/);
				const title = m ? m[1] : plain;
				const body = m && m[2] !== undefined ? m[2] : '';
				if (body) { close(); cur = { title, body, page: line.page, line: line.n }; }
				else if (cur) cur.title = join(cur.title, title);
				else leave(line, 'a must-know title with no body');
				continue;
			}
			if (cur) { cur.body = join(cur.body, text.trim()); continue; }
			leave(line, 'a must-know body before any title');
			continue;
		}
		if (mode === 'terms') {
			if (!termCols) {
				const t = text.indexOf('Term');
				const s = text.indexOf('Say it');
				const g = text.indexOf('To a guest');
				if (t >= 0 && s > t && g > s) { termCols = { term: t, say: s }; continue; }
				leave(line, 'before the Term / Say it / To a guest header');
				continue;
			}
			const c1 = collapse(text.slice(0, termCols.say));
			const rest = text.slice(termCols.say);
			let c2 = '';
			let c3 = '';
			if (/^\s/.test(rest)) c3 = collapse(rest);
			else {
				const m = rest.match(CELL_RE);
				c2 = m ? collapse(m[1]) : collapse(rest);
				c3 = m && m[2] !== undefined ? collapse(m[2]) : '';
			}
			if (c1 && c3) { close(); cur = { term: c1, say: c2, toGuest: c3, page: line.page, line: line.n }; continue; }
			if (!cur) { leave(line, 'a term fragment before any term'); continue; }
			if (c1) cur.term = join(cur.term, c1);
			if (c2) cur.say = join(cur.say, c2);
			if (c3) cur.toGuest = join(cur.toGuest, c3);
			continue;
		}
		if (mode === 'sources') {
			const m = plain.match(/^(\d+)\. (.*?) \u2014 (https?:\/\/\S+)$/);
			if (m) { sources.push({ n: Number(m[1]), title: m[2], url: m[3], page: line.page, line: line.n }); continue; }
			leave(line, 'a source line without a number, a title and a URL');
			continue;
		}
		leave(line, 'before any subsection of section 5');
	}
	close();
}

/* ---------- the verdict ---------- */

const out = { readOn, items, wines, scenarios, mixUps, mustKnows, terms, sources, unplaced };
const counts = `${items.length} items (${items.filter((x) => x.kind === 'dish').length} dishes, ${items.filter((x) => x.kind === 'cocktail').length} cocktails), ${wines.length} wines, ${scenarios.length} scenarios, ${mixUps.length} mix-ups, ${mustKnows.length} must-knows, ${terms.length} terms, ${sources.length} sources, ${unplaced.length} unplaced`;

const problems = [];
if (items.length !== 52) problems.push(`${REL(GUIDE)}: ${items.length} items parsed, the guide carries 52`);
if (wines.length !== 20) problems.push(`${REL(GUIDE)}: ${wines.length} wines parsed, the guide carries 20`);
for (const u of unplaced) problems.push(`${REL(GUIDE)}:${u.line} (page ${u.page}): unplaced, ${u.why}: ${u.text}`);

if (problems.length && !ALLOW) {
	for (const p of problems) console.error('parse-guide: ' + p);
	console.error(`parse-guide: ${counts}; nothing written`);
	process.exit(1);
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
if (!QUIET) for (const p of problems) console.error('parse-guide: ' + p);
console.log(`parse-guide: wrote ${REL(OUT)}: ${counts}${problems.length ? ' (written with --allow-unplaced)' : ''}`);
