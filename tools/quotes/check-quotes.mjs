#!/usr/bin/env node
/**
 * check-quotes.mjs: the shipped quote bank says what candidates.json says,
 * and nothing it must not.
 *
 *   node tools/quotes/check-quotes.mjs
 *
 * Exits 1 on any failure. Run it after tools/quotes/build-quotes.mjs and in
 * any pass that touches candidates.json, because a bank that is a day older
 * than its candidates is a quotation nobody ticked, shipped under a name.
 *
 * WHAT IS PROVED, in rising order of how quietly it would fail:
 *
 *   1. The file is a pure ASCII script with no carriage return, no dash in
 *      any spelling (nor one hiding as a \u escape), no address (no http),
 *      and no word that reaches for the DOM or the network.
 *
 *   2. It loads in a BARE vm context (no window, no document, no fetch) and
 *      in one with a minimal window, installs OOT.quotes with v 1, a dated
 *      builtOn and a list, and loaded twice leaves the first install
 *      standing.
 *
 *   3. Every entry carries exactly id, text, who, work, year, tags and
 *      adapted; ids are unique and of the form q- and four base36
 *      characters; the list is sorted by id; text is at most WORD_CAP words;
 *      who is a name in PEOPLE, the closed list below, so a new author needs
 *      a deliberate edit here; no key anywhere is one the client's rule
 *      would refuse; no decoded string carries a dash.
 *
 *   4. Every shipped id is in candidates.json with confidence 'high', a
 *      non-empty checkedBy and non-empty evidence, and the shipped fields
 *      equal the candidate's; every candidate that qualifies is shipped;
 *      and the file is byte for byte what build-quotes.mjs would write now,
 *      so a stale build or a hand edit fails.
 */
import vm from 'node:vm';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	ROOT, CANDIDATES, SHIPPED, WORD_CAP, ID_RE, DASH, ESCAPED_DASH, SHIPPED_KEYS,
	wordCount, readCandidates, shippable, toShipped, generate, forbiddenKeys, strings
} from './build-quotes.mjs';

/**
 * The closed list of authors the shipped bank may name, as the who field
 * spells them. A new name is a deliberate edit of this list, and a name with
 * no quotation left is removed, so the list is always exactly who ships.
 * Letters outside ASCII are written as escapes so this file stays ASCII.
 */
export const PEOPLE = [
	'Anthony Bourdain',
	'Bernard DeVoto',
	'Charles Baudelaire',
	'Confucius',
	'Edward FitzGerald',
	'Elizabeth David',
	'Epictetus',
	'Epicurus',
	'Ernest Hemingway',
	'George Bernard Shaw',
	'Harry Craddock',
	'Henry David Thoreau',
	'Horace',
	'James Beard',
	'Jean Anthelme Brillat-Savarin',
	'Jerry Thomas',
	'Jonathan Swift',
	'Julia Child',
	'Lao Tzu',
	'M. F. K. Fisher',
	'Marcus Aurelius',
	'Mark Twain',
	'Michel de Montaigne',
	'Miguel de Cervantes',
	'Moli\u00e8re',
	'Oscar Wilde',
	'Pliny the Elder',
	'Robert Louis Stevenson',
	'Samuel Johnson',
	'Seneca',
	'Thomas Love Peacock',
	'Virginia Woolf',
	'Voltaire',
	'William Shakespeare',
	'Winston Churchill'
];

/** @type {string[]} */
const fail = [];
/** @type {string[]} */
const said = [];
/** @param {boolean} cond @param {string} message */
function assert(cond, message) {
	if (!cond) fail.push(message);
}

/* -------------------------------------------------------------------------
 * 1. The bytes
 * ---------------------------------------------------------------------- */

