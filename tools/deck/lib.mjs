/**
 * What the Floor Deck's authoring tools share: where the section modules and
 * the ledger live, how a section is read back, and the ONE serializer that
 * writes a section module, so merge.mjs and the roster produce the same bytes
 * for the same cards and a diff shows words, not formatting.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CARD_KEYS } from '../derive/floor-deck-contract.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, '..', '..');
export const SECTIONS_DIR = join(ROOT, 'tools', 'derive', 'floor-deck');
export const LEDGER_PATH = join(ROOT, 'tools', 'derive', 'floor-deck.ledger.json');
export const AUDIT_DIR = join(HERE, 'audit');
export const OUT_DIR = join(HERE, 'out');

/** @param {string} key */
export const sectionPath = (key) => join(SECTIONS_DIR, `${key}.mjs`);

/**
 * Read a section module as it is on disk NOW. The query string defeats the
 * module cache: these tools write a file and read it back in one process.
 *
 * @param {string} key
 * @returns {Promise<Array<Record<string, any>>>}
 */
export async function loadSection(key) {
	const file = sectionPath(key);
	if (!existsSync(file)) throw new Error(`no section module ${file}`);
	const stamp = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
	const mod = await import(`${pathToFileURL(file).href}?v=${stamp}`);
	if (!Array.isArray(mod.default)) throw new Error(`${file}: the default export is not an array`);
	return mod.default;
}

/** @returns {{ next: number, cards: Array<{ id: string, term: string, was?: string[], retired?: string }> }} */
export function readLedger() {
	if (!existsSync(LEDGER_PATH)) throw new Error(`BUILD INPUT MISSING: ${LEDGER_PATH}`);
	return JSON.parse(readFileSync(LEDGER_PATH, 'utf8'));
}

/**
 * One row per line, so a minted card is a one-line diff and a rename or a
 * swap is visible at a glance in review.
 *
 * @param {{ next: number, cards: Array<Record<string, unknown>> }} ledger
 */
export function writeLedger(ledger) {
	const rows = ledger.cards.map((r) => `    ${JSON.stringify(r).replace(/^\{/, '{ ').replace(/\}$/, ' }').replace(/","/g, '", "').replace(/":"/g, '": "').replace(/":\[/g, '": [')}`);
	const text = `{\n  "next": ${ledger.next},\n  "cards": [\n${rows.join(',\n')}\n  ]\n}\n`;
	JSON.parse(text); // never write a ledger that does not parse
	writeFileSync(LEDGER_PATH, text);
}

/** A JS string literal: single quotes unless the text has one. */
const lit = (s) =>
	String(s).includes("'")
		? JSON.stringify(String(s))
		: `'${String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n')}'`;

const STUB_ORDER = ['id', 'term', 'packet', 'planned'];

/** @param {unknown} v @param {string} pad */
function value(v, pad) {
	if (typeof v === 'string') return lit(v);
	if (typeof v === 'boolean' || typeof v === 'number') return String(v);
	if (Array.isArray(v)) {
		if (v.every((x) => typeof x === 'string')) return `[${v.map(lit).join(', ')}]`;
		return `[\n${v.map((x) => `${pad}\t\t${value(x, pad + '\t')}`).join(',\n')}\n${pad}\t]`;
	}
	if (v && typeof v === 'object') {
		return `{ ${Object.entries(v).map(([k, x]) => `${k}: ${value(x, pad)}`).join(', ')} }`;
	}
	throw new Error(`cannot serialize ${typeof v}`);
}

/**
 * @param {Record<string, any>} card
 * @returns {string}
 */
export function serializeCard(card) {
	if (card.planned === true) {
		const keys = STUB_ORDER.filter((k) => card[k] !== undefined);
		return `\t{ ${keys.map((k) => `${k}: ${value(card[k], '')}`).join(', ')} }`;
	}
	const keys = [...CARD_KEYS.filter((k) => card[k] !== undefined), ...Object.keys(card).filter((k) => !CARD_KEYS.includes(k))];
	return `\t{\n${keys.map((k) => `\t\t${k}: ${value(card[k], '\t')}`).join(',\n')}\n\t}`;
}

