import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { readDishes, derive, stale } from '../../tools/derive/kitchen.mjs';
import {
	MEALS,
	PER_MEAL,
	RATINGS,
	brennansParts,
	cookKey,
	courseProgress,
	dishHref,
	dishProblems,
	foldName,
	isKitchenKey,
	kitchenDataUrl,
	ladderCompare,
	levelProgress,
	loadKitchenIndex,
	loadKitchenLevel,
	minutesLabel,
	nextInMeal,
	ratingWord,
	recookLine,
	recooksDue,
	resetKitchenCaches,
	slugOfKey,
	stepSeconds,
	videoSearchUrl,
	type KitchenDish,
	type KitchenIndex
} from './kitchen';
import { repertoire, DAY_MS } from './repertoire';
import recipesIndex from './data/recipes.index.json';
import techniques from './data/techniques.json';

const all = readDishes() as KitchenDish[];

describe('the 400 dishes', () => {
	it('are 400, a hundred a level, twenty five a meal, each slug once', () => {
		expect(all).toHaveLength(400);
		expect(new Set(all.map((d) => d.slug)).size).toBe(400);
		for (const level of [1, 2, 3, 4]) {
			for (const meal of MEALS) {
				const ns = all.filter((d) => d.level === level && d.meal === meal).map((d) => d.n);
				expect(ns, `${level} ${meal}`).toEqual(Array.from({ length: PER_MEAL }, (_, i) => i + 1));
			}
		}
	});

	it('every one holds the binding shape', () => {
		const problems = all.flatMap((d) => dishProblems(d));
		expect(problems).toEqual([]);
	});

	it('builds only on earlier dishes, and every reference resolves', () => {
		/* curriculum.json's own rule for "earlier": a lower level, or at the same
		   level a lower n, or at the same level and n an earlier meal. A course
		   is cooked across the four meals at once, so dinner 3 may build on
		   breakfast 3. */
		const order = new Map(all.map((d) => [d.slug, d.level * 1000 + d.n * 10 + MEALS.indexOf(d.meal)]));
		const lib = new Set((recipesIndex as Array<{ slug: string }>).map((r) => r.slug));
		const tech = new Set((techniques as Array<{ slug: string }>).map((t) => t.slug));
		for (const d of all) {
			for (const b of d.buildsOn) {
				expect(order.has(b), `${d.slug} builds on ${b}`).toBe(true);
				expect(order.get(b)! < order.get(d.slug)!, `${d.slug} builds on a later ${b}`).toBe(true);
			}
			if (d.libraryRef) expect(lib.has(d.libraryRef), `${d.slug} libraryRef ${d.libraryRef}`).toBe(true);
			for (const t of d.techniqueRefs) expect(tech.has(t), `${d.slug} technique ${t}`).toBe(true);
		}
	});

	it('the shape check catches a broken dish', () => {
		const bad = structuredClone(all[0]) as unknown as Record<string, unknown>;
		bad.steps = (bad.steps as unknown[]).slice(0, 3);
		bad.difficulty = 'Hard';
		bad.meal = 'brunch';
		const out = dishProblems(bad);
		expect(out.some((p) => /6 to 16 steps/.test(p))).toBe(true);
		expect(out.some((p) => /difficulty/.test(p))).toBe(true);
		expect(out.some((p) => /meal/.test(p))).toBe(true);
		const fake = structuredClone(all[0]) as unknown as Record<string, unknown>;
		fake.video = { search: 'x', verified: { url: 'https://example.com/v', title: 't', channel: 'c', verifiedBy: 'v' } };
		expect(dishProblems(fake).some((p) => /video\.verified/.test(p))).toBe(true);
	});
});

describe('the emitted files', () => {
	it('match a fresh derivation of the source (run node tools/derive/kitchen.mjs)', () => {
		expect(stale(derive(all))).toEqual([]);
	});

	it('the index lists every dish in ladder order with what a list draws', async () => {
		resetKitchenCaches();
		const ix = await loadKitchenIndex();
		expect(ix.dishes).toHaveLength(400);
		const sorted = [...ix.dishes].sort(ladderCompare);
		expect(ix.dishes.map((d) => d.slug)).toEqual(sorted.map((d) => d.slug));
		const first = ix.dishes[0];
		expect(Object.keys(first).sort()).toEqual(['active', 'cuisine', 'difficulty', 'level', 'meal', 'n', 'serves', 'slug', 'title', 'total']);
	});

	it('a level file carries that level whole and nothing else', () => {
		const file = JSON.parse(readFileSync('static/kitchen-data/level-2.json', 'utf8')) as { level: number; dishes: KitchenDish[] };
		expect(file.level).toBe(2);
		expect(file.dishes).toHaveLength(100);
		expect(file.dishes.every((d) => d.level === 2)).toBe(true);
	});
});

