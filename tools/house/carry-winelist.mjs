#!/usr/bin/env node
/* carry-winelist.mjs: the stable identity of a wine list entry across the owner's pastes (the wine
   list review of 28 November 2026).

   A catalogue (research/winelist-<date>.json, written by parse-winelist.mjs) numbers its entries n
   by position, and a new paste moves almost every position. So an entry gets a key once, when a
   catalogue first prints it, and keeps it for as long as the list prints it: the letter of that
   catalogue and its n there. The first catalogue (3 October 2026) is a, the next (28 November 2026)
   b, and so on: a15 is the Cesarini Sforza for ever, b21 the Daulny Sancerre. The producer files
   (research/winelist/producers-*.json) map keys to producers, never positions, so a new paste never
   renumbers them.

   The ledger, research/winelist/ledger.json, format oot-winelist-ledger v1:
     { format, version,
       catalogues: { letter: date },     in the order the pastes came; the file of each is
                                         research/winelist-<date>.json
       current: letter,                  the newest
       keys: { letter: { n: key } },     every row of every catalogue, one line a row
       left: { key: letter },            every key the current catalogue no longer prints, with the
                                         catalogue that printed it last
       rulings: [ { catalogue, from, to, why } ]   a key carried onto row `to` of `catalogue` that the
                                         passes would not carry (a printing read wrong, a vintage
                                         rolled), with the reason }

   The carry from one catalogue to the next is mechanical and one to one, pass by pass, and a key is
   carried only where the printing is the same wine:
     the rulings first;
     1. the same place (section, group, sub), bin, folded name, vintage, size and price;
     2. the same place, bin, folded name, vintage and size at another price;
     3. the same section, bin, vintage, size and price under another name or group;
     4. the same place, folded name, vintage, size and price at another bin.
   A different vintage or size is never carried except by a ruling. Each pass is tried against the
   rows of the catalogue before, then against the keys that had left, so a bottle that comes back
   takes its old key again. Everything else in the new catalogue gets a new key under the new letter;
   everything unmatched goes to left.

   Usage:
     node tools/house/carry-winelist.mjs --init <date>       a ledger of one catalogue (every key its own n)
     node tools/house/carry-winelist.mjs --to <date> [--rule <from>:<to>:<why>]...
                                         carry the current catalogue onto the paste of <date> (rerun
                                         with the date that is current to carry it again, the
                                         ledger's own rulings kept); a --rule adds a ruling for <date>
     node tools/house/carry-winelist.mjs --migrate            the producer files' bare entry numbers
                                         become keys of the first catalogue ("15" to "a15"); rerunnable
     node tools/house/carry-winelist.mjs                      the ledger checked and the proof printed
   Each run also takes --ledger <file>, --producers <a,b,...>, --against <list file> (the proof's
   reference, default the shipped list file) and --dry (report, write nothing). Every run ends with
   the proof: every row of the reference list file resolves through its key to the producer the file
   gives it, and every one of those keys that the current catalogue still prints keeps it there.
   Runs from any directory. Exits 1 with the file and the rule on failure. Deterministic: no clock,
   no chance. No dash of any spelling in this file. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const RESEARCH = path.join(HERE, 'brennans', 'research');
export const PRODUCERS_DIR = path.join(RESEARCH, 'winelist');
export const LEDGER = path.join(PRODUCERS_DIR, 'ledger.json');
export const LEDGER_FORMAT = 'oot-winelist-ledger';
export const LEDGER_VERSION = 1;
const SHIPPED_LIST = path.join(HERE, '..', '..', 'static', 'shared', 'packs', 'brennans-new-orleans.winelist.v1.json');
const REL = (p) => { const r = path.relative(process.cwd(), p); return !r ? p : r.startsWith('..') ? p : r; };
const LETTERS = 'abcdefghijklmnopqrstuvwxyz';

/** The catalogue file of a date. */
export const catalogueFile = (date) => path.join(RESEARCH, `winelist-${date}.json`);

/** A name folded for comparison: lower case, no accents, curly quotes straight, '&' as and, every other mark a space. */
export const foldName = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
	.replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
const foldSize = (s) => String(s == null ? '' : s).toLowerCase().replace(/\s+/g, '');

/** The letters of the ledger's catalogues, oldest first. */
export const lettersOf = (ledger) => Object.keys((ledger && ledger.catalogues) || {}).sort((a, b) => LETTERS.indexOf(a) - LETTERS.indexOf(b));

