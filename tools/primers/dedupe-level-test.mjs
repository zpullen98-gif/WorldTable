#!/usr/bin/env node
/**
 * One mention of the Level test per level.
 *
 *   node tools/primers/dedupe-level-test.mjs [--dry]
 *
 * Every brief carries the levelTest line, so nearly every primer closed on
 * the same sentence and a level page read it six times; the level page
 * itself shows the test door once, at the foot. This keeps the sentence in
 * the LAST primer of each level that carries it (the subsections' order,
 * so it lands where the reader finishes) and removes it from the others,
 * as whole sentences. Run after take.mjs and before build:data; it is
 * idempotent.
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SUBSECTIONS } from '../derive/levels.mjs';
import { PRIMERS_DIR } from '../derive/primers.mjs';

const dry = process.argv.includes('--dry');
const ORDER = SUBSECTIONS.map((s) => s.key);
const SENTENCE = /\s*[^.!?]*\bLevel test\b[^.!?]*[.!?]/g;

const files = readdirSync(PRIMERS_DIR)
	.filter((f) => f.endsWith('.json'))
	.map((f) => {
		const [level, subsection] = f.replace(/\.json$/, '').split('-');
		return { f, level: Number(level), subsection, text: JSON.parse(readFileSync(join(PRIMERS_DIR, f), 'utf8')) };
	})
	.sort((a, b) => a.level - b.level || ORDER.indexOf(a.subsection) - ORDER.indexOf(b.subsection));

const carries = (p) => p.text.paragraphs.some((x) => /\bLevel test\b/.test(x));
let removed = 0;
for (const level of [1, 2, 3, 4]) {
	const mine = files.filter((p) => p.level === level && carries(p));
	const keep = mine[mine.length - 1];
	for (const p of mine) {
		if (p === keep) continue;
		const before = p.text.paragraphs.join(' ');
		p.text.paragraphs = p.text.paragraphs.map((x) => x.replace(SENTENCE, '').replace(/\s{2,}/g, ' ').trim()).filter((x) => x.length);
		if (before !== p.text.paragraphs.join(' ')) {
			removed++;
			console.log(`  ${dry ? 'would remove from' : 'removed from'} ${p.f}`);
			if (!dry) writeFileSync(join(PRIMERS_DIR, p.f), JSON.stringify(p.text, null, 1) + '\n');
		}
	}
	if (keep) console.log(`  Level ${level} keeps it in ${keep.f}`);
}
console.log(`  ${removed} primer(s) ${dry ? 'would change' : 'changed'}; now npm run build:data`);
