#!/usr/bin/env node
/**
 * Merge an authored draft into its section module. All or nothing.
 *
 *   node tools/deck/merge.mjs <section> <draft.json>
 *
 * A draft is what the authoring workflow returns:
 *   { cards: [...], findings?: [...], dispositions?: [...], unresolved?: [...], critic?: {...} }
 *
 * The order is the point:
 *   1. anything the workflow could not place (`unresolved`) stops the merge.
 *      The atlas pipeline matched refuter findings by exact term and silently
 *      dropped ten of sixty-eight; ten confirmed errors nearly shipped.
 *   2. a refuter finding of severity `wrong` or `verdict` whose disposition is
 *      `rejected` stops it too, until a person has looked (--accept-rejected).
 *   3. names become ids through the ledger; an unknown name stops it.
 *   4. the draft is laid over the section: it may replace a card, never add or
 *      remove one.
 *   5. the WHOLE deck is checked with the build's own contract.
 *   6. only then is the module written, and the findings and dispositions are
 *      written beside it as tools/deck/audit/<section>.json: committed
 *      provenance for why each card reads the way it does.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { checkDeck } from '../derive/floor-deck-contract.mjs';
import { DECK_SECTIONS, PACKET_TERMS, PACKET_ERRORS } from '../derive/floor-deck.mjs';
import { ROOT, AUDIT_DIR, loadSection, readLedger, resolveDraft, overlay, writeSection } from './lib.mjs';

const args = process.argv.slice(2);
const acceptRejected = args.includes('--accept-rejected');
const [sectionKey, draftFile] = args.filter((a) => !a.startsWith('--'));
const die = (m, list = []) => {
	console.error(`\n  ✗ ${m}`);
	for (const p of list) console.error(`      ${p}`);
	console.error('\n  nothing was written\n');
	process.exit(1);
};
if (!sectionKey || !draftFile) die('usage: node tools/deck/merge.mjs <section> <draft.json> [--accept-rejected]');
if (!DECK_SECTIONS.some((s) => s.key === sectionKey)) die(`no section "${sectionKey}"`);

const draft = JSON.parse(readFileSync(draftFile, 'utf8'));
if (!Array.isArray(draft.cards) || !draft.cards.length) die('a draft is { cards: [...] } and this one has none');

if (draft.unresolved?.length) die(`${draft.unresolved.length} finding(s) the workflow could not place on a card. Place each by hand or re-run; none is dropped`, draft.unresolved.map((u) => JSON.stringify(u)));

const dispositions = new Map((draft.dispositions ?? []).map((d) => [d.finding, d]));
const serious = (draft.findings ?? []).filter((f) => f.severity === 'wrong' || f.severity === 'verdict');
const undisposed = serious.filter((f) => !dispositions.has(f.key));
if (undisposed.length) die(`${undisposed.length} serious finding(s) have no disposition`, undisposed.map((f) => `${f.id}: ${f.claim}`));
const rejected = serious.filter((f) => dispositions.get(f.key)?.action === 'rejected');
if (rejected.length && !acceptRejected) {
	die(
		`${rejected.length} finding(s) of severity wrong/verdict were REJECTED by the corrector. Read each; if the corrector was right, re-run with --accept-rejected`,
		rejected.map((f) => `${f.id} [${f.lens}] ${f.claim}  ->  rejected: ${dispositions.get(f.key).reason}`)
	);
}

const ledger = readLedger();
const resolved = resolveDraft(draft.cards, ledger);
if (resolved.unresolved.length) die('the draft names cards that are not on the roster', resolved.unresolved);

const sections = [];
for (const s of DECK_SECTIONS) sections.push({ ...s, cards: await loadSection(s.key) });
const target = sections.find((s) => s.key === sectionKey);
const before = target.cards.filter((c) => c.planned !== true).length;
const laid = overlay(target.cards, resolved.cards);
if (laid.problems.length) die('the draft does not fit the section', laid.problems);
target.cards = laid.cards;

const lexicon = JSON.parse(readFileSync(join(ROOT, 'src', 'lib', 'data', 'lexicon.json'), 'utf8'));
const problems = checkDeck(sections, ledger, {
	lexiconSlugs: new Set(lexicon.map((e) => e.slug)),
	packetTerms: PACKET_TERMS,
	packetErrors: PACKET_ERRORS
});
if (problems.length) die(`the deck would hold ${problems.length} problem(s) with this draft in it`, problems);

writeSection(sectionKey, target.cards);

mkdirSync(AUDIT_DIR, { recursive: true });
const audit = {
	section: sectionKey,
	merged: new Date().toISOString().slice(0, 10),
	cards: resolved.cards.map((c) => c.id),
	findings: draft.findings ?? [],
	dispositions: draft.dispositions ?? [],
	critic: draft.critic ?? null,
	acceptedRejected: acceptRejected ? rejected.map((f) => f.key) : []
};
writeFileSync(join(AUDIT_DIR, `${sectionKey}.json`), JSON.stringify(audit, null, '\t') + '\n');

const after = target.cards.filter((c) => c.planned !== true).length;
console.log(`  ${sectionKey}: ${resolved.cards.length} card(s) merged, ${before} -> ${after} written of ${target.cards.length}`);
console.log(`  audit: tools/deck/audit/${sectionKey}.json (${audit.findings.length} finding(s), ${audit.dispositions.length} disposition(s))`);
console.log('  now: npm run build:data && node tools/deck/measure.mjs');