/** The key's catalogue letter and its n there: 'a15' to ['a', 15]. */
export function splitKey(key) {
	const m = /^([a-z])([1-9]\d*)$/.exec(String(key));
	return m ? [m[1], Number(m[2])] : null;
}

/** The identity a carried pair is held to: never another vintage or size, and the same bin or the same folded name. */
export function sameWine(o, n) {
	return String(o.vintage) === String(n.vintage) && foldSize(o.size) === foldSize(n.size)
		&& (String(o.bin || '') === String(n.bin || '') || foldName(o.name) === foldName(n.name));
}

/**
 * The keys left as of catalogue `upto`: every key an earlier catalogue printed that `upto` does not,
 * with the catalogue that printed it last. Derived from the keys alone, so it can never disagree.
 */
export function leftAt(ledger, upto) {
	const letters = lettersOf(ledger);
	const last = new Map();
	for (const l of letters.slice(0, letters.indexOf(upto) + 1)) for (const k of Object.values((ledger.keys && ledger.keys[l]) || {})) last.set(k, l);
	const out = {};
	for (const [k, l] of last) if (l !== upto) out[k] = l;
	return out;
}

const PASSES = [
	{ kind: 'identical', key: (e) => [e.section, e.group, e.sub, e.bin, foldName(e.name), e.vintage, foldSize(e.size), e.price] },
	{ kind: 'at another price', key: (e) => [e.section, e.group, e.sub, e.bin, foldName(e.name), e.vintage, foldSize(e.size)] },
	{ kind: 'under another name or group', key: (e) => [e.section, e.bin, e.vintage, foldSize(e.size), e.price] },
	{ kind: 'at another bin', key: (e) => [e.section, e.group, e.sub, foldName(e.name), e.vintage, foldSize(e.size), e.price] }
];

/**
 * The carry of one catalogue onto the next: { keys, left, pairs, minted, failures }. `ledger` is the
 * ledger as it stands, `cats` the parsed catalogues by letter, `from` the letter carried from, `to`
 * the new letter, `rulings` the rulings for `to`. Pure.
 */
export function carry(ledger, cats, from, to, rulings) {
	const failures = [];
	const fromCat = cats[from];
	const toCat = cats[to];
	const fromKeys = ledger.keys[from] || {};
	/* The rows a key can be carried from: the catalogue before, then every key that had left it, each at its last printing. */
	const pool = [];
	for (const e of fromCat.entries) pool.push({ key: fromKeys[e.n], e, back: false });
	for (const [key, letter] of Object.entries(leftAt(ledger, from)).sort()) {
		const keys = ledger.keys[letter] || {};
		const n = Object.keys(keys).find((x) => keys[x] === key);
		const e = n && cats[letter] ? cats[letter].entries.find((x) => x.n === Number(n)) : null;
		if (e) pool.push({ key, e, back: true });
	}
	for (const p of pool) if (!p.key) failures.push(`catalogue ${from}: entry ${p.e.n} has no key in the ledger`);
	const taken = new Set();
	const keyOf = new Map();
	const pairs = [];
	const byKey = new Map(pool.map((p) => [p.key, p]));
	for (const r of rulings) {
		const p = byKey.get(r.from);
		const e = toCat.entries.find((x) => x.n === r.to);
		if (!p) { failures.push(`ruling ${r.from}: no such key to carry`); continue; }
		if (!e) { failures.push(`ruling ${r.from}: catalogue ${to} has no entry ${r.to}`); continue; }
		if (!r.why || !String(r.why).trim()) failures.push(`ruling ${r.from}: it says no why`);
		if (taken.has(r.from) || keyOf.has(e.n)) { failures.push(`ruling ${r.from}: the key or the row ${r.to} is ruled twice`); continue; }
		taken.add(r.from);
		keyOf.set(e.n, r.from);
		pairs.push({ kind: 'by ruling', key: r.from, o: p.e, n: e, back: p.back, why: r.why });
	}
	for (const back of [false, true]) {
		for (const pass of PASSES) {
			const index = new Map();
			for (const p of pool) {
				if (p.back !== back || taken.has(p.key)) continue;
				const k = JSON.stringify(pass.key(p.e));
				if (!index.has(k)) index.set(k, []);
				index.get(k).push(p);
			}
			for (const e of toCat.entries) {
				if (keyOf.has(e.n)) continue;
				const list = index.get(JSON.stringify(pass.key(e)));
				if (!list) continue;
				const p = list.find((x) => !taken.has(x.key));
				if (!p) continue;
				taken.add(p.key);
				keyOf.set(e.n, p.key);
				pairs.push({ kind: pass.kind + (back ? ', come back' : ''), key: p.key, o: p.e, n: e, back });
			}
		}
	}
	const keys = {};
	const minted = [];
	for (const e of toCat.entries) {
		const key = keyOf.get(e.n) || to + e.n;
		if (!keyOf.has(e.n)) minted.push({ key, e });
		keys[e.n] = key;
	}
	const left = leftAt({ ...ledger, keys: { ...ledger.keys, [to]: keys } }, to);
	return { keys, left, pairs, minted, failures };
}

