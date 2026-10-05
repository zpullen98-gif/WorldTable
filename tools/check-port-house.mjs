#!/usr/bin/env node
/**
 * check-port-house.mjs: the generated static/shared/oot-house.js says what
 * the TypeScript under src/lib/house says.
 *
 *   node tools/check-port-house.mjs
 *
 * Exits 1 on any difference. Run it after tools/port-house.mjs and in any
 * pass that touches src/lib/house, because a port that is a day older than
 * its source is a second House engine with a generator's name on it.
 * src/lib/port.test.ts spawns it, so npm test runs it too.
 *
 * WHAT IS PROVED, in rising order of how quietly it would fail:
 *
 *   1. The file: it parses as a classic script, carries no dash in any
 *      spelling, no carriage return, no address (no "http" outside the
 *      video scheme's one declaration, port-house.mjs namesAddress), and no regex
 *      literal with a character outside ASCII.
 *
 *   2. Loading: in a BARE vm context (no window) it adds OOT and nothing
 *      else; beside a window with no IndexedDB it installs OOT.house over
 *      the Map store with house.volatile true, and OOT.houseLib with every
 *      name port-house.mjs promises; beside a window that offers an
 *      indexedDB it is not volatile and touches the database not at all at
 *      load; loaded twice it leaves the first install standing.
 *
 *   3. Parity: the fixture through readPack, normaliseHouse (as it is and
 *      damaged: stray keys, bad ids, a numeric price), validateHouse (with
 *      and without a source text), mergeHouse (with itself and with a
 *      changed copy), syncIn for all three adapters (a projection written
 *      by syncOut, a changed projection, no rows, an empty house), the
 *      drills over a widened copy for twenty seeds, a tasting as printed
 *      (its subtitle, a choice of, the printed lines, the pour labels and a
 *      flash card per course), the lines, mintId, and
 *      the whole api over a Map through import, mark, card, put, sync,
 *      removeItem and buildPack: each compared, as JSON, with the same call
 *      into the TypeScript, transpiled to CommonJS in memory and run
 *      through a tiny require, the way check-port.mjs does for the Menu
 *      Desk. The clock and the dice are fixed on both sides, so a
 *      difference is a difference in the ENGINE, not in time or chance.
 */
import ts from 'typescript';
import vm from 'node:vm';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADAPTERS, CONSTANTS, DASH, DRILLS, DRILL_CONSTANTS, GRADERS, LIB, MODULES, TARGET, namesAddress } from './port-house.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HOUSE = path.join(ROOT, 'src', 'lib', 'house');
const FIXTURE = path.join(HOUSE, 'fixtures', 'house-min.json');

/** @typedef {Record<string, any>} Engine */

/* The characters the material needs, built from code points so this file
   itself carries no dash and no character outside ASCII. */
const EM_DASH = String.fromCharCode(0x2014);
const EN_DASH = String.fromCharCode(0x2013);
const DOUBLE = '-' + '-';
const CURLY = String.fromCharCode(0x2019);
const E_GRAVE = String.fromCharCode(0xe8);
const CAFE = 'Caf' + String.fromCharCode(0xe9);

/** A fixed clock, as a number and as a function, so stamps agree on both sides. */
const NOW = Date.parse('2026-10-03T14:02:00.000Z');
const LATER = NOW + 60_000;

/**
 * A fixed random source, the one the house tests use, so ids and draws
 * agree on both sides.
 * @param {number} [start]
 * @returns {() => number}
 */
function seeded(start = 12345) {
	let s = start;
	return () => {
		s = (s * 1103515245 + 12345) & 0x7fffffff;
		return s / 0x80000000;
	};
}

/** @type {string[]} */
const fail = [];
/** @type {string[]} */
const said = [];

/* -------------------------------------------------------------------------
 * The TypeScript, run
 * ---------------------------------------------------------------------- */

/**
 * Each module to CommonJS in memory, evaluated in THIS realm through a
 * require that resolves './house-x' to the module already loaded. No build
 * directory, no vitest, no cache to go stale. Every export of every module
 * lands on one object, the way the port's door gathers them.
 * @returns {Engine}
 */
function loadTypeScript() {
	/** @type {Map<string, { exports: Record<string, any> }>} */
	const cache = new Map();
	/** @param {string} file @returns {Record<string, any>} */
	const load = (file) => {
		const key = path.basename(file, '.ts');
		const hit = cache.get(key);
		if (hit) return hit.exports;
		const src = readFileSync(file, 'utf8');
		const js = ts.transpileModule(src, {
			fileName: path.basename(file),
			compilerOptions: { target: ts.ScriptTarget.ES2017, module: ts.ModuleKind.CommonJS, isolatedModules: true }
		}).outputText;
		const mod = { exports: /** @type {Record<string, any>} */ ({}) };
		cache.set(key, mod);
		const fn = vm.runInThisContext(`(function (exports, require, module) {\n${js}\n})`, { filename: path.basename(file) });
		/** @param {string} spec */
		const require = (spec) => load(path.join(path.dirname(file), spec + '.ts'));
		fn(mod.exports, require, mod);
		return mod.exports;
	};
	/** @type {Engine} */
	const all = {};
	for (const name of MODULES) Object.assign(all, load(path.join(HOUSE, name + '.ts')));
	return all;
}

/* -------------------------------------------------------------------------
 * The port, run
 * ---------------------------------------------------------------------- */

/**
 * The file evaluated in a fresh context; `seed` is what the context starts
 * with. With `asWindow` the context stands as its own window, the way a
 * wing has it.
 * @param {string} text
 * @param {Record<string, unknown>} seed
 * @param {boolean} asWindow
 */
function loadPort(text, seed, asWindow) {
	/** @type {Record<string, any>} */
	const sandbox = { setTimeout };
	/* By descriptor, not by spread: a seed may carry a getter that throws on the touch, which is the case under test. */
	Object.defineProperties(sandbox, Object.getOwnPropertyDescriptors(seed));
	if (asWindow) sandbox.window = sandbox;
	const before = new Set(Object.keys(sandbox));
	vm.createContext(sandbox);
	vm.runInContext(text, sandbox, { filename: 'oot-house.js' });
	const added = Object.keys(sandbox).filter((k) => !before.has(k)).sort();
	return { ctx: sandbox, added };
}

/**
 * The port's names flattened the way loadTypeScript flattens the modules:
 * the lib, its adapters, its drills and its constants on one object.
 * @param {Record<string, any>} lib OOT.houseLib
 * @returns {Engine}
 */
function flatten(lib) {
	/** @type {Engine} */
	const out = {};
	for (const [k, v] of Object.entries(lib)) if (k !== 'adapters' && k !== 'drills' && k !== 'constants') out[k] = v;
	Object.assign(out, lib.adapters, lib.drills, lib.constants);
	return out;
}

/* -------------------------------------------------------------------------
 * Comparing
 * ---------------------------------------------------------------------- */

/**
 * Where two JSON strings first part, with a little of each side around it.
 * @param {string} a @param {string} b
 */
function firstDifference(a, b) {
	let i = 0;
	while (i < a.length && i < b.length && a[i] === b[i]) i++;
	const from = Math.max(0, i - 80);
	return `at char ${i}:\n      ts:   ...${a.slice(from, i + 160)}\n      port: ...${b.slice(from, i + 160)}`;
}

/**
 * A value as JSON with a regex spelled out, since JSON would read one as {}.
 * @param {unknown} v
 */
function asJson(v) {
	/* By its tag, not instanceof: the port's regexes were made in another realm. */
	return JSON.stringify(v, (_k, x) => (Object.prototype.toString.call(x) === '[object RegExp]' ? `/${x.source}/${x.flags}` : x));
}

/**
 * A value as JSON with every object's keys sorted, for the one comparison
 * where the order is not the point: the normaliser rebuilds a record in the
 * schema's order, and the fixture is written in its own.
 * @param {unknown} v
 * @returns {unknown}
 */
