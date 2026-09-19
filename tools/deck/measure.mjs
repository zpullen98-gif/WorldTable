#!/usr/bin/env node
/**
 * What the deck weighs now, and what it will weigh at 300.
 *
 *   node tools/deck/measure.mjs
 *
 * The precache cap was raised to 2.65 MB for a deck of at most
 * DECK_GZ_CEILING bytes, and the five study routes share what is left. The
 * build fails when the ceiling is passed; this fails EARLIER, when the rate a
 * section was written at would pass it by the time all 300 are in, which is
 * when trimming one section is still cheaper than trimming fifteen.
 *
 * Measured, never extrapolated from one card: gzip exploits the vocabulary
 * cards share, so the three hundredth costs less than the first. The atlas
 * taught this the expensive way (773 B for one entry, 451 B each for 300).
 * That is why the projection below uses the running per-card figure and says
 * which way it is likely to be wrong.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildFloorDeck, DECK_GZ_CEILING } from '../derive/floor-deck.mjs';
import { ROOT, readLedger } from './lib.mjs';
import { gzipSync } from 'node:zlib';

const recipes = JSON.parse(readFileSync(join(ROOT, 'src', 'lib', 'data', 'recipes.index.json'), 'utf8'));
const { floorDeck, floorDeckTraps, floorDeckIndex, problems } = buildFloorDeck({ recipes });

const gz = (v) => gzipSync(JSON.stringify(v)).length;
const parts = { 'floor-deck.json': gz(floorDeck), 'floor-deck.traps.json': gz(floorDeckTraps), 'floor-deck.index.json': gz(floorDeckIndex) };
const bytes = Object.values(parts).reduce((a, b) => a + b, 0);
const cards = floorDeck.cards.length;
const planned = readLedger().cards.filter((r) => !r.retired).length;

if (!cards) {
	console.log('  no card is written yet; nothing to measure');
	process.exit(0);
}
const per = bytes / cards;
const projected = Math.round(per * planned);
for (const [name, n] of Object.entries(parts)) console.log(`  ${name.padEnd(24)} ${(n / 1024).toFixed(1).padStart(7)} KB gz`);
console.log(`  ${'total'.padEnd(24)} ${(bytes / 1024).toFixed(1).padStart(7)} KB gz, ${cards} cards, ${Math.round(per)} B per card`);
console.log(`  projected at ${planned}: ${(projected / 1024).toFixed(1)} KB against a ceiling of ${(DECK_GZ_CEILING / 1024).toFixed(1)} KB (an over-estimate while the deck is small: shared vocabulary makes later cards cheaper)`);
for (const s of floorDeck.sections.filter((x) => x.count)) {
	const mine = floorDeck.cards.filter((c) => c.section === s.key);
	const prose = mine.reduce((n, c) => n + [c.gist, c.guest, c.why, c.note, c.origin, c.pairs, c.notThis, c.line].join('').length, 0);
	console.log(`    ${s.key.padEnd(13)} ${String(s.count).padStart(3)} cards, mean prose ${Math.round(prose / s.count)} characters`);
}
if (problems.length) {
	console.error(`\n  ${problems.length} problem(s) on the emitted shape`);
	for (const p of problems) console.error(`    ✗ ${p}`);
}
/* Only a deck at least a fifth written projects tightly enough to fail on. */
const over = cards >= planned / 5 && projected > DECK_GZ_CEILING;
if (over) console.error(`\n  ✗ at this rate the finished deck passes its ceiling. Tighten this section now; the ceiling does not move\n`);
process.exit(problems.length || over ? 1 : 0);
