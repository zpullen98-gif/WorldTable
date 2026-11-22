/**
 * The fixed price menu and the tasting's pours through the Brennan's chain (the
 * Thanksgiving edition, 22 November 2026). tools/house/build-brennans.mjs takes
 * a whole menu among the tastings (tasting:+, fixedPrice), a dish that menu
 * prices (fixedPriceOn), a wine poured only with a tasting (tastingPour, an
 * empty vintage), the pours of a tasting as one table quoted from a page (op
 * pours) and a lineup ask a newer page answers (op answer); engine.mjs
 * menuProblems holds what no route can check for another's record, and
 * isSidesSection names the sections that carry no pairing. Each build runs on a
 * copy of the tool tree in a scratch folder, so the worktree's house.json, the
 * ledger and the logs are never touched. The shipped pack must pass every rule
 * here as it stands: the routes were added before the edition that uses them.
 */
import { describe, it, expect, afterAll } from 'vitest';
import { execFile, spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));
const made: string[] = [];
afterAll(() => {
	for (const d of made) rmSync(d, { recursive: true, force: true });
});

type Entry = Record<string, any>;
const BASE = JSON.parse(readFileSync(join(ROOT, 'tools', 'house', 'brennans', 'overrides.json'), 'utf8')).entries as Entry[];
const PACK = () => JSON.parse(readFileSync(join(ROOT, 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json'), 'utf8')).house;
const engine = () => import(/* @vite-ignore */ pathToFileURL(join(ROOT, 'tools', 'house', 'engine.mjs')).href);
const isPast = (r: Entry) => typeof r?.section === 'string' && r.section.trim().indexOf('Past ') === 0;

/** A copy of tools/house beside the shipped engine and pack, the component fragments left out, with the entries appended. */
function tree(extra: Entry[]): string {
	const dir = mkdtempSync(join(tmpdir(), 'oot-fixed-'));
	made.push(dir);
	cpSync(join(ROOT, 'tools', 'house'), join(dir, 'tools', 'house'), { recursive: true, filter: (src) => !/[\\/]_staging([\\/]|$)/.test(src) });
	rmSync(join(dir, 'tools', 'house', 'brennans', 'components'), { recursive: true, force: true });
	mkdirSync(join(dir, 'static', 'shared', 'packs'), { recursive: true });
	cpSync(join(ROOT, 'static', 'shared', 'oot-house.js'), join(dir, 'static', 'shared', 'oot-house.js'));
	/* The shipped pack carries the fragments' components and the videos only they file: a build without
	   the fragments would drop them unannounced, so the copy keeps only what the overrides file. */
	const at = join(dir, 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json');
	const p = JSON.parse(readFileSync(join(ROOT, 'static', 'shared', 'packs', 'brennans-new-orleans.v1.oothouse.json'), 'utf8'));
	const ledger = JSON.parse(readFileSync(join(dir, 'tools', 'house', 'brennans', 'ids.ledger.json'), 'utf8'));
	const filed = new Set(BASE.filter((e) => e.target === 'video:+').map((e) => ledger['videos:' + e.value.id]));
	delete p.house.components;
	if (Array.isArray(p.house.videos)) p.house.videos = p.house.videos.filter((v: Entry) => filed.has(v.id));
	writeFileSync(at, JSON.stringify(p));
	const parsed = spawnSync(process.execPath, [join(dir, 'tools', 'house', 'parse-guide.mjs'), '--quiet'], { cwd: dir, encoding: 'utf8' });
	expect(parsed.status, parsed.stderr || parsed.stdout).toBe(0);
	const file = join(dir, 'tools', 'house', 'brennans', 'overrides.json');
	const o = JSON.parse(readFileSync(file, 'utf8'));
	o.entries.push(...extra);
	writeFileSync(file, JSON.stringify(o));
	return dir;
}
/** The builder on a tree, without holding the test thread: several builds run side by side. */
function build(dir: string): Promise<{ status: number; stdout: string; stderr: string }> {
	return new Promise((done) => {
		execFile(process.execPath, [join(dir, 'tools', 'house', 'build-brennans.mjs'), '--mint'], { cwd: dir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }, (err, stdout, stderr) => {
			done({ status: err ? (typeof (err as any).code === 'number' ? (err as any).code : 1) : 0, stdout, stderr });
		});
	});
}
const built = (dir: string) => JSON.parse(readFileSync(join(dir, 'tools', 'house', 'brennans', 'house.json'), 'utf8'));

/* ---- the fixtures: a menu, a dish it prices, a pour, the table ---- */
const MENU = 'Test Holiday Menu';
const MEAL = 'Test Holiday';
const dishBase = () => JSON.parse(JSON.stringify(BASE.find((e) => e.target === 'dish:+')!.value));
function dish(name: string, more: Entry = {}): Entry {
	const v = dishBase();
	delete v.price; delete v.prices; delete v.priceUnknown;
	Object.assign(v, { name, section: MEAL, meals: [MEAL], fixedPriceOn: MENU, say: 'Say ' + name + '.', lines: { s10: name + ' one.', s20: name + ' two.', s45: name + ' three.' } }, more);
	v.parts = Object.assign({}, v.parts, { sauce: '', sides: '' });
	return { target: 'dish:+', op: 'add', reason: 'test', value: v };
}
const joins = (name: string, meals: string[]): Entry => ({ target: 'dish:' + name, field: 'meals', reason: 'test', value: [...meals, MEAL] });
const SOUP = joins('Turtle Soup', ['Breakfast & lunch', 'Dinner', 'Breakfast tasting']);
function menu(more: Entry = {}, course: Entry = {}): Entry {
	return { target: 'tasting:+', op: 'add', reason: 'test', value: Object.assign({
		name: MENU, price: '$80', meal: MEAL, includesDrinks: false, fixedPrice: true, line: '3 Courses $80: choice of appetizer', note: '',
		courses: [Object.assign({ label: 'Appetizers', choice: true, dishes: ['Turtle Soup', 'Test Gratin'], printed: ['Classic Turtle Soup: Brown Butter Spinach, Grated Egg, Aged Sherry', 'Test Gratin: Oysters'] }, course)]
	}, more) };
}
const POUR = 'Test Estate Sylvaner';
function pour(more: Entry = {}): Entry {
	const v = JSON.parse(JSON.stringify(BASE.find((e) => e.target === 'wine:+' && e.value.list !== 'bottle')!.value));
	for (const k of ['priceUnknown', 'price', 'prices', 'glass', 'bottle', 'list', 'bin', 'size']) delete v[k];
	Object.assign(v, { name: POUR, tastingPour: true, pours: ['4 oz'], vintage: '', meals: ['Dinner tasting'], goesWith: 'Goes with ' + POUR, say: 'Say ' + POUR + '.' }, more);
	return { target: 'wine:+', op: 'add', reason: 'test', value: v };
}
const VINTAGE_ASK: Entry = { target: 'ask:+', op: 'add', reason: 'test', value: { question: 'Test: which vintage of the test Sylvaner is open?', askWhom: 'sommelier', items: [POUR] } };
const WORDS = 'Ripe pear with green notes and a lush texture.';
function pours(rows: Entry[] | null = null): Entry {
	return { target: 'tasting:Dinner Tasting Menu', op: 'pours', reason: 'test', value: { sheet: 'the Dinner Pairing Wines sheet of 22 November 2026', courses: rows ?? [
		{ n: 1, pour: 'Charles Lafitte Brut Champagne NV', pourText: 'Charles Lafitte Champagne', words: 'Vibrant & fresh with crisp apple & honey notes.' },
		{ n: 2, pour: POUR, pourText: 'Domaine Weinbach Sylvaner', words: WORDS },
		{ n: 3, pour: 'Louis Jadot Beaune 1er Cru 2023', pourText: 'Domaine du Vieux Lazaret Blanc', words: 'Grenache Blanc Blend notes of white flowers, lemon, & apricot with a full-bodied texture.' },
		{ n: 4, pour: 'Paul Hobbs Coombsville Cabernet Sauvignon 2021', pourText: 'Paul Hobbs "Coombsville" Cabernet Sauvignon', words: 'Notes of blackberry, cassis, sage, and tobacco. Elegant, silky tannins.' },
		{ n: 5, pour: 'Domaine La Tour Vieille Banyuls Reserva NV', pourText: 'Domaine la Tour Vieille', words: 'Notes of sweet jammy dark fruits and exotic spice.' }
	] } };
}
/* The second course's old pour, poured nowhere once the table names another: filed as past. */
const FICHET = 'Fichet ‘Château London’ Mâcon-Igé 2024';
const FICHET_PAST: Entry = { target: 'wine:' + FICHET, field: 'section', reason: 'test', value: 'Past tasting pours' };
const WHOLE = [dish('Test Gratin'), SOUP, menu(), pour(), VINTAGE_ASK, pours(), FICHET_PAST];

describe("the Brennan's pack rules: the menu rules and the sides", () => {
	it('finds nothing in the shipped pack, and names an unpriced dish, an unpriced wine and a wine with no vintage', async () => {
		const e = await engine();
		const h = PACK();
		expect(e.menuProblems(h, isPast)).toEqual([]);
		/* A fall dish priced by ask, with the ask gone: nobody would know to ask. */
		const noAsk = JSON.parse(JSON.stringify(h));
		const tartare = noAsk.dishes.find((d: Entry) => d.name === 'Steak Tartare with Rye');
		noAsk.askAtLineup = noAsk.askAtLineup.filter((a: Entry) => !(a.blocksField === 'price' && a.itemIds.includes(tartare.id)));
		expect(e.menuProblems(noAsk, isPast)).toEqual([expect.stringMatching(/^unpriced-dish: dish Steak Tartare with Rye:/)]);
		/* The same dish on a course of a menu is priced by the menu. */
		noAsk.tastings[1].courses[0].dishIds.push(tartare.id);
		expect(e.menuProblems(noAsk, isPast)).toEqual([]);
		/* A pour whose course names another wine is poured nowhere, until it is filed as past. */
		const moved = JSON.parse(JSON.stringify(h));
		const fichet = moved.wines.find((w: Entry) => w.name === FICHET);
		const hobbs = moved.wines.find((w: Entry) => /^Paul Hobbs/.test(w.name));
		moved.tastings[1].courses.find((c: Entry) => c.pourId === fichet.id).pourId = hobbs.id;
		expect(e.menuProblems(moved, isPast)).toEqual([expect.stringMatching(/^unpriced-wine: wine Fichet .*section that begins "Past "/)]);
		fichet.section = 'Past tasting pours';
		expect(e.menuProblems(moved, isPast)).toEqual([]);
		/* A wine with no vintage is asked about, by the word. */
		const bare = JSON.parse(JSON.stringify(h));
		const lafitte = bare.wines.find((w: Entry) => /^Charles Lafitte/.test(w.name));
		lafitte.vintage = '';
		bare.askAtLineup = bare.askAtLineup.filter((a: Entry) => !a.itemIds.includes(lafitte.id));
		expect(e.menuProblems(bare, isPast)).toEqual([expect.stringMatching(/^vintage: wine Charles Lafitte/)]);
		bare.askAtLineup.push({ id: 'a-testvint', question: 'Which vintage is open?', askWhom: 'sommelier', itemIds: [lafitte.id], ts: 1 });
		expect(e.menuProblems(bare, isPast)).toEqual([]);
	});

	it('knows a sides section by its name, the past one too, and keeps the sheet question off the fixed five', async () => {
		const e = await engine();
		for (const s of ['Sides', ' Sides ', 'Thanksgiving Day sides', 'Past Thanksgiving Day sides']) expect(e.isSidesSection(s), s).toBe(true);
		for (const s of ['Thanksgiving Day', 'Besides', 'sides', 'Sides for the Table', 'Past menu items', '', undefined]) expect(e.isSidesSection(s), String(s)).toBe(false);
		expect(e.FIXED_QS).not.toContain(e.SHEET_Q);
		expect(e.SHEET_Q).toBe('What does the pairing sheet say?');
	});
});

describe("the Brennan's builder: a fixed price menu, its dishes and a tasting's pours", () => {
	it('files the menu, the dish it prices, the pour and the table, and retires an answered ask', async () => {
		const ANSWER: Entry = { target: 'house', op: 'answer', reason: 'test', value: { id: 'a-i0xmkjmb', was: 'the November ask on the second course pour', tombstone: '2026-11-15T15:04:00.001Z' } };
		const dir = tree([...WHOLE, ANSWER]);
		const r = await build(dir);
		expect(r.status, r.stderr).toBe(0);
		const h = built(dir);
		const byName = (list: string, name: string) => h[list].find((x: Entry) => x.name === name);
		/* The menu: a third record among the tastings, its course a choice, one printed line a dish, no pour. */
		expect(h.tastings.map((t: Entry) => t.name)).toEqual(['Traditional Breakfast at Brennan’s', 'Dinner Tasting Menu', MENU]);
		const t = h.tastings[2];
		expect(t).toMatchObject({ price: '$80', meal: MEAL, includesDrinks: false, line: '3 Courses $80: choice of appetizer', note: '' });
		expect('fixedPrice' in t).toBe(false);
		const gratin = byName('dishes', 'Test Gratin');
		const soup = byName('dishes', 'Turtle Soup');
		expect(t.courses).toEqual([{ n: 1, label: 'Appetizers', dishIds: [soup.id, gratin.id], pourId: '', pourText: '', choice: true, printed: ['Classic Turtle Soup: Brown Butter Spinach, Grated Egg, Aged Sherry', 'Test Gratin: Oysters'] }]);
		/* The dish the menu prices carries no price and no route's key; the dish the house already had keeps its own and gains the meal. */
		expect(gratin).toMatchObject({ section: MEAL, meals: [MEAL], price: '', prices: [] });
		expect('fixedPriceOn' in gratin).toBe(false);
		expect(soup).toMatchObject({ section: 'Soups', price: '$13', meals: ['Breakfast & lunch', 'Dinner', 'Breakfast tasting', MEAL] });
		expect(h.dishes.filter((d: Entry) => d.name === 'Turtle Soup')).toHaveLength(1);
		/* The pour: no price, its pours, an empty vintage, and never a key of the route. */
		const wine = byName('wines', POUR);
		expect(wine).toMatchObject({ price: '', prices: [], glass: '', bottle: '', pours: ['4 oz'], vintage: '', meals: ['Dinner tasting'] });
		expect('tastingPour' in wine || 'list' in wine).toBe(false);
		/* The table: every course's pour and printed pour replaced, the words over the pour kept, the sheet's words quoted on the wine. */
		const dinner = h.tastings[1];
		expect(dinner.courses.map((c: Entry) => c.pourText)).toEqual(['Charles Lafitte Champagne', 'Domaine Weinbach Sylvaner', 'Domaine du Vieux Lazaret Blanc', 'Paul Hobbs "Coombsville" Cabernet Sauvignon', 'Domaine la Tour Vieille']);
		expect(dinner.courses[1]).toMatchObject({ pourId: wine.id, pourLabel: 'Suggested Pairing' });
		expect(wine.kept.filter((k: Entry) => k.q === 'What does the pairing sheet say?').map((k: Entry) => k.a)).toEqual(['The Dinner Pairing Wines sheet of 22 November 2026 prints this for the second course of the Dinner Tasting Menu: “' + WORDS + '”']);
		expect(byName('wines', 'Paul Hobbs Coombsville Cabernet Sauvignon 2021').kept.some((k: Entry) => k.q === 'What does the pairing sheet say?' && k.a.includes('“Notes of blackberry, cassis, sage, and tobacco. Elegant, silky tannins.”'))).toBe(true);
		/* The pour that left sorts last with the past, and the answered ask is gone under its tombstone. */
		expect(h.wines[h.wines.length - 1]).toMatchObject({ name: FICHET, section: 'Past tasting pours' });
		expect(h.askAtLineup.some((a: Entry) => a.id === 'a-i0xmkjmb')).toBe(false);
		expect(h.removed['a-i0xmkjmb']).toBe(Date.parse('2026-11-15T15:04:00.001Z'));
	}, 180_000);

	it('re-files the menu as past once its day is done: the menu retired, its dish under a past section, nothing rewritten', async () => {
		const dir = tree(WHOLE);
		const first = await build(dir);
		expect(first.status, first.stderr).toBe(0);
		const menuId = built(dir).tastings[2].id;
		/* The day after: three entries after the edition's own, none of its entries touched. */
		const file = join(dir, 'tools', 'house', 'brennans', 'overrides.json');
		const o = JSON.parse(readFileSync(file, 'utf8'));
		o.entries.push(
			{ target: 'tasting:' + MENU, op: 'retire', reason: 'test', value: { tombstone: '2026-11-27T00:00:00.000Z' } },
			{ target: 'dish:Test Gratin', field: 'section', reason: 'test', value: 'Past ' + MEAL },
			{ target: 'dish:Turtle Soup', field: 'meals', reason: 'test', value: ['Breakfast & lunch', 'Dinner', 'Breakfast tasting'] }
		);
		writeFileSync(file, JSON.stringify(o));
		const second = await build(dir);
		expect(second.status, second.stderr).toBe(0);
		const h = built(dir);
		expect(h.tastings.map((t: Entry) => t.name)).toEqual(['Traditional Breakfast at Brennan’s', 'Dinner Tasting Menu']);
		expect(h.removed[menuId]).toBe(Date.parse('2026-11-27T00:00:00.000Z'));
		/* The dish keeps its record and its id, filed last with the past, still without a price and with the meal it was served at. */
		expect(h.dishes[h.dishes.length - 1]).toMatchObject({ name: 'Test Gratin', section: 'Past ' + MEAL, meals: [MEAL], price: '', prices: [] });
		expect(h.dishes.find((d: Entry) => d.name === 'Turtle Soup').meals).toEqual(['Breakfast & lunch', 'Dinner', 'Breakfast tasting']);
		/* The builder's own tastings are not retired this way. */
		o.entries.push({ target: 'tasting:Dinner Tasting Menu', op: 'retire', reason: 'test', value: { tombstone: '2026-11-27T00:00:00.000Z' } });
		writeFileSync(file, JSON.stringify(o));
		const third = await build(dir);
		expect(third.status).toBe(1);
		expect(third.stderr).toMatch(/retire needs a dish, a wine, a cocktail or a menu filed with tasting:\+/);
	}, 240_000);

	it('refuses what the edition could get wrong, each with the record named', async () => {
		const without = (drop: Entry) => WHOLE.filter((e) => e !== drop);
		const whole = WHOLE;
		const cases: Array<[string, Entry[], RegExp]> = [
			['a course naming a dish the house lacks', [SOUP, menu()], /Test Holiday Menu, Appetizers: names the dish Test Gratin, which is not a dish in the house/],
			['a course naming a wine as a dish', [SOUP, menu({}, { dishes: ['Turtle Soup', 'Charles Lafitte Brut Champagne NV'] })], /names the dish Charles Lafitte Brut Champagne NV, which is not a dish in the house/],
			['a dish of the menu without the menu’s meal', [dish('Test Gratin'), menu()], /Turtle Soup does not list the meal Test Holiday/],
			['a printed line short of the dishes', [dish('Test Gratin'), SOUP, menu({}, { printed: ['Classic Turtle Soup: Brown Butter Spinach'] })], /prints 1 line\(s\) for 2 dishes/],
			['a fixed price course that is not a choice', [dish('Test Gratin'), SOUP, menu({}, { choice: false })], /is not a choice of two or more dishes/],
			['a dish the menu it names does not serve', [dish('Test Gratin'), dish('Test Orphan'), SOUP, menu()], /the dish Test Orphan is filed with fixedPriceOn Test Holiday Menu, and no course of that menu names it/],
			['a dish priced by a menu that is not there', [dish('Test Gratin')], /fixedPriceOn Test Holiday Menu, and no menu of that name is among the tastings/],
			['a tasting pour no course pours', [pour(), VINTAGE_ASK], /the wine Test Estate Sylvaner is filed with tastingPour and no course of a tasting pours it/],
			['a tasting pour with a price', [pour({ price: '$12', prices: [{ meal: 'By the glass', printed: '$12' }] })], /lacks an empty price and no printed prices, since tastingPour is set/],
			['a pour with no vintage and no ask for it', without(VINTAGE_ASK), /vintage: wine Test Estate Sylvaner: no vintage/],
			['a pour that left its course and was not filed as past', without(FICHET_PAST), /unpriced-wine: wine Fichet/],
			['words the page does not print', [pour(), VINTAGE_ASK, pours([{ n: 1, pour: POUR, pourText: 'Domaine Weinbach Sylvaner', words: 'Ripe pear and a lush, creamy texture.' }])], /course 1: words is not printed on the guide or a page snapshot as written/],
			['a table that leaves a course out', [pour(), VINTAGE_ASK, pours([{ n: 2, pour: POUR, pourText: 'Domaine Weinbach Sylvaner', words: WORDS }])], /pours names 1 of the 5 courses of Dinner Tasting Menu/],
			['a pour that is not a wine of the house', [pours([{ n: 2, pour: 'No Such Wine', pourText: 'Domaine Weinbach Sylvaner', words: WORDS }])], /the pour No Such Wine is not a wine in the house/],
			['an answer for an ask nobody files', [{ target: 'house', op: 'answer', value: { id: 'a-nosuchask', was: 'nothing', tombstone: '2026-11-15T15:04:00.001Z' } }], /names a-nosuchask, which is not an ask this build files/]
		];
		expect(whole.length).toBe(7);
		/* Four builds at a time: each is a whole run of the builder, and the machine has other work. */
		const results: Array<{ status: number; stdout: string; stderr: string }> = [];
		let next = 0;
		await Promise.all([0, 1, 2, 3].map(async () => {
			while (next < cases.length) {
				const i = next++;
				results[i] = await build(tree(cases[i][1]));
			}
		}));
		results.forEach((r, i) => {
			expect(r.status, cases[i][0] + ': ' + r.stdout.slice(-300)).toBe(1);
			expect(r.stderr, cases[i][0]).toMatch(cases[i][2]);
		});
	}, 600_000);
});