function sortedKeys(v) {
	if (Array.isArray(v)) return v.map(sortedKeys);
	if (v && typeof v === 'object') {
		/** @type {Record<string, unknown>} */
		const out = {};
		for (const k of Object.keys(v).sort()) out[k] = sortedKeys(/** @type {Record<string, unknown>} */ (v)[k]);
		return out;
	}
	return v;
}

/**
 * @param {string} label
 * @param {unknown} tsValue
 * @param {unknown} portValue
 */
function same(label, tsValue, portValue) {
	const a = asJson(tsValue);
	const b = asJson(portValue);
	if (a === b) return true;
	fail.push(`${label}: the port and the TypeScript differ ${firstDifference(a, b)}`);
	return false;
}

/** @param {unknown} v */
const clone = (v) => JSON.parse(JSON.stringify(v));

/* -------------------------------------------------------------------------
 * The material
 * ---------------------------------------------------------------------- */

/** The fixture as a pack. @param {unknown} house */
const packOf = (house) => ({ format: 'oot-house-pack', version: 1, exportedAt: new Date(NOW).toISOString(), app: { from: 'tools' }, house });

/**
 * The fixture with the damage the normaliser exists to undo: a stray key
 * at every depth, a bad id, a duplicate id, a numeric price, a mark with
 * the wrong by, a numeric string stamp.
 * @param {any} fixture
 */
function damaged(fixture) {
	const h = clone(fixture);
	h.allergens = ['none'];
	h.dishes[0].allergens = ['none'];
	h.dishes[0].contains = 'x';
	h.dishes[0].price = 24;
	h.dishes[0].say = { value: 'Said.', by: 'nobody', ts: '1790000000000', model: 7 };
	if (h.dishes[0].parts && h.dishes[0].parts.value) h.dishes[0].parts.value.nutFree = 'yes';
	h.dishes[1].id = 'bad id:here';
	h.wines[0].grapes = 'Chardonnay, Pinot Noir';
	if (h.cocktails[1]) h.cocktails[1].id = h.cocktails[0].id;
	h.lexicon.push({ id: 'x-', term: 'A term with no id', say: '', toGuest: '', itemIds: [], ts: NOW });
	return h;
}

/**
 * The fixture with the bottle list in it: four wines on the list 'bottle'
 * (a value, a sweet spot, a celebration and a half bottle, each with a bin
 * and a size), the chicken's pairing carrying all four tiers, one more tier
 * that breaks every rule it can (a glass wine, a bottle out of its band, a
 * why over the cap, a half that is not a half, no line to say), and a
 * stray key inside a tier for the normaliser to drop.
 * @param {any} fixture
 */
function bottled(fixture) {
	const h = clone(fixture);
	const base = h.wines[0];
	const bottle = (/** @type {string} */ id, /** @type {string} */ name, /** @type {string} */ price, /** @type {string} */ bin, /** @type {string} */ size) =>
		Object.assign(clone(base), { id, name, wine: name, glass: '', bottle: price, price, list: 'bottle', bin, size, ts: NOW });
	h.wines.push(
		bottle('w-bvalue01', 'Quay Lane Value Red', '$68', '1101', '750ml'),
		bottle('w-bclass01', 'Quay Lane Reserve', '$140', '1102', '750ml'),
		bottle('w-bsplur01', 'Quay Lane Grand Vin', '$1,250', '1103', '750ml'),
		bottle('w-bhalf001', 'Quay Lane Half', '$54', '1104', '375 ml')
	);
	const pick = (/** @type {string} */ wineId) => ({ wineId, why: 'It meets the roast with the same weight.', sayIt: 'This one sits right beside the chicken.' });
	const p = h.dishes[0].pairing.value;
	p.bottles = { value: pick('w-bvalue01'), classic: pick('w-bclass01'), splurge: Object.assign(pick('w-bsplur01'), { allergens: 'x' }), half: pick('w-bhalf001'), magnum: pick('w-bvalue01') };
	return h;
}

/** The bottled fixture with every tier wrong in its own way. @param {any} h */
function badTiers(h) {
	const b = clone(h);
	const p = b.dishes[0].pairing.value;
	p.bottles.value.wineId = b.wines[0].id;
	p.bottles.classic.wineId = 'w-bsplur01';
	p.bottles.splurge.why = Array.from({ length: 30 }, (_, i) => 'word' + i).join(' ');
	p.bottles.half.wineId = 'w-bvalue01';
	p.bottles.half.sayIt = '';
	b.dishes[1].pairing = { value: Object.assign(clone(p), { bottles: { value: { wineId: 'w-nowhere1', why: 'a', sayIt: 'b' } } }), by: 'maitre', ts: NOW };
	return b;
}

/**
 * The fixture widened so the drills deal: every item of the five drilled
 * lists copied twice more under a fresh id and a suffixed name, every
 * reference kept, so the pools pass their floors.
 * @param {any} fixture
 * @param {Engine} T
 */
function widened(fixture, T) {
	const h = clone(fixture);
	const rand = seeded(777);
	const taken = new Set();
	for (const list of ['dishes', 'wines', 'cocktails', 'lexicon', 'mixUps']) for (const it of h[list]) taken.add(it.id);
	for (const list of ['dishes', 'wines', 'cocktails', 'lexicon', 'mixUps']) {
		const base = h[list].slice();
		for (let n = 2; n <= 3; n++) {
			for (const it of base) {
				const copy = clone(it);
				copy.id = T.mintId(it.id.slice(0, 2), taken, rand);
				taken.add(copy.id);
				if (typeof copy.name === 'string') copy.name = `${copy.name} ${n}`;
				if (typeof copy.term === 'string') copy.term = `${copy.term} ${n}`;
				if (typeof copy.wine === 'string') copy.wine = `${copy.wine} ${n}`;
				if (typeof copy.glass === 'string') copy.glass = `${copy.glass} ${n}`;
				if (typeof copy.spec === 'string') copy.spec = `${copy.spec} ${n}`;
				if (Array.isArray(copy.grapes)) copy.grapes = copy.grapes.map((/** @type {string} */ g) => `${g} ${n}`);
				for (const k of Object.keys(copy)) {
					const m = copy[k];
					if (m && typeof m === 'object' && !Array.isArray(m) && typeof m.value === 'string') m.value = `${m.value} ${n}`;
				}
				h[list].push(copy);
			}
		}
	}
	return h;
}

/* -------------------------------------------------------------------------
 * The checks
 * ---------------------------------------------------------------------- */

/**
 * The file rules and the loads.
 * @param {string} text
 * @returns {Engine | null} the port's flattened lib, or null when it cannot load
 */
