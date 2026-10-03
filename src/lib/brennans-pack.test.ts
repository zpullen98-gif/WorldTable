/**
 * The Brennan's pack, proved the way the site proves it: tools/house/check-pack.mjs
 * reads static/shared/packs/brennans-new-orleans.v1.oothouse.json through the
 * SHIPPED engine, validates it with no fatal code (every price verbatim on the
 * guide or on a committed page snapshot), holds every mark to a person, every id
 * to its prefix, every reference to an item, every drink to two or three upsells,
 * every wine to its timed lines, every child's plate to no pairing, every drill
 * stem to one record, every upsell to a drink poured where the guest sits, the edition
 * rule (one stamp, Date.parse of house.pack.builtAt, on every mark and record),
 * and no dash and no British spelling in the house's own American English. The
 * pack is rebuilt by the chain (parse-guide, check-parse, build-brennans,
 * validate-pack, keep-all --owner-reviewed) and never patched; this test spawns
 * the gate, reads the counts it prints and spot-checks the file.
 */
import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const PACK = join(ROOT, 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json');
const EDITION = '2026-10-03T21:00:00.000Z';

interface Row {
	id: string;
	name: string;
	section: string;
	price: string;
	ts: number;
	zeroProof?: boolean;
	pairing?: unknown;
	pairs?: unknown;
	upsells?: { value: string[]; by: string };
	meals?: string[];
	glass?: string;
	parts?: { value: Record<string, string> };
	say?: { value: string };
	term?: string;
	itemIds?: string[];
}

function house(): Record<string, Row[]> & { pack: unknown } {
	return JSON.parse(readFileSync(PACK, 'utf8')).house;
}

describe("the Brennan's pack", () => {
	it('is shipped and passes tools/house/check-pack.mjs through the shipped engine', () => {
		expect(existsSync(PACK)).toBe(true);
		const r = spawnSync(process.execPath, [join(ROOT, 'tools', 'house', 'check-pack.mjs')], { cwd: ROOT, encoding: 'utf8' });
		expect(r.status, r.stdout + r.stderr).toBe(0);
		expect(r.stdout).toContain('1176 marks all by person');
		expect(r.stdout).toContain('62 dishes, 23 cocktails (6 spirit-free, 9 pairings on a coffee)');
		expect(r.stdout).toContain('20 wines (20 with timed lines)');
		expect(r.stdout).toContain('123 terms, 34 scenarios');
		expect(r.stdout).toContain('64 to ask');
		expect(r.stdout).toContain(`edition ${EDITION}`);
		expect(r.stdout).toContain('0 fatal');
	});

	it('carries the edition stamp on the pack and on every record', () => {
		const h = house();
		const stamp = Date.parse(EDITION);
		expect(h.pack).toEqual({ id: 'brennans-new-orleans', builtBy: 'claude-code', builtAt: EDITION, version: 1 });
		for (const list of ['tastings', 'dishes', 'wines', 'cocktails', 'lexicon', 'scenarios', 'mixUps', 'mustKnows', 'askAtLineup', 'disputes']) {
			for (const row of h[list]) expect(row.ts, `${list} ${row.id}`).toBe(stamp);
		}
	});

	it('gives every drink two or three kept upsells, and a spirit-free drink only spirit-free ones', () => {
		const h = house();
		const byId = new Map(h.cocktails.map((c) => [c.id, c]));
		for (const c of h.cocktails) {
			expect(c.upsells, c.name).toBeTruthy();
			const ups = c.upsells!.value;
			expect(c.upsells!.by).toBe('person');
			expect(ups.length).toBeGreaterThanOrEqual(2);
			expect(ups.length).toBeLessThanOrEqual(3);
			for (const id of ups) {
				const to = byId.get(id);
				expect(to, `${c.name} upsells ${id}`).toBeTruthy();
				if (c.zeroProof) expect(to!.zeroProof, `${c.name} upsells a drink with alcohol`).toBe(true);
			}
		}
	});

	it('gives no two dishes one sauce or sides stem, and no two items or terms one say', () => {
		const h = house();
		const fold = (t: string) => t.trim().toLowerCase().replace(/\s+/g, ' ');
		const clash = (rows: Array<[string, string, string]>) => {
			const seen = new Map<string, string>();
			for (const [answer, stem, where] of rows) {
				const f = fold(stem);
				if (!f || f.includes(fold(answer))) continue;
				const before = seen.get(f);
				expect(before === undefined || before === fold(answer), `${where} shares its stem "${stem}"`).toBe(true);
				seen.set(f, fold(answer));
			}
		};
		for (const part of ['sauce', 'sides']) {
			const rows = h.dishes.map((d): [string, string, string] => [d.name, d.parts?.value[part] ?? '', `${d.name} parts.${part}`]);
			for (const [, stem, where] of rows) expect(/\b(not printed|nothing printed)\b|^ask the (kitchen|bar)\b/i.test(stem), `${where} is filler`).toBe(false);
			clash(rows);
		}
		const items = ([] as Row[]).concat(h.dishes, h.wines, h.cocktails);
		clash(
			items
				.map((r): [string, string, string] => [r.name, r.say?.value ?? '', `${r.name} say`])
				.concat(h.lexicon.map((t): [string, string, string] => [t.term ?? '', t.say?.value ?? '', `term ${t.term} say`]))
		);
		expect(h.cocktails.find((c) => c.name === 'Classic Sazerac')!.glass).toBe('');
	});

	it('upsells only to a drink poured where the guest sits', () => {
		const h = house();
		const seat: Record<string, string> = { 'Breakfast & lunch': 'breakfast', 'Breakfast tasting': 'breakfast', Dinner: 'dinner', 'Dinner tasting': 'dinner', 'Roost Bar & Lounge': 'bar', "Bubbles at Brennan's": 'bar' };
		const seats = (r: Row) => new Set((r.meals ?? []).map((m) => seat[m] ?? m));
		const byId = new Map(h.cocktails.map((c) => [c.id, c]));
		for (const c of h.cocktails) {
			for (const id of c.upsells!.value) {
				const there = seats(byId.get(id)!);
				for (const s of seats(c)) expect(there.has(s), `${c.name} upsells ${byId.get(id)!.name}, not poured at ${s}`).toBe(true);
			}
		}
	});

	it('links a term only to the items it describes', () => {
		const h = house();
		const id = (name: string) => ([] as Row[]).concat(h.dishes, h.cocktails).find((r) => r.name === name)!.id;
		const term = (t: string) => h.lexicon.find((x) => x.term === t)!;
		expect(term('Chicory').itemIds).not.toContain(id('Congregation Single-Origin Coffee'));
		expect(term('Chicory').itemIds).toContain(id('New Orleans-Style Coffee with Chicory'));
		expect(term("Peychaud's").itemIds).not.toContain(id('Yellowstone'));
		expect(term("Peychaud's Aperitivo").itemIds).toContain(id('Yellowstone'));
		expect(term('Brabant potatoes').say!.value).toBe('bra-BAHNT');
	});

	it("never pairs a child's plate", () => {
		const kids = house().dishes.filter((d) => d.section.startsWith("Children's"));
		expect(kids.length).toBe(8);
		for (const d of kids) {
			expect(d.pairing).toBeUndefined();
			expect(d.pairs).toBeUndefined();
			expect(d.price).toBe('$25.00');
		}
	});
});
