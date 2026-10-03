#!/usr/bin/env node
/**
 * port-desk.mjs: the Menu Desk's seven TypeScript modules as ONE classic script
 * for the two plain wings.
 *
 *   node tools/port-desk.mjs            writes both js/menu-desk.js files
 *   node tools/port-desk.mjs --dry-run  generates and asserts, writes nothing
 *
 * Then `node tools/check-port.mjs` proves the written files say what the
 * TypeScript says. Run both after any change under src/lib/desk.
 *
 * WHY A GENERATOR AND NOT A HAND PORT. The three apps used to carry three
 * hand-ported copies of menu-parse.ts, kept "line for line the same" by
 * discipline, and they drifted on exactly one line (the Codex let a bare
 * price run to five figures, the other two capped it at three). A hand port
 * of seven modules and 4,000 lines would drift on the first Tuesday. This file
 * names the modules, the globals and the targets; the engine in port-core.mjs
 * reads the modules, transpiles each with the TypeScript compiler already in
 * node_modules, strips the import and export statements, and joins them in
 * dependency order, so the port IS the source and a change to the source is
 * a rerun, not a transcription.
 *
 * WHY ONE FILE AND NOT SEVEN. The Ledger and the Codex load classic scripts
 * into one shared global scope. Seven files would put about a hundred and
 * fifty private names (words, str, scan, finish, cut, place) into that scope
 * beside fifteen other files' names, and the first collision would be a
 * silent overwrite. One IIFE keeps them all in; what comes out is the short
 * list in GLOBALS, and nothing else. The seven modules were written knowing
 * this (desk-text.ts copies foldText rather than importing it, for the same
 * reason), and the engine refuses the port if two modules ever declare the
 * same top-level name, because inside one function scope a second `const`
 * of the same name is a syntax error and a second `function` is a silent
 * replacement.
 *
 * The target, the escapes and the clean gate are port-core.mjs's and are
 * explained there; the House port (port-house.mjs) shares them, so the two
 * ports cannot drift from each other either.
 *
 * The two outputs differ in their first line and nowhere else. The first
 * line names the app, so a copy pasted into the wrong tree says so at the
 * top of the file; check-port.mjs asserts the rest is byte-identical.
 */
import path from 'node:path';
import { ROOT, unitFor, unitsIn, portModules, assertClean, writePorts, runMain } from './port-core.mjs';

/* The engine's pieces check-port.mjs reads through this file. */
export { DASH, assertClean } from './port-core.mjs';

const DESK = path.join(ROOT, 'src', 'lib', 'desk');

/**
 * The seven, in dependency order: each may use only what sits above it.
 * desk-share imports nothing but types from desk-file, so it could sit
 * anywhere; it sits beside the file whose rows it counts.
 */
export const MODULES = ['desk-text', 'desk-vocab', 'desk-file', 'desk-share', 'desk-sort', 'desk-reader', 'desk-inbox'];

/**
 * The adapter is read from the file that owns it rather than written here,
 * so `parseMenuText` in the port is `parseMenuText` in the World Table to the
 * character, and a change to the seven pinned keys reaches all three apps
 * with one regeneration.
 */
const ADAPTER = path.join(ROOT, 'src', 'lib', 'menu-parse.ts');

/**
 * What the script exposes, and all it exposes. `parseWineText` is the name
 * the Codex's wine-rows.js has always called; it is the same function as
 * `parseMenuText`, kept alive so nothing breaks at load before that screen
 * changes.
 */
export const GLOBALS = [
	'readMenu', 'reReadAs', 'readDeskFile', 'emptyDesk', 'mintDeskId', 'deskFilename', 'downloadDesk',
	'toParsedDish', 'classify', 'deskInbox', 'parseMenuText', 'parseWineText',
	/* What a wing's own screen needs to call readMenu directly and to say what
	   it read: the source block (so the hash is minted one way in three apps
	   and never built by hand in a wing), the hash on its own for the "already
	   read" check, the price tokeniser for a price a person retyped, and the
	   words from desk-share.ts. sharedOrigin and siblingHref stay out: they
	   answer for the World Table's base path, and a plain wing asks its own
	   location.pathname. */
	'deskSource', 'hashText', 'priceParts',
	'readInName', 'whenRead', 'roomName', 'deskCounts', 'countsLine', 'handList', 'priceInRaw'
];

/**
 * The two names the door out builds itself rather than reads off a module:
 * parseWineText is parseMenuText under its old name, deskInbox is the inbox
 * object assembled below.
 */
const BUILT = ['parseWineText', 'deskInbox'];

/** Where the two copies go. The sibling repos, unless the environment says otherwise. */
export const TARGETS = [
	{
		app: 'ledger',
		name: "The Bartender's Ledger",
		file: path.join(process.env.LEDGER_DIR || path.resolve(ROOT, '..', 'BartendersLedger'), 'js', 'menu-desk.js')
	},
	{
		app: 'codex',
		name: "The Sommelier's Codex",
		file: path.join(process.env.CODEX_DIR || path.resolve(ROOT, '..', 'SommeliersCodex'), 'js', 'menu-desk.js')
	}
];

/* -------------------------------------------------------------------------
 * The words around the modules
 * ---------------------------------------------------------------------- */

/**
 * The paragraphs every copy carries under its first line. Written dash-free on purpose.
 * @param {string} date the day of the run, as YYYY-MM-DD
 * @returns {string}
 */
