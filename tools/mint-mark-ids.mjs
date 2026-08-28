/**
 * Mint a frozen id for every mark in the authored standards.
 *
 * WHY IDS AND NEVER INDICES. A cook's annotation says "the crust mark was off".
 * Stored as an index, inserting a mark at position 2 silently repoints four
 * months of history to a different sentence, and no gate can see it happen —
 * the array is still the same length it should be and every entry still points
 * at something. Stored as an id bound to the sentence, an insert is free, an
 * edit to the wording is free, and a DROP is loud.
 *
 * This is the rule the Codex already holds for question ids: minted ids make
 * stems safe to edit, and a changed id orphans progress.
 *
 * IT REWRITES THE PROSE FILES, so it is built to be incapable of touching the
 * prose. It finds each `marks: [` block, walks it with a string-aware scanner,
 * and WRAPS each string literal with `{ id: '…', text: <the original bytes> }`
 * without re-emitting the literal. The mark text cannot change because it is
 * never rewritten — and build-data compares the parsed text against a snapshot
 * anyway.
 *
 * ADDITIVE ONLY. A mark that already has an id is left exactly as it is. Run it
 * as often as you like; it only ever mints for marks that have none.
 *
 * Usage:  node tools/mint-mark-ids.mjs [--dry]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const FILES = ['tools/derive/standards.mjs', 'tools/derive/technique-standards.mjs'];
const DRY = process.argv.includes('--dry');

/** Words too common to identify a mark by. */
const STOP = new Set([
	'the', 'and', 'not', 'but', 'for', 'with', 'from', 'into', 'over', 'under',
	'that', 'this', 'them', 'they', 'when', 'what', 'which', 'while', 'where',
	'have', 'has', 'had', 'been', 'was', 'were', 'are', 'its', 'it', 'a', 'an',
	'of', 'in', 'on', 'at', 'to', 'is', 'no', 'any', 'all', 'one', 'two',
	'every', 'each', 'both', 'more', 'most', 'less', 'than', 'then', 'there',
	'without', 'within', 'through', 'across', 'against', 'before', 'after',
	'still', 'never', 'always', 'only', 'just', 'very', 'about', 'around',
	'take', 'takes', 'taken', 'give', 'gives', 'goes', 'gone', 'come', 'comes'
]);

/**
 * A short human token from the mark's own opening words — `seam`, `cigar`,
 * `wobble`. Read at a glance in a diff, which an index or a hash is not.
 */
function tokenFor(text, used) {
	const words = text
		.toLowerCase()
		.replace(/[^a-z\s-]/g, ' ')
		.split(/\s+/)
		.filter((w) => w.length >= 4 && !STOP.has(w));
	let base = words[0] ?? 'mark';
	if (base.length > 14) base = base.slice(0, 14);
	let id = base;
	let n = 2;
	while (used.has(id)) id = `${base}${n++}`;
	used.add(id);
	return id;
}

/** Walk from `[` to its matching `]`, string-aware, returning literal spans. */
function literalsIn(src, open) {
	const spans = [];
	let i = open + 1;
	let depth = 1;
	while (i < src.length) {
		const c = src[i];
		if (c === '[') depth++;
		else if (c === ']') {
			depth--;
			if (depth === 0) return { spans, close: i };
		} else if (c === "'" || c === '"' || c === '`') {
			const start = i;
			const quote = c;
			i++;
			while (i < src.length) {
				if (src[i] === '\\') i += 2;
				else if (src[i] === quote) break;
				else i++;
			}
			spans.push({ start, end: i + 1 });
		} else if (c === '{') {
			// Already minted — skip the whole object so its text is untouched.
			let d = 1;
			i++;
			while (i < src.length && d > 0) {
				if (src[i] === '{') d++;
				else if (src[i] === '}') d--;
				else if (src[i] === "'" || src[i] === '"') {
					const q = src[i];
					i++;
					while (i < src.length && src[i] !== q) i += src[i] === '\\' ? 2 : 1;
				}
				i++;
			}
			spans.push({ skipped: true });
			continue;
		}
		i++;
	}
	throw new Error('unterminated marks array');
}

let totalMinted = 0;
const ledger = [];

for (const file of FILES) {
	const src = readFileSync(file, 'utf8');
	let out = '';
	let cursor = 0;
	let minted = 0;

	// Each standard's slug, so an id reads `<slug>#<token>`.
	const slugRe = /slug:\s*['"]([a-z0-9-]+)['"]/g;
	const marksRe = /marks:\s*\[/g;

	const slugs = [...src.matchAll(slugRe)].map((m) => ({ slug: m[1], at: m.index }));
	const markBlocks = [...src.matchAll(marksRe)].map((m) => m.index + m[0].length - 1);

	for (const open of markBlocks) {
		const owner = [...slugs].reverse().find((s) => s.at < open);
		if (!owner) throw new Error(`no slug before marks block at ${open}`);
		const { spans } = literalsIn(src, open);
		const used = new Set();
		const real = spans.filter((s) => !s.skipped);
		if (spans.some((s) => s.skipped)) {
			// Mixed or already-minted block: leave the whole thing alone.
			continue;
		}
		for (const span of real) {
			const literal = src.slice(span.start, span.end);
			// eslint-disable-next-line no-eval
			const text = eval(literal);
			const id = `${owner.slug}#${tokenFor(text, used)}`;
			ledger.push({ id, standard: owner.slug });
			out += src.slice(cursor, span.start) + `{ id: '${id}', text: ${literal} }`;
			cursor = span.end;
			minted++;
		}
	}
	out += src.slice(cursor);

	if (minted) {
		totalMinted += minted;
		if (!DRY) writeFileSync(file, out, 'utf8');
		console.log(`  ${file.padEnd(40)} ${minted} minted${DRY ? ' (dry run)' : ''}`);
	} else {
		console.log(`  ${file.padEnd(40)} nothing to mint`);
	}
}

console.log(`\n  ${totalMinted} mark ids minted total`);
if (!DRY && totalMinted) {
	console.log('  Now run: npm run build:data  (the ledger gate writes/checks the ledger)');
}
