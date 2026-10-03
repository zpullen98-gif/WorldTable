/**
 * port-core.mjs: the engine under every port of TypeScript modules into ONE
 * classic script for the plain wings.
 *
 * Not a script to run. port-desk.mjs (the Menu Desk into js/menu-desk.js) and
 * port-house.mjs (the House into static/shared/oot-house.js) import it and
 * describe their own bundle: which modules in which order, what sits above
 * the IIFE, how the IIFE opens and what its door out says. Everything the two
 * ports share lives here, so a fix to the transpile, the strip, the collision
 * rule or the clean gate reaches every port with one edit and the two never
 * drift the way the three hand copies of the old parser did.
 *
 * WHAT A PORT IS. Each module is read, transpiled with the TypeScript compiler
 * already in node_modules, stripped of its import and export statements, and
 * joined to the others in dependency order inside one IIFE. The comments ride
 * along (removeComments is off) because they are the specification and let a
 * wing's copy be diffed against its source. A compiler helper (__assign for an
 * object spread at ES2017) is lifted out and emitted once for the whole file.
 * Two modules may not declare the same top-level name: inside one function
 * scope a second const is a syntax error and a second function is a silent
 * replacement, so bundleModules refuses the collision before a byte is written.
 *
 * WHY ES2017 AND WHY THE ESCAPES. ES2017 is what the wings' oldest supported
 * browsers run without help; object spread and optional chaining are compiled
 * down. Every character outside ASCII inside a regex literal is rewritten as a
 * \uXXXX escape, because the suite's publish gate counts em dashes across the
 * built tree and one dash inside a character class, shipped twice, would spend
 * the baseline; the gate counts the escape separately and on purpose. Word
 * lists keep their accents: they are data, and a region printed with an accent
 * should match.
 *
 * THE CLEAN GATE. assertClean refuses a script that does not parse, carries an
 * em dash or a double hyphen in any spelling, carries a carriage return, or
 * keeps a regex literal with a character outside ASCII. Every port runs it on
 * every file before writing, which is why a comment in a ported module may
 * never carry a dash of any kind.
 */
import ts from 'typescript';
import vm from 'node:vm';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** The repository root, the directory above tools/. */
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * One module to port: the file on disk and the label its banner carries,
 * which is its path from the repository root with forward slashes.
 * @typedef {{ label: string, file: string }} Unit
 */

/**
 * A module as a script body, with the names it declares at the top level.
 * @typedef {{ body: string, declared: string[] }} ScriptBody
 */

/**
 * The bundled modules: one banner and body per unit in order, the compiler
 * helpers found (name to source, first copy kept) and which unit owns each
 * top-level name.
 * @typedef {{ parts: string[], helpers: Map<string, string>, owner: Map<string, string> }} Bundle
 */

/**
 * One file a port writes: a short name for the log line, where it goes and
 * the whole text.
 * @typedef {{ app: string, file: string, text: string }} PortFile
 */

/**
 * The em dash, however it is spelled, and the double hyphen: what the publish
 * gate counts. Built from escapes, so this file passes the rule it enforces.
 */
export const DASH = new RegExp(['\\u2014', '&' + 'mdash;', '&#' + '8212;', '&#' + 'x2014;', ' ' + '-- '].join('|'), 'g');

/** The banner above the lines that let names out of the IIFE. */
export const DOOR_BANNER = '/* ==================== the door out ==================== */';

/* -------------------------------------------------------------------------
 * Units
 * ---------------------------------------------------------------------- */

/**
 * A unit for a file, labelled by its path from the repository root.
 * @param {string} file an absolute path
 * @returns {Unit}
 */
export function unitFor(file) {
	return { label: path.relative(ROOT, file).split(path.sep).join('/'), file };
}

/**
 * The units for the named modules of one directory, in the order given.
 * @param {string} dir the directory holding the .ts files
 * @param {readonly string[]} names module names without the extension, in dependency order
 * @returns {Unit[]}
 */
export function unitsIn(dir, names) {
	return names.map((name) => unitFor(path.join(dir, name + '.ts')));
}

/* -------------------------------------------------------------------------
 * Transpile and strip
 * ---------------------------------------------------------------------- */

/**
 * One module through the compiler, with its comments, or a thrown diagnostic.
 * @param {string} file the .ts file to read
 * @param {string} label the name a diagnostic reports
 * @returns {string} the ES module as JavaScript
 */
export function transpile(file, label) {
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

/**
 * A character outside ASCII as its \uXXXX escape; a surrogate half is escaped
 * on its own, which every regex mode reads as the pair.
 * @param {string} text
 * @returns {string}
 */
export function escapeRegex(text) {
	return text.replace(/[^\x00-\x7f]/g, (ch) => '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0'));
}

/**
 * The compiled module as a script body: imports and export lists gone, the
 * `export` keyword off every declaration, compiler helpers lifted out into
 * `helpers` (one copy for the whole bundle), every regex literal ASCII.
 * Returns the body and the names it declares at the top level, so the
 * caller can refuse a collision before the bundle is written.
 * @param {string} js the transpiled module
 * @param {string} label the name the parser reports
 * @param {Map<string, string>} helpers the bundle's compiler helpers, filled here
 * @returns {ScriptBody}
 */