const rel = path.relative(ROOT, SHIPPED);
if (!existsSync(SHIPPED)) {
	console.error(`  check-quotes: ${rel} is missing; run node tools/quotes/build-quotes.mjs`);
	process.exit(1);
}
const text = readFileSync(SHIPPED, 'utf8');
assert(!/[^\x00-\x7f]/.test(text), `${rel} is not pure ASCII`);
assert(!text.includes('\r'), `${rel} carries a carriage return`);
const dashes = text.match(DASH);
assert(!dashes, `${rel} carries ${dashes ? dashes.length : 0} dash(es)`);
assert(!ESCAPED_DASH.test(text), `${rel} carries a dash as a \\u escape`);
assert(!/http/i.test(text), `${rel} carries an address (http)`);
for (const word of ['document', 'fetch', 'localStorage', 'XMLHttpRequest', 'navigator', 'location']) {
	assert(!new RegExp('\\b' + word + '\\b').test(text), `${rel} mentions ${word}; the bank touches no DOM and makes no request`);
}
try {
	new vm.Script(text, { filename: 'oot-quotes.js' });
	said.push('parses as a classic script');
} catch (e) {
	fail.push(`${rel} does not parse: ${e instanceof Error ? e.message : String(e)}`);
}

/* -------------------------------------------------------------------------
 * 2. Loading
 * ---------------------------------------------------------------------- */

/**
 * @typedef {{ id: string, text: string, who: string, work: string, year: string, tags: string[], adapted: boolean }} Entry
 * @typedef {{ v: number, builtOn: string, quotes: Entry[] }} Bank
 */

/**
 * The file run in a fresh context, twice, with or without a window.
 * @param {boolean} withWindow
 * @returns {{ bank: Bank | null, same: boolean }}
 */
function load(withWindow) {
	/** @type {Record<string, unknown>} */
	const ctx = { console };
	if (withWindow) {
		ctx.window = ctx;
		ctx.self = ctx;
	}
	vm.createContext(ctx);
	try {
		vm.runInContext(text, ctx, { filename: 'oot-quotes.js' });
	} catch (e) {
		fail.push(`${rel} threw at load ${withWindow ? 'with' : 'without'} a window: ${e instanceof Error ? e.message : String(e)}`);
		return { bank: null, same: false };
	}
	const oot = /** @type {{ quotes?: Bank } | undefined} */ (ctx.OOT);
	const first = oot && oot.quotes ? oot.quotes : null;
	vm.runInContext(text, ctx, { filename: 'oot-quotes.js' });
	const second = oot && oot.quotes ? oot.quotes : null;
	return { bank: first, same: first !== null && first === second };
}

const bare = load(false);
assert(bare.bank !== null, `${rel} did not install OOT.quotes in a bare context (no window)`);
const windowed = load(true);
assert(windowed.bank !== null, `${rel} did not install OOT.quotes under a window`);
assert(windowed.same && bare.same, `${rel} loaded twice replaced the first install; it must return when OOT.quotes exists`);
const bank = windowed.bank;

if (bank) {
	assert(bank.v === 1, `OOT.quotes.v is ${String(bank.v)}, not 1`);
	assert(typeof bank.builtOn === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(bank.builtOn), `OOT.quotes.builtOn is not YYYY-MM-DD: ${String(bank.builtOn)}`);
	assert(Array.isArray(bank.quotes), 'OOT.quotes.quotes is not a list');
	const bankKeys = Object.keys(bank).sort().join(',');
	assert(bankKeys === 'builtOn,quotes,v', `OOT.quotes carries keys ${bankKeys}; only v, builtOn and quotes ship`);
	said.push(`installs OOT.quotes v1, bank dated ${bank.builtOn}, idempotent, bare and under a window`);
}

/* -------------------------------------------------------------------------
 * 3. The entries
 * ---------------------------------------------------------------------- */