/**
 * Every problem with a ledger, as sentences. `cats` holds the parsed catalogue of each letter (one
 * that is missing is a problem). It proves: every row of every catalogue has one key and no key
 * names two rows of one catalogue; a key is born in its own catalogue (a<n> on row n of a) and
 * otherwise was printed by the catalogue before; every carried pair is the same wine (vintage and
 * size, and the bin or the folded name) unless a ruling names it; left is exactly the keys of older
 * catalogues the current one no longer prints, each with its last catalogue.
 */
export function ledgerProblems(ledger, cats) {
	const out = [];
	if (!ledger || ledger.format !== LEDGER_FORMAT || ledger.version !== LEDGER_VERSION) { out.push(`format ${ledger && ledger.format} version ${ledger && ledger.version}; expected ${LEDGER_FORMAT} version ${LEDGER_VERSION}`); return out; }
	const letters = lettersOf(ledger);
	if (!letters.length) { out.push('names no catalogue'); return out; }
	letters.forEach((l, i) => { if (l !== LETTERS[i]) out.push(`the catalogues are lettered ${letters.join(', ')}; they run a, b, c in order`); });
	if (ledger.current !== letters[letters.length - 1]) out.push(`current is ${ledger.current}; the newest catalogue is ${letters[letters.length - 1]}`);
	for (let i = 1; i < letters.length; i++) if (!(ledger.catalogues[letters[i - 1]] < ledger.catalogues[letters[i]])) out.push(`catalogue ${letters[i]} (${ledger.catalogues[letters[i]]}) is not later than ${letters[i - 1]}`);
	const ruled = new Map();
	for (const r of ledger.rulings || []) {
		if (!r || !letters.includes(r.catalogue) || !splitKey(r.from) || !Number.isInteger(r.to) || !String(r.why || '').trim()) { out.push(`a ruling is { catalogue, from, to, why }: ${JSON.stringify(r)}`); continue; }
		ruled.set(r.catalogue + ' ' + r.to, r.from);
	}
	const lastOf = new Map();
	letters.forEach((l, i) => {
		const cat = cats[l];
		if (!cat || !Array.isArray(cat.entries)) { out.push(`catalogue ${l} (${ledger.catalogues[l]}): ${REL(catalogueFile(ledger.catalogues[l]))} is missing`); return; }
		if (cat.readOn !== ledger.catalogues[l]) out.push(`catalogue ${l}: its file reads ${cat.readOn}, the ledger says ${ledger.catalogues[l]}`);
		const keys = (ledger.keys && ledger.keys[l]) || {};
		const ns = new Set(cat.entries.map((e) => String(e.n)));
		for (const n of Object.keys(keys)) if (!ns.has(n)) out.push(`catalogue ${l}: the ledger keys row ${n}, which the catalogue lacks`);
		const seen = new Map();
		const before = i ? (ledger.keys[letters[i - 1]] || {}) : {};
		const beforeRow = new Map(Object.entries(before).map(([n, k]) => [k, Number(n)]));
		for (const e of cat.entries) {
			const key = keys[e.n];
			if (!key) { out.push(`catalogue ${l}: entry ${e.n} has no key`); continue; }
			const sk = splitKey(key);
			if (!sk) { out.push(`catalogue ${l}: entry ${e.n} has the key ${key}, not a letter and a number`); continue; }
			if (seen.has(key)) out.push(`catalogue ${l}: the key ${key} names rows ${seen.get(key)} and ${e.n}`);
			seen.set(key, e.n);
			if (sk[0] === l) { if (sk[1] !== e.n) out.push(`catalogue ${l}: entry ${e.n} carries ${key}, a key of this catalogue born on another row`); continue; }
			if (letters.indexOf(sk[0]) < 0 || letters.indexOf(sk[0]) > i) { out.push(`catalogue ${l}: entry ${e.n} carries ${key}, a key of no earlier catalogue`); continue; }
			/* Carried: from the catalogue before, or back from left; either way the wine it named last. */
			const lastL = beforeRow.has(key) ? letters[i - 1] : lastOf.get(key);
			if (!lastL) { out.push(`catalogue ${l}: entry ${e.n} carries ${key}, which the catalogue before neither printed nor had left`); continue; }
			const ln = Object.keys(ledger.keys[lastL] || {}).find((x) => ledger.keys[lastL][x] === key);
			const o = cats[lastL] && ln ? cats[lastL].entries.find((x) => x.n === Number(ln)) : null;
			if (!o) { out.push(`catalogue ${l}: ${key} names no row of ${lastL}`); continue; }
			if (!sameWine(o, e) && ruled.get(l + ' ' + e.n) !== key) out.push(`catalogue ${l}: entry ${e.n} (${e.name} ${e.vintage} ${e.size}, bin ${e.bin || 'none'}) carries ${key} (${o.name} ${o.vintage} ${o.size}, bin ${o.bin || 'none'}), another wine; only a ruling carries that`);
		}
		for (const k of seen.keys()) lastOf.set(k, l);
	});
	const live = new Set(Object.values((ledger.keys && ledger.keys[ledger.current]) || {}));
	const wantLeft = leftAt(ledger, ledger.current);
	const left = ledger.left || {};
	for (const [k, l] of Object.entries(wantLeft)) if (left[k] !== l) out.push(`left: ${k} was last printed by ${l}${left[k] ? `, not ${left[k]}` : ' and is not in left'}`);
	for (const k of Object.keys(left)) if (!(k in wantLeft)) out.push(`left: ${k} is ${live.has(k) ? 'still printed' : 'no key of any catalogue'}`);
	for (const r of ledger.rulings || []) {
		const keys = (ledger.keys && ledger.keys[r.catalogue]) || {};
		if (keys[r.to] !== r.from) out.push(`ruling ${r.from} onto ${r.catalogue} ${r.to}: the ledger keys that row ${keys[r.to] || 'with nothing'}`);
	}
	return out;
}