export function toScriptBody(js, label, helpers) {
	const sf = ts.createSourceFile(label + '.js', js, ts.ScriptTarget.ES2017, true, ts.ScriptKind.JS);
	/** @type {Array<{ start: number, end: number, text: string }>} */
	const edits = [];
	/** @type {string[]} */
	const declared = [];
	/** @param {number} start @param {number} end */
	const cut = (start, end) => edits.push({ start, end, text: '' });
	/* Take the line break with the statement, so a stripped import leaves no blank line behind. */
	/** @param {number} end */
	const lineEnd = (end) => (js[end] === '\n' ? end + 1 : end);

	for (const st of sf.statements) {
		if (ts.isImportDeclaration(st) || ts.isExportDeclaration(st) || ts.isExportAssignment(st)) {
			cut(st.getStart(sf), lineEnd(st.getEnd()));
			continue;
		}
		const mods = ts.canHaveModifiers(st) ? ts.getModifiers(st) : undefined;
		const exp = mods && mods.find((m) => m.kind === ts.SyntaxKind.ExportKeyword);
		if (exp) {
			const gap = (js.slice(exp.getEnd()).match(/^\s*/) || [''])[0].length;
			cut(exp.getStart(sf), exp.getEnd() + gap);
		}
		if (ts.isFunctionDeclaration(st) && st.name) declared.push(st.name.text);
		if (ts.isClassDeclaration(st) && st.name) declared.push(st.name.text);
		if (ts.isVariableStatement(st)) {
			const names = st.declarationList.declarations.filter((d) => ts.isIdentifier(d.name)).map((d) => /** @type {ts.Identifier} */ (d.name).text);
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

	/** @param {ts.Node} node */
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

/**
 * Every unit transpiled, stripped and bannered, in order, with the collision
 * rule enforced: two units may not declare one top-level name.
 * @param {readonly Unit[]} units in dependency order; each may use only what sits above it
 * @returns {Bundle}
 */
export function bundleModules(units) {
	/** @type {Map<string, string>} */
	const helpers = new Map();
	/** @type {string[]} */
	const parts = [];
	/** @type {Map<string, string>} */
	const owner = new Map();
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
	return { parts, helpers, owner };
}

/**
 * The whole script under its first line: the header, the prelude, the IIFE's
 * opening lines, the compiler helpers once, every unit's body, the door
 * banner and the door, then a final newline. Pure, so a test can generate in
 * memory and compare.
 *
 * The caller owns every word that is not a module: `header` is the comment
 * block that says what the file is, `prelude` the lines between it and the
 * IIFE (the Menu Desk's var list), `opener` the IIFE's first lines, `door`
 * everything after the bodies through the IIFE's close. `expects` names
 * which some unit must declare, so a door that reads an undeclared name
 * fails here and not at first use in the app.
 * @param {{
 *   units: readonly Unit[],
 *   header: string,
 *   prelude?: readonly string[],
 *   opener?: readonly string[],
 *   door?: readonly string[],
 *   expects?: readonly string[]
 * }} spec
 * @returns {string}
 */
export function portModules({ units, header, prelude = [], opener = ['(function () {', "'use strict';"], door = ['})();'], expects = [] }) {
	const { parts, helpers, owner } = bundleModules(units);
	for (const name of expects) {
		if (!owner.has(name)) throw new Error(`no module declares "${name}", so it cannot be exposed`);
	}
	return [
		header,
		...prelude,
		...opener,
		helpers.size
			? `/* The compiler's own helpers, emitted once for the whole file. */\n${[...helpers.values()].join('\n')}\n`
			: '',
		parts.join('\n'),
		DOOR_BANNER,
		...door,
		''
	].join('\n');
}

/* -------------------------------------------------------------------------
 * Assert, then write
 * ---------------------------------------------------------------------- */

/**
 * What must hold before a byte is written: the script parses, it carries no
 * em dash or double hyphen in any spelling, no regex literal carries a
 * character outside ASCII, and no carriage return rode in from a source.
 * @param {string} text the whole script
 * @param {string} label the name a problem reports
 */
export function assertClean(text, label) {
	/** @type {string[]} */
	const problems = [];
	try {
		new vm.Script(text, { filename: label });
	} catch (e) {
		const err = /** @type {{ message?: string }} */ (e);
		problems.push(`does not parse as a script: ${err.message}`);
	}
	const dashes = text.match(DASH);
	if (dashes) problems.push(`carries ${dashes.length} em dash(es) or double hyphen(s); the publish gate would count them`);
	if (text.includes('\r')) problems.push('carries a carriage return');
	const sf = ts.createSourceFile(label, text, ts.ScriptTarget.ES2017, true, ts.ScriptKind.JS);
	/** @param {ts.Node} node */
	const walk = (node) => {
		if (ts.isRegularExpressionLiteral(node) && /[^\x00-\x7f]/.test(node.getText(sf))) {
			problems.push(`a regex literal still carries a character outside ASCII: ${node.getText(sf).slice(0, 60)}`);
		}
		ts.forEachChild(node, walk);
	};
	walk(sf);
	if (problems.length) throw new Error(`${label}:\n  ${problems.join('\n  ')}`);
}

/**
 * Each file written where it goes, with one log line per file; with `dry`
 * on, the log lines alone. The directory is made if it is missing.
 * @param {readonly PortFile[]} files
 * @param {boolean} dry
 */
export function writePorts(files, dry) {
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
}

/**
 * Runs `main` when the module at `importMetaUrl` is the script node was
 * given, and nothing when it was imported; a thrown error prints under the
 * port's name and exits 1.
 * @param {string} name the port's name for the error line, such as port-desk
 * @param {string} importMetaUrl the caller's import.meta.url
 * @param {() => void} main
 */
export function runMain(name, importMetaUrl, main) {
	if (!(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(importMetaUrl))) return;
	try {
		main();
	} catch (e) {
		const err = /** @type {{ message?: string } | null} */ (e);
		console.error(`  ${name}: ` + (err && err.message ? err.message : err));
		process.exit(1);
	}
}
