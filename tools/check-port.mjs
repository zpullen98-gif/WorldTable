#!/usr/bin/env node
/**
 * check-port.mjs: the two generated js/menu-desk.js files say what the
 * TypeScript says.
 *
 *   node tools/check-port.mjs
 *
 * Exits 1 on any difference. Run it after tools/port-desk.mjs, and in any
 * pass that touches src/lib/desk, because a port that is a day older than its
 * source is the three-copies drift again with a generator's name on it.
 *
 * WHAT IS PROVED, in rising order of how quietly it would fail:
 *
 *   1. Each file loads in a BARE vm context, the way the Codex's own gate
 *      loads it (sandbox = {}): no window, no document, no localStorage
 *      touched at load. Then again in a context with a minimal window and a
 *      Map-backed localStorage, the way a wing has them.
 *
 *   2. The globals it leaves behind are exactly the GLOBALS list in
 *      port-desk.mjs, no more and no fewer. A private helper leaking into a
 *      scope shared by fifteen files is the failure the IIFE exists to stop.
 *
 *   3. readMenu on the three fixtures, reReadAs on every row into every kind,
 *      the parseMenuText adapter, readDeskFile over the file's own JSON, the
 *      inbox's five calls against a Map, mintDeskId with a seeded source,
 *      deskFilename and emptyDesk, then the names a wing's screen calls on
 *      its own (deskSource, hashText, priceParts and the desk-share words):
 *      each compared, as JSON, with the same call
 *      into the TypeScript, transpiled to CommonJS in memory and run through
 *      a tiny require. Ids come from the same seeded source on both sides so
 *      a difference is a difference in READING, not in dice; createdAt,
 *      source.at and source.hash are normalised anyway, so a clock or a hash
 *      can never mask one.
 *
 *   4. The two files differ in their first line and nowhere else, and neither
 *      carries an em dash, a double hyphen, or a regex literal with a
 *      character outside ASCII. The publish gate counts the first two across
 *      the built tree; the third is the generator's own promise.
 */
import ts from 'typescript';
import vm from 'node:vm';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GLOBALS, TARGETS, DASH } from './port-desk.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DESK = path.join(ROOT, 'src', 'lib', 'desk');
const FIXTURES = ['commanders-dinner.txt', 'commanders-drinks.txt', 'codex-pdf-list.txt'];
const KINDS = ['dish', 'wine', 'cocktail', 'unsure'];

/**
 * A fixed clock and a fixed random source, the same ones desk-reader.test.ts
 * uses, so ids and stamps agree on both sides. The seed is an argument
 * because two files minted from ONE seed carry the same ids, and a merge of
 * the two makes readDeskFile re-mint the collisions with real dice, which
 * then differ across the realms and read as a port bug that is not there.
 */
const NOW = new Date('2026-09-25T14:02:00.000Z');
function seeded(start = 12345) {
	let s = start;
	return () => {
		s = (s * 1103515245 + 12345) & 0x7fffffff;
		return s / 0x80000000;
	};
}
const source = () => ({ kind: 'paste', at: NOW.toISOString(), reader: 'desk-reader/1', readIn: 'table', hash: 'fixture' });

const fail = [];
const said = [];

/* -------------------------------------------------------------------------
 * The TypeScript, run
 * ---------------------------------------------------------------------- */

/**
 * Each module to CommonJS in memory, evaluated in THIS realm through a
 * require that resolves './desk-x' and './desk/desk-x' to the module already
 * loaded. No build directory, no vitest, no cache to go stale.
 */