describe('loadKitchenLevel', () => {
	beforeEach(() => resetKitchenCaches());
	const level1 = { version: 1, level: 1, dishes: all.filter((d) => d.level === 1) };

	it('fetches the level file from under the base and keeps it', async () => {
		const urls: string[] = [];
		const fake = (async (u: string) => {
			urls.push(u);
			return new Response(JSON.stringify(level1), { status: 200 });
		}) as unknown as typeof fetch;
		const a = await loadKitchenLevel(1, '/table', fake);
		const b = await loadKitchenLevel(1, '/table', fake);
		expect(a.dishes).toHaveLength(100);
		expect(b).toBe(a);
		expect(urls).toEqual(['/table/kitchen-data/level-1.json']);
		expect(kitchenDataUrl('', 3)).toBe('/kitchen-data/level-3.json');
	});

	it('refuses a file whose dishes break the shape, and forgets a failure so the next try fetches again', async () => {
		const broken = { ...level1, dishes: [{ ...level1.dishes[0], steps: [] }] };
		let calls = 0;
		const fake = (async () => {
			calls++;
			return calls === 1 ? new Response('gone', { status: 503 }) : new Response(JSON.stringify(broken), { status: 200 });
		}) as unknown as typeof fetch;
		await expect(loadKitchenLevel(1, '', fake)).rejects.toThrow(/503/);
		await new Promise((r) => setTimeout(r, 0));
		await expect(loadKitchenLevel(1, '', fake)).rejects.toThrow(/shape/);
		expect(calls).toBe(2);
	});
});

describe('progress', () => {
	const ix = JSON.parse(readFileSync('src/lib/data/kitchen.index.json', 'utf8')) as KitchenIndex;

	it('counts each meal of a level out of 25 and names the first dish not cooked', () => {
		const breakfast = ix.dishes.filter((d) => d.level === 1 && d.meal === 'breakfast');
		const cooked = new Set([cookKey(breakfast[0].slug), cookKey(breakfast[1].slug), cookKey(breakfast[3].slug), 'shakshuka']);
		const p = levelProgress(ix, 1, cooked);
		expect(p.map((m) => m.meal)).toEqual(['breakfast', 'lunch', 'dinner', 'dessert']);
		expect(p[0]).toMatchObject({ total: 25, cooked: 3 });
		expect(p[0].next?.slug).toBe(breakfast[2].slug);
		expect(p[1].cooked).toBe(0);
		expect(p[1].next?.n).toBe(1);
		expect(p[0].rows.map((r) => r.n)).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
	});

	it('a bare Library slug never counts as a kitchen cook: the namespace keeps them apart', () => {
		const shared = ix.dishes.find((d) => d.slug === 'shakshuka');
		expect(shared).toBeTruthy();
		const p = levelProgress(ix, shared!.level, new Set(['shakshuka']));
		expect(p.reduce((n, m) => n + m.cooked, 0)).toBe(0);
		expect(isKitchenKey(cookKey('shakshuka'))).toBe(true);
		expect(slugOfKey(cookKey('shakshuka'))).toBe('shakshuka');
	});

	it('next is null when a meal is done; the course sums each level of 100', () => {
		const lunch = ix.dishes.filter((d) => d.level === 2 && d.meal === 'lunch').map((d) => cookKey(d.slug));
		const p = levelProgress(ix, 2, new Set(lunch));
		expect(p[1]).toMatchObject({ cooked: 25, next: null });
		expect(courseProgress(ix, new Set(lunch))).toEqual([
			{ level: 1, cooked: 0, total: 100 },
			{ level: 2, cooked: 25, total: 100 },
			{ level: 3, cooked: 0, total: 100 },
			{ level: 4, cooked: 0, total: 100 }
		]);
	});

	it('names the re-cooks due in a meal, most overdue as a share of its interval first', () => {
		const now = Date.UTC(2026, 9, 5, 12);
		const rows = ix.dishes.filter((d) => d.level === 3 && d.meal === 'breakfast');
		const [a, b, c, d] = rows;
		const log = [
			// a: cooked once, 40 days ago, on the 14-day rung: about 2.9 intervals late
			{ slug: cookKey(a.slug), at: now - 40 * DAY_MS },
			// b: climbed to the 35-day rung, last cook 50 days ago: about 1.4 late
			{ slug: cookKey(b.slug), at: now - 120 * DAY_MS, grade: 'met' as const },
			{ slug: cookKey(b.slug), at: now - 50 * DAY_MS, grade: 'met' as const },
			// c: cooked yesterday, not due
			{ slug: cookKey(c.slug), at: now - DAY_MS, grade: 'met' as const },
			// d's bare Library slug and another level's dish never count here
			{ slug: d.slug, at: now - 400 * DAY_MS },
			{ slug: cookKey(ix.dishes.find((x) => x.level === 1)!.slug), at: now - 400 * DAY_MS }
		];
		expect(recooksDue(rows, log, now).map((r) => r.slug)).toEqual([a.slug, b.slug]);
		expect(recooksDue(rows, [], now)).toEqual([]);
	});

	it('the next dish in the meal, and none after 25', () => {
		const rows = ix.dishes.filter((d) => d.level === 3 && d.meal === 'dinner');
		expect(nextInMeal(ix, rows[0].slug)?.slug).toBe(rows[1].slug);
		expect(nextInMeal(ix, rows[24].slug)).toBeNull();
	});
});