/** @type {Entry[]} */
const entries = bank && Array.isArray(bank.quotes) ? bank.quotes : [];
const seen = new Set();
const people = new Set(PEOPLE);
const usedPeople = new Set();
assert(new Set(PEOPLE).size === PEOPLE.length, 'PEOPLE carries a duplicate name');
assert(PEOPLE.slice().sort().join('|') === PEOPLE.join('|'), 'PEOPLE is not in alphabetical order');
let previous = '';
entries.forEach((q, i) => {
	const at = `quotes[${i}]${q && typeof q.id === 'string' ? ' ' + q.id : ''}`;
	if (!q || typeof q !== 'object') { fail.push(`${at}: not an object`); return; }
	const keys = Object.keys(q).sort().join(',');
	assert(keys === SHIPPED_KEYS.slice().sort().join(','), `${at}: carries keys ${keys}; a shipped entry has exactly ${SHIPPED_KEYS.join(', ')}`);
	assert(typeof q.id === 'string' && ID_RE.test(q.id), `${at}: id is not q- and four base36 characters`);
	assert(!seen.has(q.id), `${at}: duplicate id`);
	seen.add(q.id);
	assert(q.id > previous, `${at}: out of order; the list is sorted by id`);
	previous = q.id;
	assert(typeof q.text === 'string' && q.text.trim() !== '', `${at}: empty text`);
	assert(typeof q.text === 'string' && wordCount(q.text) <= WORD_CAP, `${at}: ${wordCount(q.text)} words, the cap is ${WORD_CAP}`);
	assert(typeof q.who === 'string' && people.has(q.who), `${at}: who "${String(q.who)}" is not in PEOPLE; a new name is a deliberate edit of check-quotes.mjs`);
	if (typeof q.who === 'string') usedPeople.add(q.who);
	assert(typeof q.work === 'string' && q.work.trim() !== '', `${at}: no work named`);
	assert(typeof q.year === 'string', `${at}: year is not a string`);
	assert(Array.isArray(q.tags) && q.tags.length > 0 && q.tags.every((t) => typeof t === 'string' && t.trim() !== ''), `${at}: tags must be a non-empty list of words`);
	assert(typeof q.adapted === 'boolean', `${at}: adapted is not a boolean`);
	for (const s of strings(q, at, [])) {
		assert(!DASH.test(s.s), `${s.at}: carries a dash once decoded`);
		DASH.lastIndex = 0;
	}
	for (const k of forbiddenKeys(q, at, [])) fail.push(`${k}: a key the client would refuse`);
});
for (const name of PEOPLE) assert(usedPeople.has(name), `PEOPLE names "${name}" but no shipped quotation is theirs; remove the name or ship one`);
said.push(`${entries.length} entries, ${usedPeople.size} names, every entry shaped, capped, sorted and swept`);

/* -------------------------------------------------------------------------
 * 4. Against the candidates
 * ---------------------------------------------------------------------- */

/** @type {import('./build-quotes.mjs').Candidate[]} */
let candidates = [];
try {
	candidates = readCandidates(CANDIDATES);
} catch (e) {
	fail.push(e instanceof Error ? e.message : String(e));
}
const byId = new Map(candidates.map((c) => [c.id, c]));
for (const q of entries) {
	const c = byId.get(q.id);
	if (!c) { fail.push(`${q.id}: shipped but not in candidates.json`); continue; }
	assert(c.confidence === 'high', `${q.id}: shipped with confidence "${c.confidence}"; only high ships`);
	assert(typeof c.checkedBy === 'string' && c.checkedBy.trim() !== '', `${q.id}: shipped with no checkedBy`);
	assert(typeof c.evidence === 'string' && c.evidence.trim() !== '', `${q.id}: shipped with no evidence`);
	const want = JSON.stringify(toShipped(c));
	const got = JSON.stringify({ id: q.id, text: q.text, who: q.who, work: q.work, year: q.year, tags: q.tags, adapted: q.adapted });
	assert(want === got, `${q.id}: the shipped fields differ from the candidate's; rebuild`);
}
const expected = shippable(candidates);
assert(expected.length === entries.length, `${expected.length} candidates qualify to ship but ${entries.length} entries shipped; rebuild`);
if (candidates.length) {
	const fresh = generate(candidates);
	assert(fresh === text, `${rel} is not what build-quotes.mjs writes now; rebuild with node tools/quotes/build-quotes.mjs`);
}
const tally = ['high', 'medium', 'low'].map((c) => `${c} ${candidates.filter((x) => x.confidence === c).length}`).join(', ');
said.push(`${candidates.length} candidates (${tally}); ${entries.length} shipped and byte-equal to a fresh build`);

/* -------------------------------------------------------------------------
 * The verdict
 * ---------------------------------------------------------------------- */

if (fail.length) {
	console.error(`  check-quotes: ${fail.length} failure(s)`);
	for (const f of fail) console.error('    ' + f);
	process.exit(1);
}
for (const s of said) console.log('  ok  ' + s);
console.log(`  check-quotes: ${rel} is the bank candidates.json ticks`);
