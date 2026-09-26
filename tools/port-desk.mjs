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
 * reason), and this tool refuses the port if two modules ever declare the
 * same top-level name, because inside one function scope a second `const`
 * of the same name is a syntax error and a second `function` is a silent
 * replacement.
 *
 * WHY ES2017 AND WHY THE ESCAPES. ES2017 is what the two wings' oldest
 * supported browsers run without help; object spread and optional chaining
 * are compiled down, and the one compiler helper that needs (__assign) is
 * emitted once rather than once per module. Every character outside ASCII
 * inside a regex literal is rewritten as a \uXXXX escape, because the
 * suite's publish gate counts em dashes across the built tree and one dash
 * inside a character class, shipped twice, would spend the baseline; the
 * gate counts the escape separately and on purpose. Word lists keep their
 * accents: they are data, and a region printed with an accent should match.
 *
 * The two outputs differ in their first line and nowhere else. The first
 * line names the app, so a copy pasted into the wrong tree says so at the
 * top of the file; check-port.mjs asserts the rest is byte-identical.
 */
import ts from 'typescript';
import vm from 'node:vm';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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

/** The em dash, however it is spelled, and the double hyphen: what the publish gate counts. Built from escapes, so this file passes the rule it enforces. */
export const DASH = new RegExp(['\\u2014', '&' + 'mdash;', '&#' + '8212;', '&#' + 'x2014;', ' ' + '-- '].join('|'), 'g');

/* -------------------------------------------------------------------------
 * Transpile and strip
 * ---------------------------------------------------------------------- */

/** One module through the compiler, with its comments, or a thrown diagnostic. */
function transpile(file, label) {
	const src = readFileSync(file, 'utf8');
	const out = ts.transpileModule(src, {
		fileName: label,
		reportDiagnostics: true,
		compilerOptions: {
			target: ts.ScriptTarget.ES2017,
			module: ts.ModuleKind.ESNext,
			removeComments: false,
			newLine: ts.NewLineKind.LineFeed,
			importHelpers: false,
			isolatedModules: true
		}
	});
	if (out.diagnostics && out.diagnostics.length) {
		const said = out.diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('\n');
		throw new Error(`${label}: the compiler refused it:\n${said}`);
	}
	return out.outputText;
}