describe('the record', () => {
	it('rates in words, one word per grade, never a number', () => {
		expect(RATINGS.map((r) => r.grade).sort()).toEqual(['close', 'met', 'missed']);
		for (const r of RATINGS) expect(r.word).not.toMatch(/\d|★|\*/);
		expect(ratingWord('met')).toBe('Nailed it');
		expect(ratingWord(undefined)).toBe('Cooked, not rated');
	});

	it('says where a dish sits on the re-cook ladder', () => {
		const now = Date.UTC(2026, 9, 5, 12);
		expect(recookLine(undefined, now)).toBe('Not cooked yet.');
		const key = cookKey('shakshuka');
		const once = repertoire([{ slug: key, at: now - DAY_MS, grade: 'met' }], now)[0];
		expect(recookLine(once, now)).toBe('Cooked once, last yesterday: nailed it, comes back in 13 days.');
		const late = repertoire([{ slug: key, at: now - 20 * DAY_MS, grade: 'missed' }], now)[0];
		expect(recookLine(late, now)).toMatch(/^Cooked once, last 20 days ago: not yet, due a re-cook now\.$/);
	});
});

describe('the small helpers', () => {
	it('reads the first stated duration in a step for the timer', () => {
		expect(stepSeconds('Start a 6 minute timer the moment the last egg is in.')).toBe(360);
		expect(stepSeconds('Simmer for 3 to 4 minutes until thick.')).toBe(240);
		expect(stepSeconds('Rest 45 seconds.')).toBe(45);
		expect(stepSeconds('Braise for 1 1/2 hours.')).toBe(5400);
		expect(stepSeconds('Season to taste.')).toBeNull();
	});

	it('labels minutes the way a cook reads them', () => {
		expect(minutesLabel(45)).toBe('45 min');
		expect(minutesLabel(90)).toBe('1 hr 30 min');
		expect(minutesLabel(120)).toBe('2 hr');
	});

	it('builds the dish address with its level, the film search and the Brennan’s parts', () => {
		expect(dishHref('/table', { slug: 'shakshuka', level: 1 })).toBe('/table/kitchen?d=shakshuka&level=1');
		expect(videoSearchUrl('Maangchi gyeranjjim')).toBe('https://www.youtube.com/results?search_query=Maangchi%20gyeranjjim');
		expect(brennansParts('')).toBeNull();
		expect(brennansParts('Eggs Sardou: the same poaching skill')).toEqual({ name: 'Eggs Sardou', why: 'the same poaching skill' });
		expect(foldName('Brennan’s  Bloody Mary')).toBe(foldName("brennan's bloody mary"));
	});

	it('keeps the source free of dashes and of a level by its number', () => {
		const src = readFileSync('src/lib/kitchen.ts', 'utf8') + readFileSync('src/routes/kitchen/+page.svelte', 'utf8');
		expect(src).not.toMatch(/[\u2014\u2013]|&mdash;|&ndash;/);
		expect(src).not.toMatch(/\blevel\s+(?:[1-4]|one|two|three|four|i{1,3}|iv)\b(?!\s*[,)])/i);
	});
});