/** The ledger's text: compact, one row a line under each catalogue, so a diff reads. */
export function ledgerText(ledger) {
	const parts = [];
	parts.push(`{"format":${JSON.stringify(ledger.format)},"version":${ledger.version},`);
	parts.push(`"catalogues":${JSON.stringify(ledger.catalogues)},`);
	parts.push(`"current":${JSON.stringify(ledger.current)},`);
	parts.push(`"rulings":[${(ledger.rulings || []).length ? '\n' + ledger.rulings.map((r) => JSON.stringify(r)).join(',\n') + '\n' : ''}],`);
	const left = Object.keys(ledger.left || {}).sort((x, y) => { const a = splitKey(x); const b = splitKey(y); return a[0] === b[0] ? a[1] - b[1] : a[0] < b[0] ? -1 : 1; });
	parts.push(`"left":{${left.length ? '\n' + left.map((k) => JSON.stringify(k) + ':' + JSON.stringify(ledger.left[k])).join(',\n') + '\n' : ''}},`);
	const letters = lettersOf(ledger);
	parts.push('"keys":{' + letters.map((l) => {
		const keys = ledger.keys[l] || {};
		const ns = Object.keys(keys).map(Number).sort((a, b) => a - b);
		return JSON.stringify(l) + ':{\n' + ns.map((n) => JSON.stringify(String(n)) + ':' + JSON.stringify(keys[n])).join(',\n') + '\n}';
	}).join(',\n') + '}}\n');
	return parts.join('\n');
}

/** The catalogues a ledger names, parsed: { letter: catalogue }, a missing file left out. */
export function readCatalogues(ledger) {
	const cats = {};
	for (const l of lettersOf(ledger)) {
		const f = catalogueFile(ledger.catalogues[l]);
		if (fs.existsSync(f)) cats[l] = JSON.parse(fs.readFileSync(f, 'utf8'));
	}
	return cats;
}