function checkFile(text) {
	const dashes = text.match(DASH);
	if (dashes) fail.push(`oot-house.js carries ${dashes.length} em dash(es) or double hyphen(s)`);
	if (text.includes('\r')) fail.push('oot-house.js carries a carriage return');
	if (text.includes(EN_DASH)) fail.push('oot-house.js carries an en dash');
	const address = namesAddress(text);
	if (address) fail.push(address);
	if (!text.startsWith('/* Outside Of Time, shared/oot-house.js')) fail.push('oot-house.js does not open with its own first line');
	if (!text.includes('GENERATED by WorldTable/tools/port-house.mjs')) fail.push('oot-house.js does not say it is generated');
	const sf = ts.createSourceFile('oot-house.js', text, ts.ScriptTarget.ES2017, true, ts.ScriptKind.JS);
	/** @param {ts.Node} node */
	const walk = (node) => {
		if (ts.isRegularExpressionLiteral(node) && /[^\x00-\x7f]/.test(node.getText(sf))) {
			fail.push(`oot-house.js: a regex literal carries a character outside ASCII: ${node.getText(sf).slice(0, 60)}`);
		}
		ts.forEachChild(node, walk);
	};
	walk(sf);
	try {
		new vm.Script(text, { filename: 'oot-house.js' });
	} catch (e) {
		fail.push(`oot-house.js does not parse as a script: ${/** @type {Error} */ (e).message}`);
		return null;
	}
	said.push('the file parses, carries no dash, no carriage return, no address and no regex outside ASCII');

	/* Bare: no window at all. */
	let bare;
	try {
		bare = loadPort(text, {}, false);
	} catch (e) {
		fail.push(`oot-house.js does not load in a bare context: ${/** @type {Error} */ (e).message}`);
		return null;
	}
	if (bare.added.join(',') !== 'OOT') fail.push(`a bare load added ${bare.added.join(', ') || 'nothing'}; it should add OOT and nothing else`);

	/* A window with no IndexedDB: the volatile path. */
	let win;
	try {
		win = loadPort(text, {}, true);
	} catch (e) {
		fail.push(`oot-house.js does not load beside a window: ${/** @type {Error} */ (e).message}`);
		return null;
	}
	if (win.added.join(',') !== 'OOT') fail.push(`a load beside a window added ${win.added.join(', ')}; it should add OOT and nothing else`);
	const OOT = win.ctx.OOT;
	if (!OOT || !OOT.house || !OOT.houseLib) {
		fail.push('the port did not install OOT.house and OOT.houseLib');
		return null;
	}
	if (OOT.house.volatile !== true) fail.push('beside a window with no IndexedDB, OOT.house.volatile should be true');
	const wantLib = [...Object.keys(LIB), 'adapters', 'drills', 'constants'].sort();
	const gotLib = Object.keys(OOT.houseLib).sort();
	if (wantLib.join(',') !== gotLib.join(',')) fail.push(`OOT.houseLib carries ${gotLib.join(', ')}; port-house.mjs promises ${wantLib.join(', ')}`);
	const wantAdapters = Object.keys(ADAPTERS).sort().join(',');
	if (Object.keys(OOT.houseLib.adapters).sort().join(',') !== wantAdapters) fail.push('OOT.houseLib.adapters does not carry the promised names');
	const wantDrills = [...DRILLS, ...GRADERS, ...DRILL_CONSTANTS].sort().join(',');
	for (const g of GRADERS) if (OOT.houseLib[g] !== OOT.houseLib.drills[g]) fail.push(`OOT.houseLib.${g} is not the same function as OOT.houseLib.drills.${g}`);
	if (Object.keys(OOT.houseLib.drills).sort().join(',') !== wantDrills) fail.push('OOT.houseLib.drills does not carry the promised names');
	const wantConstants = CONSTANTS.slice().sort().join(',');
	if (Object.keys(OOT.houseLib.constants).sort().join(',') !== wantConstants) fail.push('OOT.houseLib.constants does not carry the promised names');
	for (const [k, v] of Object.entries(flatten(OOT.houseLib))) if (v === undefined) fail.push(`OOT.houseLib.${k} is undefined`);

	/* Loaded twice, the first install stands. */
	const house1 = OOT.house;
	const lib1 = OOT.houseLib;
	vm.runInContext(text, win.ctx, { filename: 'oot-house.js' });
	if (win.ctx.OOT.house !== house1 || win.ctx.OOT.houseLib !== lib1) fail.push('a second load replaced the first install');

	/* A window that offers an indexedDB: not volatile, and the database untouched at load. */
	let opened = 0;
	const factory = { open: () => { opened++; throw new Error('not here'); } };
	const idb = loadPort(text, { indexedDB: factory, localStorage: { getItem: () => null, setItem: () => undefined } }, true);
	if (idb.ctx.OOT.house.volatile !== undefined) fail.push('beside a window with an indexedDB, OOT.house should not be flagged volatile');
	if (opened) fail.push('the port opened the database at load; the api reads only on ready()');
	/* A window whose indexedDB throws on the touch falls to the Map. */
	const again = loadPort(text, { get indexedDB() { throw new Error('private mode'); } }, true);
	if (again.ctx.OOT.house.volatile !== true) fail.push('a window whose indexedDB throws on the touch should fall to the Map store');

	said.push('loads bare (OOT alone), beside a window (volatile over a Map), beside an indexedDB (not volatile, untouched at load), and twice');
	return flatten(OOT.houseLib);
}

/**
 * The parity: every call on both sides, compared as JSON.
 * @param {Engine} T the TypeScript
 * @param {Engine} P the port
 */
