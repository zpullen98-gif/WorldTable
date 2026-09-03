/**
 * extract-writer.mjs: REGENERATE src/lib/data/raw/ from the archived original.
 *
 * THIS REVERTS AUTHORED WORK. `raw/` wears a generated-data name and is not
 * generated data any more. Measured by reading the archive through extract-lib
 * and diffing against what is committed: this would put back 3,919 em-dashes
 * across 7 of the 15 files - 2,028 in R alone, 1,664 in D - where `raw/` holds
 * ZERO, because three deliberate commits (d0ba35c, 2f98cd5, f741ca2) swept
 * them out.
 *
 * And nothing downstream would notice. `verify:data` proves raw/ WORD-identical
 * to the archive, not byte-identical - that is the whole point of it, since
 * byte-identical stopped being the invariant the moment the sweep landed. So
 * all 53 checks pass, the build is green, and 3,919 em-dashes the author
 * removed on purpose are back in the shipped app.
 *
 * It used to be `npm run extract`, one tab-complete away, and the reader half
 * that three tools import lived in the same file. Both are fixed: the reader is
 * extract-lib.mjs, the npm script is gone, and this refuses to run without
 * --i-know-this-reverts-authored-work.
 *
 * To be clear about what is NOT lost: the archive is still in the tree and this
 * still works. It just cannot happen by accident.
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	ROOT,
	SOURCE,
	TARGETS,
	EXPECTED,
	extract,
	toSerializable,
	reviveRegex,
	charSum
} from './extract-lib.mjs';

const OUT_DIR = join(ROOT, 'src', 'lib', 'data', 'raw');
const CONFIRM = '--i-know-this-reverts-authored-work';

function main() {
	const html = readFileSync(SOURCE, 'utf8');
	const found = extract(html);

	mkdirSync(OUT_DIR, { recursive: true });

	const report = [];
	for (const name of TARGETS) {
		const value = found.get(name);
		const serializable = toSerializable(value);
		const json = JSON.stringify(serializable, null, 2);

		// Round-trip check right here, before we write. If the emitted JSON does
		// not revive back to something char-identical, we have already lost data
		// and there is no point continuing.
		const revived = reviveRegex(JSON.parse(json));
		const a = charSum(value);
		const b = charSum(revived);
		if (a.chars !== b.chars || a.leaves !== b.leaves) {
			throw new Error(
				`${name}: round-trip lost data: ` +
					`${a.chars}/${a.leaves} chars/leaves in, ${b.chars}/${b.leaves} out`
			);
		}

		const file = join(OUT_DIR, `${name}.json`);
		writeFileSync(file, json + '\n', 'utf8');

		const count = Array.isArray(value) ? value.length : Object.keys(value).length;
		report.push({ name, count, chars: a.chars, leaves: a.leaves });
	}

	const w = (s, n) => String(s).padEnd(n);
	console.log(`\n  extracted from ${SOURCE.replace(ROOT, '.')}\n`);
	console.log(`  ${w('target', 14)}${w('count', 8)}${w('chars', 10)}leaves`);
	console.log(`  ${'─'.repeat(44)}`);
	for (const r of report) {
		const expected = EXPECTED[r.name];
		const mark = expected === undefined ? ' ' : r.count === expected ? '✓' : '✗';
		console.log(`  ${w(r.name, 14)}${w(r.count, 8)}${w(r.chars, 10)}${w(r.leaves, 8)}${mark}`);
	}
	const total = report.reduce((s, r) => s + r.chars, 0);
	console.log(`  ${'─'.repeat(44)}`);
	console.log(`  ${w('TOTAL', 14)}${w('', 8)}${w(total, 10)}\n`);
	console.log(`  wrote ${report.length} files to ${OUT_DIR.replace(ROOT, '.')}\n`);
}

if (!process.argv.includes(CONFIRM)) {
	console.error(
		[
			'',
			'  extract-writer.mjs refuses to run.',
			'',
			`  It rewrites src/lib/data/raw/ from ${SOURCE.replace(ROOT, '.')}, which would`,
			'  put back 3,919 em-dashes across 7 files that three commits swept out, and',
			'  every gate would still pass: verify:data compares WORDS, not bytes.',
			'',
			'  If you have read that and still mean it:',
			`    node tools/extract-writer.mjs ${CONFIRM}`,
			''
		].join('\n')
	);
	process.exit(1);
}
main();