function loadTypeScript() {
	const cache = new Map();
	const load = (file) => {
		const key = path.basename(file, '.ts');
		if (cache.has(key)) return cache.get(key).exports;
		const src = readFileSync(file, 'utf8');
		const js = ts.transpileModule(src, {
			fileName: path.basename(file),
			compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, isolatedModules: true }
		}).outputText;
		const mod = { exports: {} };
		cache.set(key, mod);
		const fn = vm.runInThisContext(`(function (exports, require, module) {\n${js}\n})`, { filename: path.basename(file) });
		const require = (spec) => load(path.join(path.dirname(file), spec + '.ts'));
		fn(mod.exports, require, mod);
		return mod.exports;
	};
	const reader = load(path.join(DESK, 'desk-reader.ts'));
	const file = load(path.join(DESK, 'desk-file.ts'));
	const inbox = load(path.join(DESK, 'desk-inbox.ts'));
	const sort = load(path.join(DESK, 'desk-sort.ts'));
	const text = load(path.join(DESK, 'desk-text.ts'));
	const share = load(path.join(DESK, 'desk-share.ts'));
	const adapter = load(path.join(ROOT, 'src', 'lib', 'menu-parse.ts'));
	return {
		readMenu: reader.readMenu,
		reReadAs: reader.reReadAs,
		priceParts: reader.priceParts,
		readDeskFile: file.readDeskFile,
		emptyDesk: file.emptyDesk,
		mintDeskId: file.mintDeskId,
		deskFilename: file.deskFilename,
		deskSource: file.deskSource,
		toParsedDish: file.toParsedDish,
		classify: sort.classify,
		hashText: text.hashText,
		readInName: share.readInName,
		whenRead: share.whenRead,
		roomName: share.roomName,
		deskCounts: share.deskCounts,
		countsLine: share.countsLine,
		handList: share.handList,
		priceInRaw: share.priceInRaw,
		deskInbox: {
			DESK_INBOX_KEY: inbox.DESK_INBOX_KEY,
			write: inbox.writeDeskInbox,
			read: inbox.readDeskInbox,
			share: inbox.deskShare,
			taken: inbox.markDeskTaken,
			clear: inbox.clearDeskInbox
		},
		parseMenuText: adapter.parseMenuText
	};
}

/* -------------------------------------------------------------------------
 * The port, run
 * ---------------------------------------------------------------------- */

/** A Storage the inbox can use, backed by a Map, with the three methods it calls. */
function mapStorage() {
	const m = new Map();
	return {
		getItem: (k) => (m.has(k) ? m.get(k) : null),
		setItem: (k, v) => { m.set(k, String(v)); },
		removeItem: (k) => { m.delete(k); },
		dump: () => [...m.entries()]
	};
}

/** The file evaluated in a fresh context; `seed` is what the context starts with. */
function loadPort(text, label, seed) {
	const ctx = vm.createContext(seed);
	const before = new Set(Object.keys(seed));
	vm.runInContext(text, ctx, { filename: label });
	const added = Object.keys(ctx).filter((k) => !before.has(k)).sort();
	return { ctx, added };
}

/* -------------------------------------------------------------------------
 * Comparing
 * ---------------------------------------------------------------------- */

/** The clock and the hash out of a desk file, so neither can mask a reading difference. */
function normalise(file) {
	if (!file || typeof file !== 'object') return file;
	const out = JSON.parse(JSON.stringify(file));
	if ('createdAt' in out) out.createdAt = '<createdAt>';
	if (out.source && typeof out.source === 'object') {
		out.source.at = '<at>';
		out.source.hash = '<hash>';
	}
	if (out.taken && typeof out.taken === 'object') for (const k of Object.keys(out.taken)) out.taken[k] = '<at>';
	return out;
}

/** Where two JSON strings first part, with a little of each side around it. */
function firstDifference(a, b) {
	let i = 0;
	while (i < a.length && i < b.length && a[i] === b[i]) i++;
	const from = Math.max(0, i - 80);
	return `at char ${i}:\n      ts:   ...${a.slice(from, i + 160)}\n      port: ...${b.slice(from, i + 160)}`;
}

function same(label, tsValue, portValue) {
	const a = JSON.stringify(normalise(tsValue));
	const b = JSON.stringify(normalise(portValue));
	if (a === b) return true;
	fail.push(`${label}: the port and the TypeScript differ ${firstDifference(a, b)}`);
	return false;
}

/* -------------------------------------------------------------------------
 * The checks
 * ---------------------------------------------------------------------- */