function checkParity(T, P) {
	const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8'));
	const packText = JSON.stringify(packOf(fixture));

	/* The constants, regexes spelled out. */
	same('constants', Object.fromEntries(CONSTANTS.map((k) => [k, T[k]])), Object.fromEntries(CONSTANTS.map((k) => [k, P[k]])));
	same('drill constants', Object.fromEntries(DRILL_CONSTANTS.map((k) => [k, T[k]])), Object.fromEntries(DRILL_CONSTANTS.map((k) => [k, P[k]])));

	/* The pack read, as text and as the object. */
	same('readPack(text)', T.readPack(packText, { rand: seeded() }), P.readPack(packText, { rand: seeded() }));
	same('readPack(object)', T.readPack(packOf(clone(fixture)), { rand: seeded() }), P.readPack(packOf(clone(fixture)), { rand: seeded() }));
	same('readPack(damaged)', T.readPack(packOf(damaged(fixture)), { rand: seeded() }), P.readPack(packOf(damaged(fixture)), { rand: seeded() }));
	for (const bad of ['', 'not json', '{}', '[]', JSON.stringify({ format: 'oot-house-pack', version: 2, house: {} }), JSON.stringify({ format: 'oot-house-pack', version: 1 })]) {
		same(`readPack(${JSON.stringify(bad).slice(0, 30)})`, T.readPack(bad), P.readPack(bad));
	}
	same('buildPack', T.buildPack(clone(fixture), 'tools', NOW), P.buildPack(clone(fixture), 'tools', NOW));
	same('packFilename', T.packFilename(fixture, NOW), P.packFilename(fixture, NOW));

	/* The normaliser. */
	const normT = T.normaliseHouse(clone(fixture), { rand: seeded() });
	const normP = P.normaliseHouse(clone(fixture), { rand: seeded() });
	same('normaliseHouse(fixture)', normT, normP);
	if (!same('normaliseHouse(fixture) is the fixture', sortedKeys(fixture), sortedKeys(normT.house))) fail.push('the fixture does not round-trip through the TypeScript normaliser, so the parity above proves less than it should');
	same('normaliseHouse(damaged)', T.normaliseHouse(damaged(fixture), { rand: seeded() }), P.normaliseHouse(damaged(fixture), { rand: seeded() }));
	const NOTHING = [null, {}, 'x', [], 7];
	same('normaliseHouse(nothing)', NOTHING.map((v) => T.normaliseHouse(v, { rand: seeded(3) })), NOTHING.map((v) => P.normaliseHouse(v, { rand: seeded(3) })));
	const MARKS = [
		{ value: 'A line.', by: 'maitre', ts: NOW, model: 'm' },
		{ value: '', by: 'person', ts: NOW },
		{ value: ['a', 'b'], by: 'person', ts: '12', model: 3 },
		{ value: { main: 'x', allergens: 'y' }, by: 'person', ts: NOW },
		{ value: { s10: 'ten', s20: 'twenty', s45: 'forty five' }, by: 'maitre', ts: NOW },
		null,
		'plain'
	];
	for (const kind of ['text', 'list', 'parts', 'lines', 'pairing']) {
		same(`normaliseMark(${kind})`, MARKS.map((m) => T.normaliseMark(clone(m), kind)), MARKS.map((m) => P.normaliseMark(clone(m), kind)));
	}
	same('markKind', ['say', 'parts', 'lines', 'pairing', 'pairs', 'firstPickIds', 'upsells', 'other'].map(T.markKind), ['say', 'parts', 'lines', 'pairing', 'pairs', 'firstPickIds', 'upsells', 'other'].map(P.markKind));
	same('forbiddenKeys', T.forbiddenKeys(damaged(fixture), 'house', []), P.forbiddenKeys(damaged(fixture), 'house', []));

	/* The validator, bare and with a source text. */
	same('validateHouse(fixture)', T.validateHouse(normT.house), P.validateHouse(normP.house));
	const sourceText = 'Lantern Roast Chicken 24\nThe Harbour White glass 9 bottle 36\nThe Harbour Supper 45';
	same('validateHouse(fixture, sourceText)', T.validateHouse(normT.house, { sourceText }), P.validateHouse(normP.house, { sourceText }));
	same('validateHouse(fixture, fatal)', T.validateHouse(normT.house, { fatal: ['proper-noun', 'dash'] }), P.validateHouse(normP.house, { fatal: ['proper-noun', 'dash'] }));
	const dashed = clone(fixture);
	dashed.dishes[0].say.value = 'Roast chicken ' + EM_DASH + ' the hearth one, as they say ' + EN_DASH + ' and more';
	dashed.dishes[0].lines.value.s10 = 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty one two three four five six';
	dashed.dishes[0].guest = { value: 'Ask about allergens before you order.', by: 'maitre', ts: NOW };
	dashed.tastings[0].courses[0].dishIds.push('d-nowhere1');
	same('validateHouse(dashed)', T.validateHouse(T.normaliseHouse(dashed, { rand: seeded() }).house), P.validateHouse(P.normaliseHouse(dashed, { rand: seeded() }).house));
	/* The bottle list and the tiers: read, normalised, validated, merged, renamed. */
	const bot = bottled(fixture);
	same('readPack(bottled)', T.readPack(packOf(clone(bot)), { rand: seeded() }), P.readPack(packOf(clone(bot)), { rand: seeded() }));
	const botT = T.normaliseHouse(clone(bot), { rand: seeded() });
	same('normaliseHouse(bottled)', botT, P.normaliseHouse(clone(bot), { rand: seeded() }));
	if (!botT.house.wines[1] || botT.house.wines[1].list !== 'bottle' || botT.house.wines[1].bin !== '1101') fail.push('normaliseHouse(bottled) did not keep a bottle wine\'s list and bin');
	if (!botT.house.dishes[0].pairing.value.bottles || botT.house.dishes[0].pairing.value.bottles.magnum) fail.push('normaliseHouse(bottled) did not keep the four tiers and drop the stray one');
	same('validateHouse(bottled)', T.validateHouse(botT.house), P.validateHouse(P.normaliseHouse(clone(bot), { rand: seeded() }).house));
	const badT = T.validateHouse(T.normaliseHouse(badTiers(bot), { rand: seeded() }).house);
	same('validateHouse(bad tiers)', badT, P.validateHouse(P.normaliseHouse(badTiers(bot), { rand: seeded() }).house));
	if (!badT.problems.some((/** @type {any} */ x) => x.code === 'tier')) fail.push('validateHouse(bad tiers) found no tier problem');
	const botMoved = clone(bot);
	botMoved.dishes[0].pairing = { value: Object.assign(clone(bot.dishes[0].pairing.value), { bottles: { value: bot.dishes[0].pairing.value.bottles.value } }), by: 'person', ts: NOW + 9 };
	same('mergeHouse(bottled, moved)', T.mergeHouse(clone(bot), clone(botMoved)), P.mergeHouse(clone(bot), clone(botMoved)));
	const renamed = clone(bot);
	renamed.wines[1].id = 'bad id:bottle';
	renamed.dishes[0].pairing.value.bottles.value.wineId = 'bad id:bottle';
	same('normaliseHouse(renamed bottle)', T.normaliseHouse(clone(renamed), { rand: seeded(9) }), P.normaliseHouse(clone(renamed), { rand: seeded(9) }));
	const SIZES = ['375ml', '375 ML', '1.5L', '', '750 ml'];
	same('foldSize', SIZES.map(T.foldSize), SIZES.map(P.foldSize));
	const PRICES = ['$80 half-bottle', '$1,250', '68', 'MP', '', '9 / 38'];
	same('printedDollars', PRICES.map(T.printedDollars), PRICES.map(P.printedDollars));
	const BANDS = [[99, 'value'], [100, 'value'], [100, 'classic'], [250, 'classic'], [251, 'classic'], [251, 'splurge'], [250, 'splurge'], [40, 'half'], [0, 'value']];
	same('inBottleBand', BANDS.map(([n, t]) => T.inBottleBand(t, n)), BANDS.map(([n, t]) => P.inBottleBand(t, n)));
	same('wineListOf', [{}, { list: 'bottle' }, { list: 'glass' }, { list: 'x' }].map(T.wineListOf), [{}, { list: 'bottle' }, { list: 'glass' }, { list: 'x' }].map(P.wineListOf));

	/* The videos: the link rule, a bad link dropped, refs and caps validated, the lists a card and a study view draw, a merge that moves one. */
	const LINKS = ['https://www.youtube.com/watch?v=abc', 'https://youtu.be/abc', 'https://player.vimeo.com/video/1', 'http://www.youtube.com/watch?v=abc', 'https://youtube.com.evil.example/x', 'https://user@youtube.com/x', 'https://www.youtube.com:8080/x', 'javascript:alert(1)', '', 7];
	same('videoUrlOk', LINKS.map(T.videoUrlOk), LINKS.map(P.videoUrlOk));
	const vid = clone(fixture);
	vid.videos.push(Object.assign(clone(fixture.videos[0]), { id: 'v-badlink1', url: 'http://example.org/x' }));
	vid.videos.push(Object.assign(clone(fixture.videos[0]), { id: 'v-house001', house: true, topic: 'The house', itemIds: ['d-nowhere1'], termIds: ['x-nowhere1'], why: 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty one two three four five six' }));
	const vidT = T.normaliseHouse(clone(vid), { rand: seeded() });
	same('normaliseHouse(videos)', vidT, P.normaliseHouse(clone(vid), { rand: seeded() }));
	if (vidT.house.videos.length !== 2 || !vidT.report.some((/** @type {any} */ r) => r.code === 'video')) fail.push('normaliseHouse(videos) did not drop the video with a bad link and say so');
	const vidV = T.validateHouse(vidT.house);
	same('validateHouse(videos)', vidV, P.validateHouse(P.normaliseHouse(clone(vid), { rand: seeded() }).house));
	if (!vidV.problems.some((/** @type {any} */ x) => x.code === 'ref' && x.path.indexOf('videos') >= 0) || !vidV.problems.some((/** @type {any} */ x) => x.code === 'word-cap' && x.path.indexOf('videos') >= 0)) fail.push('validateHouse(videos) named no bad reference or no long why');
	same('videosFor', ['d-chicken1', 'd-beetrt01', 'b-collins1'].map((id) => T.videosFor(vidT.house, id)), ['d-chicken1', 'd-beetrt01', 'b-collins1'].map((id) => P.videosFor(vidT.house, id)));
	same('videoGroups', T.videoGroups(vidT.house), P.videoGroups(vidT.house));
	same('videoMeta', vidT.house.videos.map(T.videoMeta), vidT.house.videos.map(P.videoMeta));
	const vidMoved = clone(vidT.house);
	vidMoved.videos[0] = Object.assign(vidMoved.videos[0], { title: 'Retitled', ts: NOW + 7 });
	vidMoved.videos.splice(1, 1);
	vidMoved.removed = Object.assign({}, vidMoved.removed, { 'v-house001': NOW + 8 });
	same('mergeHouse(videos, moved)', T.mergeHouse(clone(vidT.house), clone(vidMoved)), P.mergeHouse(clone(vidT.house), clone(vidMoved)));
	const bare = clone(fixture);
	delete bare.videos;
	same('mergeHouse(bare, fixture)', T.mergeHouse(clone(bare), clone(fixture)), P.mergeHouse(clone(bare), clone(fixture)));
	same('mergeHouse(bare, bare)', T.mergeHouse(clone(bare), clone(bare)), P.mergeHouse(clone(bare), clone(bare)));

	/* The components and the comparisons: normalised, validated (a bad kind, a third comparison, a long card), the helpers a card reads, the flash cards, a merge and an edition refresh that brings them to a device that had none. */
	const comp = clone(fixture);
	comp.components.push({ id: 'c-story001', kind: 'story', name: 'The quay', itemIds: ['d-chicken1'], termIds: [], ts: NOW });
	same('normaliseHouse(components)', T.normaliseHouse(clone(comp), { rand: seeded() }), P.normaliseHouse(clone(comp), { rand: seeded() }));
	same('componentsFor', ['d-chicken1', 'b-verjus01', 'w-lantern1'].map((id) => T.componentsFor(comp, id)), ['d-chicken1', 'b-verjus01', 'w-lantern1'].map((id) => P.componentsFor(comp, id)));
	same('componentGroups', T.componentGroups(comp, 'd-chicken1'), P.componentGroups(comp, 'd-chicken1'));
	same('componentVideos', T.componentVideos(comp, 'c-saltcrs1'), P.componentVideos(comp, 'c-saltcrs1'));
	same('buildFlashcards(components)', T.buildFlashcards(comp), P.buildFlashcards(comp));
	const compBad = clone(comp);
	compBad.components[0].kind = 'garnish';
	compBad.components[0].card.value.front = 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen';
	compBad.dishes[0].compare.value.push(clone(compBad.dishes[0].compare.value[1]), { app: 'menu', ref: '', label: 'x', same: 'y', different: 'z' });
	compBad.videos[0].componentIds = ['c-nowhere1'];
	const compBadT = T.validateHouse(T.normaliseHouse(clone(compBad), { rand: seeded() }).house);
	same('validateHouse(components)', compBadT, P.validateHouse(P.normaliseHouse(clone(compBad), { rand: seeded() }).house));
	for (const code of ['component', 'compare', 'word-cap', 'ref']) if (!compBadT.problems.some((/** @type {any} */ x) => x.code === code && (x.path.indexOf('omponent') >= 0 || x.path.indexOf('compare') >= 0))) fail.push('validateHouse(components) named no ' + code + ' problem');
	const compMoved = clone(comp);
	compMoved.components[0].card = { value: { front: 'Moved?', back: 'Moved.' }, by: 'person', ts: NOW + 9 };
	compMoved.dishes[0].compare = { value: [{ app: 'classic', ref: '', label: 'Moved', same: 'S', different: 'D' }], by: 'person', ts: NOW + 9 };
	same('mergeHouse(components, moved)', T.mergeHouse(clone(comp), clone(compMoved)), P.mergeHouse(clone(comp), clone(compMoved)));
	const compOld = clone(fixture);
	delete compOld.components;
	delete compOld.dishes[0].compare;
	delete compOld.videos[0].componentIds;
	same('refreshEdition(components arrive)', T.refreshEdition(clone(compOld), clone(fixture)), P.refreshEdition(clone(compOld), clone(fixture)));

	/* The tastings as printed: a subtitle and a supplement, a drink course, a choice of, printed lines and the pour labels, normalised, validated (a choice of one, a label over no pour, a long line), merged, refreshed onto a device that had none, and dealt as one flash card per course. */
	const tast = clone(fixture);
	Object.assign(tast.tastings[0], { line: 'Celebrating the harbour!', supplement: 'Add the Wine Pairing $30.00' });
	tast.tastings[0].courses = [
		{ n: 1, label: 'Welcome Drink', dishIds: [], pourId: 'b-collins1', pourText: 'The Lantern Collins', printed: ['Gin, lemon, soda'] },
		{ n: 2, label: 'First Course', dishIds: ['d-beetrt01', 'd-chicken1'], pourId: 'w-lantern1', pourText: '', choice: true, pourLabel: 'Suggested Pairing' }
	];
	const tastT = T.normaliseHouse(clone(tast), { rand: seeded() });
	same('normaliseHouse(tastings)', tastT, P.normaliseHouse(clone(tast), { rand: seeded() }));
	if (!tastT.house.tastings[0].courses[1].choice || tastT.house.tastings[0].line !== 'Celebrating the harbour!') fail.push('normaliseHouse(tastings) did not keep the choice of and the printed line');
	same('buildFlashcards(tastings)', T.buildFlashcards(tastT.house), P.buildFlashcards(tastT.house));
	if (T.buildFlashcards(tastT.house).filter((/** @type {any} */ c) => c.kind === 'tasting').length !== 2) fail.push('buildFlashcards(tastings) did not deal one card per course');
	const NAMES = [['Traditional Breakfast at Brennan\u2019s', 'Brennan\u2019s'], ["Supper at Brennan's", 'Brennan\u2019s'], ['Dinner Tasting Menu', 'Brennan\u2019s'], ['', 'x']];
	same('tastingShortName', NAMES.map(([n, h]) => T.tastingShortName(n, h)), NAMES.map(([n, h]) => P.tastingShortName(n, h)));
	const tastBad = clone(tast);
	tastBad.tastings[0].courses[1].dishIds = ['d-beetrt01'];
	tastBad.tastings[0].courses.push({ n: 3, label: 'Third Course', dishIds: [], pourId: '', pourText: '', pourLabel: 'Paired with', printed: ['x'] });
	tastBad.tastings[0].line = 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty forty one';
	const tastBadT = T.validateHouse(T.normaliseHouse(clone(tastBad), { rand: seeded() }).house);
	same('validateHouse(tastings)', tastBadT, P.validateHouse(P.normaliseHouse(clone(tastBad), { rand: seeded() }).house));
	for (const code of ['tasting', 'word-cap']) if (!tastBadT.problems.some((/** @type {any} */ x) => x.code === code && x.path.indexOf('tastings') >= 0)) fail.push('validateHouse(tastings) named no ' + code + ' problem');
	same('mergeHouse(fixture, tastings)', T.mergeHouse(clone(fixture), Object.assign(clone(tastT.house), { tastings: [Object.assign(clone(tastT.house.tastings[0]), { ts: NOW + 9 })] })), P.mergeHouse(clone(fixture), Object.assign(clone(tastT.house), { tastings: [Object.assign(clone(tastT.house.tastings[0]), { ts: NOW + 9 })] })));
	same('refreshEdition(tastings arrive)', T.refreshEdition(clone(fixture), clone(tastT.house)), P.refreshEdition(clone(fixture), clone(tastT.house)));

	const PAGES = [['abc 24 def', '24'], ['glass 9', ' 9 '], ['a  b', 'a b'], ['x', ''], ['', 'y']];
	same('onPage', PAGES.map(([h, n]) => T.onPage(h, n)), PAGES.map(([h, n]) => P.onPage(h, n)));

	/* The lines. */
	const LINES = ['Roast chicken, the hearth one.', 'a-b c' + CURLY + 'd', '', 'one two three four five', CAFE + ' cr' + E_GRAVE + 'me, 3 pieces', 'A ' + EM_DASH + ' dash; a ' + DOUBLE + ' double; an &' + 'mdash; entity'];
	same('wordCount', LINES.map(T.wordCount), LINES.map(P.wordCount));
	same('hasDash', LINES.map(T.hasDash), LINES.map(P.hasDash));
	same('stripDashes', LINES.map(T.stripDashes), LINES.map(P.stripDashes));
	same('lineProblems', T.lineProblems({ s10: LINES[3], s20: dashed.dishes[0].lines.value.s10, s45: '' }), P.lineProblems({ s10: LINES[3], s20: dashed.dishes[0].lines.value.s10, s45: '' }));

	/* The merge: with itself, and with a copy that moved. */
	same('mergeHouse(fixture, fixture)', T.mergeHouse(clone(fixture), clone(fixture)), P.mergeHouse(clone(fixture), clone(fixture)));
	const moved = clone(fixture);
	moved.name = 'The Lantern Room, renamed';
	moved.lastWrite = fixture.lastWrite + 1000;
	moved.dishes[0].say = { value: 'Hers, later.', by: 'maitre', ts: NOW + 5 };
	moved.dishes[0].ts = NOW + 5;
	moved.dishes.splice(1, 1);
	moved.removed = Object.assign({}, moved.removed, { [fixture.dishes[1].id]: NOW });
	moved.cocktails.push(Object.assign(clone(fixture.cocktails[0]), { id: 'b-newone01', name: 'A new one', ts: NOW }));
	same('mergeHouse(fixture, moved)', T.mergeHouse(clone(fixture), clone(moved)), P.mergeHouse(clone(fixture), clone(moved)));
	same('mergeHouse(moved, fixture)', T.mergeHouse(clone(moved), clone(fixture)), P.mergeHouse(clone(moved), clone(fixture)));
	same('mergeKept', T.mergeKept(fixture.dishes[0].kept, [{ q: 'q', a: 'a', ts: NOW }]), P.mergeKept(fixture.dishes[0].kept, [{ q: 'q', a: 'a', ts: NOW }]));
	const PAIRS = [[{ value: 'a', by: 'person', ts: 1 }, { value: 'b', by: 'maitre', ts: 9 }], [{ value: 'a', by: 'maitre', ts: 1 }, { value: 'b', by: 'maitre', ts: 9 }], [undefined, { value: 'b', by: 'maitre', ts: 9 }], [{ value: 'a', by: 'person', ts: 1 }, undefined]];
	same('pickMark', PAIRS.map(([a, b]) => T.pickMark(a, b)), PAIRS.map(([a, b]) => P.pickMark(a, b)));
	same('lastTouch', fixture.dishes.map((/** @type {any} */ d) => T.lastTouch(d, T.MARK_FIELDS.dishes)), fixture.dishes.map((/** @type {any} */ d) => P.lastTouch(d, P.MARK_FIELDS.dishes)));
	same('listOfKind', ['dish', 'wine', 'cocktail', 'x'].map(T.listOfKind), ['dish', 'wine', 'cocktail', 'x'].map(P.listOfKind));
	same('mergeSaid', T.mergeSaid('X', { added: 1, updated: 2, keptMine: 3, removed: 4 }), P.mergeSaid('X', { added: 1, updated: 2, keptMine: 3, removed: 4 }));
	same('countItems', T.countItems(fixture), P.countItems(fixture));

	/* The sync, per adapter. */
	const empty = (/** @type {Engine} */ E) => E.emptyHouse('h-emptyone', 'Empty', 'hand', NOW);
	for (const [kind, name] of [['dish', 'tableDish'], ['wine', 'codexWine'], ['cocktail', 'ledgerCocktail']]) {
		const rowsT = T.syncOut(kind, clone(fixture), T[name], []);
		const rowsP = P.syncOut(kind, clone(fixture), P[name], []);
		if (!same(`syncOut(${kind})`, rowsT, rowsP)) continue;
		if (!rowsT.length) fail.push(`syncOut(${kind}) wrote no rows off the fixture, which cannot be right`);
		same(`syncIn(${kind}, own rows)`, T.syncIn(kind, clone(rowsT), clone(fixture), T[name], { now: NOW }), P.syncIn(kind, clone(rowsP), clone(fixture), P[name], { now: NOW }));
		const changed = (/** @type {any[]} */ rows) => {
			const out = clone(rows);
			out[0].ts = LATER;
			out[0].name = String(out[0].name || out[0].wine || '') + ' changed';
			out.push(Object.assign(clone(out[0]), { id: kind[0] + '-handtypd', ts: LATER, house: undefined, name: 'Typed by hand' }));
			return out;
		};
		same(`syncIn(${kind}, changed rows)`, T.syncIn(kind, changed(rowsT), clone(fixture), T[name], { now: LATER, knownHouses: [fixture.id] }), P.syncIn(kind, changed(rowsP), clone(fixture), P[name], { now: LATER, knownHouses: [fixture.id] }));
		same(`syncIn(${kind}, no rows)`, T.syncIn(kind, [], clone(fixture), T[name], { now: LATER }), P.syncIn(kind, [], clone(fixture), P[name], { now: LATER }));
		same(`syncIn(${kind}, empty house)`, T.syncIn(kind, clone(rowsT), empty(T), T[name], { now: LATER }), P.syncIn(kind, clone(rowsP), empty(P), P[name], { now: LATER }));
		same(`syncOut(${kind}, over previous rows)`, T.syncOut(kind, clone(moved), T[name], changed(rowsT)), P.syncOut(kind, clone(moved), P[name], changed(rowsP)));
		same(`adapterFor(${kind}).kind`, T.adapterFor(kind).kind, P.adapterFor(kind).kind);
	}
	same('emptyHouse', empty(T), empty(P));
	same('wineDisplayName', [T.wineDisplayName('A', 'B', '2019'), T.wineDisplayName('', 'B', ''), T.wineDisplayName('A', '', 'NV')], [P.wineDisplayName('A', 'B', '2019'), P.wineDisplayName('', 'B', ''), P.wineDisplayName('A', '', 'NV')]);
	const ACCENTED = ['The  Lantern Room', CAFE.toLowerCase() + ' CR' + E_GRAVE.toUpperCase() + 'ME'];
	same('foldHouseName', ACCENTED.map(T.foldHouseName), ACCENTED.map(P.foldHouseName));
	same('foldBarName', ['Old Fashioned', 'OLD-fashioned '].map(T.foldBarName), ['Old Fashioned', 'OLD-fashioned '].map(P.foldBarName));
	same('listFor', ['dish', 'dishes', 'lexicon', 'house', 'x'].map(T.listFor), ['dish', 'dishes', 'lexicon', 'house', 'x'].map(P.listFor));

	/* The drills, over the fixture and over the widened copy, twenty seeds each. */
	const wide = widened(fixture, T);
	for (const [label, house] of [['fixture', fixture], ['widened', wide]]) {
		same(`drillableCounts(${label})`, T.drillableCounts(house), P.drillableCounts(house));
		same(`readyKinds(${label})`, T.readyKinds(house), P.readyKinds(house));
		same(`buildFlashcards(${label})`, T.buildFlashcards(house), P.buildFlashcards(house));
		let dealt = 0;
		for (const kind of T.DRILL_KINDS) {
			const a = [];
			const b = [];
			for (let seed = 1; seed <= 20; seed++) {
				a.push(T.dealQuestion(house, kind, seeded(seed)));
				b.push(P.dealQuestion(house, kind, seeded(seed)));
				a.push(T[kind](house, seeded(seed + 100)));
				b.push(P[kind](house, seeded(seed + 100)));
			}
			dealt += a.filter(Boolean).length;
			same(`dealQuestion(${label}, ${kind})`, a, b);
		}
		if (label === 'widened' && !dealt) fail.push('the widened house dealt no question of any kind, so the drills are not proved');
	}

	/* The offline graders, over the fixture: the kept lines word for word, a
	   thin answer, an over cap one, an empty one, an unknown id and her
	   unkept line, each length; the scenarios likewise; the listings. */
	const hersOnly = clone(fixture);
	for (const d of hersOnly.dishes) if (d.lines) d.lines.by = 'maitre';
	for (const sc of hersOnly.scenarios) if (sc.you) sc.you.by = 'maitre';
	const SAID = ['', 'Chicken with potatoes and gravy.', 'Half a corn fed chicken roasted over embers, rosemary gravy, leeks, crushed potatoes, smoky skin and lemon.', CAFE + ' cr' + E_GRAVE + 'me, glazed with roasting juices' + CURLY + 's.'];
	/** @param {Engine} E */
	const grades = (E) => {
		const out = [];
		for (const house of [fixture, hersOnly]) {
			for (const id of ['d-chicken1', 'd-beetrt01', 'w-lantern1', 'b-collins1', 'd-nowhere1']) {
				for (const len of ['s10', 's20', 's45']) {
					const lines = (house.dishes.concat(house.wines, house.cocktails).find((/** @type {any} */ i) => i.id === id) || {}).lines;
					for (const said of [...SAID, lines ? lines.value.s45 : '']) out.push(E.gradeSaid(house, id, len, said));
				}
			}
			for (const id of ['s-hurry001', 's-nowhere1']) for (const said of [...SAID, 'Order both now and I will tell the pass.']) out.push(E.gradeScenario(house, id, said));
			out.push(E.sayable(house), E.sayable(house, 'wine'), E.roleable(house));
		}
		out.push([0, 1, 12, 45, 104, 2025, 12000].map(E.numberWords));
		return out;
	};
	const gradedT = grades(T);
	same('the graders (gradeSaid, gradeScenario, sayable, roleable, numberWords)', gradedT, grades(P));
	if (!gradedT.some((g) => g && g.verdict === 'met')) fail.push('no answer met its kept line, so the graders are not proved');

	/* A newer edition over an older one, both ways of stamping, on both sides. */
	const edition = (/** @type {any} */ h, /** @type {number} */ at, /** @type {number} */ itemTs) => {
		const out = clone(h);
		out.pack = { id: 'house-min', builtBy: 'the fixture', builtAt: new Date(at).toISOString(), version: 1 };
		for (const list of T.HOUSE_LISTS) for (const r of out[list]) {
			r.ts = itemTs;
			for (const f of T.MARK_FIELDS[list]) if (T.isMark(r[f])) r[f].ts = at;
		}
		return out;
	};
	const ed1 = edition(fixture, NOW - 86_400_000, NOW - 2 * 86_400_000);
	const ed2 = edition(fixture, NOW, NOW);
	ed2.dishes[0].description = 'The second edition.';
	ed2.dishes[0].parts.value.sauce = 'The second edition sauce';
	ed2.dishes.push(Object.assign(clone(ed2.dishes[1]), { id: 'd-newdish1', name: 'Smoked Trout' }));
	const touched = clone(ed1);
	touched.dishes[0].lines = { value: { s10: 'Mine.', s20: 'Mine too.', s45: 'All mine.' }, by: 'person', ts: NOW - 1000 };
	touched.wines[0].ts = NOW - 500;
	touched.dishes = touched.dishes.filter((/** @type {any} */ d) => d.id !== 'd-beetrt01');
	touched.removed = { 'd-beetrt01': NOW - 400 };
	for (const [label, dev] of [['untouched', ed1], ['touched', touched]]) {
		same(`editionStamp(${label})`, [T.editionStamp(dev), T.editionItemStamp(dev), T.editionBuiltAt(dev)], [P.editionStamp(dev), P.editionItemStamp(dev), P.editionBuiltAt(dev)]);
		same(`refreshEdition(${label})`, T.refreshEdition(dev, ed2), P.refreshEdition(dev, ed2));
	}

	/* Ids. */
	same('mintId', ['d-', 'w-', 'h-'].map((p) => T.mintId(p, new Set(['d-00000000']), seeded(5))), ['d-', 'w-', 'h-'].map((p) => P.mintId(p, new Set(['d-00000000']), seeded(5))));
	same('isMark', MARKS.map(T.isMark), MARKS.map(P.isMark));
	same('isNote', [{ q: 'q', a: 'a', ts: 1 }, { q: 'q', ts: 1 }, null].map(T.isNote), [{ q: 'q', a: 'a', ts: 1 }, { q: 'q', ts: 1 }, null].map(P.isNote));
	const SLUGS = ['The Lantern Room', '  ' + CAFE + ' "Cr' + E_GRAVE + 'me"  ', ''];
	same('packSlug', SLUGS.map(T.packSlug), SLUGS.map(P.packSlug));
	same('storeSaid', ['too-big', 'no-storage', 'refused'].map((r) => T.storeSaid(r, 'X')), ['too-big', 'no-storage', 'refused'].map((r) => P.storeSaid(r, 'X')));
	same('asIndex', [T.asIndex(null), T.asIndex({ v: 1, current: 'h-x', list: [] }), T.asIndex({ v: 1, current: 'h-x', list: [{ id: 'h-x', name: 'X', ts: 1, bytes: 2, began: 'hand' }] })], [P.asIndex(null), P.asIndex({ v: 1, current: 'h-x', list: [] }), P.asIndex({ v: 1, current: 'h-x', list: [{ id: 'h-x', name: 'X', ts: 1, bytes: 2, began: 'hand' }] })]);
	same('measureHouse', T.measureHouse(fixture), P.measureHouse(fixture));
}

/**
 * The whole api over a Map on both sides, step by step, the two Maps
 * compared after every step.
 * @param {Engine} T
 * @param {Engine} P
 */
async function checkApi(T, P) {
	const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8'));
	let clock = NOW;
	const now = () => clock;
	const mapT = new Map();
	const mapP = new Map();
	const apiT = T.createHouseApi(T.mapStorage(mapT), { now, rand: seeded(42), from: 'ledger' });
	const apiP = P.createHouseApi(P.mapStorage(mapP), { now, rand: seeded(42), from: 'ledger' });
	same('api keys', Object.keys(apiT).sort(), Object.keys(apiP).sort());
	const dump = () => same(`the two Maps after ${step}`, [...mapT.entries()], [...mapP.entries()]);
	let step = 'nothing';

	await apiT.ready();
	await apiP.ready();
	same('current() with no house', [apiT.current(), apiT.currentId(), apiT.list()], [apiP.current(), apiP.currentId(), apiP.list()]);
	same('setMark with no house', await apiT.setMark('dish', 'd-chicken1', 'say', { value: 'x', by: 'person', ts: NOW }), await apiP.setMark('dish', 'd-chicken1', 'say', { value: 'x', by: 'person', ts: NOW }));
	step = 'nothing written with no house';
	dump();
	if (mapT.size) fail.push('a write with no house reached the Map');

	step = 'importPack';
	same(step, await apiT.importPack(packOf(clone(fixture)), { mode: 'new' }), await apiP.importPack(packOf(clone(fixture)), { mode: 'new' }));
	dump();
	same('current() after import', [apiT.current(), apiT.currentId(), apiT.list()], [apiP.current(), apiP.currentId(), apiP.list()]);

	clock = LATER;
	step = 'setMark (hers)';
	same(step, await apiT.setMark('dish', 'd-chicken1', 'guest', { value: 'Hers, new.', by: 'maitre', ts: LATER }), await apiP.setMark('dish', 'd-chicken1', 'guest', { value: 'Hers, new.', by: 'maitre', ts: LATER }));
	dump();
	step = 'setMark (hers over kept)';
	same(step, await apiT.setMark('dish', 'd-chicken1', 'say', { value: 'Hers, not kept.', by: 'maitre', ts: LATER }), await apiP.setMark('dish', 'd-chicken1', 'say', { value: 'Hers, not kept.', by: 'maitre', ts: LATER }));
	dump();
	step = 'setMark (house history)';
	same(step, await apiT.setMark('house', fixture.id, 'history', { value: 'A new history.', by: 'person', ts: LATER }), await apiP.setMark('house', fixture.id, 'history', { value: 'A new history.', by: 'person', ts: LATER }));
	dump();
	step = 'setMark (discard)';
	same(step, await apiT.setMark('dish', 'd-chicken1', 'guest', null), await apiP.setMark('dish', 'd-chicken1', 'guest', null));
	dump();
	step = 'setCard';
	same(step, await apiT.setCard({ dressCode: 'Anything clean', allergens: 'x' }), await apiP.setCard({ dressCode: 'Anything clean', allergens: 'x' }));
	dump();
	same('setCard blank name', await apiT.setCard({ name: '  ' }), await apiP.setCard({ name: '  ' }));
	step = 'setItemField';
	same(step, await apiT.setItemField('dish', 'd-beetrt01', { serviceNote: 'Ask the pass about the crust.', signature: true }), await apiP.setItemField('dish', 'd-beetrt01', { serviceNote: 'Ask the pass about the crust.', signature: true }));
	dump();
	same('setItemField (a shared field refused)', await apiT.setItemField('dish', 'd-beetrt01', { name: 'x' }), await apiP.setItemField('dish', 'd-beetrt01', { name: 'x' }));
	step = 'putListItem (minted)';
	same(step, await apiT.putListItem('lexicon', { term: 'Mirepoix', itemIds: [] }), await apiP.putListItem('lexicon', { term: 'Mirepoix', itemIds: [] }));
	dump();
	step = 'putListItem (replaced by id)';
	same(step, await apiT.putListItem('mustKnows', { id: 'k-lastord1', title: 'Last orders, ten sharp' }), await apiP.putListItem('mustKnows', { id: 'k-lastord1', title: 'Last orders, ten sharp' }));
	dump();

	clock = LATER + 1000;
	for (const kind of ['dish', 'wine', 'cocktail']) {
		step = `rows(${kind})`;
		const rowsT = apiT.rows(kind, []);
		const rowsP = apiP.rows(kind, []);
		if (!same(step, rowsT, rowsP)) continue;
		step = `put(${kind})`;
		const row = clone(rowsT[0]);
		row.ts = clock;
		row.name = String(row.name || '') + ' put';
		same(step, await apiT.put(kind, clone(row)), await apiP.put(kind, clone(row)));
		dump();
		step = `put(${kind}, hand typed)`;
		const typed = Object.assign(clone(row), { id: kind[0] + '-typedone', house: undefined, name: 'Typed ' + kind, ts: clock });
		same(step, await apiT.put(kind, clone(typed)), await apiP.put(kind, clone(typed)));
		dump();
		step = `sync(${kind})`;
		same(step, await apiT.sync(kind, clone(rowsT)), await apiP.sync(kind, clone(rowsP)));
		dump();
	}

	clock = LATER + 2000;
	step = 'removeItem';
	same(step, await apiT.removeItem('dish', 'd-chicken1'), await apiP.removeItem('dish', 'd-chicken1'));
	dump();
	step = 'sync after removeItem';
	const backT = apiT.rows('dish', []);
	const backP = apiP.rows('dish', []);
	same(step, await apiT.sync('dish', [...backT, Object.assign(clone(fixture.dishes[0]), { house: fixture.id })]), await apiP.sync('dish', [...backP, Object.assign(clone(fixture.dishes[0]), { house: fixture.id })]));
	dump();

	step = 'buildPack';
	same(step, apiT.buildPack(), apiP.buildPack());
	same('names', [await apiT.names('dish'), await apiT.names('wine'), await apiT.names('cocktail')], [await apiP.names('dish'), await apiP.names('wine'), await apiP.names('cocktail')]);

	clock = LATER + 3000;
	step = 'mintHouse';
	same(step, await apiT.mintHouse('Second', 'hand'), await apiP.mintHouse('Second', 'hand'));
	dump();
	step = 'rename';
	same(step, await apiT.rename('Second, renamed'), await apiP.rename('Second, renamed'));
	dump();
	step = 'switchTo';
	same(step, await apiT.switchTo(fixture.id), await apiP.switchTo(fixture.id));
	dump();
	step = 'importPack (merge)';
	same(step, await apiT.importPack(packOf(clone(fixture)), { mode: 'merge', into: fixture.id }), await apiP.importPack(packOf(clone(fixture)), { mode: 'merge', into: fixture.id }));
	dump();
	step = 'importPack (new, same id)';
	same(step, await apiT.importPack(packOf(clone(fixture)), { mode: 'new' }), await apiP.importPack(packOf(clone(fixture)), { mode: 'new' }));
	dump();
	/* The shipped pack at boot: a house the device lacks is added (current
	   only when asked here, the device holding a house with work in it), the
	   same edition writes nothing, a newer edition refreshes with a person's
	   edited mark kept and a removal respected, and a refusal is a sentence. */
	const shippedOf = (/** @type {any} */ h, /** @type {number} */ at) => {
		const out = clone(h);
		out.id = 'h-shipped1';
		out.name = 'The Shipped Room';
		out.pack = { id: 'shipped', builtBy: 'the check', builtAt: new Date(at).toISOString(), version: 1 };
		for (const list of T.HOUSE_LISTS) for (const r of out[list]) {
			r.ts = at;
			if ('house' in r) r.house = out.id;
			for (const f of T.MARK_FIELDS[list]) if (T.isMark(r[f])) r[f].ts = at;
		}
		return JSON.stringify(packOf(out));
	};
	clock = LATER + 3500;
	step = 'ensurePack (refused)';
	same(step, await apiT.ensurePack('{ not a pack'), await apiP.ensurePack('{ not a pack'));
	dump();
	step = 'ensurePack (added)';
	const firstEdition = shippedOf(fixture, NOW - 86_400_000);
	same(step, await apiT.ensurePack(firstEdition), await apiP.ensurePack(firstEdition));
	dump();
	step = 'ensurePack (current)';
	const again = [await apiT.ensurePack(firstEdition), await apiP.ensurePack(firstEdition)];
	same(step, again[0], again[1]);
	if (again[0].action !== 'current') fail.push(`ensurePack with the same edition answered ${again[0].action}; it should be current and write nothing`);
	dump();
	step = 'switchTo the shipped house';
	same(step, await apiT.switchTo('h-shipped1'), await apiP.switchTo('h-shipped1'));
	dump();
	step = 'a person edits a mark and removes an item on the shipped house';
	const myLine = { value: { s10: 'My own line.', s20: 'My own twenty.', s45: 'My own forty five.' }, by: 'person', ts: LATER + 3600 };
	clock = LATER + 3600;
	same(step, [await apiT.setMark('dish', 'd-chicken1', 'lines', myLine), await apiT.removeItem('dish', 'd-beetrt01')], [await apiP.setMark('dish', 'd-chicken1', 'lines', myLine), await apiP.removeItem('dish', 'd-beetrt01')]);
	dump();
	step = 'ensurePack (refreshed)';
	const nextEdition = JSON.parse(shippedOf(fixture, LATER + 4000));
	nextEdition.house.dishes[0].lines.value.s10 = 'The edition line.';
	nextEdition.house.dishes[0].parts.value.sauce = 'The edition sauce';
	nextEdition.house.dishes.push(Object.assign(clone(nextEdition.house.dishes[1]), { id: 'd-newdish1', name: 'Smoked Trout' }));
	const nextText = JSON.stringify(nextEdition);
	clock = LATER + 5000;
	const refreshedT = await apiT.ensurePack(nextText);
	same(step, refreshedT, await apiP.ensurePack(nextText));
	dump();
	const after = apiT.current();
	if (refreshedT.action !== 'refreshed') fail.push(`ensurePack with a newer edition answered ${refreshedT.action}; it should refresh`);
	else if (!after) fail.push('the refresh left no current house');
	else {
		const chicken = after.dishes.find((/** @type {any} */ d) => d.id === 'd-chicken1');
		if (!chicken || chicken.lines.value.s10 !== 'My own line.') fail.push('the refresh did not keep the line a person edited');
		if (!chicken || chicken.parts.value.sauce !== 'The edition sauce') fail.push('the refresh did not bring an untouched mark up to the edition');
		if (after.dishes.some((/** @type {any} */ d) => d.id === 'd-beetrt01')) fail.push('the refresh brought back an item a person removed');
		if (!after.dishes.some((/** @type {any} */ d) => d.id === 'd-newdish1')) fail.push('the refresh did not add the item the edition added');
	}

	step = 'remove';
	const second = apiT.list().find((/** @type {any} */ s) => s.name === 'Second, renamed');
	same(step, await apiT.remove(second ? second.id : 'h-none', 'Second, renamed'), await apiP.remove(second ? second.id : 'h-none', 'Second, renamed'));
	dump();
	same('list at the end', apiT.list(), apiP.list());
	said.push(`the api over a Map agrees step by step through import, mark, card, field, entry, put, sync, removeItem, pack, mint, rename, switch, merge, ensurePack (refused, added, current, refreshed with an edit kept and a removal respected) and remove (${mapT.size} keys on the device at the end)`);
}

async function main() {
	if (!existsSync(TARGET)) {
		console.log(`\n  x   ${TARGET} does not exist; run node tools/port-house.mjs\n\n  check-port-house: FAIL (1)\n`);
		process.exit(1);
	}
	const text = readFileSync(TARGET, 'utf8');
	const T = loadTypeScript();
	const P = checkFile(text);
	if (P) {
		const before = fail.length;
		checkParity(T, P);
		await checkApi(T, P);
		if (fail.length === before) said.push('every pure call on the fixture, the damaged, moved and widened copies agrees with the TypeScript');
	}

	console.log('\n  Checking the House port against its TypeScript\n');
	for (const s of said) console.log('  ok  ' + s);
	if (fail.length) {
		console.log('');
		for (const f of fail.slice(0, 40)) console.log('  x   ' + f);
		if (fail.length > 40) console.log(`  ... and ${fail.length - 40} more`);
		console.log(`\n  check-port-house: FAIL (${fail.length})\n`);
		process.exit(1);
	}
	console.log('\n  check-port-house: OK\n');
}

main().catch((e) => {
	console.error('  check-port-house: ' + (e && e.stack ? e.stack : e));
	process.exit(1);
});