/** The producer files' entries merged: { key: producer }, with a second mapping of one key a failure. */
function entriesOf(files) {
	const map = {};
	const failures = [];
	for (const { file, data } of files) for (const [k, p] of Object.entries((data && data.entries) || {})) {
		if (map[k] && map[k] !== p) failures.push(`entry ${k}: given to ${map[k]} and, in ${path.basename(file)}, to ${p}`);
		else map[k] = p;
	}
	return { map, failures };
}

/* ---------- the command ---------- */

function main() {
	const args = process.argv.slice(2);
	const fail = (msg) => { console.error('carry-winelist: ' + msg); process.exit(1); };
	if (args.includes('--help') || args.includes('-h')) {
		console.log(`carry-winelist.mjs: the stable keys of the wine list's entries, in ${REL(LEDGER)}.

  --init <date>               a ledger of the one catalogue research/winelist-<date>.json
  --to <date>                 carry the current catalogue onto research/winelist-<date>.json
  --rule <from>:<to>:<why>    with --to: carry the key <from> onto row <to> of <date> (repeatable)
  --migrate                   the producer files' bare entry numbers become keys of the first catalogue
  --ledger <file>             another ledger (default ${REL(LEDGER)})
  --producers <a,b,...>       the producer files (default every producers-*.json in ${REL(PRODUCERS_DIR)})
  --against <list file>       the proof's reference (default ${REL(SHIPPED_LIST)})
  --dry                       report, write nothing
  --help                      this text

With no command: the ledger checked and the proof printed.`);
		process.exit(0);
	}
	const valued = ['--init', '--to', '--rule', '--ledger', '--producers', '--against'];
	const flags = ['--migrate', '--dry'];
	const opt = { rules: [] };
	for (let i = 0; i < args.length; i++) {
		const a = args[i];
		if (!valued.includes(a) && !flags.includes(a)) fail(`unknown argument ${a}; see --help`);
		if (valued.includes(a)) {
			if (i + 1 >= args.length || args[i + 1].startsWith('--')) fail(`${a} needs a value; see --help`);
			if (a === '--rule') opt.rules.push(args[++i]); else opt[a] = args[++i];
		} else opt[a] = true;
	}
	if (opt.rules.length && !opt['--to']) fail('--rule goes with --to');
	if ([opt['--init'], opt['--to'], opt['--migrate']].filter(Boolean).length > 1) fail('one of --init, --to and --migrate at a time');
	for (const d of [opt['--init'], opt['--to']]) if (d && !/^\d{4}-\d{2}-\d{2}$/.test(d)) fail(`${d}: a date is YYYY-MM-DD`);
	const ledgerFile = path.resolve(opt['--ledger'] || LEDGER);
	const dry = !!opt['--dry'];
	const producerFiles = opt['--producers'] ? opt['--producers'].split(',').map((f) => path.resolve(f.trim())).filter(Boolean)
		: fs.readdirSync(PRODUCERS_DIR).filter((f) => /^producers-[a-z]+\.json$/.test(f)).sort().map((f) => path.join(PRODUCERS_DIR, f));
	const read = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (err) { return fail(`${REL(f)}: does not parse as JSON (${err.message})`); } };

	let ledger = null;
	if (opt['--init']) {
		if (fs.existsSync(ledgerFile) && !dry) fail(`${REL(ledgerFile)} exists; --init starts a ledger, it never replaces one`);
		const f = catalogueFile(opt['--init']);
		if (!fs.existsSync(f)) fail(`${REL(f)}: no such catalogue; run parse-winelist.mjs --date ${opt['--init']}`);
		const cat = read(f);
		ledger = { format: LEDGER_FORMAT, version: LEDGER_VERSION, catalogues: { a: opt['--init'] }, current: 'a', rulings: [], left: {}, keys: { a: Object.fromEntries(cat.entries.map((e) => [e.n, 'a' + e.n])) } };
		console.log(`carry-winelist: a ledger of catalogue a (${opt['--init']}), ${cat.entries.length} keys a1 to a${cat.entries.length}`);
	} else {
		if (!fs.existsSync(ledgerFile)) fail(`${REL(ledgerFile)}: no ledger; start one with --init <date>`);
		ledger = read(ledgerFile);
	}

	if (opt['--to']) {
		const date = opt['--to'];
		const f = catalogueFile(date);
		if (!fs.existsSync(f)) fail(`${REL(f)}: no such catalogue; run parse-winelist.mjs --date ${date}`);
		let letters = lettersOf(ledger);
		let to = letters.find((l) => ledger.catalogues[l] === date);
		if (to && to !== ledger.current) fail(`${date} is catalogue ${to}, older than the current ${ledger.current}; only the current one is carried again`);
		if (!to) {
			if (date <= ledger.catalogues[ledger.current]) fail(`${date} is not later than the current catalogue (${ledger.catalogues[ledger.current]})`);
			to = LETTERS[letters.length];
			ledger.catalogues[to] = date;
			letters = lettersOf(ledger);
		}
		const from = letters[letters.indexOf(to) - 1];
		if (!from) fail(`${date} is the first catalogue; nothing to carry from`);
		/* Carrying the current catalogue again starts from the ledger as it stood before it: its own
		   keys are dropped and the carry works from the keys of the catalogues before (leftAt). */
		delete ledger.keys[to];
		for (const raw of opt.rules) {
			const m = /^([a-z][1-9]\d*):([1-9]\d*):(.+)$/.exec(raw);
			if (!m) fail(`--rule ${raw}: write <from>:<to>:<why>, for instance a276:274:the format tail read at last`);
			ledger.rulings = (ledger.rulings || []).filter((r) => !(r.catalogue === to && r.from === m[1]));
			ledger.rulings.push({ catalogue: to, from: m[1], to: Number(m[2]), why: m[3].trim() });
		}
		ledger.rulings = (ledger.rulings || []).slice().sort((a, b) => (a.catalogue === b.catalogue ? a.to - b.to : a.catalogue < b.catalogue ? -1 : 1));
		const cats = readCatalogues(ledger);
		const r = carry(ledger, cats, from, to, ledger.rulings.filter((x) => x.catalogue === to));
		if (r.failures.length) fail(`${r.failures.length} problem(s), nothing written:\n  ` + r.failures.join('\n  '));
		ledger.keys[to] = r.keys;
		ledger.left = r.left;
		ledger.current = to;
		const kinds = {};
		for (const p of r.pairs) kinds[p.kind] = (kinds[p.kind] || 0) + 1;
		const glass = (e) => e.section === 'By the Glass';
		console.log(`carry-winelist: ${from} (${ledger.catalogues[from]}, ${cats[from].entries.length} entries) onto ${to} (${date}, ${cats[to].entries.length} entries): ${r.pairs.length} keys carried, ${r.minted.length} new, ${Object.values(r.left).filter((l) => l === from).length} left with ${from}`);
		for (const [k, c] of Object.entries(kinds)) console.log(`  carried ${k}: ${c} (${r.pairs.filter((p) => p.kind === k && glass(p.n)).length} by the glass)`);
		const show = (e) => `${e.n} ${e.name} ${e.vintage} ${e.size} bin ${e.bin || 'none'} $${e.price} [${[e.section, e.group, e.sub].filter(Boolean).join(' / ')}]`;
		const differ = r.pairs.filter((p) => p.kind !== 'identical' || p.o.name !== p.n.name);
		console.log(`  ${differ.length} carried pair(s) not identical:`);
		for (const p of differ) console.log(`    ${p.key} (${p.kind}${p.why ? ': ' + p.why : ''}): ${show(p.o)}  =>  ${show(p.n)}`);
		const leftNow = Object.keys(r.left).filter((k) => r.left[k] === from);
		console.log(`  ${leftNow.length} key(s) left with ${from}:`);
		for (const k of leftNow) { const n = Object.keys(ledger.keys[from]).find((x) => ledger.keys[from][x] === k); const e = cats[from].entries.find((x) => x.n === Number(n)); console.log(`    ${k}: ${show(e)}`); }
		const problems = ledgerProblems(ledger, cats);
		if (problems.length) fail(`the carried ledger fails its own check, nothing written:\n  ` + problems.join('\n  '));
	}

	if (opt['--migrate']) {
		const first = lettersOf(ledger)[0];
		let changed = 0;
		for (const f of producerFiles) {
			const text = fs.readFileSync(f, 'utf8');
			const data = JSON.parse(text);
			const entries = {};
			let here = 0;
			for (const [k, p] of Object.entries(data.entries || {})) {
				if (/^[1-9]\d*$/.test(k)) { entries[first + k] = p; here++; } else entries[k] = p;
			}
			const dup = Object.keys(data.entries || {}).filter((k) => /^[1-9]\d*$/.test(k) && (first + k) in (data.entries || {}));
			if (dup.length) fail(`${REL(f)}: both ${dup[0]} and ${first + dup[0]} are mapped; settle which by hand`);
			changed += here;
			console.log(`carry-winelist: ${REL(f)}: ${here} bare entr${here === 1 ? 'y' : 'ies'} keyed ${first}<n>${here ? '' : ' (already migrated)'}`);
			if (here && !dry) fs.writeFileSync(f, JSON.stringify({ ...data, entries }, null, 1) + '\n');
		}
		if (dry && changed) console.log('carry-winelist: (dry) nothing written; the proof below reads the files as they stand');
	}

	/* The ledger's own check and the proof. */
	const cats = readCatalogues(ledger);
	const problems = ledgerProblems(ledger, cats);
	if (problems.length) fail(`${REL(ledgerFile)}: ${problems.length} problem(s):\n  ` + problems.slice(0, 40).join('\n  '));
	const files = producerFiles.map((file) => ({ file, data: read(file) }));
	const em = entriesOf(files);
	if (em.failures.length) fail(em.failures.join('\n  '));
	const against = path.resolve(opt['--against'] || SHIPPED_LIST);
	if (fs.existsSync(against)) {
		const ref = read(against);
		const letter = lettersOf(ledger).find((l) => ledger.catalogues[l] === ref.readOn);
		if (!letter) fail(`${REL(against)}: read on ${ref.readOn}, which no catalogue of the ledger is`);
		const keys = ledger.keys[letter];
		const live = new Set(Object.values(ledger.keys[ledger.current]));
		const bare = files.some((f) => Object.keys(f.data.entries || {}).some((k) => /^[1-9]\d*$/.test(k)));
		let kept = 0;
		let standing = 0;
		const lost = [];
		for (const row of ref.entries || []) {
			const key = keys[row[0]];
			const mine = em.map[key] || (bare && letter === lettersOf(ledger)[0] ? em.map[String(row[0])] : '');
			if (mine !== row[7]) { lost.push(`row ${row[0]} (${row[3]} ${row[4]}): the list file gives ${row[7] || 'none'}, the producer files give ${key} ${mine || 'none'}`); continue; }
			kept++;
			if (live.has(key)) standing++;
		}
		if (lost.length) fail(`the proof fails: ${lost.length} row(s) of ${REL(against)} lose their producer:\n  ` + lost.slice(0, 30).join('\n  '));
		console.log(`carry-winelist: proof: all ${kept} rows of ${REL(against)} (catalogue ${letter}, ${ref.readOn}) resolve through their keys to the producer the file gives; ${standing} of them are printed by catalogue ${ledger.current} (${ledger.catalogues[ledger.current]}) and keep it there, ${kept - standing} left the list${bare ? ' (the producer files are not migrated yet: bare numbers read as catalogue ' + lettersOf(ledger)[0] + ')' : ''}`);
	} else console.log(`carry-winelist: note: ${REL(against)} is missing, so the proof is skipped`);
	const cur = ledger.keys[ledger.current];
	const first = lettersOf(ledger)[0];
	const unmapped = Object.keys(cur).map(Number).sort((a, b) => a - b).filter((n) => !em.map[cur[n]] && !(splitKey(cur[n])[0] === first && em.map[String(splitKey(cur[n])[1])]));
	const curCat = cats[ledger.current];
	console.log(`carry-winelist: ${unmapped.length} row(s) of catalogue ${ledger.current} whose key no producer file maps${unmapped.length ? ':' : ''}`);
	for (const n of unmapped) { const e = curCat.entries.find((x) => x.n === n); console.log(`    ${cur[n]} (row ${n}): ${e.name} ${e.vintage} ${e.size} bin ${e.bin || 'none'} $${e.price}`); }
	if (!dry && (opt['--init'] || opt['--to'])) fs.writeFileSync(ledgerFile, ledgerText(ledger));
	console.log(`carry-winelist: ${dry ? '(dry, not written) ' : ''}${REL(ledgerFile)}: ${lettersOf(ledger).length} catalogue(s), current ${ledger.current} (${ledger.catalogues[ledger.current]}), ${Object.keys(cur).length} keys live, ${Object.keys(ledger.left || {}).length} left, ${(ledger.rulings || []).length} ruling(s)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
