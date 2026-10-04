/**
 * The bottle list through the Brennan's chain (the wine deep dive, 4 October
 * 2026): tools/house/build-brennans.mjs takes a wine:+ add with list "bottle",
 * its bin and its size, and a 'bottles' override that tiers a dish's pairing
 * by wine name, resolved to ids through the builder's own wineId; and
 * engine.mjs countProblems counts the floor's bottles and the tiered dishes
 * from the overrides rather than from a fixed figure. Each run is on a copy of
 * the tool tree in a scratch folder, so the committed house.json, the ledger
 * and the logs are never touched.
 */
import { describe, it, expect, afterAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const made: string[] = [];
afterAll(() => {
	for (const d of made) rmSync(d, { recursive: true, force: true });
});

type Entry = Record<string, unknown>;

/** A copy of tools/house beside a copy of the shipped engine and pack, with the entries appended. */
function tree(extra: Entry[]): string {
	const dir = mkdtempSync(join(tmpdir(), 'oot-bottles-'));
	made.push(dir);
	cpSync(join(ROOT, 'tools', 'house'), join(dir, 'tools', 'house'), { recursive: true });
	mkdirSync(join(dir, 'static', 'shared', 'packs'), { recursive: true });
	cpSync(join(ROOT, 'static', 'shared', 'oot-house.js'), join(dir, 'static', 'shared', 'oot-house.js'));
	cpSync(join(ROOT, 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json'), join(dir, 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json'));
	const file = join(dir, 'tools', 'house', 'brennans', 'overrides.json');
	const o = JSON.parse(readFileSync(file, 'utf8'));
	/* The edition's own tiers are taken out, so a test tiers Eggs Hussarde from nothing; its bottles stay. */
	o.entries = o.entries.filter((e: Entry) => e.op !== 'bottles');
	o.entries.push(...extra);
	writeFileSync(file, JSON.stringify(o, null, '\t'));
	return dir;
}

/** A whole bottle on the list, from the shape of the first wine:+ the overrides carry. */
function bottle(name: string, price: string, bin: string, size: string, list: string | undefined = 'bottle'): Entry {
	const o = JSON.parse(readFileSync(join(ROOT, 'tools', 'house', 'brennans', 'overrides.json'), 'utf8'));
	const base = JSON.parse(JSON.stringify(o.entries.find((e: Entry) => e.target === 'wine:+').value));
	const value = Object.assign(base, { name, price, prices: [{ meal: 'Bottle', printed: price }], glass: '', bottle: price, bin, size, firstPickFor: [], goesWith: 'Goes with ' + name, say: 'Say ' + name + '.', meals: ['Dinner'] });
	if (list) value.list = list;
	return { target: 'wine:+', op: 'add', reason: 'test', value };
}

const tier = (wine: string) => ({ wine, why: 'Bright enough for the hollandaise.', sayIt: 'A bright bottle that loves the ham.' });
/* The bottles the edition itself files, so a figure the builder prints is read against them. */
const OWN = (JSON.parse(readFileSync(join(ROOT, 'tools', 'house', 'brennans', 'overrides.json'), 'utf8')).entries as Entry[]).filter((e) => e.target === 'wine:+' && (e.value as Entry).list === 'bottle').length;
const FOUR = [bottle('Test Value Red 2020', '$68', '9001', '750ml'), bottle('Test Classic Red 2019', '$140', '9002', '750ml'), bottle('Test Grand Red 2015', '$1,250', '9003', '1.5L'), bottle('Test Half White 2021', '$54', '9004', '375ml')];

function build(dir: string) {
	return spawnSync(process.execPath, [join(dir, 'tools', 'house', 'build-brennans.mjs'), '--mint'], { cwd: dir, encoding: 'utf8' });
}

describe("the Brennan's builder: the bottle list and the tiers", () => {
	it('files a bottle with its list, bin and size, and tiers a dish by wine name over two entries', () => {
		const dir = tree([
			...FOUR,
			{ target: 'dish:Eggs Hussarde', op: 'bottles', reason: 'test', value: { value: tier('Test Value Red 2020'), classic: tier('Test Classic Red 2019') } },
			{ target: 'dish:Eggs Hussarde', op: 'bottles', reason: 'test', value: { splurge: tier('Test Grand Red 2015'), half: tier('Test Half White 2021') } }
		]);
		const r = build(dir);
		expect(r.status, r.stderr).toBe(0);
		expect(r.stdout).toContain(`${OWN + 4} of ${OWN + 38} wines are on the bottle list; 1 dishes carry bottle tiers`);
		const h = JSON.parse(readFileSync(join(dir, 'tools', 'house', 'brennans', 'house.json'), 'utf8'));
		const byName = new Map(h.wines.map((w: Entry) => [w.name, w]));
		expect(byName.get('Test Half White 2021')).toMatchObject({ list: 'bottle', bin: '9004', size: '375ml', bottle: '$54' });
		const glass = h.wines.find((w: Entry) => w.name !== undefined && !String(w.name).startsWith('Test'));
		expect('list' in glass || 'bin' in glass || 'size' in glass).toBe(false);
		const b = h.dishes.find((d: Entry) => d.name === 'Eggs Hussarde').pairing.value.bottles;
		expect(Object.keys(b)).toEqual(['value', 'classic', 'splurge', 'half']);
		expect(b.splurge.wineId).toBe((byName.get('Test Grand Red 2015') as Entry).id);
		expect(b.half).toEqual({ wineId: (byName.get('Test Half White 2021') as Entry).id, why: 'Bright enough for the hollandaise.', sayIt: 'A bright bottle that loves the ham.' });
	}, 60_000);

	it('refuses a glass wine in a tier, a tier twice, a tier that is not one, a dish with no pairing and a bottle whose bin is not named', () => {
		const cases: Array<[Entry[], RegExp]> = [
			[[...FOUR, { target: 'dish:Eggs Hussarde', op: 'bottles', value: { value: tier('La Miraja Le Masche Barbera d’Asti 2023') } }], /is not on the bottle list/],
			[[...FOUR, { target: 'dish:Eggs Hussarde', op: 'bottles', value: { value: tier('Test Value Red 2020') } }, { target: 'dish:Eggs Hussarde', op: 'bottles', value: { value: tier('Test Value Red 2020') } }], /already has a value tier/],
			[[...FOUR, { target: 'dish:Eggs Hussarde', op: 'bottles', value: { magnum: tier('Test Value Red 2020') } }], /magnum is not a tier/],
			[[...FOUR, { target: 'dish:Eggs Hussarde', op: 'bottles', value: { value: { wine: 'Test Value Red 2020', why: 'x' } } }], /needs \{ wine, why, sayIt \}/],
			[[...FOUR, { target: 'dish:Eggs Hussarde', op: 'bottles', value: { value: tier('No Such Wine 1999') } }], /the wine No Such Wine 1999 is not on the list/],
			[[bottle('Test Binless 2020', '$70', undefined as unknown as string, '750ml')], /lacks bin/]
		];
		for (const [entries, said] of cases) {
			const r = build(tree(entries));
			expect(r.status, r.stdout).toBe(1);
			expect(r.stderr).toMatch(said);
		}
		/* A bin named blank is the list printing none (the house Champagne), and builds. */
		const blank = build(tree([bottle('Test Blank Bin 2020', '$70', '', '750ml')]));
		expect(blank.status, blank.stderr).toBe(0);
	}, 180_000);

	it('counts the menus at 34 and the bottles and tiers from the overrides', async () => {
		/* A computed address, so the type check never walks the untyped tool. */
		const engine = await import(/* @vite-ignore */ pathToFileURL(join(ROOT, 'tools', 'house', 'engine.mjs')).href);
		const h = JSON.parse(readFileSync(join(ROOT, 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json'), 'utf8')).house;
		expect(engine.countProblems(h)).toEqual([]);
		expect(engine.MENU_WINES).toBe(34);
		const more = JSON.parse(JSON.stringify(h));
		more.wines.push({ ...more.wines[0], id: 'w-testbot1', name: 'A bottle', list: 'bottle', bin: '1', size: '750ml', bottle: '$90' });
		const own = engine.overrideCounts();
		expect(engine.countProblems(more)).toEqual([`the floor's bottles (list bottle, from the overrides' wine:+ adds): ${own.bottles + 1}, expected ${own.bottles}`]);
		expect(engine.countProblems(more, { bottles: own.bottles + 1, tiered: own.tiered })).toEqual([]);
		delete more.wines[more.wines.length - 1].size;
		expect(engine.countProblems(more, { bottles: own.bottles + 1, tiered: own.tiered })).toEqual(['bottle A bottle: a bottle on the list carries its size and bottle price']);
		const dir = tree([...FOUR, { target: 'dish:Eggs Hussarde', op: 'bottles', value: { value: tier('Test Value Red 2020') } }]);
		expect(engine.overrideCounts(join(dir, 'tools', 'house', 'brennans', 'overrides.json'))).toEqual({ bottles: own.bottles + 4, tiered: 1 });
	}, 60_000);
});