/** A character outside ASCII as its \uXXXX escape; a surrogate half is escaped on its own, which every regex mode reads as the pair. */
function escapeRegex(text) {
	return text.replace(/[^\x00-\x7f]/g, (ch) => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0'));
}

/**
 * The compiled module as a script body: imports and export lists gone, the
 * `export` keyword off every declaration, compiler helpers lifted out into
 * `helpers` (one copy for the whole bundle), every regex literal ASCII.
 * Returns the body and the names it declares at the top level, so the
 * caller can refuse a collision before the bundle is written.
 */
function toScriptBody(js, label, helpers) {
	const sf = ts.createSourceFile(label + '.js', js, ts.ScriptTarget.ES2017, true, ts.ScriptKind.JS);
	const edits = [];
	const declared = [];
	const cut = (start, end) => edits.push({ start, end, text: '' });
	/* Take the line break with the statement, so a stripped import leaves no blank line behind. */
	const lineEnd = (end) => (js[end] === '\n' ? end + 1 : end);

	for (const st of sf.statements) {
		if (ts.isImportDeclaration(st) || ts.isExportDeclaration(st) || ts.isExportAssignment(st)) {
			cut(st.getStart(sf), lineEnd(st.getEnd()));
			continue;
		}
		const mods = ts.canHaveModifiers(st) ? ts.getModifiers(st) : undefined;
		const exp = mods && mods.find((m) => m.kind === ts.SyntaxKind.ExportKeyword);
		if (exp) {
			const gap = js.slice(exp.getEnd()).match(/^\s*/)[0].length;
			cut(exp.getStart(sf), exp.getEnd() + gap);
		}
		if (ts.isFunctionDeclaration(st) && st.name) declared.push(st.name.text);
		if (ts.isClassDeclaration(st) && st.name) declared.push(st.name.text);
		if (ts.isVariableStatement(st)) {
			const names = st.declarationList.declarations.filter((d) => ts.isIdentifier(d.name)).map((d) => d.name.text);
			/* A compiler helper: __assign for an object spread at ES2017. TS
			   emits one per module that needs it; the bundle keeps the first. */
			if (names.length === 1 && /^__[A-Za-z]+$/.test(names[0])) {
				if (!helpers.has(names[0])) helpers.set(names[0], js.slice(st.getStart(sf), st.getEnd()));
				cut(st.getStart(sf), lineEnd(st.getEnd()));
				continue;
			}
			declared.push(...names);
		}
	}

	const walk = (node) => {
		if (ts.isRegularExpressionLiteral(node)) {
			const text = node.getText(sf);
			const escaped = escapeRegex(text);
			if (escaped !== text) edits.push({ start: node.getStart(sf), end: node.getEnd(), text: escaped });
		}
		ts.forEachChild(node, walk);
	};
	walk(sf);

	/* From the back, so an earlier edit cannot move a later one. Nothing here overlaps: a stripped keyword and a regex inside the same statement are different spans. */
	edits.sort((a, b) => b.start - a.start);
	let out = js;
	for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
	return { body: out.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim() + '\n', declared };
}

/* -------------------------------------------------------------------------
 * Assemble
 * ---------------------------------------------------------------------- */

/** The paragraphs every copy carries under its first line. Written dash-free on purpose. */
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
 */
export function generateShared(now = new Date()) {
	const helpers = new Map();
	const parts = [];
	const owner = new Map();
	const units = MODULES.map((m) => ({ label: `src/lib/desk/${m}.ts`, file: path.join(DESK, m + '.ts') }));
	units.push({ label: 'src/lib/menu-parse.ts', file: ADAPTER });
	for (const u of units) {
		const { body, declared } = toScriptBody(transpile(u.file, u.label), path.basename(u.file, '.ts'), helpers);
		for (const name of declared) {
			if (owner.has(name)) {
				throw new Error(`${u.label} declares "${name}", which ${owner.get(name)} already declares; inside one IIFE that is a collision. Rename one of them in the source.`);
			}
			owner.set(name, u.label);
		}
		parts.push(`/* ==================== ${u.label} ==================== */\n${body}`);
	}
	for (const g of GLOBALS) {
		/* The door out reads these names from the module scope; a global the
		   modules do not define would come out undefined and fail at first use,
		   in the app, not here. parseWineText and deskInbox are built below. */
		if (g !== 'parseWineText' && g !== 'deskInbox' && !owner.has(g)) throw new Error(`no module declares "${g}", so it cannot be exposed`);
	}

	const date = now.toISOString().slice(0, 10);
	const exposeList = GLOBALS.map((g) => {
		if (g === 'deskInbox') return '\tdeskInbox: inbox';
		if (g === 'parseWineText') return '\tparseWineText: parseMenuText';
		return `\t${g}: ${g}`;
	}).join(',\n');
	const assign = GLOBALS.map((g) => `\t${g} = api.${g};`).join('\n');

	return [
		headerBody(date),
		`var ${GLOBALS.join(', ')};`,
		'(function (expose) {',
		"'use strict';",
		helpers.size
			? `/* The compiler's own helpers, emitted once for the whole file. */\n${[...helpers.values()].join('\n')}\n`
			: '',
		parts.join('\n'),
		'/* ==================== the door out ==================== */',
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
		'});',
		''
	].join('\n');
}

/** The first line: the app, so a copy in the wrong tree says so at the top. */
export function firstLine(target) {
	return `/* ${target.name}, js/menu-desk.js: the Menu Desk (reader, sorter, desk file, inbox) as one classic script.`;
}

/* -------------------------------------------------------------------------
 * Assert, then write
 * ---------------------------------------------------------------------- */

/**
 * What must hold before a byte is written: the script parses, it carries no
 * em dash or double hyphen in any spelling, no regex literal carries a
 * character outside ASCII, and no carriage return rode in from a source.
 */
export function assertClean(text, label) {
	const problems = [];
	try {
		new vm.Script(text, { filename: label });
	} catch (e) {
		problems.push(`does not parse as a script: ${e.message}`);
	}
	const dashes = text.match(DASH);
	if (dashes) problems.push(`carries ${dashes.length} em dash(es) or double hyphen(s); the publish gate would count them`);
	if (text.includes('\r')) problems.push('carries a carriage return');
	const sf = ts.createSourceFile(label, text, ts.ScriptTarget.ES2017, true, ts.ScriptKind.JS);
	const walk = (node) => {
		if (ts.isRegularExpressionLiteral(node) && /[^\x00-\x7f]/.test(node.getText(sf))) {
			problems.push(`a regex literal still carries a character outside ASCII: ${node.getText(sf).slice(0, 60)}`);
		}
		ts.forEachChild(node, walk);
	};
	walk(sf);
	if (problems.length) throw new Error(`${label}:\n  ${problems.join('\n  ')}`);
}

export function generate(now = new Date()) {
	const shared = generateShared(now);
	return TARGETS.map((t) => {
		const text = `${firstLine(t)}\n${shared}`;
		assertClean(text, `menu-desk.js (${t.app})`);
		return { ...t, text };
	});
}

function main() {
	const dry = process.argv.includes('--dry-run');
	const files = generate();
	for (const f of files) {
		const lines = f.text.split('\n').length;
		if (dry) {
			console.log(`  ok  ${f.app}: ${lines} lines, ${f.text.length} chars, not written (--dry-run)`);
			continue;
		}
		mkdirSync(path.dirname(f.file), { recursive: true });
		writeFileSync(f.file, f.text, 'utf8');
		console.log(`  ok  ${f.app}: ${lines} lines, ${f.text.length} chars -> ${f.file}`);
	}
	console.log('  now: node tools/check-port.mjs');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	try {
		main();
	} catch (e) {
		console.error('  port-desk: ' + (e && e.message ? e.message : e));
		process.exit(1);
	}
}