/**
 * @param {string} key
 * @param {Array<Record<string, any>>} cards
 */
export function writeSection(key, cards) {
	const text =
		`/* The Floor Deck, section "${key}". Written by tools/deck/merge.mjs and\n` +
		`   tools/deck/mint-ids.mjs, hand-editable afterwards (a merge keeps every\n` +
		`   field and loses comments). The contract is\n` +
		`   tools/derive/floor-deck-contract.mjs; an id is minted, never typed. */\n` +
		`/** @type {import('../floor-deck-contract.mjs').AuthoredCard[]} */\n` +
		`const cards = [\n${cards.map(serializeCard).join(',\n')}\n];\n\nexport default cards;\n`;
	writeFileSync(sectionPath(key), cards.length ? text : text.replace('const cards = [\n\n];', 'const cards = [];'));
}

/**
 * A draft may name other cards by TERM (`confusedWithTerms`, `seeAlsoTerms`),
 * because a writer knows "Skirt Steak" and not fd_0097. This turns them into
 * ids through the ledger and reports anything it cannot place. It never drops
 * a name silently: the atlas pipeline once matched findings by exact term and
 * lost ten confirmed errors that way.
 *
 * @param {Array<Record<string, any>>} cards
 * @param {{ cards: Array<{ id: string, term: string, retired?: string }> }} ledger
 * @returns {{ cards: Array<Record<string, any>>, unresolved: string[] }}
 */
export function resolveDraft(cards, ledger) {
	const fold = (/** @type {string} */ s) =>
		String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
	const byTerm = new Map(ledger.cards.filter((r) => !r.retired).map((r) => [fold(r.term), r.id]));
	/** @type {string[]} */
	const unresolved = [];
	const out = cards.map((card) => {
		const c = { ...card };
		for (const [from, to] of [['confusedWithTerms', 'confusedWith'], ['seeAlsoTerms', 'seeAlso']]) {
			if (c[from] === undefined) continue;
			const ids = [...(c[to] ?? [])];
			for (const name of c[from]) {
				const id = byTerm.get(fold(name));
				if (!id) unresolved.push(`${c.id} ${JSON.stringify(c.term)}: ${from} names ${JSON.stringify(name)}, which is no card on the roster`);
				else if (id !== c.id && !ids.includes(id)) ids.push(id);
			}
			delete c[from];
			if (ids.length) c[to] = ids;
		}
		return c;
	});
	return { cards: out, unresolved };
}

/**
 * Lay a draft over a section: a draft card REPLACES the card with its id and
 * keeps that card's `packet` flag. A draft never adds an id the roster does
 * not hold and never removes a card.
 *
 * @param {Array<Record<string, any>>} existing
 * @param {Array<Record<string, any>>} draft
 * @returns {{ cards: Array<Record<string, any>>, problems: string[] }}
 */
export function overlay(existing, draft) {
	/** @type {string[]} */
	const problems = [];
	const byId = new Map(existing.map((c) => [c.id, c]));
	const seen = new Set();
	for (const d of draft) {
		if (!byId.has(d.id)) problems.push(`${d.id} ${JSON.stringify(d.term)} is not a card of this section. A new card is added to the module with id: 'NEW' and minted first`);
		if (seen.has(d.id)) problems.push(`${d.id} appears twice in the draft`);
		seen.add(d.id);
	}
	const drafted = new Map(draft.map((d) => [d.id, d]));
	const cards = existing.map((c) => {
		const d = drafted.get(c.id);
		if (!d) return c;
		const next = { ...d };
		delete next.planned;
		if (c.packet === true) next.packet = true;
		else delete next.packet;
		return next;
	});
	return { cards, problems };
}