function checkOne(target, T) {
	const label = `menu-desk.js (${target.app})`;
	if (!existsSync(target.file)) {
		fail.push(`${label}: ${target.file} does not exist; run node tools/port-desk.mjs`);
		return null;
	}
	const text = readFileSync(target.file, 'utf8');

	/* 4. dashes and regex escapes */
	const dashes = text.match(DASH);
	if (dashes) fail.push(`${label}: carries ${dashes.length} em dash(es) or double hyphen(s)`);
	const sf = ts.createSourceFile(label, text, ts.ScriptTarget.ES2017, true, ts.ScriptKind.JS);
	const walk = (node) => {
		if (ts.isRegularExpressionLiteral(node) && /[^\x00-\x7f]/.test(node.getText(sf))) {
			fail.push(`${label}: a regex literal carries a character outside ASCII: ${node.getText(sf).slice(0, 60)}`);
		}
		ts.forEachChild(node, walk);
	};
	walk(sf);

	/* 1. loads bare, the way the Codex gate loads it */
	let bare;
	try {
		bare = loadPort(text, label, {});
	} catch (e) {
		fail.push(`${label}: does not load in a bare context: ${e.message}`);
		return text;
	}
	/* 2. exactly the promised globals */
	const want = [...GLOBALS].sort();
	if (bare.added.join(',') !== want.join(',')) {
		const extra = bare.added.filter((k) => !want.includes(k));
		const missing = want.filter((k) => !bare.added.includes(k));
		fail.push(`${label}: globals differ from the promise${extra.length ? `; leaked: ${extra.join(', ')}` : ''}${missing.length ? `; missing: ${missing.join(', ')}` : ''}`);
	}
	if (bare.ctx.parseWineText !== bare.ctx.parseMenuText) fail.push(`${label}: parseWineText is not the same function as parseMenuText`);

	/* 1 again, with a window and a localStorage, the way a wing has them */
	const storage = mapStorage();
	let P;
	try {
		P = loadPort(text, label, { window: {}, navigator: {}, localStorage: storage }).ctx;
	} catch (e) {
		fail.push(`${label}: does not load beside a window and localStorage: ${e.message}`);
		return text;
	}

	/* 3. the readings */
	let rows = 0;
	for (const name of FIXTURES) {
		const menu = readFileSync(path.join(DESK, 'fixtures', name), 'utf8');
		const fromTs = T.readMenu(menu, source(), { now: NOW, rand: seeded() });
		const fromPort = P.readMenu(menu, source(), { now: NOW, rand: seeded() });
		if (!same(`readMenu(${name})`, fromTs, fromPort)) continue;
		rows += fromTs.items.length;
		if (fromTs.items.length === 0) fail.push(`readMenu(${name}): read nothing, which cannot be the fixture`);

		/* Every row, read again as every kind. reReadAs keeps the row's id, so
		   its dice never reach the output; the vintage pivot reads the real clock
		   on both sides in the same second. */
		fromTs.items.forEach((item, i) => {
			for (const kind of KINDS) {
				same(`reReadAs(${name} row ${i} "${item.name}", ${kind})`, T.reReadAs(item, kind), P.reReadAs(JSON.parse(JSON.stringify(item)), kind));
			}
		});

		same(`parseMenuText(${name})`, T.parseMenuText(menu), P.parseMenuText(menu));
		const json = JSON.stringify(fromTs);
		same(`readDeskFile(${name})`, T.readDeskFile(json, NOW.getTime()), P.readDeskFile(json, NOW.getTime()));
		same(`readDeskFile(${name}) from the object`, T.readDeskFile(JSON.parse(json), NOW.getTime()), P.readDeskFile(JSON.parse(json), NOW.getTime()));
		same(`toParsedDish(${name})`, fromTs.items.map(T.toParsedDish), fromPort.items.map(P.toParsedDish));

		/* The names a wing's screen calls directly: the source block and its
		   hash (deskSource is compared whole, hash included, because the hash is
		   the whole point of exposing it), the words under the read, and the
		   price guard and the price tokeniser on every row. */
		same(`deskSource(${name})`, T.deskSource('paste', 'ledger', menu, { now: NOW, url: 'https://example.test/menu' }), P.deskSource('paste', 'ledger', menu, { now: NOW, url: 'https://example.test/menu' }));
		same(`hashText(${name})`, T.hashText(menu), P.hashText(menu));
		same(`deskCounts(${name})`, T.deskCounts(fromTs.items, fromTs.unsorted), P.deskCounts(fromPort.items, fromPort.unsorted));
		same(`countsLine(${name})`, T.countsLine(T.deskCounts(fromTs.items, fromTs.unsorted)), P.countsLine(P.deskCounts(fromPort.items, fromPort.unsorted)));
		same(`priceInRaw(${name})`, fromTs.items.map((i) => T.priceInRaw(i.price.printed, i.raw)), fromPort.items.map((i) => P.priceInRaw(i.price.printed, i.raw)));
		same(`priceParts(${name})`, fromTs.items.map((i) => T.priceParts(i.price.printed)), fromPort.items.map((i) => P.priceParts(i.price.printed)));
	}

	/* The words on their own, over the cases desk-share.test.ts pins. */
	{
		const PRICES = ['12', '45.00 / 22.50', 'Glass 8 Bottle 30', '$90 per Person + Optional Wine Pairing ($40)', 'MP', '', '6/9', '£ 12', '14 GBP', 'market price'];
		same('priceParts', PRICES.map(T.priceParts), PRICES.map(P.priceParts));
		same('hashText (folded whitespace)', [T.hashText(''), T.hashText('a  b\n c'), T.hashText('a b c')], [P.hashText(''), P.hashText('a  b\n c'), P.hashText('a b c')]);
		same('readInName', ['table', 'codex', 'ledger'].map(T.readInName), ['table', 'codex', 'ledger'].map(P.readInName));
		same('roomName', ['wine', 'cocktail'].map(T.roomName), ['wine', 'cocktail'].map(P.roomName));
		const STAMPS = ['2026-09-25T14:02:00.000Z', '2026-09-24T09:15:00.000Z', '2026-09-03T20:40:00.000Z', 'not a date'];
		same('whenRead', STAMPS.map((s) => T.whenRead(s, NOW)), STAMPS.map((s) => P.whenRead(s, NOW)));
		const HANDS = [[9, 4], [9, 0], [0, 1], [1, 1], [0, 0]];
		same('handList', HANDS.map(([w, c]) => T.handList(w, c)), HANDS.map(([w, c]) => P.handList(w, c)));
		same('countsLine (empty)', T.countsLine(T.deskCounts([], [])), P.countsLine(P.deskCounts([], [])));
		same('priceInRaw', [T.priceInRaw('', 'x'), T.priceInRaw('45.00 / 22.50', 'Ployez\n45.00 /  22.50'), T.priceInRaw('12', 'Soup 9.50')], [P.priceInRaw('', 'x'), P.priceInRaw('45.00 / 22.50', 'Ployez\n45.00 /  22.50'), P.priceInRaw('12', 'Soup 9.50')]);
	}

	/* The inbox, against two Maps that must end up holding the same JSON. */
	{
		const a = mapStorage();
		const b = mapStorage();
		const drinks = readFileSync(path.join(DESK, 'fixtures', 'commanders-drinks.txt'), 'utf8');
		const dinner = readFileSync(path.join(DESK, 'fixtures', 'commanders-dinner.txt'), 'utf8');
		const later = NOW.getTime() + 60_000;
		const file1 = (E) => E.readMenu(drinks, source(), { now: NOW, rand: seeded() });
		const file2 = (E) => E.readMenu(dinner, { ...source(), at: new Date(later).toISOString() }, { now: new Date(later), rand: seeded(99991) });
		same('deskInbox.DESK_INBOX_KEY', T.deskInbox.DESK_INBOX_KEY, P.deskInbox.DESK_INBOX_KEY);
		same('deskInbox.read (empty)', T.deskInbox.read(a, NOW.getTime()), P.deskInbox.read(b, NOW.getTime()));
		same('deskInbox.write (first)', T.deskInbox.write(file1(T), a, NOW.getTime()), P.deskInbox.write(file1(P), b, NOW.getTime()));
		same('deskInbox.write (merge)', T.deskInbox.write(file2(T), a, later), P.deskInbox.write(file2(P), b, later));
		const readA = T.deskInbox.read(a, later);
		const readB = P.deskInbox.read(b, later);
		same('deskInbox.read (merged)', readA, readB);
		for (const kind of ['dish', 'wine', 'cocktail']) same(`deskInbox.share(${kind})`, T.deskInbox.share(readA, kind), P.deskInbox.share(readB, kind));
		same('deskInbox.taken(wine)', T.deskInbox.taken('wine', a, later), P.deskInbox.taken('wine', b, later));
		same('deskInbox.share(wine) after taken', T.deskInbox.share(T.deskInbox.read(a, later), 'wine'), P.deskInbox.share(P.deskInbox.read(b, later), 'wine'));
		same('storage after taken', a.dump(), b.dump());
		T.deskInbox.clear(a);
		P.deskInbox.clear(b);
		same('storage after clear', a.dump(), b.dump());
		same('deskInbox.read (expired)', T.deskInbox.read(a, later + 31 * 24 * 60 * 60 * 1000), P.deskInbox.read(b, later + 31 * 24 * 60 * 60 * 1000));
	}

	same('mintDeskId', T.mintDeskId(['k-00000000'], seeded()), P.mintDeskId(['k-00000000'], seeded()));
	same('deskFilename', T.deskFilename(NOW), P.deskFilename(NOW));
	same('emptyDesk', T.emptyDesk(source(), NOW), P.emptyDesk(source(), NOW));
	same('classify', T.classify({ name: 'Kiss the Crab', headings: ['Tasting Menu'], body: ['Zacapa No. 23 Solera, banana oleosacrum, dry vermouth, orange peel'], pourLabelled: false, vintage: '', bin: '' }),
		P.classify({ name: 'Kiss the Crab', headings: ['Tasting Menu'], body: ['Zacapa No. 23 Solera, banana oleosacrum, dry vermouth, orange peel'], pourLabelled: false, vintage: '', bin: '' }));
	same('parseMenuText total', [T.parseMenuText(''), T.parseMenuText(null), T.parseMenuText('9.50'), T.parseMenuText('(v)')],
		[P.parseMenuText(''), P.parseMenuText(null), P.parseMenuText('9.50'), P.parseMenuText('(v)')]);

	said.push(`${label}: loads bare and beside a window, exposes ${bare.added.length} globals and nothing else, reads ${rows} rows off the three fixtures as the TypeScript does`);
	return text;
}

function main() {
	const T = loadTypeScript();
	const texts = TARGETS.map((t) => checkOne(t, T));
	if (texts.every(Boolean)) {
		const [a, b] = texts.map((t) => t.split('\n'));
		if (a[0] === b[0]) fail.push('the two files share a first line, so neither names its app');
		else if (a.slice(1).join('\n') !== b.slice(1).join('\n')) {
			const at = a.slice(1).findIndex((line, i) => line !== b[i + 1]);
			fail.push(`the two files differ past their first line, first at line ${at + 2}:\n      ledger: ${a[at + 1]}\n      codex:  ${b[at + 1]}`);
		} else said.push(`the ${TARGETS.map((t) => t.app).join(' and ')} copies differ in their first line and nowhere else (${a.length} lines)`);
	}

	console.log('\n  Checking the Menu Desk port against its TypeScript\n');
	for (const s of said) console.log('  ok  ' + s);
	if (fail.length) {
		console.log('');
		for (const f of fail.slice(0, 40)) console.log('  x   ' + f);
		if (fail.length > 40) console.log(`  ... and ${fail.length - 40} more`);
		console.log(`\n  check-port: FAIL (${fail.length})\n`);
		process.exit(1);
	}
	console.log('\n  check-port: OK\n');
}

main();