function headerBody(date) {
	return [
		`   GENERATED by WorldTable/tools/port-desk.mjs from src/lib/desk on ${date}; do not edit; regenerate with node tools/port-desk.mjs.`,
		'',
		"   WHAT THIS IS. The Menu Desk's reader (desk-reader.ts), sorter (desk-sort.ts),",
		'   desk file (desk-file.ts), inbox (desk-inbox.ts), vocabulary (desk-vocab.ts),',
		'   text hygiene (desk-text.ts) and the words a desk screen says (desk-share.ts),',
		'   transpiled from the World Table\'s TypeScript and joined into one script',
		'   for a wing that has no bundler, with the parseMenuText adapter from',
		'   src/lib/menu-parse.ts on the end.',
		"   The Ledger's copy and the Codex's copy differ in their first line and",
		'   nowhere else; WorldTable/tools/check-port.mjs asserts that, and asserts',
		'   that readMenu here says exactly what the TypeScript says on the three',
		'   desk fixtures. A fix belongs in the TypeScript, with its tests, and',
		'   reaches this file by regeneration; an edit made here is lost on the',
		'   next run, which is the point.',
		'',
		'   WHY ONE FILE. This app loads classic scripts into one global scope. Seven',
		'   files would put about a hundred and fifty private names (words, str,',
		'   scan, finish, cut, place) into that scope beside every other file\'s',
		'   names, and the first collision would be a silent overwrite. One IIFE',
		'   keeps them all in; what comes out is the list of vars declared below,',
		'   and nothing else.',
		'',
		'   THE RULES TRAVEL WITH THE CODE. No allergen field exists on any row and',
		'   nothing reads contents: marks carries the (v) and the [GF] the menu',
		'   PRINTED. No price, quantity or spelling is ever invented; a price is',
		"   stored as printed and every figure in parts is a substring of it; '3/4",
		"   oz lime' stays one spec part and is never '4 oz'. Section names come",
		'   back as printed. Every row keeps raw, the lines it came from. The desk',
		'   file is a DRAFT read into a review table, never a store transport, and',
		'   this app adopts a row only through its own review and its own save.',
		'   The comments are the specification and are kept so the file can be',
		'   diffed against its source.',
		'',
		'   ON THE ESCAPES. Every character outside ASCII inside a regex literal is',
		'   written as a \\uXXXX escape by the generator, because the suite\'s publish',
		'   gate counts em dashes across the built tree and a dash inside a',
		'   character class, shipped twice, would spend the baseline. The word',
		'   lists (the regions, the grapes) keep their accents: they are data, and',
		'   a region printed with an accent should match one.',
		'',
		'   parseMenuText is the adapter src/lib/menu-parse.ts has always exposed,',
		"   and parseWineText is the same function under the name the Codex's",
		'   wine-rows.js has always called; neither knows about the desk file, which',
		'   is why every existing caller keeps working before its screen changes.',
		'*/'
	].join('\n');
}

/**
 * Everything but the first line: the header body, the var list, the IIFE
 * with the helpers, the seven bodies and the door out. Pure, so a test can
 * generate in memory and compare.
 * @param {Date} [now] the clock, for the date in the header
 * @returns {string}
 */
export function generateShared(now = new Date()) {
	const date = now.toISOString().slice(0, 10);
	const exposeList = GLOBALS.map((g) => {
		if (g === 'deskInbox') return '\tdeskInbox: inbox';
		if (g === 'parseWineText') return '\tparseWineText: parseMenuText';
		return `\t${g}: ${g}`;
	}).join(',\n');
	const assign = GLOBALS.map((g) => `\t${g} = api.${g};`).join('\n');

	return portModules({
		units: [...unitsIn(DESK, MODULES), unitFor(ADAPTER)],
		header: headerBody(date),
		prelude: [`var ${GLOBALS.join(', ')};`],
		opener: ['(function (expose) {', "'use strict';"],
		/* The door out reads these names from the module scope; a global the
		   modules do not define would come out undefined and fail at first use,
		   in the app, not here. */
		expects: GLOBALS.filter((g) => !BUILT.includes(g)),
		door: [
			'/* The inbox as one object, so the five calls a wing makes read as one',
			'   thing: deskInbox.read(), deskInbox.share(file, "wine"), deskInbox.taken("wine").',
			'   The rest come out under their own names: a wing that reads a menu itself',
			'   calls deskSource for the source block, hashText for the "already read"',
			'   check, and the desk-share words for the sentence under the read. */',
			'var inbox = {',
			'\tDESK_INBOX_KEY: DESK_INBOX_KEY,',
			'\twrite: writeDeskInbox,',
			'\tread: readDeskInbox,',
			'\tshare: deskShare,',
			'\ttaken: markDeskTaken,',
			'\tclear: clearDeskInbox',
			'};',
			'expose({',
			exposeList,
			'});',
			'})(function (api) {',
			'\t/* Outside the IIFE, where the vars above are in reach and the module',
			'\t   names inside cannot shadow them. */',
			assign,
			'});'
		]
	});
}

/**
 * The first line: the app, so a copy in the wrong tree says so at the top.
 * @param {{ name: string }} target
 * @returns {string}
 */
export function firstLine(target) {
	return `/* ${target.name}, js/menu-desk.js: the Menu Desk (reader, sorter, desk file, inbox) as one classic script.`;
}

/**
 * Both files, asserted clean and ready to write.
 * @param {Date} [now]
 * @returns {Array<{ app: string, name: string, file: string, text: string }>}
 */
export function generate(now = new Date()) {
	const shared = generateShared(now);
	return TARGETS.map((t) => {
		const text = `${firstLine(t)}\n${shared}`;
		assertClean(text, `menu-desk.js (${t.app})`);
		return { ...t, text };
	});
}

function main() {
	writePorts(generate(), process.argv.includes('--dry-run'));
	console.log('  now: node tools/check-port.mjs');
}

runMain('port-desk', import.meta.url, main);
